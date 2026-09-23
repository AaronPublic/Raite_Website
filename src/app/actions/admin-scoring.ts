"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { computeRankings, getRubricForEvent, ScoredRegistrationRow } from "@/lib/rubrics";

async function getAuthenticatedAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const admin = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  return admin;
}

export async function getJudges() {
  await getAuthenticatedAdmin();

  const judges = await db.user.findMany({
    where: { role: "JUDGE" },
    include: {
      judgeAssignments: {
        include: { event: true },
      },
      _count: {
        select: { scoresGiven: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allOnlineEvents = await db.event.findMany({
    where: { subcategory: "ONLINE" },
    select: { id: true, title: true, category: true },
    orderBy: { title: "asc" },
  });

  return {
    judges: judges.map((j) => ({
      id: j.id,
      name: j.name || "Unnamed Judge",
      email: j.email,
      clerkId: j.clerkId,
      assignedEvents: j.judgeAssignments.map((a) => ({
        id: a.event.id,
        title: a.event.title,
      })),
      evaluatedCount: j._count.scoresGiven,
      createdAt: j.createdAt,
    })),
    availableEvents: allOnlineEvents,
  };
}

const createJudgeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  eventIds: z.array(z.string()).min(1, "Assign at least one competition"),
});

export async function createJudge(data: z.infer<typeof createJudgeSchema>) {
  await getAuthenticatedAdmin();

  const parsed = createJudgeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input data" };
  }

  const { name, email, password, eventIds } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();

  // Check if email already exists in DB
  const existingUser = await db.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    return { error: `A user with email "${cleanEmail}" already exists.` };
  }

  try {
    const clerk = await clerkClient();

    // 1. Create Clerk user
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "";

    let clerkUser;
    try {
      clerkUser = await clerk.users.createUser({
        emailAddress: [cleanEmail],
        password,
        firstName,
        lastName,
        skipPasswordRequirement: false,
      });
    } catch (clerkErr: any) {
      console.error("Clerk user creation error:", clerkErr);
      return {
        error: clerkErr.errors?.[0]?.message || clerkErr.message || "Failed to create user in authentication provider.",
      };
    }

    // 2. Create database User and JudgeAssignments in a transaction
    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          clerkId: clerkUser.id,
          email: cleanEmail,
          name: name.trim(),
          role: "JUDGE",
          approved: true,
        },
      });

      if (eventIds.length > 0) {
        await tx.judgeAssignment.createMany({
          data: eventIds.map((eventId) => ({
            judgeId: newUser.id,
            eventId,
          })),
        });
      }
    });

    revalidatePath("/admin/judges");
    return { success: true };
  } catch (err: any) {
    console.error("createJudge error:", err);
    return { error: err.message || "Failed to create judge account" };
  }
}

const updateJudgeSchema = z.object({
  judgeId: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  eventIds: z.array(z.string()),
});

export async function updateJudge(data: z.infer<typeof updateJudgeSchema>) {
  await getAuthenticatedAdmin();

  const parsed = updateJudgeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input data" };
  }

  const { judgeId, name, password, eventIds } = parsed.data;

  const judge = await db.user.findUnique({
    where: { id: judgeId },
  });

  if (!judge || judge.role !== "JUDGE") {
    return { error: "Judge not found" };
  }

  try {
    // 1. Update password in Clerk if provided
    if (password && password.trim() !== "" && judge.clerkId) {
      const clerk = await clerkClient();
      await clerk.users.updateUser(judge.clerkId, {
        password: password.trim(),
      });
    }

    // 2. Update name and assignments in database transaction
    await db.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({
          where: { id: judgeId },
          data: { name: name.trim() },
        });
      }

      // Replace assignments
      await tx.judgeAssignment.deleteMany({
        where: { judgeId },
      });

      if (eventIds.length > 0) {
        await tx.judgeAssignment.createMany({
          data: eventIds.map((eventId) => ({
            judgeId,
            eventId,
          })),
        });
      }
    });

    revalidatePath("/admin/judges");
    return { success: true };
  } catch (err: any) {
    console.error("updateJudge error:", err);
    return { error: err.message || "Failed to update judge details" };
  }
}

export async function deleteJudge(judgeId: string) {
  await getAuthenticatedAdmin();

  const judge = await db.user.findUnique({
    where: { id: judgeId },
  });

  if (!judge || judge.role !== "JUDGE") {
    return { error: "Judge not found" };
  }

  try {
    // Delete in Clerk if exists
    if (judge.clerkId) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(judge.clerkId);
      } catch (clerkErr) {
        console.warn("Could not delete Clerk user (may not exist in Clerk):", clerkErr);
      }
    }

    // Delete in database (cascades JudgeAssignment & Score)
    await db.user.delete({
      where: { id: judgeId },
    });

    revalidatePath("/admin/judges");
    return { success: true };
  } catch (err: any) {
    console.error("deleteJudge error:", err);
    return { error: err.message || "Failed to delete judge" };
  }
}

export async function getCompetitionLeaderboard(eventId: string) {
  await getAuthenticatedAdmin();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      judgeAssignments: {
        include: {
          judge: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!event) throw new Error("Event not found");

  const rubric = getRubricForEvent(event.title);

  // Fetch all registrations with submissions for this event
  const registrations = await db.registration.findMany({
    where: {
      eventId,
      entryUrl: { not: null },
      NOT: { entryUrl: "" },
    },
    include: {
      user: true,
      coach: true,
      scores: {
        include: {
          judge: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  const assignedJudges = event.judgeAssignments.map((ja) => ({
    id: ja.judge.id,
    name: ja.judge.name || ja.judge.email,
  }));

  const rawRows: ScoredRegistrationRow[] = registrations.map((reg) => {
    const judgeScores = reg.scores.map((s) => ({
      judgeId: s.judgeId,
      judgeName: s.judge.name || s.judge.email,
      totalScore: s.totalScore,
      criteriaScores: s.criteriaScores as Record<string, number>,
      feedback: s.feedback,
    }));

    const judgesWhoScoredCount = judgeScores.length;
    const sumOfJudgeScores = judgeScores.reduce((acc, s) => acc + s.totalScore, 0);
    const averageJudgeScore =
      judgesWhoScoredCount > 0 ? Number((sumOfJudgeScores / judgesWhoScoredCount).toFixed(2)) : 0;

    const socialMediaScore = reg.socialMediaScore ?? 0;
    const finalScore = Number((averageJudgeScore + socialMediaScore).toFixed(2));

    return {
      registrationId: reg.id,
      schoolName: reg.user.school || "N/A",
      teamOrCompetitor: reg.teamName ? `${reg.teamName} (${reg.user.name || reg.user.email})` : reg.user.name || reg.user.email,
      entryUrl: reg.entryUrl,
      socialMediaScore,
      judgeScores,
      averageJudgeScore,
      finalScore,
      judgesCount: judgesWhoScoredCount,
    };
  });

  const rankedRows = computeRankings(rawRows);

  return {
    event: {
      id: event.id,
      title: event.title,
      category: event.category,
    },
    rubric,
    assignedJudges,
    rankings: rankedRows,
  };
}

export async function updateSocialMediaScore(registrationId: string, score: number) {
  await getAuthenticatedAdmin();

  if (isNaN(score) || score < 0 || score > 5) {
    return { error: "Social media score must be between 0 and 5 points." };
  }

  try {
    await db.registration.update({
      where: { id: registrationId },
      data: {
        socialMediaScore: Number(score.toFixed(2)),
      },
    });

    revalidatePath("/admin/scores");
    return { success: true };
  } catch (err: any) {
    console.error("updateSocialMediaScore error:", err);
    return { error: err.message || "Failed to update social media score" };
  }
}

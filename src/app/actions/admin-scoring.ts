"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { computeRankings, getRubricForEvent, ScoredRegistrationRow, sumCriteriaScores } from "@/lib/rubrics";

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

  // Ensure all existing judge accounts in Clerk are marked as verified (bypasses verification code)
  (async () => {
    try {
      const clerk = await clerkClient();
      for (const j of judges) {
        if (j.clerkId) {
          try {
            const clerkUser = await clerk.users.getUser(j.clerkId);
            if (clerkUser?.emailAddresses) {
              for (const emailObj of clerkUser.emailAddresses) {
                if (emailObj.verification?.status !== "verified") {
                  await clerk.emailAddresses.updateEmailAddress(emailObj.id, {
                    verified: true,
                    primary: true,
                  });
                }
              }
            }
          } catch (e) {
            // Ignore individual user check errors
          }
        }
      }
    } catch (e) {
      // Ignore background sync error
    }
  })();

  return {
    judges: judges.map((j) => {
      let username = j.email;
      if (username.endsWith("@raite2026.com")) {
        username = username.replace("@raite2026.com", "");
      } else if (username.endsWith("@judge.raite.internal")) {
        username = username.replace("@judge.raite.internal", "");
      }

      return {
        id: j.id,
        name: j.name || "Unnamed Judge",
        username,
        email: j.email,
        clerkId: j.clerkId,
        assignedEvents: j.judgeAssignments.map((a) => ({
          id: a.event.id,
          title: a.event.title,
        })),
        evaluatedCount: j._count.scoresGiven,
        createdAt: j.createdAt,
      };
    }),
    availableEvents: allOnlineEvents,
  };
}

const createJudgeSchema = z.object({
  name: z.string().min(1, "Please enter the judge's full name"),
  username: z.string().min(1, "Please enter a username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  eventIds: z.array(z.string()).optional().default([]),
});

export async function createJudge(data: z.infer<typeof createJudgeSchema>) {
  await getAuthenticatedAdmin();

  const parsed = createJudgeSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const fieldName = firstIssue?.path[0] !== undefined ? ` (${String(firstIssue.path[0])})` : "";
    return { error: `${firstIssue?.message || "Invalid input data"}${fieldName}` };
  }

  const { name, username, password, eventIds } = parsed.data;
  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
  
  if (!cleanUsername) {
    return { error: "Username cannot be empty. Please enter a valid username." };
  }

  // Format valid RFC/TLD email address for Clerk
  const validEmail = cleanUsername.includes("@")
    ? cleanUsername
    : `${cleanUsername.replace(/[^a-z0-9_.-]/g, "") || "judge"}@raite2026.com`;

  // Check if username / email already exists in DB
  const existingUser = await db.user.findFirst({
    where: {
      OR: [
        { email: validEmail },
        { name: name.trim() },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email.toLowerCase() === validEmail.toLowerCase()) {
      return { 
        error: `Username "${cleanUsername}" is already in use by another judge or account. Please choose a different username.` 
      };
    }
  }

  try {
    const clerk = await clerkClient();
    const sanitizedClerkUsername = cleanUsername.replace(/[^a-zA-Z0-9_]/g, "");

    let clerkUser;
    // Attempt 1: Try creating with username (if enabled in Clerk)
    try {
      clerkUser = await clerk.users.createUser({
        emailAddress: [validEmail],
        username: sanitizedClerkUsername.length >= 4 ? sanitizedClerkUsername : undefined,
        password,
        firstName: name.trim(),
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      });
    } catch (firstErr: any) {
      console.warn("Primary Clerk user creation attempt failed, retrying with email only:", firstErr?.message);
      // Attempt 2: Retry with emailAddress only
      try {
        clerkUser = await clerk.users.createUser({
          emailAddress: [validEmail],
          password,
          firstName: name.trim(),
          skipPasswordChecks: true,
          skipPasswordRequirement: true,
        });
      } catch (secondErr: any) {
        console.error("Clerk user creation error:", secondErr);
        const clerkErrors = secondErr.errors || firstErr.errors || [];
        const firstError = clerkErrors[0];
        
        let rawMessage = firstError?.longMessage || firstError?.message || secondErr.message || "Failed to create user authentication.";
        const paramName = (firstError?.meta?.paramName || "").toLowerCase();

        if (paramName === "email_address" || rawMessage.toLowerCase().includes("email_address") || rawMessage.toLowerCase().includes("email address")) {
          return {
            error: `Invalid Username / Email: "${cleanUsername}". Please use simple letters and numbers (e.g. judge1, judge_alpha).`,
          };
        } else if (paramName === "password" || rawMessage.toLowerCase().includes("password")) {
          return {
            error: `Password Requirement: ${firstError?.longMessage || firstError?.message || "Password does not meet authentication standards. Please use at least 8 characters."}`,
          };
        } else if (paramName === "username" || rawMessage.toLowerCase().includes("username")) {
          return {
            error: `Username Error: ${firstError?.longMessage || firstError?.message || "Please choose a different username."}`,
          };
        }

        return { error: `Authentication Error: ${rawMessage}` };
      }
    }

    // 2. MARK EMAIL AS VERIFIED IN CLERK IMMEDIATELY (Prevents Clerk from asking for verification code!)
    try {
      if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
        for (const emailObj of clerkUser.emailAddresses) {
          if (emailObj.verification?.status !== "verified") {
            await clerk.emailAddresses.updateEmailAddress(emailObj.id, {
              verified: true,
              primary: true,
            });
          }
        }
      }
    } catch (verifyErr) {
      console.warn("Could not explicitly mark email as verified:", verifyErr);
    }

    // 3. Create database User and JudgeAssignments in a transaction
    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          clerkId: clerkUser.id,
          email: validEmail,
          name: name.trim(),
          role: "JUDGE",
          approved: true,
        },
      });

      if (eventIds && eventIds.length > 0) {
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
  name: z.string().min(1, "Name cannot be empty").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  eventIds: z.array(z.string()).optional().default([]),
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
    const clerk = await clerkClient();

    // 1. Update password in Clerk if provided and ensure email is verified
    if (judge.clerkId) {
      if (password && password.trim() !== "") {
        await clerk.users.updateUser(judge.clerkId, {
          password: password.trim(),
          skipPasswordChecks: true,
        });
      }

      // Ensure judge's email is marked as verified in Clerk
      try {
        const clerkUser = await clerk.users.getUser(judge.clerkId);
        if (clerkUser.emailAddresses) {
          for (const emailObj of clerkUser.emailAddresses) {
            if (emailObj.verification?.status !== "verified") {
              await clerk.emailAddresses.updateEmailAddress(emailObj.id, {
                verified: true,
                primary: true,
              });
            }
          }
        }
      } catch (verifyErr) {
        console.warn("Could not verify email in updateJudge:", verifyErr);
      }
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

      if (eventIds && eventIds.length > 0) {
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
      teamOrCompetitor: reg.teamName || "Individual Entry",
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

export async function submitAdminCriteriaScoreOverride(data: {
  registrationId: string;
  judgeId: string;
  criteriaScores: Record<string, number>;
  feedback?: string;
}) {
  await getAuthenticatedAdmin();

  const registration = await db.registration.findUnique({
    where: { id: data.registrationId },
    include: { event: true },
  });

  if (!registration) return { error: "Registration not found" };

  const rubric = getRubricForEvent(registration.event.title);
  if (!rubric) return { error: "Rubric not found for this event" };

  // Validate criteria scores
  const validatedScores: Record<string, number> = {};
  for (const criterion of rubric.criteria) {
    const rawVal = data.criteriaScores[criterion.id];
    const scoreVal = typeof rawVal === "number" ? rawVal : Number(rawVal);

    if (isNaN(scoreVal) || scoreVal < 0) {
      return { error: `Score for "${criterion.name}" must be 0 or higher.` };
    }
    if (scoreVal > criterion.maxScore) {
      return { error: `Score for "${criterion.name}" cannot exceed ${criterion.maxScore} points.` };
    }
    validatedScores[criterion.id] = scoreVal;
  }

  const totalScore = sumCriteriaScores(validatedScores);

  try {
    await db.score.upsert({
      where: {
        registrationId_judgeId: {
          registrationId: data.registrationId,
          judgeId: data.judgeId,
        },
      },
      update: {
        criteriaScores: validatedScores,
        totalScore,
        feedback: data.feedback?.trim() || null,
      },
      create: {
        registrationId: data.registrationId,
        judgeId: data.judgeId,
        criteriaScores: validatedScores,
        totalScore,
        feedback: data.feedback?.trim() || null,
      },
    });

    revalidatePath("/admin/scores");
    revalidatePath(`/judge/competitions`);
    revalidatePath(`/judge/competitions/${registration.eventId}`);
    revalidatePath(`/judge/competitions/${registration.eventId}/evaluate/${data.registrationId}`);

    return { success: true, totalScore };
  } catch (err: any) {
    console.error("submitAdminCriteriaScoreOverride error:", err);
    return { error: err.message || "Failed to record score" };
  }
}


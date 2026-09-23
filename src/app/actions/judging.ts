"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getRubricForEvent, sumCriteriaScores } from "@/lib/rubrics";

async function getAuthenticatedJudge() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      judgeAssignments: {
        include: { event: true },
      },
    },
  });

  if (!user || (user.role !== "JUDGE" && user.role !== "ADMIN")) {
    throw new Error("Forbidden: Judge access required");
  }

  return user;
}

export async function getJudgeCompetitions() {
  const user = await getAuthenticatedJudge();

  let events: any[] = [];
  if (user.role === "ADMIN") {
    events = await db.event.findMany({
      where: { subcategory: "ONLINE" },
      orderBy: { title: "asc" },
    });
  } else {
    events = user.judgeAssignments.map((ja) => ja.event);
  }

  // Calculate submission counts & evaluated counts per competition for this judge
  const eventSummaries = await Promise.all(
    events.map(async (event) => {
      const totalSubmissions = await db.registration.count({
        where: {
          eventId: event.id,
          entryUrl: { not: null },
          NOT: { entryUrl: "" },
        },
      });

      const evaluatedCount = await db.score.count({
        where: {
          judgeId: user.id,
          registration: {
            eventId: event.id,
          },
        },
      });

      const rubric = getRubricForEvent(event.title);

      return {
        id: event.id,
        title: event.title,
        category: event.category,
        totalSubmissions,
        evaluatedCount,
        hasRubric: !!rubric,
      };
    })
  );

  return eventSummaries;
}

export async function getJudgeCompetitionSubmissions(eventId: string) {
  const user = await getAuthenticatedJudge();

  // Verify judge assignment
  if (user.role !== "ADMIN") {
    const isAssigned = user.judgeAssignments.some((ja) => ja.eventId === eventId);
    if (!isAssigned) {
      throw new Error("You are not assigned to evaluate this competition.");
    }
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Event not found");

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
        where: { judgeId: user.id },
      },
    },
    orderBy: [{ user: { school: "asc" } }, { createdAt: "asc" }],
  });

  const rubric = getRubricForEvent(event.title);

  return {
    event: {
      id: event.id,
      title: event.title,
      category: event.category,
      subcategory: event.subcategory,
    },
    rubric,
    submissions: registrations.map((reg) => {
      const myScore = reg.scores[0] || null;
      return {
        id: reg.id,
        school: reg.user.school || "N/A",
        teamName: reg.teamName || "Individual",
        competitorName: reg.user.name || reg.user.email,
        coachName: reg.coach?.name || reg.registeredBy || "N/A",
        entryUrl: reg.entryUrl,
        isEvaluated: !!myScore,
        myTotalScore: myScore ? myScore.totalScore : null,
        updatedAt: myScore ? myScore.updatedAt : null,
      };
    }),
  };
}

export async function getSubmissionForEvaluation(registrationId: string) {
  const user = await getAuthenticatedJudge();

  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    include: {
      event: true,
      user: true,
      coach: true,
      scores: {
        where: { judgeId: user.id },
      },
    },
  });

  if (!registration) throw new Error("Registration not found");

  // Verify judge assignment
  if (user.role !== "ADMIN") {
    const isAssigned = user.judgeAssignments.some((ja) => ja.eventId === registration.eventId);
    if (!isAssigned) {
      throw new Error("You are not assigned to evaluate this competition.");
    }
  }

  const rubric = getRubricForEvent(registration.event.title);
  if (!rubric) {
    throw new Error(`No scoring rubric configured for event: ${registration.event.title}`);
  }

  const existingScore = registration.scores[0] || null;

  return {
    registration: {
      id: registration.id,
      eventId: registration.eventId,
      eventTitle: registration.event.title,
      school: registration.user.school || "N/A",
      teamName: registration.teamName || "Individual",
      competitorName: registration.user.name || registration.user.email,
      coachName: registration.coach?.name || registration.registeredBy || "N/A",
      entryUrl: registration.entryUrl,
    },
    rubric,
    existingScore: existingScore
      ? {
          id: existingScore.id,
          criteriaScores: existingScore.criteriaScores as Record<string, number>,
          totalScore: existingScore.totalScore,
          feedback: existingScore.feedback,
          updatedAt: existingScore.updatedAt,
        }
      : null,
  };
}

export async function submitJudgeScore(data: {
  registrationId: string;
  criteriaScores: Record<string, number>;
  feedback?: string;
}) {
  const user = await getAuthenticatedJudge();

  const registration = await db.registration.findUnique({
    where: { id: data.registrationId },
    include: { event: true },
  });

  if (!registration) return { error: "Registration not found" };

  if (user.role !== "ADMIN") {
    const isAssigned = user.judgeAssignments.some((ja) => ja.eventId === registration.eventId);
    if (!isAssigned) {
      return { error: "You are not assigned to evaluate this competition." };
    }
  }

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
          judgeId: user.id,
        },
      },
      update: {
        criteriaScores: validatedScores,
        totalScore,
        feedback: data.feedback?.trim() || null,
      },
      create: {
        registrationId: data.registrationId,
        judgeId: user.id,
        criteriaScores: validatedScores,
        totalScore,
        feedback: data.feedback?.trim() || null,
      },
    });

    revalidatePath(`/judge/competitions/${registration.eventId}`);
    revalidatePath(`/judge/competitions/${registration.eventId}/evaluate/${data.registrationId}`);
    revalidatePath(`/admin/scores`);

    return { success: true, totalScore };
  } catch (err: any) {
    console.error("submitJudgeScore error:", err);
    return { error: err.message || "Failed to record score" };
  }
}

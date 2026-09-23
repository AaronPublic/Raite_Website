import { db } from "@/lib/db";
import { getCompetitionLeaderboard } from "@/app/actions/admin-scoring";
import AdminScoringClient from "@/components/admin/AdminScoringClient";
import { Award } from "lucide-react";

export default async function AdminScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const params = await searchParams;

  // Fetch all online competitions
  const onlineEvents = await db.event.findMany({
    where: { subcategory: "ONLINE" },
    select: { id: true, title: true, category: true },
    orderBy: { title: "asc" },
  });

  const activeEventId = params.eventId || (onlineEvents[0]?.id ?? "");

  let leaderboardData = {
    rubric: null as any,
    assignedJudges: [] as { id: string; name: string }[],
    rankings: [] as any[],
  };

  if (activeEventId) {
    leaderboardData = await getCompetitionLeaderboard(activeEventId);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Award className="w-8 h-8 text-primary" /> Scores & Rankings Leaderboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor real-time judging evaluations, input social media reaction scores, and view live calculated competition rankings.
        </p>
      </div>

      <AdminScoringClient
        events={onlineEvents}
        activeEventId={activeEventId}
        rubric={leaderboardData.rubric}
        assignedJudges={leaderboardData.assignedJudges}
        rankings={leaderboardData.rankings}
      />
    </div>
  );
}

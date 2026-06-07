import { getLeaderboard, getCompetitionWinners } from "@/app/actions/ranking";
import RankingForm from "@/components/admin/RankingForm";
import CompetitionWinnersForm from "@/components/admin/CompetitionWinnersForm";

export default async function RankingAdminPage() {
  const initialEntries = await getLeaderboard();
  const initialWinners = await getCompetitionWinners();

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Manage Overall Ranking</h1>
        <RankingForm initialEntries={initialEntries} />
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Manage Competition Winners</h1>
        <CompetitionWinnersForm initialWinners={initialWinners} />
      </div>
    </div>
  );
}

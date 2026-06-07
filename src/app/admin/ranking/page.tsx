import { getLeaderboard, getCompetitionWinners } from "@/app/actions/ranking";
import RankingForm from "@/components/admin/RankingForm";
import CompetitionWinnersForm from "@/components/admin/CompetitionWinnersForm";

export default async function RankingAdminPage() {
  const initialEntries = await getLeaderboard();
  const initialWinners = await getCompetitionWinners();

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pl-2">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Overall Podium</h2>
          </div>
          <RankingForm initialEntries={initialEntries} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 pl-2">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Competition Champions</h2>
          </div>
          <CompetitionWinnersForm initialWinners={initialWinners} />
        </div>
      </div>
    </div>
  );
}

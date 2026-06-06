import { getLeaderboard } from "@/app/actions/ranking";
import RankingForm from "@/components/admin/RankingForm";

export default async function RankingAdminPage() {
  const initialEntries = await getLeaderboard();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase">Manage Overall Ranking</h1>
      <RankingForm initialEntries={initialEntries} />
    </div>
  );
}

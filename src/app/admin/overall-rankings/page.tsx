import { getTabulationData } from "@/app/actions/tabulation";
import AdminOverallRankingsClient from "@/components/admin/AdminOverallRankingsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overall Rankings | RAITE 2026 Admin",
  description: "Official consolidated overall rankings and points matrix.",
};

export default async function OverallRankingsPage() {
  const data = await getTabulationData();

  return (
    <div className="space-y-6">
      <AdminOverallRankingsClient
        events={data.events}
        schools={data.schools}
        leaderboard={data.leaderboard}
        specialAwards={data.specialAwards}
      />
    </div>
  );
}

import { getTabulationData } from "@/app/actions/tabulation";
import SecretOverallRankingsClient from "@/components/admin/SecretOverallRankingsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consolidated Overall Rankings | RAITE 2026 Admin",
  description: "Official password-protected consolidated overall rankings and points matrix.",
};

export default async function OverallRankingsPage() {
  const data = await getTabulationData();

  return (
    <div className="space-y-6">
      <SecretOverallRankingsClient
        events={data.events}
        schools={data.schools}
        leaderboard={data.leaderboard}
        specialAwards={data.specialAwards}
      />
    </div>
  );
}

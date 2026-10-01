import { getPublicOverallRankingsData } from "@/app/actions/tabulation";
import PublicOverallRankingsClient from "@/components/public/PublicOverallRankingsClient";
import DecorativeLayout from "@/components/layout/DecorativeLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overall Rankings | RAITE 2026",
  description: "Official institutional consolidated overall rankings and points matrix for RAITE 2026.",
};

export const revalidate = 0; // Dynamic data for live rankings

export default async function PublicOverallRankingsPage() {
  const data = await getPublicOverallRankingsData();

  return (
    <DecorativeLayout className="min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <PublicOverallRankingsClient
          events={data.events}
          schools={data.schools}
          leaderboard={data.leaderboard}
          specialAwards={data.specialAwards}
        />
      </div>
    </DecorativeLayout>
  );
}

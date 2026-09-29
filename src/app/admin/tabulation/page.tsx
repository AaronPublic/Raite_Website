import { getTabulationData } from "@/app/actions/tabulation";
import TabulationClient from "@/components/admin/TabulationClient";
import { Calculator } from "lucide-react";

export default async function AdminTabulationPage() {
  const data = await getTabulationData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" /> Overall Tabulation & Special Awards
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure competition champions, calculate school tabulation points (10/7/4/1), and record official special awards.
        </p>
      </div>

      <TabulationClient
        initialEvents={data.events}
        initialSchools={data.schools}
        initialLeaderboard={data.leaderboard}
        initialSpecialAwards={data.specialAwards}
        participantsList={data.participantsList}
      />
    </div>
  );
}

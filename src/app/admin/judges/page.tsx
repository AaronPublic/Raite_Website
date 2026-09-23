import { getJudges } from "@/app/actions/admin-scoring";
import JudgesManagement from "@/components/admin/JudgesManagement";
import { Gavel } from "lucide-react";

export default async function AdminJudgesPage() {
  const { judges, availableEvents } = await getJudges();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Gavel className="w-8 h-8 text-primary" /> Judges Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Create judge accounts, manage credentials, and assign competition scoring panels.
        </p>
      </div>

      <JudgesManagement initialJudges={judges} availableEvents={availableEvents} />
    </div>
  );
}

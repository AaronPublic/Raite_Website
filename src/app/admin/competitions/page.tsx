import { getAllEvents } from "@/lib/data/events";
import CompetitionsTable from "@/components/admin/CompetitionsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";



export default async function AdminCompetitionsPage() {
  const events = await getAllEvents();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manage Competitions</h1>
          <p className="text-gray-500 text-sm">Create, edit, and monitor all RAITE 2025 events.</p>
        </div>
        <Button>
          <Link href="/admin/competitions/new">
            <Plus className="mr-2 h-4 w-4" /> Add Competition
          </Link>
        </Button>
      </div>

      <CompetitionsTable events={events as any} />
    </div>
  );
}

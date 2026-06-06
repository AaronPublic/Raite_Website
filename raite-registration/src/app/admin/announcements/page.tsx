import { getAllAnnouncements } from "@/lib/data/announcements";
import AnnouncementsTable from "@/components/admin/AnnouncementsTable";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, Megaphone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await getAllAnnouncements();

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b dark:border-gray-800 pb-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest">
            <Megaphone className="w-3 h-3" />
            Communication Portal
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Broadcast Console</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 max-w-lg">
            Dispatch critical updates and news to all participants and faculty members across the region.
          </p>
        </div>
        
        <Link href="/admin/announcements/new" className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 group")}>
            <Plus className="mr-2 h-5 w-5" /> 
            NEW BROADCAST
            <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900/40 rounded-[1rem] p-1 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <AnnouncementsTable announcements={announcements as any} />
      </div>
    </div>
  );
}

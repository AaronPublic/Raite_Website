import AnnouncementForm from "@/components/admin/AnnouncementForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAnnouncementPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-4">
        <Link href="/admin/announcements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to announcements
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">New Announcement</h1>
          <p className="text-gray-500">Post a new update for the participants.</p>
        </div>
      </div>

      <AnnouncementForm />
    </div>
  );
}

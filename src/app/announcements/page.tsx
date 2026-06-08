import { getAllAnnouncements } from "@/lib/data/announcements";
import AnnouncementList from "@/components/home/AnnouncementList";
import { Megaphone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import DecorativeLayout from "@/components/layout/DecorativeLayout";

export default async function AnnouncementsPage() {
  const announcements = await getAllAnnouncements();
  
  // Filter out archived ones for the public view if getAllAnnouncements doesn't already
  const activeAnnouncements = announcements.filter(a => !a.isArchived);

  return (
    <DecorativeLayout className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary border border-primary/10">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight uppercase text-foreground">All Broadcasts</h1>
                <p className="text-muted-foreground font-medium">Stay updated with the latest news from RAITE 2026.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <AnnouncementList announcements={activeAnnouncements} />
            {activeAnnouncements.length === 0 && (
              <div className="text-center py-20 border rounded-3xl bg-muted/20">
                <p className="text-muted-foreground font-medium italic">No announcements found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DecorativeLayout>
  );
}

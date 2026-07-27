import { getAllEvents, getDistinctCategories } from "@/lib/data/events";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import SearchFilter from "@/components/competitions/SearchFilter";
import DecorativeLayout from "@/components/layout/DecorativeLayout";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { userId } = await auth();
  const user = userId ? await getUserByClerkId(userId) : null;
  const isSubAdmin = user?.role === "SUB_ADMIN";

  const { search, category } = await searchParams;
  const allEvents = await getAllEvents();
  const categories = await getDistinctCategories();

  // If sub-admin, only show assigned competitions
  const eventsForUser = isSubAdmin
    ? allEvents.filter((event) => event.subAdminId === user.id)
    : allEvents;

  // Client-side filtering simulation in server component
  const filteredEvents = eventsForUser.filter((event) => {
    const matchesSearch = search 
      ? event.title.toLowerCase().includes(search.toLowerCase()) 
      : true;
    const matchesCategory = category && category !== "all"
      ? event.category === category
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <DecorativeLayout className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Competitions</h1>
          <p className="text-xl text-muted-foreground">
            {isSubAdmin ? "Manage your assigned competitions." : "Explore and register for the premier IT competitions at RAITE 2026."}
          </p>
          {isSubAdmin && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                You are viewing only your assigned competitions.
              </p>
            </div>
          )}
        </div>
        
        <SearchFilter categories={categories} />
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed border-border">
            <p className="text-muted-foreground text-lg font-medium">
              No competitions found matching your filters.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredEvents.map((event, index) => {
              // Serialize Date objects to strings to prevent Next.js client component serialization crashes
              const serializedEvent = {
                ...event,
                startDate: event.startDate.toISOString(),
                endDate: event.endDate.toISOString(),
                createdAt: event.createdAt.toISOString(),
                updatedAt: event.updatedAt.toISOString(),
              };
              return (
                <CompetitionCard 
                  key={event.id} 
                  event={serializedEvent as any} 
                  index={index} 
                  isAssigned={isSubAdmin}
                />
              );
            })}
          </div>
        )}
      </div>
    </DecorativeLayout>
  );
}

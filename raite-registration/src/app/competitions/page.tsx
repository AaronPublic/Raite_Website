import { getAllEvents, getDistinctCategories } from "@/lib/data/events";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import SearchFilter from "@/components/competitions/SearchFilter";

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search, category } = await searchParams;
  const allEvents = await getAllEvents();
  const categories = await getDistinctCategories();

  // Client-side filtering simulation in server component
  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch = search 
      ? event.title.toLowerCase().includes(search.toLowerCase()) 
      : true;
    const matchesCategory = category && category !== "all"
      ? event.category === category
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Competitions</h1>
          <p className="text-xl text-muted-foreground">
            Explore and register for the premier IT competitions at RAITE 2026.
          </p>
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
            {filteredEvents.map((event, index) => (
              <CompetitionCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

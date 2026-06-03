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
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Competitions</h1>
        <p className="text-xl text-gray-600">
          Explore and register for AI & IT competitions at RAITE 2025.
        </p>
      </div>

      <SearchFilter categories={categories} />

      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
          <p className="text-gray-500 text-lg font-medium">
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
  );
}

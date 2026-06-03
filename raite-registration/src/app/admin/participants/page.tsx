import { getPaginatedParticipants } from "@/lib/data/participants";
import ParticipantsTable from "@/components/admin/ParticipantsTable";
import ParticipantFilters from "@/components/admin/ParticipantFilters";
import ExportButtons from "@/components/admin/ExportButtons";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string; 
    search?: string; 
    school?: string; 
    course?: string; 
    yearLevel?: string 
  }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  
  const { participants, totalPages, totalCount } = await getPaginatedParticipants(
    currentPage,
    10,
    {
      search: params.search,
      school: params.school,
      course: params.course,
      yearLevel: params.yearLevel,
    }
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Participants</h1>
          <p className="text-gray-500 text-sm">
            Manage and view all {totalCount} registered students.
          </p>
        </div>
        <ExportButtons />
      </div>

      <ParticipantFilters />

      <ParticipantsTable 
        participants={participants as any} 
        totalPages={totalPages} 
        currentPage={currentPage} 
      />
    </div>
  );
}

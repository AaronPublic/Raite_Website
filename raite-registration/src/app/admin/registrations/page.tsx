import { getFilteredRegistrations } from "@/lib/data/registrations";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import { getAllEvents } from "@/lib/data/events";
import RegistrationFilters from "@/components/admin/RegistrationFilters";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; eventId?: string }>;
}) {
  const params = await searchParams;
  const registrations = await getFilteredRegistrations({
    search: params.search,
    status: params.status as any,
    eventId: params.eventId,
  });

  const events = await getAllEvents();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registrations</h1>
        <p className="text-gray-500 text-sm">
          Review and manage all {registrations.length} applications.
        </p>
      </div>

      <RegistrationFilters events={events as any} />

      <RegistrationsTable initialData={registrations as any} />
    </div>
  );
}

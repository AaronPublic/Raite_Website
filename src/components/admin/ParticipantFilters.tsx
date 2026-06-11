import { getSchools } from "@/lib/data/schools";
import ParticipantFiltersClient from "@/components/admin/ParticipantFiltersClient";

export default async function ParticipantFilters() {
  const schools = await getSchools();
  return <ParticipantFiltersClient schools={schools} />;
}

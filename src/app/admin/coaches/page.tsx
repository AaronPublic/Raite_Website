import { getFacultyCoaches } from "@/app/actions/coaches";
import CoachesManagement from "@/components/admin/CoachesManagement";

export default async function AdminCoachesPage() {
  const coaches = await getFacultyCoaches();

  return (
    <CoachesManagement initialCoaches={coaches} />
  );
}

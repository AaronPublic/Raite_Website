import { getSchools } from "@/lib/data/schools";
import { getShirtSizesData } from "@/app/actions/participants";
import { ShirtSizesClient } from "@/components/admin/ShirtSizesClient";

export default async function AdminShirtSizesPage() {
  const [schools, initialParticipants] = await Promise.all([
    getSchools(),
    getShirtSizesData()
  ]);

  return (
    <div className="space-y-8">
      <ShirtSizesClient 
        schools={schools} 
        initialParticipants={initialParticipants} 
      />
    </div>
  );
}

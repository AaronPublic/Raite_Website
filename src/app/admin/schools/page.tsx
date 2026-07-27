import { getSchools } from "@/lib/data/schools";
import SchoolManagement from "@/components/admin/SchoolManagement";
import { School } from "lucide-react";

export default async function AdminSchoolsPage() {
  const schools = await getSchools();

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-blue-600">
          <School className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.3em]">Institution Hub</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
          Manage <span className="text-blue-600">Schools</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mt-2">Add institutions, define abbreviations, and classify member status.</p>
      </div>

      <SchoolManagement schools={schools} />
    </div>
  );
}

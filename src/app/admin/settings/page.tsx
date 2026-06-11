import { getSystemSetting } from "@/lib/data/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import { Settings } from "lucide-react";
import { getSchools } from "@/lib/data/schools";
import SchoolManagement from "@/components/admin/SchoolManagement";

export default async function AdminSettingsPage() {
  const [missionStartDate, schools] = await Promise.all([
    getSystemSetting("MISSION_START_DATE"),
    getSchools(),
  ]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-blue-600">
          <Settings className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.3em]">System Management</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
          Site <span className="text-blue-600">Settings</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mt-2">Manage global configurations and site-wide parameters.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <SettingsForm initialMissionStartDate={missionStartDate} />
        <SchoolManagement schools={schools} />
      </div>
    </div>
  );
}

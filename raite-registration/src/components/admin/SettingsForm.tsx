"use client";

import { useState } from "react";
import { updateSystemSetting } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface SettingsFormProps {
  initialMissionStartDate: string | null;
}

export default function SettingsForm({ initialMissionStartDate }: SettingsFormProps) {
  const [missionStartDate, setMissionStartDate] = useState(initialMissionStartDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateSystemSetting("MISSION_START_DATE", missionStartDate);
      if (result && result.success) {
        toast.success("Mission start date updated successfully");
      } else {
        toast.error(result?.error || "Failed to update setting");
      }
    } catch (error: any) {
      toast.error(`System Error: ${error.message || "An unexpected error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl border-none shadow-2xl shadow-blue-600/5 bg-white dark:bg-gray-900/40 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 md:p-12 border-b dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Countdown Configuration</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">Set the global target date for the "Mission Start" countdown.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="missionStartDate" className="text-xs font-black uppercase tracking-widest text-gray-400">Target Date & Time</Label>
            <div className="relative">
              <Input
                id="missionStartDate"
                type="datetime-local"
                value={missionStartDate}
                onChange={(e) => setMissionStartDate(e.target.value)}
                className="h-16 px-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-lg font-bold focus:ring-blue-600 transition-all"
                required
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">This date will override any automatic event-based countdowns on the homepage.</p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? "UPDATING SYSTEM..." : "SAVE CONFIGURATION"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

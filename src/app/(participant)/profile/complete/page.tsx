import { getSchools } from "@/lib/data/schools";
import ProfileCompleteForm from "@/components/profile/ProfileCompleteForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Sparkles } from "lucide-react";
import { MotionDiv } from "@/components/profile/MotionDiv";

export default async function ProfileCompletePage() {
  const schools = await getSchools();

  return (
    <div className="filipino-page flex items-center justify-center min-h-screen bg-background p-6 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute left-0 top-0 h-full w-3 bg-primary" />
        <div className="absolute left-3 top-0 h-full w-2 bg-accent" />
        <div className="absolute right-0 top-0 h-full w-4 bg-destructive" />
      </div>

      <MotionDiv className="w-full max-w-lg relative z-10">
        <Card className="bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl shadow-blue-600/5 overflow-hidden">
          <CardHeader className="p-10 pb-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Final Boarding Call
              </CardTitle>
              <CardDescription className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3" />
                Complete Your Identity
              </CardDescription>
            </div>
          </CardHeader>
          
          <ProfileCompleteForm schools={schools} />
        </Card>
      </MotionDiv>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MyRegistrationsTable } from "@/components/registration/MyRegistrationsTable";
import { Download, AlertCircle, Send } from "lucide-react";

export default async function MyRegistrationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || user.role !== "FACULTY_COACH") {
    redirect("/");
  }

  const registrations = await db.registration.findMany({
    where: { coachId: user.id },
    include: { 
      event: true,
      user: {
        select: {
          school: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto py-10 px-4 md:px-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">My Registrations</h1>
        <p className="text-lg text-gray-500 font-medium">Manage and track your competition entries.</p>
      </div>

      <div className="mb-10 p-8 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-3xl w-full shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-blue-900/40 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-800">
              <AlertCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-blue-950 dark:text-blue-100 uppercase tracking-tight">
              Registration Approval Notice
            </h2>
          </div>
          
          <a 
            href="/assets/RAITE_2026_PROMISSORY_TEMPLATE.docx" 
            download
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            Download Template
          </a>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-8 text-base md:text-lg leading-relaxed text-justify">
          Registration will only be approved upon submission of either a <span className="font-black text-gray-900 dark:text-white">payment deposit slip</span> or a <span className="font-black text-gray-900 dark:text-white">duly signed Promissory Note</span>.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm flex flex-col gap-3">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Submission Email Recipients</p>
            <div className="flex flex-col gap-2 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-400">To:</span>
                <span className="text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">psitecl.raite@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-400">CC:</span>
                <span className="text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">psiteregion3@gmail.com</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm flex flex-col gap-3">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Required Email Subject</p>
            <div className="font-mono text-sm font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
              Promissory Note - [Institution Name]
            </div>
          </div>
        </div>
      </div>

      <MyRegistrationsTable registrations={registrations} />
    </div>
  );
}

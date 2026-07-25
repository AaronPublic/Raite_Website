import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import EntryUrlEditor from "@/components/registration/EntryUrlEditor";
import AdminRegistrationActions from "@/components/admin/AdminRegistrationActions";

export default async function AdminViewRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const registration = await db.registration.findUnique({
    where: { id },
    include: { event: true, user: true, coach: true },
  });

  if (!registration) redirect("/admin/registrations");

  // Fetch team member details
  const memberEmails = (registration.members as string[]) || [];
  const teamMembers = await db.user.findMany({
    where: {
      email: { in: memberEmails },
    },
    select: {
      name: true,
      email: true,
      uniqueId: true,
    },
  });

  // Authorization Check
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const isOnlineRelevant = registration.event.subcategory === "ONLINE" || registration.event.subcategory === "ONSITE_PAGEANT";
  const isPageant = registration.event.subcategory === "ONSITE_PAGEANT";

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="rounded-full">
            <Link href="/admin/registrations">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">
              {registration.event.title}
            </h1>
            <p className="text-gray-500 font-medium">Registration Details</p>
          </div>
        </div>
        <AdminRegistrationActions registrationId={registration.id} currentStatus={registration.status} />
      </div>

      {isOnlineRelevant && (
        <Card className="p-8 rounded-[2rem] border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">Submitted Link</h3>
              <p className="text-xs text-gray-500 font-medium">
                {isPageant ? "View and verify the submitted 3R photo links." : "Sub-admins and Admins can edit this if the coach submitted a wrong link."}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t">
            {isPageant ? (
               <div className="flex flex-col gap-3">
                 {(() => {
                   if (!registration.entryUrl) return <span className="text-gray-500 italic text-sm">No photos submitted yet.</span>;
                   try {
                     const parsed = JSON.parse(registration.entryUrl);
                     return (
                       <>
                         <div className="flex items-center justify-between gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="text-xs font-black uppercase text-gray-400">Male Photo</span>
                            <a href={parsed.malePhoto} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline text-sm truncate flex-1 text-right">
                              {parsed.malePhoto}
                            </a>
                         </div>
                         <div className="flex items-center justify-between gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="text-xs font-black uppercase text-gray-400">Female Photo</span>
                            <a href={parsed.femalePhoto} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline text-sm truncate flex-1 text-right">
                              {parsed.femalePhoto}
                            </a>
                         </div>
                       </>
                     );
                   } catch {
                     return <span className="text-red-500 text-sm font-bold">Invalid submission data format.</span>;
                   }
                 })()}
               </div>
            ) : (
              <EntryUrlEditor registrationId={registration.id} initialEntryUrl={registration.entryUrl} />
            )}
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 rounded-[2rem] border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Registration Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Competitor / Team Leader</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{registration.user.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Competitor Email</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{registration.user.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Faculty Coach</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {registration.coach?.name || registration.registeredBy || "N/A"}
              </p>
            </div>
            {registration.coach?.email && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Coach Email</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{registration.coach.email}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Team Name</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{registration.teamName || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
              <Badge 
                variant="outline" 
                className={cn(
                  "font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border-2 mt-1",
                  registration.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" : 
                  registration.status === "REJECTED" ? "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-450 dark:border-yellow-900/30" : 
                  "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
                )}
              >
                {registration.status === "REJECTED" ? "TO REVIEW" : registration.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Created</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(registration.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 rounded-[2rem] border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Requirements</h2>
          <div className="grid gap-4">
            {Object.entries(registration.requirements as Record<string, string>).map(([key, value]) => (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
                {value.startsWith("http") ? (
                  <a 
                    href={value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-blue-600 dark:text-blue-400 font-bold hover:underline break-all text-sm leading-tight"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="block text-gray-900 dark:text-white font-medium text-sm">{value}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-8 rounded-[2rem] border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Team Members ({teamMembers.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div key={member.email} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{member.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-black border-blue-200 text-blue-600 bg-blue-50">
                  {member.uniqueId}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{member.email}</span>
              </div>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <p className="text-gray-500 font-medium italic">No team members listed.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

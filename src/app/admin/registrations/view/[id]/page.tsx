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

export default async function AdminViewRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const registration = await db.registration.findUnique({
    where: { id },
    include: { event: true, user: true },
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

  const isOnline = registration.event.subcategory === "ONLINE";

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
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

      {isOnline && (
        <Card className="p-6 rounded-[2rem] border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Online Submission Link</p>
              <p className="text-xs text-blue-900/60 dark:text-blue-300/60 font-medium mt-0.5">Sub-admins and Admins can edit this if the coach submitted a wrong link.</p>
            </div>
          </div>
          <div className="flex-1 max-w-md bg-white dark:bg-gray-900 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
            <EntryUrlEditor registrationId={registration.id} initialEntryUrl={registration.entryUrl} />
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 rounded-[2rem] border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Registration Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Coach</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{registration.user.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Email</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{registration.user.email}</p>
            </div>
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
                  registration.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100" : 
                  registration.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" : 
                  "bg-blue-50 text-blue-700 border-blue-100"
                )}
              >
                {registration.status}
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

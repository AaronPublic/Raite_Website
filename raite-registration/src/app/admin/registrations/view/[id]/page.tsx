import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminViewRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const registration = await db.registration.findUnique({
    where: { id },
    include: { event: true, user: true },
  });

  if (!registration) redirect("/admin/registrations");

  // Authorization Check
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 rounded-[2rem] border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Registration Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Participant</p>
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
    </div>
  );
}

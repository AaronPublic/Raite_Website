import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EditRegistrationForm from "@/components/registration/EditRegistrationForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminEditRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Determine required fields based on event category
  const isEgames = registration.event.subcategory === "EGAMES";
  const eventRequirements = isEgames 
    ? ["crossArmPhoto", "creativeShotPhoto", "coachCert", "participantDocs", "schoolLogo"]
    : ["coachCert", "participantDocs"];

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
            Edit Registration: {registration.event.title}
            </h1>
            <p className="text-gray-500 font-medium">Update details for {registration.user.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 rounded-[2rem] border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Current Info</h2>
            <p><strong>Participant:</strong> {registration.user.name}</p>
            <p><strong>Email:</strong> {registration.user.email}</p>
            <p><strong>Status:</strong> {registration.status}</p>
        </Card>
        
        <EditRegistrationForm 
          registration={registration} 
          eventRequirements={eventRequirements} 
          maxParticipants={registration.event.maxParticipantsPerRegistration}
        />
      </div>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EditRegistrationForm from "@/components/registration/EditRegistrationForm";
import { Card } from "@/components/ui/card";

export default async function AdminManageRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Registration: {registration.event.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Registration Details</h2>
            <p><strong>Participant:</strong> {registration.user.name}</p>
            <p><strong>Status:</strong> {registration.status}</p>
            <p><strong>Created:</strong> {new Date(registration.createdAt).toLocaleDateString()}</p>
        </Card>
        
        <EditRegistrationForm registration={registration} eventRequirements={eventRequirements} />
      </div>
    </div>
  );
}

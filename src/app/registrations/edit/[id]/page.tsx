import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EditRegistrationForm from "@/components/registration/EditRegistrationForm";

export default async function EditRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const registration = await db.registration.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!registration) redirect("/registrations/my");
  if (registration.status === "APPROVED") redirect("/registrations/my");

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || (registration.coachId !== user.id && registration.userId !== user.id)) {
    redirect("/");
  }

  // Determine required fields based on event category
  const isEgames = registration.event.subcategory === "EGAMES";
  const eventRequirements = isEgames 
    ? ["crossArmPhoto", "creativeShotPhoto", "coachCert", "participantDocs", "schoolLogo"]
    : ["coachCert", "participantDocs"];

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Registration: {registration.event.title}</h1>
      <EditRegistrationForm 
        registration={registration} 
        eventRequirements={eventRequirements} 
        maxParticipants={registration.event.maxParticipantsPerRegistration}
      />
    </div>
  );
}

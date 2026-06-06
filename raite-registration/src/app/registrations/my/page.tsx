import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MyRegistrationsTable } from "@/components/registration/MyRegistrationsTable";

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
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Registrations</h1>
      <MyRegistrationsTable registrations={registrations} />
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getEligibleParticipants } from "@/app/actions/participants";
import { CompetitorsTable } from "@/components/registration/CompetitorsTable";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CompetitorsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || (user.role !== "FACULTY_COACH" && user.role !== "ADMIN" && user.role !== "SUB_ADMIN")) {
    redirect("/");
  }

  const participants = await getEligibleParticipants();

  return (
    <div className="container mx-auto py-10 px-4 md:px-8">
      <div className="flex flex-col gap-4 mb-8">
        <Link 
          href="/registrations/my"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Registrations
        </Link>
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Registered Competitors and Shirt Sizes</h1>
          <p className="text-lg text-gray-500 font-medium">View and manage registered competitors, coaches, and shirt sizes for {user.school || "your school"}.</p>
        </div>
      </div>

      <CompetitorsTable initialParticipants={participants} />
    </div>
  );
}

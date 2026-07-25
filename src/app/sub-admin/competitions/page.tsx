import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import SubAdminCompetitionsTable from "@/components/sub-admin/SubAdminCompetitionsTable";

export default async function SubAdminCompetitionsPage() {
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkId: userId as string } });

  if (!user) return null;

  const assignedEvents = await db.event.findMany({
    where: { subAdminId: user.id },
    include: {
      registrations: {
        include: {
          user: {
            select: { school: true, name: true }
          },
          coach: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  // Extract schools and coaches
  const eventsWithData = assignedEvents.map(event => {
    const registrations = event.registrations;
    const schools = Array.from(new Set(registrations.map(r => r.user.school).filter(Boolean)));
    const coaches = Array.from(new Set(registrations.map(r => r.coach?.name || r.registeredBy).filter(Boolean)));
    return {
      ...event,
      registeredSchools: schools,
      coaches,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">My Competitions</h1>
        <p className="text-gray-500 text-sm">Manage the competitions you have been assigned to.</p>
      </div>

      <SubAdminCompetitionsTable events={eventsWithData as any} />
    </div>
  );
}

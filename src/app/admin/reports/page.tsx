import { db } from "@/lib/db";
import AdminReportsPageClient from "./ReportsPageClient";

export default async function ReportsPage() {
  const events = await db.event.findMany({
    include: {
      _count: {
        select: { registrations: true }
      }
    },
    orderBy: {
      title: "asc",
    },
  });

  return <AdminReportsPageClient events={events as any} />;
}

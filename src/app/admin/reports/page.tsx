import { getAllEvents } from "@/lib/data/events";
import AdminReportsPageClient from "./ReportsPageClient";



export default async function ReportsPage() {
  const events = await getAllEvents();

  return <AdminReportsPageClient events={events as any} />;
}

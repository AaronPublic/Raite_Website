import { getUpcomingEvents } from "@/lib/data/events";
import EventList from "@/components/registration/EventList";
import { checkRegistrationExists } from "@/app/actions/registration";

export const dynamic = "force-dynamic";

export default async function Step1Page() {
  const events = await getUpcomingEvents();
  
  // Check registration status for each event
  const eventsWithStatus = await Promise.all(
    events.map(async (event) => {
      const isRegistered = await checkRegistrationExists(event.id);
      return { ...event, isRegistered };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Step 1: Select an Event</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Choose the competition you want to join.</p>
      </div>
      
      {eventsWithStatus.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-bold">No upcoming events available at the moment.</p>
        </div>
      ) : (
        <EventList events={eventsWithStatus} />
      )}
    </div>
  );
}

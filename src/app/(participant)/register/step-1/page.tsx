import { getUpcomingEvents } from "@/lib/data/events";
import EventList from "@/components/registration/EventList";
import { checkRegistrationExists } from "@/app/actions/registration";



export default async function Step1Page() {
  const events = await getUpcomingEvents();
  
  const eventsWithStatus = await Promise.all(
    events.map(async (event) => {
      const isRegistered = await checkRegistrationExists(event.id);
      return { ...event, isRegistered };
    })
  );

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Choose Your Challenge</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-lg">Select the competition you wish to register for to begin your journey.</p>
      </div>
      
      {eventsWithStatus.length === 0 ? (
        <div className="bento-card p-12 text-center border-dashed">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No upcoming events are currently available.</p>
        </div>
      ) : (
        <EventList events={eventsWithStatus} />
      )}
    </div>
  );
}

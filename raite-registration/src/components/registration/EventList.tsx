"use client";

import { useWizard } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Check, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isRegistered?: boolean;
}

export default function EventList({ events }: { events: Event[] }) {
  const { data, updateData } = useWizard();
  const router = useRouter();

  const handleSelect = (event: Event) => {
    if (event.isRegistered) return;
    updateData({ 
      eventId: event.id,
      eventTitle: event.title
    });
  };

  const handleNext = () => {
    if (data.eventId) {
      router.push("/register/step-2");
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "group relative overflow-hidden transition-all duration-300 border-2 h-full flex flex-col",
                data.eventId === event.id 
                  ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/50 dark:bg-blue-900/10" 
                  : "hover:border-blue-400 dark:border-gray-800 dark:bg-gray-900/40 hover:shadow-xl",
                event.isRegistered && "opacity-75 grayscale-[0.5] cursor-not-allowed border-gray-200 dark:border-gray-800"
              )}
              onClick={() => handleSelect(event)}
            >
              {event.isRegistered && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                    Already Registered
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start pr-8">
                  <CardTitle className="text-xl font-bold tracking-tight group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2 font-medium text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {new Date(event.startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} - {new Date(event.endDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
                  {event.description || "Join this exciting competition and showcase your skills."}
                </p>
              </CardContent>
              <div className="px-6 pb-6 pt-2">
                <div className={cn(
                  "w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm",
                  data.eventId === event.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                    : event.isRegistered
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700"
                      : "bg-white dark:bg-gray-950 text-blue-600 border-blue-100 dark:border-blue-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                )}>
                  {event.isRegistered ? (
                    <>
                      <Info className="w-4 h-4" />
                      Registration Complete
                    </>
                  ) : data.eventId === event.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Selected
                    </>
                  ) : (
                    "Select Competition"
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-8 border-t dark:border-gray-800">
        <p className="text-sm text-gray-500 font-medium">
          {data.eventId ? "1 competition selected" : "Please select a competition to continue"}
        </p>
        <Button 
          onClick={handleNext} 
          disabled={!data.eventId}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold"
        >
          Continue to Step 2
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

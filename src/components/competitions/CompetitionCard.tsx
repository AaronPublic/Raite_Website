"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Calendar, Users, ArrowRight, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface CompetitionCardProps {
  event: {
    id: string;
    title: string;
    category: string | null;
    startDate: Date;
    maxRegistrations: number | null;
    maxParticipantsPerRegistration: number;
    status: string;
    imageUrl?: string | null;
    rulesPdfUrl?: string | null;
  };
  index?: number;
}

export default function CompetitionCard({ event, index = 0 }: CompetitionCardProps) {
  const { user } = useUser();
  const isOpen = event.status === "UPCOMING";
  
  const role = user?.publicMetadata?.role as string;
  const canRegister = role === "FACULTY_COACH";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Card className="group relative flex flex-col aspect-square bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-600/10 hover:-translate-y-1 rounded-[2rem] active:border-primary/50">
        {/* Top Half: Image */}
        <div className="relative h-1/2 w-full overflow-hidden">
          {event.imageUrl ? (
            <Image 
              src={event.imageUrl} 
              alt={event.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center border-b-4 border-accent">
              <Trophy className="w-12 h-12 text-primary/30" />
            </div>
          )}
          
          {/* Badge Overlay */}
          <div className="absolute top-3 right-3 z-10">
            <Badge 
              variant="secondary" 
              className={cn(
                "font-bold px-2 py-0.5 rounded-full uppercase tracking-widest text-[8px] backdrop-blur-md shadow-lg",
                isOpen 
                  ? "bg-green-500/90 text-white border-none" 
                  : "bg-gray-500/90 text-white border-none"
              )}
            >
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>

          {/* Category Overlay */}
          {event.category && (
            <div className="absolute bottom-3 left-3 z-10">
              <Badge className="bg-primary/90 text-white border-none font-bold uppercase tracking-widest text-[8px] backdrop-blur-md">
                {event.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Bottom Half: Content */}
        <div className="h-1/2 flex flex-col p-4 justify-between bg-white dark:bg-gray-900">
          <div className="space-y-1">
            <CardTitle className="text-base font-black tracking-tight line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
              {event.title}
            </CardTitle>
            
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase">
                  {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Users className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase">
                  {event.maxRegistrations || "∞"} Slots
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <Link href={`/competitions/${event.id}`} className={cn(buttonVariants({ variant: "ghost" }), "flex-1 h-8 rounded-lg font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-[10px] p-0 text-gray-900 dark:text-gray-100")}>Rules</Link>

            {canRegister && isOpen && (
              <Link href={`/register/step-1?eventId=${event.id}`} className={cn(buttonVariants(), "flex-2 h-8 rounded-lg bg-primary hover:bg-[#002673] text-white font-black shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 group/btn text-[10px] p-0 px-2 flex items-center justify-center gap-1")}>
                JOIN
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        <div className="absolute top-0 left-0 w-1/3 h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 left-1/3 w-1/3 h-1 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-1/3 h-1 bg-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </motion.div>
  );
}

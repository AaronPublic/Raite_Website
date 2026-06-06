"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Users, ArrowRight, Trophy, Sparkles, AlertCircle } from "lucide-react";
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
  
  // Note: For full role-based check here, we'd need to pass role as prop.
  // Assuming a simple role check from Clerk custom claims if configured, 
  // or restricted to Faculty Coach only as per requirements.
  const role = user?.publicMetadata?.role as string;
  const canRegister = role === "FACULTY_COACH";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="w-full"
    >
      <Card className="group relative flex flex-col aspect-square bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-600/10 hover:-translate-y-1 rounded-[2rem]">
        {/* Top Half: Image */}
        <div className="relative h-1/2 w-full overflow-hidden">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-blue-200 dark:text-blue-800" />
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
              <Badge className="bg-blue-600/90 text-white border-none font-bold uppercase tracking-widest text-[8px] backdrop-blur-md">
                {event.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Bottom Half: Content */}
        <div className="h-1/2 flex flex-col p-4 justify-between bg-white dark:bg-gray-900">
          <div className="space-y-1">
            <CardTitle className="text-base font-black tracking-tight line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
              <Link href={`/register/step-1?eventId=${event.id}`} className={cn(buttonVariants(), "flex-2 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 group/btn text-[10px] p-0 px-2 flex items-center justify-center gap-1")}>
                JOIN
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </motion.div>
  );
}

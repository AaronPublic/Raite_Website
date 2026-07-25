"use client";

import { Event } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, Edit, Users, School, Trophy } from "lucide-react";
import Link from "next/link";

interface SubAdminCompetitionsTableProps {
  events: (Event & { 
    registeredSchools: string[]; 
    coaches: string[]; 
    registrations?: any[];
  })[];
}

export default function SubAdminCompetitionsTable({ events }: SubAdminCompetitionsTableProps) {
  return (
    <div className="space-y-6">
      {events.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">No competitions assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Competition Info */}
              <div className="flex-1 space-y-2 w-full">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50">
                    {event.category}
                  </Badge>
                  <Badge variant={event.status === "UPCOMING" ? "default" : "secondary"} className="text-[9px] font-bold uppercase tracking-widest">
                    {event.status}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/50 flex items-center gap-1">
                    <Users className="w-3 h-3 text-green-500" />
                    {event.registrations?.length || 0} Registrations
                  </Badge>
                </div>
              </div>

              {/* Registered Schools & Coaches List */}
              <div className="flex-1 w-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Registered Participants</p>
                <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                  {event.registeredSchools.length > 0 ? (
                    event.registeredSchools.map((school, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] bg-gray-50/50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="font-bold text-gray-900 dark:text-gray-100 truncate">{school}</span>
                        <span className="text-gray-500 truncate text-[10px] bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">{event.coaches[i] || "N/A"}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-gray-400 italic py-4 bg-gray-50/30 dark:bg-gray-800/20 rounded-xl text-center border border-dashed border-gray-200 dark:border-gray-800">
                      No registrations yet
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto lg:min-w-[180px]">
                <Link 
                  href={`/sub-admin/competitions/${event.id}/edit`} 
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex-1 lg:w-full justify-center lg:justify-start gap-2.5 rounded-xl h-10")}
                >
                  <Edit className="h-4 w-4" /> <span className="text-xs font-bold">Edit</span>
                </Link>
                <Link 
                  href={`/sub-admin/competitions/${event.id}/registrations`} 
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 lg:w-full justify-center lg:justify-start gap-2.5 rounded-xl h-10 border-2")}
                >
                  <Eye className="h-4 w-4" /> <span className="text-xs font-bold whitespace-nowrap">View Registrations</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

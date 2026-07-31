"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Bell, UserCheck, AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUnapprovedCoaches } from "@/app/actions/coaches";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface UnapprovedCoach {
  id: string;
  name: string | null;
  email: string;
  school: string | null;
  createdAt: Date;
}

export function AdminNotifications() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<UnapprovedCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unapproved coaches
  const fetchCoaches = async () => {
    try {
      const data = await getUnapprovedCoaches();
      setCoaches(data);
    } catch (err) {
      console.error("Failed to fetch unapproved coaches for notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and whenever the popover is opened to keep it dynamic
  useEffect(() => {
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCoaches();
    }
  }, [isOpen]);

  const handleNotificationClick = (email: string) => {
    setIsOpen(false);
    // Redirect to the users page with the coach's email in the search query to show only them
    router.push(`/admin/users?search=${encodeURIComponent(email)}`);
  };

  const pendingCount = coaches.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full w-10 h-10 transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="View notifications"
        >
          <Bell className="h-[1.2rem] w-[1.2rem] text-gray-700 dark:text-gray-300" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white ring-2 ring-white dark:ring-[#07142F] animate-pulse">
              {pendingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="w-[calc(100vw-2rem)] sm:w-96 rounded-2xl p-0 shadow-2xl border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 z-50"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-[0.15em] text-gray-900 dark:text-white">Pending Approvals</span>
            {pendingCount > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingCount} NEW
              </span>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-150 dark:divide-gray-800 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500 font-medium animate-pulse flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400 animate-spin" />
              Loading pending approvals...
            </div>
          ) : pendingCount === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950/20 text-green-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">You're all caught up!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">All registered faculty coaches have been approved.</p>
              </div>
            </div>
          ) : (
            coaches.map((coach) => (
              <button
                key={coach.id}
                onClick={() => handleNotificationClick(coach.email)}
                className="w-full text-left p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors">
                    {coach.name || "New Faculty Coach"}
                  </p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight truncate mt-0.5">
                    {coach.school || "Unspecified School"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {coach.email}
                  </p>
                  <span className="text-[9px] text-gray-400 font-medium flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3" />
                    {new Date(coach.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 text-center">
          <Button
            variant="ghost"
            className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg h-8 cursor-pointer"
            onClick={() => {
              setIsOpen(false);
              router.push("/admin/coaches");
            }}
          >
            Manage All Coaches
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { getDashboardData } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import StatsCards from "@/components/admin/StatsCards";
import RegistrationsPerCompetition from "@/components/admin/RegistrationsPerCompetition";
import RegistrationsByClassification from "@/components/admin/RegistrationsByClassification";
import RegistrationTrends from "@/components/admin/RegistrationTrends";
import { Loader2, RefreshCcw, LayoutDashboard, Calendar, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    try {
      const result = await getDashboardData();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      startTransition(() => {
        fetchData();
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-600 animate-spin" />
          <LayoutDashboard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Analyzing Data</p>
          <p className="text-sm text-gray-500 font-medium animate-pulse">Synchronizing real-time records...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            System Administrator Access
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Command Center</h1>
          <div className="flex items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400">
            <p className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              RAITE 2025 Live Pulse
            </p>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Live Updates Active
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isPending && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-2"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                Syncing...
              </motion.span>
            )}
          </AnimatePresence>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()} 
            disabled={isPending}
            className="h-10 px-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            <RefreshCcw className={cn("w-4 h-4 mr-2", isPending && "animate-spin")} />
            Refresh Data
          </Button>
        </div>
      </div>

      <StatsCards stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <RegistrationsPerCompetition data={data.competitionData} />
        </div>
        <div className="lg:col-span-4">
          <RegistrationsByClassification data={data.classificationData} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900/40 rounded-[2.5rem] p-1 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <RegistrationTrends data={data.trends} />
      </div>
    </motion.div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Users2, Trophy, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  stats: {
    participantsCount: number;
    teamCount: number;
    activeCompetitionsCount: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    {
      title: "Total Participants",
      value: stats.participantsCount,
      label: "Active student accounts",
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Teams",
      value: stats.teamCount,
      label: "Competitive formations",
      icon: Users2,
      color: "purple",
    },
    {
      title: "Active Competitions",
      value: stats.activeCompetitionsCount,
      label: "Open for enrollment",
      icon: Trophy,
      color: "indigo",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-600/5 transition-all group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <item.icon className="w-24 h-24" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">{item.title}</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                  <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-500">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

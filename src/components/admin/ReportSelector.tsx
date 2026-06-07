"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy } from "lucide-react";

interface ReportSelectorProps {
  type: "competition" | "demographics";
  onChange: (type: "competition" | "demographics") => void;
}

export default function ReportSelector({ type, onChange }: ReportSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card 
        className={`cursor-pointer transition-all border-2 ${
          type === "competition" 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
        }`}
        onClick={() => onChange("competition")}
      >
        <CardContent className="p-6 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${
            type === "competition" 
              ? "bg-blue-500 text-white" 
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}>
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Competition-wise</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-nowrap">Participant list per competition</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all border-2 ${
          type === "demographics" 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
        }`}
        onClick={() => onChange("demographics")}
      >
        <CardContent className="p-6 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${
            type === "demographics" 
              ? "bg-blue-500 text-white" 
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Demographics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-nowrap">Aggregate data by school/course</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

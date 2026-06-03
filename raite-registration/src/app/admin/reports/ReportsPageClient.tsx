"use client";

import { useState } from "react";
import { Event } from "@prisma/client";
import ReportSelector from "@/components/admin/ReportSelector";
import CompetitionReport from "@/components/admin/CompetitionReport";
import DemographicsReport from "@/components/admin/DemographicsReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReportsPage({ events }: { events: Event[] }) {
  const [reportType, setReportType] = useState<"competition" | "demographics">("competition");

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm">Generate and export detailed data for RAITE 2025.</p>
      </div>

      <ReportSelector type={reportType} onChange={setReportType} />

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-xl font-bold text-gray-900 capitalize">
            {reportType} Report
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {reportType === "competition" ? (
            <CompetitionReport events={events} />
          ) : (
            <DemographicsReport />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

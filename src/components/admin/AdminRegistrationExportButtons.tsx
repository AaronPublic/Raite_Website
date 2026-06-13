"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { exportRegistrationsCSV, getRegistrationsForPDF } from "@/app/actions/registrations";
import { generateRAITEReport } from "@/lib/pdf-reports";

export default function AdminRegistrationExportButtons() {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const searchParams = useSearchParams();

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const filters = Object.fromEntries(searchParams.entries());
      const csv = await exportRegistrationsCSV(filters as any);
      const date = new Date().toISOString().split('T')[0];
      
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `RAITE_2026_Registrations_List_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const filters = Object.fromEntries(searchParams.entries());
      const data = await getRegistrationsForPDF(filters as any);
      const date = new Date().toISOString().split('T')[0];
      
      generateRAITEReport({
        title: "Registration List",
        subtitle: `Generated for: RAITE 2026 Administrative Review`,
        filename: `RAITE_2026_Registrations_List_${date}`,
        columns: ['School', 'Competition', 'Status', 'Coach', 'Date'],
        data: data.map(r => [r.school, r.competition, r.status, r.coach, r.date]),
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExportingCSV} className="rounded-xl font-bold">
        {isExportingCSV ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF} className="rounded-xl font-bold">
        {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        Export PDF
      </Button>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { exportParticipantsCSV, getParticipantsForPDF } from "@/app/actions/participants";
import { generateRAITEReport } from "@/lib/pdf-reports";

export default function ExportButtons() {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const searchParams = useSearchParams();

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const filters = Object.fromEntries(searchParams.entries());
      const csv = await exportParticipantsCSV(filters);
      const date = new Date().toISOString().split('T')[0];
      
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `RAITE_2026_Participants_List_${date}.csv`);
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
      const data = await getParticipantsForPDF(filters);
      const date = new Date().toISOString().split('T')[0];
      
      generateRAITEReport({
        title: "Participant List",
        subtitle: `Generated for: RAITE 2026 Administrative Review`,
        filename: `RAITE_2026_Participants_List_${date}`,
        columns: ['Name', 'Email', 'School', 'Role', 'Joined'],
        data: data.map(p => [p.name, p.email, p.school, p.role, p.date]),
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExportingCSV}>
        {isExportingCSV ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF}>
        {isExportingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        Export PDF
      </Button>
    </div>
  );
}

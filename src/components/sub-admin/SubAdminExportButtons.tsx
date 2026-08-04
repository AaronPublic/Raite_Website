"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Users, School } from "lucide-react";
import { useState } from "react";
import { getSubAdminExportData } from "@/app/actions/reports";
import { generateRAITEReport } from "@/lib/pdf-reports";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  eventId: string;
}

export default function SubAdminExportButtons({ eventId }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: "competition" | "school", format: "csv" | "pdf") => {
    setIsExporting(true);
    try {
      const data = await getSubAdminExportData(eventId);
      const { eventTitle, registrations } = data;
      const date = new Date().toISOString().split('T')[0];

      if (format === "csv") {
        let csvContent = "";
        
        if (type === "competition") {
          const headers = ["School", "Faculty Coach Name", "Faculty Coach Email", "Competitors (with Shirt Size)"];
          const rows = registrations.map(r => [
            `"${(r.school || "").replace(/"/g, '""')}"`,
            `"${(r.coachName || "").replace(/"/g, '""')}"`,
            `"${(r.coachEmail || "").replace(/"/g, '""')}"`,
            `"${r.members.map(m => `${m.name} (${m.shirtSize})`).join(", ").replace(/"/g, '""')}"`
          ]);
          // Include Competition Name at the top
          csvContent = `Competition Name,${eventTitle.replace(/"/g, '""')}\n\n` + 
                       [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        } else {
          const headers = ["ID", "Competitor's Name", "Competitor's Email", "Shirt Size", "Competitor's Competition Name", "Faculty Coach Name", "Faculty Coach Email"];
          const rows: string[][] = [];
          registrations.forEach(r => {
            r.members.forEach(m => {
              rows.push([
                `"${(m.id || "").replace(/"/g, '""')}"`,
                `"${(m.name || "").replace(/"/g, '""')}"`,
                `"${(m.email || "").replace(/"/g, '""')}"`,
                `"${(m.shirtSize || "N/A").replace(/"/g, '""')}"`,
                `"${eventTitle.replace(/"/g, '""')}"`,
                `"${(r.coachName || "").replace(/"/g, '""')}"`,
                `"${(r.coachEmail || "").replace(/"/g, '""')}"`
              ]);
            });
          });
          csvContent = `Per School,${eventTitle.replace(/"/g, '""')}\n\n` + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${eventTitle.replace(/ /g, '_')}_${type}_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${type === "competition" ? "Per Competition" : "Per School"} CSV`);
      } else {
        // PDF Export
        if (type === "competition") {
          generateRAITEReport({
            title: eventTitle,
            subtitle: `Registration Report (By Competition) - Generated ${date}`,
            filename: `${eventTitle.replace(/ /g, '_')}_Per_Competition_${date}`,
            columns: ['School', 'Faculty Coach Name', 'Faculty Coach Email', 'Competitors (with Shirt Size)'],
            data: registrations.map(r => [
              r.school,
              r.coachName,
              r.coachEmail,
              r.members.map(m => `${m.name} (${m.shirtSize})`).join(", ")
            ]),
          });
        } else {
          const pdfData: any[][] = [];
          registrations.forEach(r => {
            r.members.forEach(m => {
              pdfData.push([
                m.id,
                m.name,
                m.email,
                m.shirtSize,
                eventTitle,
                r.coachName,
                r.coachEmail
              ]);
            });
          });

          generateRAITEReport({
            title: eventTitle,
            subtitle: `Registration Report (By School) - Generated ${date}`,
            filename: `${eventTitle.replace(/ /g, '_')}_Per_School_${date}`,
            columns: ['ID', "Competitor's Name", "Competitor's Email", "Shirt Size", 'Competitor\'s Competition Name', 'Faculty Coach Name', 'Faculty Coach Email'],
            data: pdfData,
          });
        }
        toast.success(`Exported ${type === "competition" ? "Per Competition" : "Per School"} PDF`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export. Please check console.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-1 sm:flex-none gap-2 rounded-xl border-2 h-10 sm:h-11" disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-blue-600" />}
            <span className="text-xs font-bold">Export CSV</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 px-2 py-1.5">Select Format</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport("competition", "csv")} className="gap-2 cursor-pointer">
              <Users className="h-4 w-4" /> Per Competition
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("school", "csv")} className="gap-2 cursor-pointer">
              <School className="h-4 w-4" /> Per School
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-1 sm:flex-none gap-2 rounded-xl border-2 h-10 sm:h-11" disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-red-600" />}
            <span className="text-xs font-bold">Export PDF</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 px-2 py-1.5">Select Format</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport("competition", "pdf")} className="gap-2 cursor-pointer">
              <Users className="h-4 w-4" /> Per Competition
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("school", "pdf")} className="gap-2 cursor-pointer">
              <School className="h-4 w-4" /> Per School
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

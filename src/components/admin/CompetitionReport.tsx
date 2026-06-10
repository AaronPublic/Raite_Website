"use client";

import { useState } from "react";
import { Event } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getCompetitionRegistrations } from "@/app/actions/reports";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, FileText, Loader2 } from "lucide-react";
import Papa from "papaparse";
import type { SelectRootChangeEventDetails } from "@base-ui/react/select";
import { useEffect } from "react";
import { generateRAITEReport } from "@/lib/pdf-reports";

export default function CompetitionReport({ events }: { events: Event[] }) {
  const [mounted, setMounted] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFetch = async (eventId: string | null, eventDetails: SelectRootChangeEventDetails) => {
    if (!eventId) return;
    setSelectedEventId(eventId);
    setIsLoading(true);
    try {
      const result = await getCompetitionRegistrations(eventId);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const event = events.find(e => e.id === selectedEventId);
    const date = new Date().toISOString().split('T')[0];
    const eventTitle = event ? event.title.replace(/ /g, "_") : "Competition";
    const fileName = `RAITE_2026_${eventTitle}_Report_${date}`;
    
    // Prepare data for export with requested columns
    const exportData = data.map(r => ({
      "School": r.school,
      "Team Members (Name [ID])": r.fullTeamDetails,
      "Faculty Coach": r.coachName,
      "Coach Email": r.coachEmail
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const event = events.find(e => e.id === selectedEventId);
    const date = new Date().toISOString().split('T')[0];
    const eventTitle = event ? event.title.replace(/ /g, "_") : "Competition";
    const fileName = `RAITE_2026_${eventTitle}_Report_${date}`;
    
    generateRAITEReport({
      title: "Competition Registration Report",
      subtitle: `Event: ${event?.title}`,
      filename: fileName,
      columns: ['School', 'Team Members (Name [ID])', 'Faculty Coach', 'Coach Email'],
      data: data.map(r => [r.school, r.fullTeamDetails, r.coachName, r.coachEmail]),
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Competition</label>
          <Select onValueChange={handleFetch}>
            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700" suppressHydrationWarning>
              <SelectValue placeholder="Choose a competition..." />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
              {events.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={data.length === 0} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={data.length === 0} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Generating report...</p>
        </div>
      ) : data.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
              {events.find(e => e.id === selectedEventId)?.title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {data.length} Total Registrations
              </span>
            </div>
          </div>
          <div className="border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-800/30 border-b-2 border-gray-100 dark:border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-black uppercase tracking-widest text-[10px] h-14 px-6">School</TableHead>
                  <TableHead className="text-gray-400 font-black uppercase tracking-widest text-[10px] h-14 px-6">Team Members</TableHead>
                  <TableHead className="text-gray-400 font-black uppercase tracking-widest text-[10px] h-14 px-6">Faculty Coach Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r, i) => (
                  <TableRow key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <TableCell className="text-gray-900 dark:text-white py-6 px-6 font-bold uppercase tracking-tight text-sm">{r.school}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400 py-6 px-6 text-sm font-medium">{r.teamMembers}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white py-6 px-6 font-black text-sm">{r.coachName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : selectedEventId ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No registrations found for this competition.</p>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Select a competition above to view report.</p>
        </div>
      )}
    </div>
  );
}

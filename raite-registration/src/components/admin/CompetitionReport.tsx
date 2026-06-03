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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function CompetitionReport({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async (eventId: string) => {
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
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `competition_report_${selectedEventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const event = events.find(e => e.id === selectedEventId);
    doc.text(`RAITE 2025 - Competition Report: ${event?.title}`, 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [['Name', 'Email', 'School', 'Team', 'Status']],
      body: data.map(r => [r.name, r.email, r.school, r.teamName, r.status]),
    });
    doc.save(`competition_report_${selectedEventId}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-gray-700">Select Competition</label>
          <Select onValueChange={handleFetch}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a competition..." />
            </SelectTrigger>
            <SelectContent>
              {events.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={data.length === 0}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={data.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500">Generating report...</p>
        </div>
      ) : data.length > 0 ? (
        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.school}</TableCell>
                  <TableCell>{r.teamName}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : selectedEventId ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-500">No registrations found for this competition.</p>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-500">Select a competition above to view report.</p>
        </div>
      )}
    </div>
  );
}

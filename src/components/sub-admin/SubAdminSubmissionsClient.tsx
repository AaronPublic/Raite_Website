"use client";

import { useState, useEffect } from "react";
import { Event } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getSubAdminSubmissions } from "@/app/actions/submissions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, FileText, Loader2, ExternalLink, Inbox } from "lucide-react";
import Papa from "papaparse";
import { generateRAITEReport } from "@/lib/pdf-reports";
import { toast } from "sonner";

interface SubAdminSubmissionsClientProps {
  events: Event[];
}

export default function SubAdminSubmissionsClient({ events }: SubAdminSubmissionsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFetchSubmissions = async (eventId: string | null) => {
    if (!eventId) return;
    setSelectedEventId(eventId);
    setIsLoading(true);
    try {
      const result = await getSubAdminSubmissions(eventId);
      setSubmissions(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const event = events.find(e => e.id === selectedEventId);
    const date = new Date().toISOString().split('T')[0];
    const eventTitle = event ? event.title.replace(/ /g, "_") : "Competition";
    const fileName = `RAITE_2026_${eventTitle}_Submissions_${date}`;

    const exportData = submissions.map(r => {
      let submissionStr = r.submissionUrl || "";
      if (r.subcategory === "ONSITE_PAGEANT" && r.submissionUrl) {
        try {
          const parsed = JSON.parse(r.submissionUrl);
          submissionStr = `Male: ${parsed.malePhoto || ""}, Female: ${parsed.femalePhoto || ""}`;
        } catch {}
      }
      return {
        "School": r.school,
        "Team Name / Competitor": r.teamName,
        "Submission Link / URL": submissionStr,
        "Submitted Date": r.submittedAt
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Successfully exported CSV!");
  };

  const exportPDF = () => {
    const event = events.find(e => e.id === selectedEventId);
    const date = new Date().toISOString().split('T')[0];
    const eventTitle = event ? event.title.replace(/ /g, "_") : "Competition";
    const fileName = `RAITE_2026_${eventTitle}_Submissions_${date}`;

    const pdfData = submissions.map(r => {
      let submissionStr = r.submissionUrl || "";
      if (r.subcategory === "ONSITE_PAGEANT" && r.submissionUrl) {
        try {
          const parsed = JSON.parse(r.submissionUrl);
          submissionStr = `Male: ${parsed.malePhoto || ""}\nFemale: ${parsed.femalePhoto || ""}`;
        } catch {}
      }
      return [r.school, r.teamName, submissionStr, r.submittedAt];
    });

    generateRAITEReport({
      title: "Competition Submissions Report",
      subtitle: `Event: ${event?.title}`,
      filename: fileName,
      columns: ['School', 'Team / Competitor', 'Submission Link(s)', 'Submitted Date'],
      data: pdfData,
    });
    toast.success("Successfully exported PDF!");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="space-y-2 flex-1 w-full">
          <label className="text-xs font-black uppercase text-gray-500 tracking-wider">Select Competition</label>
          <Select value={selectedEventId} onValueChange={handleFetchSubmissions}>
            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 rounded-xl h-12" suppressHydrationWarning>
              <SelectValue placeholder="Choose a competition to view submissions...">
                {events.find(e => e.id === selectedEventId)?.title || "Choose a competition to view submissions..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-700 rounded-xl">
              {events.map(e => (
                <SelectItem key={e.id} value={e.id} className="rounded-lg">{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={exportCSV} 
            disabled={submissions.length === 0 || isLoading} 
            className="flex-1 md:flex-none gap-2 rounded-xl border-2 h-12 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold"
          >
            <Download className="h-4 w-4 text-blue-600" /> Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={exportPDF} 
            disabled={submissions.length === 0 || isLoading} 
            className="flex-1 md:flex-none gap-2 rounded-xl border-2 h-12 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold"
          >
            <FileText className="h-4 w-4 text-red-600" /> Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">Fetching submissions...</p>
        </div>
      ) : submissions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">
              {events.find(e => e.id === selectedEventId)?.title}
            </h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {submissions.length} Submissions
              </span>
            </div>
          </div>
          <div className="border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-[650px] md:min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/30 border-b-2 border-gray-100 dark:border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-black uppercase tracking-widest text-[10px] h-14 px-6">School</TableHead>
                    <TableHead className="text-gray-400 font-black uppercase tracking-widest text-[10px] h-14 px-6">Team / Competitor</TableHead>
                    <TableHead className="text-gray-400 font-black uppercase tracking-widest text-[10px] h-14 px-6">Submission Link</TableHead>
                    <TableHead className="text-gray-400 font-black uppercase tracking-widest text-[10px] h-14 px-6">Submitted Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((r) => {
                    const isPageant = r.subcategory === "ONSITE_PAGEANT";
                    let pageantLinks: { malePhoto?: string; femalePhoto?: string } = {};
                    let hasValidPageantPhotos = false;

                    if (isPageant && r.submissionUrl) {
                      try {
                        pageantLinks = JSON.parse(r.submissionUrl);
                        hasValidPageantPhotos = !!(pageantLinks.malePhoto || pageantLinks.femalePhoto);
                      } catch {}
                    }

                    return (
                      <TableRow key={r.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <TableCell className="text-gray-900 dark:text-white py-6 px-6 font-bold uppercase tracking-tight text-sm">
                          {r.school}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 py-6 px-6 text-sm font-medium">
                          {r.teamName}
                        </TableCell>
                        <TableCell className="py-6 px-6 text-sm font-medium">
                          {isPageant ? (
                            hasValidPageantPhotos ? (
                              <div className="flex gap-4">
                                {pageantLinks.malePhoto && (
                                  <a 
                                    href={pageantLinks.malePhoto} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs"
                                  >
                                    Male Photo <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {pageantLinks.femalePhoto && (
                                  <a 
                                    href={pageantLinks.femalePhoto} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs"
                                  >
                                    Female Photo <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 italic">No photos submitted</span>
                            )
                          ) : (
                            r.submissionUrl ? (
                              <a 
                                href={r.submissionUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold"
                              >
                                View Submission <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 italic">No entry submitted</span>
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400 py-6 px-6 text-sm">
                          {r.submittedAt}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : selectedEventId ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">No submissions found for this competition.</p>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">Select a competition above to view submissions.</p>
        </div>
      )}
    </div>
  );
}

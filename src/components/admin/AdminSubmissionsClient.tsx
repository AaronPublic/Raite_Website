"use client";

import { useState, useEffect } from "react";
import { Event } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { getAdminSubmissions, updateSubmissionDetails } from "@/app/actions/submissions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Download, 
  FileText, 
  Loader2, 
  ExternalLink, 
  Inbox, 
  Pencil, 
  Plus, 
  Search, 
  Globe, 
  Sparkles,
  School as SchoolIcon,
  Users
} from "lucide-react";
import Papa from "papaparse";
import { generateRAITEReport } from "@/lib/pdf-reports";
import { toast } from "sonner";

interface SubmissionItem {
  id: string;
  school: string;
  teamName: string;
  submissionUrl: string | null;
  status: string;
  submittedAt: string;
  subcategory: string | null;
}

interface AdminSubmissionsClientProps {
  events: Event[];
}

export default function AdminSubmissionsClient({ events }: AdminSubmissionsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SubmissionItem | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editPlatformUrl, setEditPlatformUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFetchSubmissions = async (eventId: string | null) => {
    if (!eventId) return;
    setSelectedEventId(eventId);
    setIsLoading(true);
    try {
      const result = await getAdminSubmissions(eventId);
      setSubmissions(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (item: SubmissionItem) => {
    setEditingItem(item);
    setEditTeamName(item.teamName || "Individual");
    setEditPlatformUrl(item.submissionUrl || "");
  };

  const handleSaveSubmission = async () => {
    if (!editingItem) return;

    if (!editTeamName.trim()) {
      toast.error("Please enter a valid team name (e.g. Team 1, Team 2)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateSubmissionDetails({
        registrationId: editingItem.id,
        teamName: editTeamName,
        submissionUrl: editPlatformUrl,
      });

      if (res.success) {
        toast.success("Submission details updated successfully!");
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === editingItem.id
              ? {
                  ...s,
                  teamName: editTeamName.trim() || "Individual",
                  submissionUrl: editPlatformUrl.trim() || null,
                  submittedAt: editPlatformUrl.trim()
                    ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : s.submittedAt,
                }
              : s
          )
        );
        setEditingItem(null);
      } else {
        toast.error("Failed to update submission");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const getPlatformInfo = (url: string | null) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes("tiktok.com")) {
      return { name: "TikTok", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" };
    }
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return { name: "YouTube", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
    }
    if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
      return { name: "Facebook", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    }
    if (lower.includes("drive.google.com")) {
      return { name: "Google Drive", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    }
    return { name: "Web Link", color: "bg-primary/10 text-primary border-primary/20" };
  };

  const filteredSubmissions = submissions.filter((s) =>
    s.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const event = events.find((e) => e.id === selectedEventId);
    const date = new Date().toISOString().split("T")[0];
    const eventTitle = event ? event.title.replace(/ /g, "_") : "Competition";
    const fileName = `RAITE_2026_${eventTitle}_Submissions_${date}`;

    const exportData = submissions.map((r) => {
      let submissionStr = r.submissionUrl || "";
      if (r.subcategory === "ONSITE_PAGEANT" && r.submissionUrl) {
        try {
          const parsed = JSON.parse(r.submissionUrl);
          submissionStr = `Male: ${parsed.malePhoto || ""}, Female: ${parsed.femalePhoto || ""}`;
        } catch {}
      }
      return {
        School: r.school,
        "Team Name": r.teamName,
        "Platform / Submission Link": submissionStr,
        "Submitted Date": r.submittedAt,
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
    const event = events.find((e) => e.id === selectedEventId);
    const date = new Date().toISOString().split("T")[0];
    const eventTitle = event ? event.title.replace(/ /g, "_") : "Competition";
    const fileName = `RAITE_2026_${eventTitle}_Submissions_${date}`;

    const pdfData = submissions.map((r) => {
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
      columns: ["School", "Team Name", "Platform / Submission Link", "Submitted Date"],
      data: pdfData,
    });
    toast.success("Successfully exported PDF!");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Filter & Actions Card */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-6 rounded-[2rem] border border-border/80 shadow-sm">
        <div className="space-y-2 flex-1 w-full">
          <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
            Select Competition
          </label>
          <Select value={selectedEventId} onValueChange={handleFetchSubmissions}>
            <SelectTrigger className="bg-background border-border/80 rounded-xl h-12 text-sm font-medium" suppressHydrationWarning>
              <SelectValue placeholder="Choose a competition to view & manage submissions...">
                {events.find((e) => e.id === selectedEventId)?.title || "Choose a competition to view & manage submissions..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-card border-border/80 rounded-xl">
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id} className="rounded-lg text-sm font-medium">
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={submissions.length === 0 || isLoading}
            className="flex-1 md:flex-none gap-2 rounded-xl border-2 h-12 bg-background border-border/80 text-foreground font-bold text-xs uppercase tracking-wider hover:border-primary/40"
          >
            <Download className="h-4 w-4 text-blue-600" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            disabled={submissions.length === 0 || isLoading}
            className="flex-1 md:flex-none gap-2 rounded-xl border-2 h-12 bg-background border-border/80 text-foreground font-bold text-xs uppercase tracking-wider hover:border-primary/40"
          >
            <FileText className="h-4 w-4 text-red-600" /> Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-card rounded-[2rem] border border-border/80 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground font-medium text-sm">Fetching submissions...</p>
        </div>
      ) : submissions.length > 0 ? (
        <div className="space-y-4">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight uppercase">
                {events.find((e) => e.id === selectedEventId)?.title}
              </h3>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">
                Manage team names and social media platform links (TikTok, YouTube, Facebook, Drive) for judges.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search school or team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-card border-border/80 text-xs font-medium"
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {submissions.length} Entries
                </span>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="border-2 border-border/80 rounded-[2rem] bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-[750px] md:min-w-full">
                <TableHeader>
                  <TableRow className="bg-secondary/40 border-b-2 border-border/80 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px] h-14 px-6">
                      School
                    </TableHead>
                    <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px] h-14 px-6">
                      Team Name
                    </TableHead>
                    <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px] h-14 px-6">
                      Platform / Submission Link
                    </TableHead>
                    <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px] h-14 px-6">
                      Date
                    </TableHead>
                    <TableHead className="text-muted-foreground font-black uppercase tracking-widest text-[10px] h-14 px-6 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-medium text-sm">
                        No entries match your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((r) => {
                      const isPageant = r.subcategory === "ONSITE_PAGEANT";
                      let pageantLinks: { malePhoto?: string; femalePhoto?: string } = {};
                      let hasValidPageantPhotos = false;

                      if (isPageant && r.submissionUrl) {
                        try {
                          pageantLinks = JSON.parse(r.submissionUrl);
                          hasValidPageantPhotos = !!(pageantLinks.malePhoto || pageantLinks.femalePhoto);
                        } catch {}
                      }

                      const platformInfo = getPlatformInfo(r.submissionUrl);

                      return (
                        <TableRow
                          key={r.id}
                          className="border-b border-border/60 hover:bg-secondary/30 transition-colors"
                        >
                          {/* School */}
                          <TableCell className="text-foreground py-5 px-6 font-bold uppercase tracking-tight text-sm">
                            <div className="flex items-center gap-2">
                              <SchoolIcon className="w-4 h-4 text-primary shrink-0" />
                              <span className="line-clamp-2">{r.school}</span>
                            </div>
                          </TableCell>

                          {/* Team Name */}
                          <TableCell className="text-foreground py-5 px-6 text-sm font-bold">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-secondary/60 text-foreground border-border/80 font-bold text-xs px-2.5 py-1"
                              >
                                {r.teamName}
                              </Badge>
                            </div>
                          </TableCell>

                          {/* Platform Link */}
                          <TableCell className="py-5 px-6 text-sm font-medium">
                            {isPageant ? (
                              hasValidPageantPhotos ? (
                                <div className="flex gap-3">
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
                                <span className="text-muted-foreground/60 italic text-xs">No photos submitted</span>
                              )
                            ) : r.submissionUrl ? (
                              <div className="flex items-center gap-2">
                                {platformInfo && (
                                  <Badge className={`text-[10px] font-black uppercase px-2 py-0.5 border ${platformInfo.color}`}>
                                    {platformInfo.name}
                                  </Badge>
                                )}
                                <a
                                  href={r.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs"
                                >
                                  View Submission <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(r)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline hover:text-amber-500"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Platform Link
                              </button>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-muted-foreground py-5 px-6 text-xs font-medium">
                            {r.submittedAt}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-5 px-6 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(r)}
                              className="rounded-xl h-9 px-3 text-xs font-bold gap-1.5 border-border/80 hover:border-primary/40 text-foreground hover:text-primary transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-primary" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : selectedEventId ? (
        <div className="text-center py-20 bg-card rounded-[2rem] border border-border/80 shadow-sm">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-foreground font-bold">No registered teams found for this competition.</p>
          <p className="text-xs text-muted-foreground mt-1">Once schools register, they will appear here to manage submission links.</p>
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-[2rem] border border-border/80 shadow-sm">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-foreground font-bold">Select a competition above to view & manage submissions.</p>
        </div>
      )}

      {/* Edit Submission Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-center text-foreground uppercase tracking-tight">
              Edit Submission Details
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-center text-muted-foreground">
              Update team naming (for multiple teams) and platform link (TikTok, YouTube, Facebook, Drive) for judges.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              {/* School (Read-Only) */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  School / University
                </span>
                <p className="text-sm font-black text-foreground">{editingItem.school}</p>
              </div>

              {/* Team Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Team Name (e.g. Team 1, Team 2, Team Alpha)
                </label>
                <Input
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="e.g. Team 1, Team 2, Team Alpha"
                  className="rounded-xl h-11 bg-background border-border/80 text-sm font-bold"
                />
                <p className="text-[11px] text-muted-foreground">
                  Differentiates multiple teams from the same school on judge scoring sheets and live leaderboards.
                </p>
              </div>

              {/* Platform Link Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  Social Media / Platform Link
                </label>
                <Input
                  value={editPlatformUrl}
                  onChange={(e) => setEditPlatformUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@..., https://youtube.com/..., https://facebook.com/..."
                  className="rounded-xl h-11 bg-background border-border/80 text-xs font-mono"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground">Supported:</span>
                  <Badge variant="outline" className="text-[10px] font-bold py-0 bg-pink-500/5 text-pink-600 border-pink-500/20">TikTok</Badge>
                  <Badge variant="outline" className="text-[10px] font-bold py-0 bg-red-500/5 text-red-600 border-red-500/20">YouTube</Badge>
                  <Badge variant="outline" className="text-[10px] font-bold py-0 bg-blue-500/5 text-blue-600 border-blue-500/20">Facebook</Badge>
                  <Badge variant="outline" className="text-[10px] font-bold py-0 bg-emerald-500/5 text-emerald-600 border-emerald-500/20">Google Drive</Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setEditingItem(null)}
              disabled={isSaving}
              className="rounded-xl font-bold h-11 text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubmission}
              disabled={isSaving}
              className="rounded-xl font-black h-11 px-6 bg-primary hover:bg-primary/90 text-white text-xs uppercase tracking-wider shadow-lg shadow-primary/20 gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

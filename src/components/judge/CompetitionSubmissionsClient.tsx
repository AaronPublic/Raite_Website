"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sparkles, 
  FileText,
  School,
  User,
  ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompetitionRubric } from "@/lib/rubrics";

interface SubmissionItem {
  id: string;
  school: string;
  teamName: string;
  competitorName: string;
  coachName: string;
  entryUrl: string | null;
  isEvaluated: boolean;
  myTotalScore: number | null;
  updatedAt: Date | null;
}

interface CompetitionSubmissionsClientProps {
  event: {
    id: string;
    title: string;
    category?: string | null;
    subcategory?: string | null;
  };
  rubric: CompetitionRubric | null;
  submissions: SubmissionItem[];
}

export default function CompetitionSubmissionsClient({
  event,
  rubric,
  submissions,
}: CompetitionSubmissionsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "evaluated" | "pending">("all");

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.competitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.coachName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "evaluated") return sub.isEvaluated;
    if (statusFilter === "pending") return !sub.isEvaluated;
    return true;
  });

  const totalCount = submissions.length;
  const evaluatedCount = submissions.filter((s) => s.isEvaluated).length;
  const pendingCount = totalCount - evaluatedCount;
  const progressPercent = totalCount > 0 ? Math.round((evaluatedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/judge/competitions"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assigned Competitions
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-foreground">{event.title}</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-xs">
              {event.subcategory}
            </Badge>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Review submission entries and record scoring rubrics for this event.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-2">
            <span className="text-muted-foreground">Judging Progress</span>
            <span className="text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-2">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400">{evaluatedCount} Evaluated</span>
            <span className="text-amber-600 dark:text-amber-400">{pendingCount} Pending</span>
          </div>
        </div>
      </div>

      {/* Rubric Criteria Overview Accordion/Card */}
      {rubric && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                Official Rubric Criteria (Max {rubric.judgeMaxTotal} pts)
              </h3>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Social Media: {rubric.socialMediaMax} pts ({rubric.socialMediaLabel}) = {rubric.grandTotal} Total Pts
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {rubric.criteria.map((c) => (
              <div
                key={c.id}
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-tight text-foreground">{c.name}</span>
                  <Badge variant="outline" className="font-black text-xs text-primary border-primary/30">
                    {c.maxScore} pts
                  </Badge>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed line-clamp-2">
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by school, team, competitor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl h-11 bg-card border-border/80 text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="rounded-xl text-xs font-bold h-9"
          >
            All ({totalCount})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className="rounded-xl text-xs font-bold h-9 text-amber-600 dark:text-amber-400 hover:text-amber-700"
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={statusFilter === "evaluated" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("evaluated")}
            className="rounded-xl text-xs font-bold h-9 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
          >
            Evaluated ({evaluatedCount})
          </Button>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/80 rounded-2xl bg-card/40">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="text-base font-black text-foreground">No submissions found</h4>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            {searchTerm ? "No entries match your search criteria." : "No uploaded entries for this competition yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubmissions.map((sub, idx) => (
            <div
              key={sub.id}
              className={`group relative rounded-2xl border transition-all duration-200 bg-card p-5 flex flex-col justify-between hover:shadow-md ${
                sub.isEvaluated
                  ? "border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.02]"
                  : "border-border/80 hover:border-primary/40"
              }`}
            >
              <div className="space-y-4">
                {/* Status & Entry number */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Entry #{idx + 1}
                  </span>
                  {sub.isEvaluated ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Evaluated ({sub.myTotalScore?.toFixed(1)}/95)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Evaluation
                    </Badge>
                  )}
                </div>

                {/* School & Competitor details */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <School className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-foreground leading-snug line-clamp-2">
                        {sub.school}
                      </h4>
                      <p className="text-xs font-bold text-muted-foreground">{sub.teamName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Participant: <strong className="text-foreground">{sub.competitorName}</strong></span>
                  </div>
                </div>

                {/* Entry URL / Attachment */}
                {sub.entryUrl && (
                  <div className="pt-2 border-t border-border/50">
                    <a
                      href={sub.entryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Submission Link
                    </a>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-border/50">
                <Link
                  href={`/judge/competitions/${event.id}/evaluate/${sub.id}`}
                  className="w-full"
                >
                  <Button
                    className={`w-full rounded-xl font-black text-xs tracking-wider uppercase h-10 gap-2 ${
                      sub.isEvaluated
                        ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                        : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                    }`}
                  >
                    {sub.isEvaluated ? (
                      <>
                        Edit Score ({sub.myTotalScore?.toFixed(1)}/95)
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        Evaluate Entry
                      </>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

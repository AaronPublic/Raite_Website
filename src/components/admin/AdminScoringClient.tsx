"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trophy, Award, ExternalLink, Download, Loader2, Save, Info, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { updateSocialMediaScore } from "@/app/actions/admin-scoring";
import { CompetitionRubric, ScoredRegistrationRow } from "@/lib/rubrics";
import Papa from "papaparse";

interface AdminScoringClientProps {
  events: { id: string; title: string; category: string | null }[];
  activeEventId: string;
  rubric: CompetitionRubric | null;
  assignedJudges: { id: string; name: string }[];
  rankings: ScoredRegistrationRow[];
}

export default function AdminScoringClient({
  events,
  activeEventId,
  rubric,
  assignedJudges,
  rankings: initialRankings,
}: AdminScoringClientProps) {
  const [selectedEventId, setSelectedEventId] = useState(activeEventId);
  const [rankings, setRankings] = useState<ScoredRegistrationRow[]>(initialRankings);
  const [socialScores, setSocialScores] = useState<Record<string, number>>(
    Object.fromEntries(initialRankings.map((r) => [r.registrationId, r.socialMediaScore]))
  );
  const [savingRegId, setSavingRegId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSocialScoreChange = (registrationId: string, val: string) => {
    const num = parseFloat(val);
    const score = isNaN(num) ? 0 : Math.min(5, Math.max(0, num));
    setSocialScores((prev) => ({ ...prev, [registrationId]: score }));
  };

  const handleSaveSocialScore = (registrationId: string) => {
    const score = socialScores[registrationId] ?? 0;
    setSavingRegId(registrationId);

    startTransition(async () => {
      const res = await updateSocialMediaScore(registrationId, score);
      setSavingRegId(null);

      if (res.success) {
        toast.success("Social media score updated!");
        // Update local ranking calculations
        setRankings((prev) => {
          const updated = prev.map((r) => {
            if (r.registrationId === registrationId) {
              const newFinal = Number((r.averageJudgeScore + score).toFixed(2));
              return {
                ...r,
                socialMediaScore: score,
                finalScore: newFinal,
              };
            }
            return r;
          });

          // Re-sort
          return [...updated].sort((a, b) => b.finalScore - a.finalScore);
        });
      } else {
        toast.error(res.error || "Failed to update social media score");
      }
    });
  };

  const handleExportCSV = () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    const eventName = currentEvent ? currentEvent.title : "Competition";

    const csvData = rankings.map((r, index) => {
      const baseObj: Record<string, any> = {
        Rank: r.rank || index + 1,
        School: r.schoolName,
        "Team / Competitor": r.teamOrCompetitor,
        "Submission Link": r.entryUrl || "N/A",
      };

      // Add each assigned judge's score
      assignedJudges.forEach((j) => {
        const scoreObj = r.judgeScores.find((js) => js.judgeId === j.id);
        baseObj[`Judge (${j.name}) /95`] = scoreObj ? scoreObj.totalScore : "Pending";
      });

      baseObj["Average Judge Score (/95)"] = r.averageJudgeScore;
      baseObj[`${rubric?.socialMediaLabel || "Social Media"} (/5)`] = r.socialMediaScore;
      baseObj["Final Score (/100)"] = r.finalScore;

      return baseObj;
    });

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RAITE_2026_${eventName.replace(/\s+/g, "_")}_Scores_Leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Competition Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {events.map((ev) => {
          const isActive = ev.id === selectedEventId;
          return (
            <Button
              key={ev.id}
              variant={isActive ? "default" : "outline"}
              onClick={() => {
                setSelectedEventId(ev.id);
                // Refresh window with new query parameter
                window.location.href = `/admin/scores?eventId=${ev.id}`;
              }}
              className={`rounded-2xl font-bold h-11 px-5 transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-white dark:bg-gray-900 hover:bg-gray-50 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Trophy className={`w-4 h-4 mr-2 ${isActive ? "text-yellow-300" : "text-gray-400"}`} />
              {ev.title}
            </Button>
          );
        })}
      </div>

      {/* Rubric & Info Header */}
      {rubric && (
        <Card className="rounded-[2rem] border-blue-100 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-blue-950 dark:text-blue-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" /> {rubric.title} — Official Rubric
              </h3>
              <p className="text-xs text-blue-700/80 dark:text-blue-300/70 font-medium">
                Judges evaluate on a <strong>95-point scale</strong>. Admins input the <strong>5-point Social Media Score ({rubric.socialMediaLabel})</strong> for a 100-point total.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Criteria Breakdown Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs bg-white dark:bg-gray-900">
                    <Info className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> View Criteria
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-gray-900">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-black">{rubric.title} Rubric</DialogTitle>
                    <DialogDescription>Score breakdown per evaluation criteria</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 pt-3">
                    {rubric.criteria.map((c) => (
                      <div key={c.id} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{c.name}</p>
                          {c.description && <p className="text-[11px] text-gray-500 mt-0.5">{c.description}</p>}
                        </div>
                        <Badge className="font-black text-xs bg-blue-600 shrink-0 ml-2">
                          {c.maxScore} pts
                        </Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100">
                      <div>
                        <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">{rubric.socialMediaLabel}</p>
                        <p className="text-[11px] text-indigo-600/80">Admin Input Only</p>
                      </div>
                      <Badge className="font-black text-xs bg-indigo-600 shrink-0 ml-2">
                        {rubric.socialMediaMax} pts
                      </Badge>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="rounded-xl font-bold text-xs bg-white dark:bg-gray-900 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card className="rounded-[2rem] border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" /> Live Rankings & Final Scores ({rankings.length})
            </CardTitle>
            <CardDescription>
              Rankings are automatically sorted by Final Score (Average of Judge Scores + Social Media Score).
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-bold text-xs">
              Assigned Judges: {assignedJudges.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-16 font-bold text-xs text-center">Rank</TableHead>
                <TableHead className="font-bold text-xs">School / Institution</TableHead>
                <TableHead className="font-bold text-xs">Team / Competitor</TableHead>
                <TableHead className="font-bold text-xs text-center">Submission</TableHead>
                <TableHead className="font-bold text-xs text-center">Judge Scores Breakdown</TableHead>
                <TableHead className="font-bold text-xs text-center">Judge Avg (/95)</TableHead>
                <TableHead className="font-bold text-xs text-center w-36">
                  {rubric?.socialMediaLabel || "Social Media"} (/5)
                </TableHead>
                <TableHead className="font-bold text-xs text-right pr-6">Final Score (/100)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-medium">
                    No submitted entries found for this competition.
                  </TableCell>
                </TableRow>
              ) : (
                rankings.map((row, index) => {
                  const rank = row.rank || index + 1;
                  const isPodium = rank <= 3;
                  const podiumColor =
                    rank === 1
                      ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300"
                      : rank === 2
                      ? "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200"
                      : rank === 3
                      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                      : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";

                  return (
                    <TableRow key={row.registrationId} className="hover:bg-muted/30 transition-colors">
                      {/* Rank */}
                      <TableCell className="text-center font-black">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs border ${podiumColor}`}
                        >
                          {rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`}
                        </span>
                      </TableCell>

                      {/* School Name */}
                      <TableCell className="font-black text-sm text-foreground">
                        {row.schoolName}
                      </TableCell>

                      {/* Team / Competitor */}
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {row.teamOrCompetitor}
                      </TableCell>

                      {/* Submission Link */}
                      <TableCell className="text-center">
                        {row.entryUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2.5 rounded-lg text-blue-600 hover:bg-blue-50 font-bold text-xs"
                          >
                            <a href={row.entryUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Entry
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No link</span>
                        )}
                      </TableCell>

                      {/* Judge Breakdown Popover */}
                      <TableCell className="text-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] font-bold rounded-lg border-dashed"
                            >
                              {row.judgeScores.length} of {assignedJudges.length} judges
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 rounded-2xl shadow-xl">
                            <h4 className="text-xs font-black uppercase text-gray-500 mb-2">Individual Judge Scores</h4>
                            {row.judgeScores.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No judges have evaluated this entry yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {row.judgeScores.map((js) => (
                                  <div
                                    key={js.judgeId}
                                    className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1"
                                  >
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-gray-800 dark:text-gray-200">{js.judgeName}</span>
                                      <Badge className="bg-blue-600 text-white font-black text-[10px]">
                                        {js.totalScore} / 95
                                      </Badge>
                                    </div>
                                    {js.feedback && (
                                      <p className="text-[10px] text-gray-500 italic mt-1">&quot;{js.feedback}&quot;</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </TableCell>

                      {/* Average Judge Score */}
                      <TableCell className="text-center font-bold text-sm text-blue-600 dark:text-blue-400">
                        {row.averageJudgeScore > 0 ? row.averageJudgeScore.toFixed(2) : "0.00"}
                      </TableCell>

                      {/* Admin Social Media Score Input */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={socialScores[row.registrationId] ?? 0}
                            onChange={(e) => handleSocialScoreChange(row.registrationId, e.target.value)}
                            className="w-16 h-8 text-center font-bold text-xs rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveSocialScore(row.registrationId)}
                            disabled={savingRegId === row.registrationId || isPending}
                            className="h-8 w-8 p-0 rounded-lg text-green-600 hover:bg-green-50"
                            title="Save social media score"
                          >
                            {savingRegId === row.registrationId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>

                      {/* Final Total Score */}
                      <TableCell className="text-right pr-6">
                        <span
                          className={`font-black text-base ${
                            isPodium ? "text-primary dark:text-blue-400 font-extrabold" : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {row.finalScore > 0 ? row.finalScore.toFixed(2) : "0.00"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

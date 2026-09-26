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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Trophy, 
  Award, 
  ExternalLink, 
  Download, 
  Loader2, 
  Save, 
  Info, 
  Sparkles, 
  Pencil, 
  CheckCircle2, 
  Gavel,
  School as SchoolIcon,
  X
} from "lucide-react";
import { toast } from "sonner";
import { updateSocialMediaScore, submitAdminCriteriaScoreOverride } from "@/app/actions/admin-scoring";
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

  // Admin Criteria Edit Modal State
  const [editingCriteriaData, setEditingCriteriaData] = useState<{
    registrationId: string;
    schoolName: string;
    teamName: string;
    judgeId: string;
    judgeName: string;
    criteriaScores: Record<string, number>;
    feedback: string;
  } | null>(null);
  const [isSavingCriteria, setIsSavingCriteria] = useState(false);

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

          return [...updated].sort((a, b) => b.finalScore - a.finalScore);
        });
      } else {
        toast.error(res.error || "Failed to update social media score");
      }
    });
  };

  const handleOpenCriteriaEditor = (
    row: ScoredRegistrationRow,
    judge: { id: string; name: string }
  ) => {
    if (!rubric) return;

    const existingScoreObj = row.judgeScores.find((js) => js.judgeId === judge.id);
    const initialScores: Record<string, number> = {};

    rubric.criteria.forEach((c) => {
      initialScores[c.id] = existingScoreObj?.criteriaScores?.[c.id] ?? 0;
    });

    setEditingCriteriaData({
      registrationId: row.registrationId,
      schoolName: row.schoolName,
      teamName: row.teamOrCompetitor,
      judgeId: judge.id,
      judgeName: judge.name,
      criteriaScores: initialScores,
      feedback: existingScoreObj?.feedback || "",
    });
  };

  const handleCriteriaScoreChange = (criterionId: string, maxScore: number, rawVal: string) => {
    let val = parseFloat(rawVal);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > maxScore) val = maxScore;
    val = Math.round(val * 10) / 10;

    setEditingCriteriaData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        criteriaScores: {
          ...prev.criteriaScores,
          [criterionId]: val,
        },
      };
    });
  };

  const calculateModalLiveTotal = () => {
    if (!editingCriteriaData || !rubric) return 0;
    return rubric.criteria.reduce(
      (sum, c) => sum + (Number(editingCriteriaData.criteriaScores[c.id]) || 0),
      0
    );
  };

  const handleSaveAdminCriteriaScore = async () => {
    if (!editingCriteriaData || !rubric) return;

    // Validate
    for (const c of rubric.criteria) {
      const val = editingCriteriaData.criteriaScores[c.id];
      if (val === undefined || isNaN(val) || val < 0 || val > c.maxScore) {
        toast.error(`Please provide a valid score between 0 and ${c.maxScore} for "${c.name}".`);
        return;
      }
    }

    setIsSavingCriteria(true);
    try {
      const res = await submitAdminCriteriaScoreOverride({
        registrationId: editingCriteriaData.registrationId,
        judgeId: editingCriteriaData.judgeId,
        criteriaScores: editingCriteriaData.criteriaScores,
        feedback: editingCriteriaData.feedback,
      });

      if (res.success && res.totalScore !== undefined) {
        toast.success(`Score for ${editingCriteriaData.judgeName} saved: ${res.totalScore.toFixed(1)} / ${rubric.judgeMaxTotal} pts!`);

        // Update local rankings state
        setRankings((prev) => {
          const updated = prev.map((r) => {
            if (r.registrationId !== editingCriteriaData.registrationId) return r;

            const existingIndex = r.judgeScores.findIndex((js) => js.judgeId === editingCriteriaData.judgeId);
            const newJudgeScore = {
              judgeId: editingCriteriaData.judgeId,
              judgeName: editingCriteriaData.judgeName,
              totalScore: res.totalScore!,
              criteriaScores: editingCriteriaData.criteriaScores,
              feedback: editingCriteriaData.feedback.trim() || null,
            };

            let newJudgeScores = [...r.judgeScores];
            if (existingIndex >= 0) {
              newJudgeScores[existingIndex] = newJudgeScore;
            } else {
              newJudgeScores.push(newJudgeScore);
            }

            const judgesCount = newJudgeScores.length;
            const sumOfJudgeScores = newJudgeScores.reduce((acc, s) => acc + s.totalScore, 0);
            const averageJudgeScore = judgesCount > 0 ? Number((sumOfJudgeScores / judgesCount).toFixed(2)) : 0;
            const finalScore = Number((averageJudgeScore + r.socialMediaScore).toFixed(2));

            return {
              ...r,
              judgeScores: newJudgeScores,
              averageJudgeScore,
              finalScore,
              judgesCount,
            };
          });

          return [...updated].sort((a, b) => b.finalScore - a.finalScore);
        });

        setEditingCriteriaData(null);
      } else {
        toast.error(res.error || "Failed to update judge criteria score");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSavingCriteria(false);
    }
  };

  const handleExportCSV = () => {
    const currentEvent = events.find((e) => e.id === selectedEventId);
    const eventName = currentEvent ? currentEvent.title : "Competition";

    const csvData = rankings.map((r, index) => {
      const baseObj: Record<string, any> = {
        Rank: r.rank || index + 1,
        School: r.schoolName,
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
                  : "bg-card hover:bg-secondary border-border/80 text-foreground"
              }`}
            >
              <Trophy className={`w-4 h-4 mr-2 ${isActive ? "text-yellow-300" : "text-muted-foreground"}`} />
              {ev.title}
            </Button>
          );
        })}
      </div>

      {/* Rubric & Info Header */}
      {rubric && (
        <Card className="rounded-[2rem] border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> {rubric.title} — Official Rubric
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Judges evaluate on a <strong>95-point scale</strong>. Admins manage the <strong>5-point Social Media Score ({rubric.socialMediaLabel})</strong> for a 100-point total.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Criteria Breakdown Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs bg-card border-border/80">
                    <Info className="w-3.5 h-3.5 mr-1.5 text-primary" /> View Criteria
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border border-border">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-black text-foreground">{rubric.title} Rubric</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">Score breakdown per evaluation criteria</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 pt-3">
                    {rubric.criteria.map((c) => (
                      <div key={c.id} className="flex items-start justify-between p-3 rounded-xl bg-secondary/50 border border-border/60">
                        <div>
                          <p className="text-xs font-bold text-foreground">{c.name}</p>
                          {c.description && <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>}
                        </div>
                        <Badge className="font-black text-xs bg-primary text-white shrink-0 ml-2">
                          {c.maxScore} pts
                        </Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-accent/30">
                      <div>
                        <p className="text-xs font-bold text-foreground">{rubric.socialMediaLabel}</p>
                        <p className="text-[11px] text-muted-foreground">Admin Input Only</p>
                      </div>
                      <Badge className="font-black text-xs bg-accent text-accent-foreground shrink-0 ml-2">
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
                className="rounded-xl font-bold text-xs bg-card text-primary border-primary/30 hover:bg-primary/10"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard & Criteria Breakdown Table */}
      <Card className="rounded-[2rem] border-border/80 shadow-xl overflow-hidden bg-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2 text-foreground">
              <Award className="w-6 h-6 text-primary" /> Live Rankings & Criteria Breakdown ({rankings.length})
            </CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground">
              Click on any judge score badge below to view, edit, or override criteria points.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-bold text-xs border-border/80">
              Assigned Judges: {assignedJudges.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/40 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                  Rank
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">
                  School / Entry
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                  Submission
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                  Judge Scores (Click to Edit)
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">
                  Judge Avg (/95)
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center w-36">
                  {rubric?.socialMediaLabel || "Social Media"} (/5)
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-6">
                  Final Score (/100)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-medium text-sm">
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
                      : "bg-secondary text-foreground border-border/80";

                  return (
                    <TableRow key={row.registrationId} className="hover:bg-secondary/30 transition-colors border-b border-border/50">
                      {/* Rank */}
                      <TableCell className="text-center font-black py-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs border ${podiumColor}`}
                        >
                          {rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}th`}
                        </span>
                      </TableCell>

                      {/* School Name & Team */}
                      <TableCell className="font-black text-sm text-foreground py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <SchoolIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{row.schoolName}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 bg-secondary/50 text-muted-foreground border-border/60">
                            {row.teamOrCompetitor}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Submission Link */}
                      <TableCell className="text-center py-4">
                        {row.entryUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50/20 font-bold text-xs"
                          >
                            <a href={row.entryUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Submission
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No link</span>
                        )}
                      </TableCell>

                      {/* Judge Scores (Interactive click to edit per judge) */}
                      <TableCell className="text-center py-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {assignedJudges.map((judge) => {
                            const scoreObj = row.judgeScores.find((js) => js.judgeId === judge.id);

                            return (
                              <button
                                key={judge.id}
                                type="button"
                                onClick={() => handleOpenCriteriaEditor(row, judge)}
                                className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                                  scoreObj
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                    : "bg-secondary/60 text-muted-foreground border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                }`}
                                title={`Click to edit criteria scores for ${judge.name}`}
                              >
                                <span className="font-medium text-[11px] truncate max-w-[80px]">
                                  {judge.name}:
                                </span>
                                <span className="font-black">
                                  {scoreObj ? `${scoreObj.totalScore.toFixed(1)}` : "Pending"}
                                </span>
                                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* Average Judge Score */}
                      <TableCell className="text-center font-black text-sm text-primary py-4">
                        {row.averageJudgeScore > 0 ? row.averageJudgeScore.toFixed(2) : "0.00"}
                      </TableCell>

                      {/* Admin Social Media Score Input */}
                      <TableCell className="text-center py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={socialScores[row.registrationId] ?? 0}
                            onChange={(e) => handleSocialScoreChange(row.registrationId, e.target.value)}
                            className="w-16 h-8 text-center font-bold text-xs rounded-xl bg-background border-border/80"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveSocialScore(row.registrationId)}
                            disabled={savingRegId === row.registrationId || isPending}
                            className="h-8 w-8 p-0 rounded-xl text-emerald-600 hover:bg-emerald-50/20"
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
                      <TableCell className="text-right pr-6 py-4">
                        <span
                          className={`font-black text-base ${
                            isPodium ? "text-primary font-black" : "text-foreground"
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

      {/* Admin Criteria Breakdown Editor Modal */}
      <Dialog
        open={!!editingCriteriaData}
        onOpenChange={(open) => !open && setEditingCriteriaData(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 sm:p-8 bg-card border border-border/80 shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground uppercase tracking-tight">
              <Gavel className="w-5 h-5 text-primary" /> Edit Judge Criteria Scores
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Modify criteria scores for this specific judge and entry as an administrator.
            </DialogDescription>
          </DialogHeader>

          {editingCriteriaData && rubric && (
            <div className="space-y-4 py-2">
              {/* Entry & Judge Details Banner */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-muted-foreground block">
                    School & Entry
                  </span>
                  <h4 className="text-sm font-black text-foreground">
                    {editingCriteriaData.schoolName} ({editingCriteriaData.teamName})
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-muted-foreground block">
                    Judge
                  </span>
                  <Badge variant="outline" className="font-bold text-xs text-primary border-primary/30">
                    {editingCriteriaData.judgeName}
                  </Badge>
                </div>
              </div>

              {/* Criteria Score Inputs */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Scoring Criteria ({rubric.judgeMaxTotal} pts max)
                  </label>
                  <Badge className="bg-primary text-white font-black text-xs">
                    Total: {calculateModalLiveTotal().toFixed(1)} / {rubric.judgeMaxTotal} pts
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {rubric.criteria.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-foreground truncate max-w-[130px]">{c.name}</span>
                        <span className="text-muted-foreground text-[10px]">Max: {c.maxScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max={c.maxScore}
                          value={
                            editingCriteriaData.criteriaScores[c.id] === 0
                              ? "0"
                              : editingCriteriaData.criteriaScores[c.id] || ""
                          }
                          onChange={(e) =>
                            handleCriteriaScoreChange(c.id, c.maxScore, e.target.value)
                          }
                          className="h-9 rounded-lg bg-background text-sm font-black text-center border-border/80"
                        />
                        <span className="text-xs font-bold text-muted-foreground">/ {c.maxScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Judge Feedback / Remarks (Optional)
                </label>
                <Input
                  value={editingCriteriaData.feedback}
                  onChange={(e) =>
                    setEditingCriteriaData((prev) =>
                      prev ? { ...prev, feedback: e.target.value } : null
                    )
                  }
                  placeholder="Optional constructive remarks..."
                  className="rounded-xl h-10 bg-background border-border/80 text-xs font-medium"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCriteriaData(null)}
              disabled={isSavingCriteria}
              className="rounded-xl font-bold h-11 text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdminCriteriaScore}
              disabled={isSavingCriteria}
              className="rounded-xl font-black h-11 px-6 bg-primary hover:bg-primary/90 text-white text-xs uppercase tracking-wider shadow-lg shadow-primary/20 gap-2"
            >
              {isSavingCriteria ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Criteria Scores"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

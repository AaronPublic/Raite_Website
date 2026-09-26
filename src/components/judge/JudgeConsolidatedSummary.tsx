"use client";

import { useState, useTransition } from "react";
import { CompetitionRubric } from "@/lib/rubrics";
import { getJudgeConsolidatedSummary, submitJudgeScore } from "@/app/actions/judging";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Trophy, 
  ExternalLink, 
  Pencil, 
  CheckCircle2, 
  Clock, 
  Save, 
  X, 
  Loader2, 
  Sparkles, 
  School as SchoolIcon, 
  Users, 
  Search,
  Lock,
  Eye,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface PeerJudgeEvaluation {
  judgeId: string;
  judgeName: string;
  totalScore: number | null;
  criteriaScores: Record<string, number>;
  feedback: string | null;
  isEvaluated: boolean;
}

interface ConsolidatedSubmission {
  id: string;
  school: string;
  teamName: string;
  entryUrl: string | null;
  socialMediaScore: number;
  myEvaluation: {
    criteriaScores: Record<string, number>;
    totalScore: number | null;
    feedback: string | null;
    isEvaluated: boolean;
    updatedAt: Date | null;
  };
  otherJudgesEvaluations: PeerJudgeEvaluation[];
  averageJudgeScore: number;
  finalScore: number;
  judgesCount: number;
}

interface JudgeConsolidatedSummaryProps {
  initialData: {
    events: Array<{ id: string; title: string }>;
    activeEventId: string | null;
    activeEventTitle: string | null;
    currentJudgeId: string;
    currentJudgeName: string;
    rubric: CompetitionRubric | null;
    assignedJudges: Array<{ id: string; name: string }>;
    submissions: ConsolidatedSubmission[];
  };
}

export default function JudgeConsolidatedSummary({ initialData }: JudgeConsolidatedSummaryProps) {
  const [data, setData] = useState(initialData);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialData.activeEventId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Inline editing state per submission id
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [editCriteriaScores, setEditCriteriaScores] = useState<Record<string, number>>({});
  const [editFeedback, setEditFeedback] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSwitchEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setEditingSubmissionId(null);
    startTransition(async () => {
      try {
        const res = await getJudgeConsolidatedSummary(eventId);
        setData(res);
      } catch (err: any) {
        toast.error("Failed to load competition summary");
      }
    });
  };

  const handleStartEdit = (sub: ConsolidatedSubmission) => {
    setEditingSubmissionId(sub.id);
    const initialScores: Record<string, number> = {};
    if (data.rubric) {
      data.rubric.criteria.forEach((c) => {
        initialScores[c.id] = sub.myEvaluation.criteriaScores?.[c.id] ?? 0;
      });
    }
    setEditCriteriaScores(initialScores);
    setEditFeedback(sub.myEvaluation.feedback || "");
  };

  const handleCancelEdit = () => {
    setEditingSubmissionId(null);
    setEditCriteriaScores({});
    setEditFeedback("");
  };

  const handleScoreChange = (criterionId: string, maxScore: number, rawVal: string) => {
    let val = parseFloat(rawVal);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > maxScore) val = maxScore;
    val = Math.round(val * 10) / 10;

    setEditCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: val,
    }));
  };

  const handleSaveMyScore = async (submissionId: string) => {
    if (!data.rubric) return;

    // Validate
    for (const c of data.rubric.criteria) {
      const val = editCriteriaScores[c.id];
      if (val === undefined || isNaN(val) || val < 0 || val > c.maxScore) {
        toast.error(`Please provide a score between 0 and ${c.maxScore} for "${c.name}".`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await submitJudgeScore({
        registrationId: submissionId,
        criteriaScores: editCriteriaScores,
        feedback: editFeedback,
      });

      if (res.success && res.totalScore !== undefined) {
        toast.success(`Score updated: ${res.totalScore.toFixed(1)} / ${data.rubric.judgeMaxTotal} pts!`);

        // Update local state smoothly
        setData((prev) => {
          const updatedSubmissions = prev.submissions.map((sub) => {
            if (sub.id !== submissionId) return sub;

            const myNewScore = res.totalScore!;
            const otherScores = sub.otherJudgesEvaluations
              .filter((o) => o.totalScore !== null)
              .map((o) => o.totalScore as number);

            const allScores = [myNewScore, ...otherScores];
            const judgesCount = allScores.length;
            const avgScore = Number((allScores.reduce((a, b) => a + b, 0) / judgesCount).toFixed(2));
            const finalScore = Number((avgScore + sub.socialMediaScore).toFixed(2));

            return {
              ...sub,
              myEvaluation: {
                criteriaScores: editCriteriaScores,
                totalScore: myNewScore,
                feedback: editFeedback.trim() || null,
                isEvaluated: true,
                updatedAt: new Date(),
              },
              averageJudgeScore: avgScore,
              finalScore,
              judgesCount,
            };
          });

          return { ...prev, submissions: updatedSubmissions };
        });

        setEditingSubmissionId(null);
      } else {
        toast.error(res.error || "Failed to save score");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSubmissions = data.submissions.filter((s) =>
    s.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateLiveEditTotal = () => {
    if (!data.rubric) return 0;
    return data.rubric.criteria.reduce((sum, c) => sum + (Number(editCriteriaScores[c.id]) || 0), 0);
  };

  if (data.events.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-[2rem] border-border/80 shadow-xl overflow-hidden bg-card mt-10">
      <CardHeader className="pb-4 border-b border-border/60 bg-secondary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase">
                Consolidated Scoring Summary
              </CardTitle>
            </div>
            <CardDescription className="text-xs font-medium text-muted-foreground">
              Review and update your criteria scores inline. View peer judge scores for transparency.
            </CardDescription>
          </div>

          {/* Event Switcher Tabs */}
          {data.events.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 bg-background rounded-2xl border border-border/80 overflow-x-auto max-w-full">
              {data.events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => handleSwitchEvent(ev.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    ev.id === selectedEventId
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {ev.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 mt-2 border-t border-border/40">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by school or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-background text-xs font-bold border-border/80">
              Evaluator: <strong className="ml-1 text-primary">{data.currentJudgeName}</strong>
            </Badge>
            {data.rubric && (
              <Badge variant="outline" className="bg-background text-[11px] font-bold border-border/80">
                Rubric Cap: <strong className="ml-1 text-primary">{data.rubric.judgeMaxTotal} pts</strong>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isPending ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-xs font-bold text-muted-foreground mt-2">Loading consolidated scores...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <h4 className="text-sm font-black text-foreground">No submissions found</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm ? "No submissions match your search." : "No uploaded entries available for this competition."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[900px] md:min-w-full">
              <TableHeader>
                <TableRow className="bg-secondary/30 border-b border-border/60 hover:bg-transparent">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6 w-[28%]">
                    School & Entry
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6 w-[34%]">
                    My Evaluation (Editable)
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6 w-[22%]">
                    Other Judges (Read-Only)
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6 text-center w-[8%]">
                    Social Media
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground h-12 px-6 text-right w-[8%]">
                    Overall
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((sub) => {
                  const isEditingThis = editingSubmissionId === sub.id;
                  const liveTotal = calculateLiveEditTotal();

                  return (
                    <TableRow
                      key={sub.id}
                      className={`border-b border-border/50 transition-colors ${
                        isEditingThis
                          ? "bg-primary/[0.03] border-primary/40"
                          : "hover:bg-secondary/20"
                      }`}
                    >
                      {/* Column 1: School & Entry */}
                      <TableCell className="py-5 px-6 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <SchoolIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-black text-foreground leading-snug">
                                {sub.school}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="bg-secondary/60 text-foreground border-border/80 font-bold text-[10px] px-2 py-0.5"
                                >
                                  {sub.teamName}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {sub.entryUrl && (
                            <div className="pt-1">
                              <a
                                href={sub.entryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Submission <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Column 2: My Evaluation (Editable) */}
                      <TableCell className="py-5 px-6 align-top">
                        {isEditingThis && data.rubric ? (
                          <div className="space-y-3 bg-card p-4 rounded-2xl border-2 border-primary/40 shadow-md">
                            <div className="flex items-center justify-between border-b border-border/60 pb-2">
                              <span className="text-xs font-black uppercase text-primary flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5" /> Edit Criteria Scores
                              </span>
                              <Badge className="bg-primary text-white font-black text-xs">
                                Total: {liveTotal.toFixed(1)} / {data.rubric.judgeMaxTotal} pts
                              </Badge>
                            </div>

                            {/* Inputs for each criterion */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                              {data.rubric.criteria.map((c) => (
                                <div
                                  key={c.id}
                                  className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1"
                                >
                                  <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="text-foreground truncate max-w-[120px]">{c.name}</span>
                                    <span className="text-muted-foreground text-[10px]">Max: {c.maxScore}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max={c.maxScore}
                                      value={editCriteriaScores[c.id] === 0 ? "0" : editCriteriaScores[c.id] || ""}
                                      onChange={(e) => handleScoreChange(c.id, c.maxScore, e.target.value)}
                                      className="h-8 rounded-lg bg-background text-xs font-black text-center"
                                    />
                                    <span className="text-xs font-bold text-muted-foreground">/{c.maxScore}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Save / Cancel buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="rounded-xl h-8 text-xs font-bold"
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveMyScore(sub.id)}
                                disabled={isSaving}
                                className="rounded-xl h-8 px-4 bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-md shadow-primary/20"
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5 mr-1" /> Save Score
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {sub.myEvaluation.isEvaluated ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-xs px-2.5 py-1 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Scored: {sub.myEvaluation.totalScore?.toFixed(1)} / {data.rubric?.judgeMaxTotal || 95} pts
                                  </Badge>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartEdit(sub)}
                                    className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 border-border/80 hover:border-primary/40 text-foreground hover:text-primary"
                                  >
                                    <Pencil className="w-3 h-3 text-primary" /> Edit
                                  </Button>
                                </div>

                                {/* Criteria breakdown tags */}
                                {data.rubric && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {data.rubric.criteria.map((c) => {
                                      const scoreVal = sub.myEvaluation.criteriaScores?.[c.id] ?? 0;
                                      return (
                                        <Badge
                                          key={c.id}
                                          variant="secondary"
                                          className="text-[10px] font-bold px-2 py-0.5 bg-secondary/80 text-foreground border-border/60"
                                        >
                                          {c.name.split(" ")[0]}: <strong className="ml-1 text-primary">{scoreVal}/{c.maxScore}</strong>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-between py-1">
                                <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending Evaluation
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => handleStartEdit(sub)}
                                  className="h-7 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-sm shadow-primary/20"
                                >
                                  + Score Now
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Column 3: Other Judges (Read-Only) */}
                      <TableCell className="py-5 px-6 align-top">
                        {sub.otherJudgesEvaluations.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No other judges assigned</span>
                        ) : (
                          <div className="space-y-1.5">
                            {sub.otherJudgesEvaluations.map((peer) => (
                              <div key={peer.judgeId} className="flex items-center justify-between text-xs">
                                <span className="font-bold text-muted-foreground truncate max-w-[110px]">
                                  {peer.judgeName}:
                                </span>

                                {peer.isEvaluated ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-foreground hover:bg-secondary/80 font-black text-[11px] border border-border/60 transition-colors">
                                        <span>{peer.totalScore?.toFixed(1)} pts</span>
                                        <Eye className="w-3 h-3 text-muted-foreground" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3.5 rounded-2xl bg-card border border-border shadow-xl space-y-2">
                                      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                                        <span className="text-xs font-black text-foreground">{peer.judgeName}</span>
                                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                                          <Lock className="w-2.5 h-2.5 mr-1" /> Read-Only
                                        </Badge>
                                      </div>
                                      {data.rubric && (
                                        <div className="space-y-1 text-xs">
                                          {data.rubric.criteria.map((c) => (
                                            <div key={c.id} className="flex items-center justify-between text-[11px]">
                                              <span className="text-muted-foreground">{c.name}:</span>
                                              <span className="font-black text-foreground">
                                                {peer.criteriaScores[c.id] ?? 0} / {c.maxScore}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-xs font-black text-primary">
                                        <span>Total Score:</span>
                                        <span>{peer.totalScore?.toFixed(1)} / {data.rubric?.judgeMaxTotal} pts</span>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <span className="text-[11px] font-bold text-amber-600/80 italic">Pending</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>

                      {/* Column 4: Social Media Voting */}
                      <TableCell className="py-5 px-6 align-top text-center">
                        <Badge
                          variant="outline"
                          className="font-black text-xs px-2.5 py-1 bg-secondary/40 text-foreground border-border/80"
                        >
                          {sub.socialMediaScore.toFixed(1)} / 5
                        </Badge>
                      </TableCell>

                      {/* Column 5: Overall Final Score */}
                      <TableCell className="py-5 px-6 align-top text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-primary">
                            {sub.finalScore.toFixed(1)}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            / 100 pts
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useTransition, useMemo } from "react";
import { CompetitionRubric } from "@/lib/rubrics";
import { getJudgeConsolidatedSummary, submitJudgeScore } from "@/app/actions/judging";
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
  CheckCircle2, 
  Save, 
  Loader2, 
  Sparkles, 
  School as SchoolIcon, 
  Search,
  Lock,
  Eye,
  FileSpreadsheet,
  Check,
  Calculator
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

  // In-cell working scores state per submission id
  const [cellScores, setCellScores] = useState<Record<string, Record<string, string | number>>>(() => {
    const map: Record<string, Record<string, string | number>> = {};
    initialData.submissions.forEach((sub) => {
      const criteriaMap: Record<string, string | number> = {};
      if (initialData.rubric) {
        initialData.rubric.criteria.forEach((c) => {
          const existing = sub.myEvaluation.criteriaScores?.[c.id];
          criteriaMap[c.id] = sub.myEvaluation.isEvaluated && existing !== undefined ? existing : "";
        });
      }
      map[sub.id] = criteriaMap;
    });
    return map;
  });

  // Track modified / dirty rows and saving state per row
  const [dirtyRows, setDirtyRows] = useState<Record<string, boolean>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [savedSuccessRows, setSavedSuccessRows] = useState<Record<string, boolean>>({});

  const handleSwitchEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setDirtyRows({});
    setSavedSuccessRows({});
    startTransition(async () => {
      try {
        const res = await getJudgeConsolidatedSummary(eventId);
        setData(res);

        // Reset cell scores
        const map: Record<string, Record<string, string | number>> = {};
        res.submissions.forEach((sub) => {
          const criteriaMap: Record<string, string | number> = {};
          if (res.rubric) {
            res.rubric.criteria.forEach((c) => {
              const existing = sub.myEvaluation.criteriaScores?.[c.id];
              criteriaMap[c.id] = sub.myEvaluation.isEvaluated && existing !== undefined ? existing : "";
            });
          }
          map[sub.id] = criteriaMap;
        });
        setCellScores(map);
      } catch (err: any) {
        toast.error("Failed to load competition spreadsheet");
      }
    });
  };

  const handleCellChange = (submissionId: string, criterionId: string, maxScore: number, rawVal: string) => {
    if (rawVal === "" || rawVal === null) {
      setCellScores((prev) => ({
        ...prev,
        [submissionId]: {
          ...(prev[submissionId] || {}),
          [criterionId]: "",
        },
      }));
      setDirtyRows((prev) => ({
        ...prev,
        [submissionId]: true,
      }));
      setSavedSuccessRows((prev) => ({
        ...prev,
        [submissionId]: false,
      }));
      return;
    }

    let valStr = rawVal;
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      if (parsed < 0) {
        valStr = "0";
      } else if (parsed > maxScore) {
        valStr = String(maxScore);
      }
    }

    setCellScores((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [criterionId]: valStr,
      },
    }));

    setDirtyRows((prev) => ({
      ...prev,
      [submissionId]: true,
    }));

    // Reset success indicator for this row
    setSavedSuccessRows((prev) => ({
      ...prev,
      [submissionId]: false,
    }));
  };

  const getRowMyTotal = (submissionId: string) => {
    if (!data.rubric) return 0;
    const scores = cellScores[submissionId] || {};
    return data.rubric.criteria.reduce((sum, c) => {
      const val = parseFloat(String(scores[c.id]));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const getRowFinalScore = (sub: ConsolidatedSubmission) => {
    const myTotal = getRowMyTotal(sub.id);
    const peerScores = sub.otherJudgesEvaluations
      .filter((p) => p.totalScore !== null)
      .map((p) => p.totalScore as number);

    const allJudgeTotals = [myTotal, ...peerScores];
    const avg = allJudgeTotals.length > 0 ? allJudgeTotals.reduce((a, b) => a + b, 0) / allJudgeTotals.length : 0;
    return Number((avg + sub.socialMediaScore).toFixed(2));
  };

  const handleSaveRow = async (submissionId: string) => {
    if (!data.rubric) return;

    const rowCriteriaRaw = cellScores[submissionId] || {};
    const rowCriteria: Record<string, number> = {};

    // Validate
    for (const c of data.rubric.criteria) {
      const raw = rowCriteriaRaw[c.id];
      const val = typeof raw === "number" ? raw : parseFloat(String(raw));
      if (raw === "" || raw === undefined || isNaN(val) || val < 0 || val > c.maxScore) {
        toast.error(`Please provide a valid score between 0 and ${c.maxScore} for "${c.name}".`);
        return;
      }
      rowCriteria[c.id] = Math.round(val * 10) / 10;
    }

    setSavingRows((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await submitJudgeScore({
        registrationId: submissionId,
        criteriaScores: rowCriteria,
      });

      if (res.success && res.totalScore !== undefined) {
        toast.success(`Row saved! Score: ${res.totalScore.toFixed(1)} / ${data.rubric.judgeMaxTotal} pts`);

        // Mark row as clean and show success check
        setDirtyRows((prev) => ({ ...prev, [submissionId]: false }));
        setSavedSuccessRows((prev) => ({ ...prev, [submissionId]: true }));

        setTimeout(() => {
          setSavedSuccessRows((prev) => ({ ...prev, [submissionId]: false }));
        }, 3000);

        // Update local dataset
        setData((prev) => {
          const updatedSubmissions = prev.submissions.map((sub) => {
            if (sub.id !== submissionId) return sub;

            const myNewScore = res.totalScore!;
            const peerScores = sub.otherJudgesEvaluations
              .filter((p) => p.totalScore !== null)
              .map((p) => p.totalScore as number);

            const allScores = [myNewScore, ...peerScores];
            const avgScore = Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2));
            const finalScore = Number((avgScore + sub.socialMediaScore).toFixed(2));

            return {
              ...sub,
              myEvaluation: {
                ...sub.myEvaluation,
                criteriaScores: rowCriteria,
                totalScore: myNewScore,
                isEvaluated: true,
                updatedAt: new Date(),
              },
              averageJudgeScore: avgScore,
              finalScore,
              judgesCount: allScores.length,
            };
          });

          return { ...prev, submissions: updatedSubmissions };
        });
      } else {
        toast.error(res.error || "Failed to save row");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSavingRows((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const filteredSubmissions = useMemo(() => {
    return data.submissions.filter((s) =>
      s.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.teamName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.submissions, searchTerm]);

  // Summary statistics for footer row
  const stats = useMemo(() => {
    if (data.submissions.length === 0) return { avgJudgeTotal: 0, avgFinal: 0, highestFinal: 0, evaluatedCount: 0 };
    const myTotals = data.submissions.map((s) => getRowMyTotal(s.id));
    const finals = data.submissions.map((s) => getRowFinalScore(s));
    const avgJudge = myTotals.reduce((a, b) => a + b, 0) / myTotals.length;
    const avgFinal = finals.reduce((a, b) => a + b, 0) / finals.length;
    const highest = Math.max(...finals, 0);
    const evaluated = data.submissions.filter((s) => s.myEvaluation.isEvaluated).length;

    return {
      avgJudgeTotal: Number(avgJudge.toFixed(2)),
      avgFinal: Number(avgFinal.toFixed(2)),
      highestFinal: Number(highest.toFixed(2)),
      evaluatedCount: evaluated,
    };
  }, [data.submissions, cellScores]);

  if (data.events.length === 0) {
    return null;
  }

  const peerJudges = data.assignedJudges.filter((j) => j.id !== data.currentJudgeId);

  return (
    <Card className="rounded-[2rem] border-2 border-border/90 shadow-2xl overflow-hidden bg-card mt-10">
      {/* Top Spreadsheet Header */}
      <CardHeader className="pb-4 border-b border-border/80 bg-gradient-to-r from-secondary/40 via-secondary/20 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase flex items-center gap-2">
                  Consolidated Scoring Sheet
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  Excel-style matrix: Type criteria points directly into cells. Peer judge scores are locked for reference.
                </CardDescription>
              </div>
            </div>
          </div>

          {/* Event Switcher Tabs */}
          {data.events.length > 1 && (
            <div className="flex items-center gap-1.5 p-1.5 bg-background rounded-2xl border border-border/80 overflow-x-auto max-w-full">
              {data.events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => handleSwitchEvent(ev.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    ev.id === selectedEventId
                      ? "bg-primary text-white shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {ev.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar & Excel Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 mt-3 border-t border-border/60">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search school or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <span>Active Evaluator:</span>
              <strong className="underline decoration-primary underline-offset-2">{data.currentJudgeName}</strong>
            </div>
            {data.rubric && (
              <Badge variant="outline" className="bg-background text-xs font-bold border-border/80 py-1">
                Judge Cap: <strong className="ml-1 text-primary">{data.rubric.judgeMaxTotal} pts</strong>
              </Badge>
            )}
            <Badge variant="outline" className="bg-background text-xs font-bold border-border/80 py-1">
              Evaluated: <strong className="ml-1 text-emerald-600 dark:text-emerald-400">{stats.evaluatedCount} / {data.submissions.length}</strong>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isPending ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-xs font-bold text-muted-foreground mt-2">Loading spreadsheet formula matrix...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <h4 className="text-sm font-black text-foreground">No submissions found</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm ? "No entries match your search." : "No uploaded entries available for this competition."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              {/* Multi-Tier Excel Header */}
              <thead>
                {/* Tier 1: Grouped Section Headers */}
                <tr className="border-b border-border/80 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-secondary/60">
                  <th colSpan={2} className="px-4 py-2 border-r border-border/80 text-center bg-secondary/80 text-foreground">
                    1. Entry Identifiers
                  </th>
                  {data.rubric && (
                    <th
                      colSpan={data.rubric.criteria.length + 1}
                      className="px-4 py-2 border-r border-border/80 text-center bg-primary/10 text-primary font-black"
                    >
                      2. My Evaluation (In-Cell Input) — Cap: {data.rubric.judgeMaxTotal} pts
                    </th>
                  )}
                  <th
                    colSpan={Math.max(1, peerJudges.length)}
                    className="px-4 py-2 border-r border-border/80 text-center bg-secondary/50 text-muted-foreground"
                  >
                    3. Peer Judges (Protected 🔒)
                  </th>
                  <th className="px-3 py-2 border-r border-border/80 text-center bg-secondary/70">
                    4. Social
                  </th>
                  <th className="px-3 py-2 border-r border-border/80 text-center bg-primary/15 text-primary font-black">
                    5. Final
                  </th>
                  <th className="px-3 py-2 text-center bg-secondary/80">
                    Action
                  </th>
                </tr>

                {/* Tier 2: Individual Column Names */}
                <tr className="border-b-2 border-border text-[11px] font-black uppercase tracking-tight text-foreground bg-secondary/40">
                  {/* Entry Identifiers */}
                  <th className="px-4 py-3 border-r border-border/80 min-w-[200px]">
                    School Name
                  </th>
                  <th className="px-3 py-3 border-r border-border/80 min-w-[130px]">
                    Team & Link
                  </th>

                  {/* My Criteria Sub-Columns */}
                  {data.rubric &&
                    data.rubric.criteria.map((c) => (
                      <th
                        key={c.id}
                        className="px-3 py-3 border-r border-border/80 text-center min-w-[130px] max-w-[180px] bg-primary/[0.04]"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-[11px] font-black leading-tight text-foreground whitespace-normal break-words">
                            {c.name}
                          </span>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            /{c.maxScore} pts
                          </span>
                        </div>
                      </th>
                    ))}

                  {/* My Total */}
                  <th className="px-3 py-3 border-r border-border/80 text-center min-w-[90px] bg-primary/10 font-black text-primary">
                    My Total
                  </th>

                  {/* Peer Judges Columns */}
                  {peerJudges.length === 0 ? (
                    <th className="px-3 py-3 border-r border-border/80 text-center text-muted-foreground min-w-[120px]">
                      Peer Scores
                    </th>
                  ) : (
                    peerJudges.map((peer) => (
                      <th
                        key={peer.id}
                        className="px-3 py-3 border-r border-border/80 text-center min-w-[110px] text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-[11px] font-bold text-foreground/80 whitespace-normal break-words leading-tight">
                            {peer.name}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground/80 bg-secondary/80 px-1.5 py-0.5 rounded">
                            /{data.rubric?.judgeMaxTotal || 95} pts
                          </span>
                        </div>
                      </th>
                    ))
                  )}

                  {/* Social Media Column */}
                  <th className="px-3 py-3 border-r border-border/80 text-center min-w-[80px]">
                    Voting (/5)
                  </th>

                  {/* Final Score */}
                  <th className="px-3 py-3 border-r border-border/80 text-center min-w-[90px] bg-primary/15 font-black text-primary">
                    Total (/100)
                  </th>

                  {/* Row Save Action */}
                  <th className="px-3 py-3 text-center min-w-[95px]">
                    Save
                  </th>
                </tr>
              </thead>

              {/* Table Data Rows */}
              <tbody className="divide-y divide-border/60">
                {filteredSubmissions.map((sub, idx) => {
                  const myRowTotal = getRowMyTotal(sub.id);
                  const rowFinalScore = getRowFinalScore(sub);
                  const isDirty = !!dirtyRows[sub.id];
                  const isSaving = !!savingRows[sub.id];
                  const isSavedSuccess = !!savedSuccessRows[sub.id];

                  return (
                    <tr
                      key={sub.id}
                      className={`transition-colors font-medium ${
                        idx % 2 === 0 ? "bg-card" : "bg-secondary/[0.15]"
                      } hover:bg-primary/[0.02]`}
                    >
                      {/* 1. School Name */}
                      <td className="px-4 py-3 border-r border-border/80 align-middle">
                        <div className="flex items-center gap-2">
                          <SchoolIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-bold text-foreground text-xs line-clamp-2">{sub.school}</span>
                        </div>
                      </td>

                      {/* 2. Team & Submission Link */}
                      <td className="px-3 py-3 border-r border-border/80 align-middle">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className="bg-secondary/60 text-foreground border-border/80 font-bold text-[10px] px-2 py-0.5 w-fit"
                          >
                            {sub.teamName}
                          </Badge>
                          {sub.entryUrl && (
                            <a
                              href={sub.entryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View Submission <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 3. Editable Criteria Cells */}
                      {data.rubric &&
                        data.rubric.criteria.map((c) => {
                          const currentScore = cellScores[sub.id]?.[c.id] ?? "";

                          return (
                            <td
                              key={c.id}
                              className="px-2 py-2 border-r border-border/80 text-center align-middle bg-primary/[0.02]"
                            >
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max={c.maxScore}
                                  placeholder="0"
                                  value={currentScore}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => handleCellChange(sub.id, c.id, c.maxScore, e.target.value)}
                                  className="h-8 w-20 mx-auto text-center font-black font-mono text-xs rounded-lg border-border/80 bg-background focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                                />
                              </div>
                            </td>
                          );
                        })}

                      {/* 4. Live Calculated Judge Total */}
                      <td className="px-3 py-3 border-r border-border/80 text-center align-middle bg-primary/5 font-black text-xs font-mono text-primary">
                        {myRowTotal.toFixed(1)}
                      </td>

                      {/* 5. Peer Judges Cells (Protected / Read-Only) */}
                      {peerJudges.length === 0 ? (
                        <td className="px-3 py-3 border-r border-border/80 text-center align-middle text-muted-foreground italic text-[11px]">
                          None
                        </td>
                      ) : (
                        peerJudges.map((peer) => {
                          const peerEval = sub.otherJudgesEvaluations.find((p) => p.judgeId === peer.id);

                          return (
                            <td
                              key={peer.id}
                              className="px-2 py-2 border-r border-border/80 text-center align-middle bg-secondary/30"
                            >
                              {peerEval && peerEval.isEvaluated ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-foreground hover:bg-secondary/80 font-black font-mono text-xs border border-border/60 transition-colors shadow-sm">
                                      <span>{peerEval.totalScore?.toFixed(1)}</span>
                                      <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-3.5 rounded-2xl bg-card border border-border shadow-2xl space-y-2">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                                      <span className="text-xs font-black text-foreground">{peer.name}</span>
                                      <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                                        <Lock className="w-2.5 h-2.5 mr-1" /> Protected Cell
                                      </Badge>
                                    </div>
                                    {data.rubric && (
                                      <div className="space-y-1 text-xs">
                                        {data.rubric.criteria.map((c) => (
                                          <div key={c.id} className="flex items-center justify-between text-[11px]">
                                            <span className="text-muted-foreground">{c.name}:</span>
                                            <span className="font-black text-foreground font-mono">
                                              {peerEval.criteriaScores[c.id] ?? 0} / {c.maxScore}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-xs font-black text-primary font-mono">
                                      <span>Judge Total:</span>
                                      <span>{peerEval.totalScore?.toFixed(1)} / {data.rubric?.judgeMaxTotal} pts</span>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600/70 italic">Pending</span>
                              )}
                            </td>
                          );
                        })
                      )}

                      {/* 6. Social Media Score */}
                      <td className="px-3 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-xs text-muted-foreground">
                        {sub.socialMediaScore.toFixed(1)}
                      </td>

                      {/* 7. Final Calculated Total */}
                      <td className="px-3 py-3 border-r border-border/80 text-center align-middle bg-primary/10 font-black font-mono text-xs text-primary">
                        {rowFinalScore.toFixed(1)}
                      </td>

                      {/* 8. Save Action Button */}
                      <td className="px-3 py-3 text-center align-middle">
                        <Button
                          size="sm"
                          onClick={() => handleSaveRow(sub.id)}
                          disabled={isSaving}
                          className={`h-8 px-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
                            isSavedSuccess
                              ? "bg-emerald-600 text-white"
                              : isDirty
                              ? "bg-primary text-white shadow-primary/20 animate-pulse font-black"
                              : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/80"
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isSavedSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" /> Saved
                            </>
                          ) : isDirty ? (
                            <>
                              <Save className="w-3.5 h-3.5 mr-1" /> Save
                            </>
                          ) : (
                            "Saved"
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Excel Summary Footer Row */}
              <tfoot>
                <tr className="border-t-2 border-border font-black text-xs uppercase bg-secondary/70 text-foreground">
                  <td colSpan={2} className="px-4 py-3 border-r border-border/80 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-primary" />
                    <span>Spreadsheet Average ({filteredSubmissions.length} Entries)</span>
                  </td>
                  {data.rubric && (
                    <td
                      colSpan={data.rubric.criteria.length + 1}
                      className="px-4 py-3 border-r border-border/80 text-center font-mono text-primary font-black bg-primary/10"
                    >
                      Avg Judge Score: {stats.avgJudgeTotal} pts
                    </td>
                  )}
                  <td colSpan={Math.max(1, peerJudges.length) + 1} className="px-4 py-3 border-r border-border/80 text-center text-muted-foreground text-[11px]">
                    Top Final: <strong className="text-foreground ml-1">{stats.highestFinal} / 100</strong>
                  </td>
                  <td className="px-3 py-3 border-r border-border/80 text-center font-mono text-primary font-black bg-primary/15">
                    {stats.avgFinal}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Badge variant="outline" className="text-[10px] font-black bg-background">
                      {stats.evaluatedCount}/{data.submissions.length}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

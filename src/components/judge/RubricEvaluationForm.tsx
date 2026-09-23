"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ExternalLink, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  School, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitJudgeScore } from "@/app/actions/judging";
import { CompetitionRubric } from "@/lib/rubrics";

interface ExistingScore {
  id: string;
  criteriaScores: Record<string, number>;
  totalScore: number;
  feedback: string | null;
  updatedAt: Date;
}

interface RegistrationData {
  id: string;
  eventId: string;
  eventTitle: string;
  school: string;
  teamName: string;
  competitorName: string;
  coachName: string;
  entryUrl: string | null;
}

interface RubricEvaluationFormProps {
  registration: RegistrationData;
  rubric: CompetitionRubric;
  existingScore: ExistingScore | null;
}

export default function RubricEvaluationForm({
  registration,
  rubric,
  existingScore,
}: RubricEvaluationFormProps) {
  const router = useRouter();

  // Initialize criteria scores from existingScore or default to 0
  const initialScores: Record<string, number> = {};
  rubric.criteria.forEach((c) => {
    initialScores[c.id] = existingScore?.criteriaScores?.[c.id] ?? 0;
  });

  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(initialScores);
  const [feedback, setFeedback] = useState<string>(existingScore?.feedback || "");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate live total
  const liveTotalScore = rubric.criteria.reduce((sum, c) => {
    const val = Number(criteriaScores[c.id]) || 0;
    return sum + val;
  }, 0);

  const handleScoreChange = (criterionId: string, maxVal: number, rawValue: string) => {
    let val = parseFloat(rawValue);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > maxVal) val = maxVal;

    // Round to 1 decimal place if needed
    val = Math.round(val * 10) / 10;

    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: val,
    }));
  };

  const handleQuickPercent = (criterionId: string, maxVal: number, percent: number) => {
    const val = Math.round((maxVal * percent) * 10) / 10;
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: val,
    }));
  };

  const validateAll = () => {
    for (const c of rubric.criteria) {
      const val = criteriaScores[c.id];
      if (val === undefined || isNaN(val) || val < 0 || val > c.maxScore) {
        setErrorMsg(`Please provide a valid score between 0 and ${c.maxScore} for "${c.name}".`);
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const onOpenConfirmation = () => {
    if (validateAll()) {
      setIsConfirmOpen(true);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await submitJudgeScore({
      registrationId: registration.id,
      criteriaScores,
      feedback,
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      setIsConfirmOpen(false);
    } else {
      setIsConfirmOpen(false);
      setSuccessMsg(`Score successfully recorded (${res.totalScore?.toFixed(1)} / ${rubric.judgeMaxTotal} pts)!`);
      setTimeout(() => {
        router.push(`/judge/competitions/${registration.eventId}`);
        router.refresh();
      }, 1200);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header & Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/judge/competitions/${registration.eventId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Submissions
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Official Evaluation Rubric
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-xs">
              {rubric.title}
            </Badge>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Evaluate this submission based on the official RAITE 2026 judging criteria.
          </p>
        </div>

        {/* Existing Evaluation Indicator */}
        {existingScore && (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Previously Scored: {existingScore.totalScore.toFixed(1)} / {rubric.judgeMaxTotal} pts
          </Badge>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Submission Details & Entry Preview */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Submission Details
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <School className="w-4 h-4 text-primary shrink-0 mt-1" />
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    School / Institution
                  </label>
                  <p className="text-sm font-black text-foreground">{registration.school}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-primary shrink-0 mt-1" />
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Team & Competitor
                  </label>
                  <p className="text-sm font-bold text-foreground">{registration.teamName}</p>
                  <p className="text-xs font-medium text-muted-foreground">{registration.competitorName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-1" />
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Coach
                  </label>
                  <p className="text-xs font-bold text-foreground">{registration.coachName}</p>
                </div>
              </div>
            </div>

            {/* Entry Link Button */}
            {registration.entryUrl ? (
              <div className="pt-4 border-t border-border/60">
                <a
                  href={registration.entryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Entry in New Tab
                </a>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Review the Google Drive / submission link carefully before locking in points.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-secondary/50 rounded-xl text-center text-xs font-medium text-muted-foreground">
                No entry link provided.
              </div>
            )}

            {/* Rubric Summary Card */}
            <div className="bg-secondary/40 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-foreground">
                <span>Judge Total Cap:</span>
                <span className="text-primary font-black">{rubric.judgeMaxTotal} pts</span>
              </div>
              <div className="flex justify-between font-bold text-muted-foreground text-[11px]">
                <span>Social Media ({rubric.socialMediaLabel}):</span>
                <span>{rubric.socialMediaMax} pts</span>
              </div>
              <div className="flex justify-between font-bold text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                <span>Overall Final Max:</span>
                <span>{rubric.grandTotal} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Rubric Scoring Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Criteria Cards */}
          <div className="space-y-4">
            {rubric.criteria.map((criterion, idx) => {
              const currentScore = criteriaScores[criterion.id] ?? 0;
              const percentFilled = (currentScore / criterion.maxScore) * 100;

              return (
                <div
                  key={criterion.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 transition-all hover:border-primary/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-primary">
                          Criterion {idx + 1}
                        </span>
                        <h4 className="text-base font-black text-foreground">
                          {criterion.name}
                        </h4>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        {criterion.description}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary font-black text-xs px-3 py-1 self-start sm:self-auto shrink-0"
                    >
                      Max: {criterion.maxScore} pts
                    </Badge>
                  </div>

                  {/* Input and Quick Selection */}
                  <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Quick percentage buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-1">
                        Preset:
                      </span>
                      {[0.5, 0.7, 0.85, 1.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleQuickPercent(criterion.id, criterion.maxScore, pct)}
                          className="px-2.5 py-1 rounded-lg bg-secondary text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                        >
                          {pct * 100}% ({(criterion.maxScore * pct).toFixed(1)})
                        </button>
                      ))}
                    </div>

                    {/* Score Number Input */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <label className="text-xs font-bold text-muted-foreground">Score:</label>
                      <div className="relative w-24">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max={criterion.maxScore}
                          value={criteriaScores[criterion.id] === 0 ? "0" : criteriaScores[criterion.id] || ""}
                          onChange={(e) =>
                            handleScoreChange(criterion.id, criterion.maxScore, e.target.value)
                          }
                          className="h-10 rounded-xl font-black text-center text-sm bg-background border-border/80 focus:border-primary pr-2"
                        />
                      </div>
                      <span className="text-xs font-black text-muted-foreground">
                        / {criterion.maxScore}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar visual */}
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, percentFilled))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback & Comments */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Judge Comments & Constructive Feedback (Optional)
              </h4>
            </div>
            <Textarea
              placeholder="Provide comments, highlights, or suggestions for the participant/team..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="rounded-xl border-border/80 bg-background text-sm font-medium resize-none"
            />
          </div>

          {/* Bottom Total Score Sticky Bar */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-accent/10 p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Calculated Judge Score
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-primary">
                  {liveTotalScore.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-muted-foreground">
                  / {rubric.judgeMaxTotal} pts
                </span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={onOpenConfirmation}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/25 gap-2"
            >
              <Lock className="w-4 h-4" />
              {existingScore ? "Review & Update Scores" : "Review & Lock In Scores"}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-center text-foreground uppercase tracking-tight">
              Confirm Score Submission
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-center text-muted-foreground">
              Please verify your criteria scores before locking them into the official RAITE 2026 leaderboard.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3 bg-secondary/30 rounded-2xl p-4 border border-border/60">
            <div className="text-xs font-bold text-foreground pb-2 border-b border-border/40">
              {registration.school} — {registration.teamName} ({registration.competitorName})
            </div>

            <div className="space-y-2">
              {rubric.criteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{c.name}</span>
                  <span className="font-black text-foreground">
                    {(criteriaScores[c.id] ?? 0).toFixed(1)} / {c.maxScore}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                Total Score:
              </span>
              <span className="text-base font-black text-primary">
                {liveTotalScore.toFixed(1)} / {rubric.judgeMaxTotal} pts
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl font-bold h-11 text-xs uppercase tracking-wider"
            >
              Modify Scores
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="rounded-xl font-black h-11 px-6 bg-primary hover:bg-primary/90 text-white text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
            >
              {isSubmitting ? "Locking in..." : "Confirm & Lock In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

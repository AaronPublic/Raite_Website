"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  TabulationEventInfo, 
  SchoolTabulationRow, 
  SpecialAwardEntry 
} from "@/app/actions/tabulation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Medal, 
  Crown, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  FileSpreadsheet, 
  Ticket, 
  ArrowLeft,
  Building2,
  Users,
  ExternalLink,
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import { generateRAITECompetitionWinnersPDF } from "@/lib/pdf-reports";

interface AdminOverallRankingsClientProps {
  events: TabulationEventInfo[];
  schools: string[];
  leaderboard: SchoolTabulationRow[];
  specialAwards: SpecialAwardEntry[];
}

export default function AdminOverallRankingsClient({
  events,
  schools,
  leaderboard,
  specialAwards,
}: AdminOverallRankingsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter leaderboard based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) return leaderboard;
    const q = searchTerm.toLowerCase();
    return leaderboard.filter(
      (r) =>
        r.schoolName.toLowerCase().includes(q) ||
        r.schoolAbbr.toLowerCase().includes(q)
    );
  }, [leaderboard, searchTerm]);

  // Grouped Podiums for Multiple Tied Winners
  const podiumGroups = useMemo(() => {
    const champions = leaderboard.filter((r) => r.rank === 1 && r.totalPoints > 0);
    const firstRunnersUp = leaderboard.filter((r) => r.rank === 2 && r.totalPoints > 0);
    const secondRunnersUp = leaderboard.filter((r) => r.rank === 3 && r.totalPoints > 0);

    return {
      champions,
      firstRunnersUp,
      secondRunnersUp,
    };
  }, [leaderboard]);

  // Rank frequency map for ties in matrix table
  const rankCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    leaderboard.forEach((r) => {
      counts[r.rank] = (counts[r.rank] || 0) + 1;
    });
    return counts;
  }, [leaderboard]);

  const handleExportWinnersPDF = () => {
    try {
      generateRAITECompetitionWinnersPDF({
        events,
        specialAwards,
        overallPodium: podiumGroups,
      });
      toast.success("Competition winners PDF exported successfully!");
    } catch (err: any) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/tabulation"
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Tabulation Setup
            </Link>
            <span className="text-muted-foreground">•</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Administrator View
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Overall Rankings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportWinnersPDF}
            variant="outline"
            size="sm"
            className="rounded-xl font-bold text-xs border-primary/30 hover:bg-primary/10 text-primary shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export Winners PDF
          </Button>
          <Link href="/overall-rankings" target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs border-border/80">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-primary" /> Public Page
            </Button>
          </Link>
          <Link href="/admin/tabulation">
            <Button size="sm" className="rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90 shadow-md">
              Edit Placements & Awards
            </Button>
          </Link>
        </div>
      </div>

      {/* Podium Highlight Grid with Support for Multiple Tied Schools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 2nd Place Silver Podium Card */}
        <Card className="rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-100/60 to-transparent dark:from-slate-900/40 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Medal className="w-3 h-3 text-slate-500" /> 2nd Overall (1st Runner Up)
                </Badge>
                {podiumGroups.firstRunnersUp.length > 1 && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-bold text-[10px] flex items-center gap-1">
                    <Users className="w-3 h-3" /> Tied ({podiumGroups.firstRunnersUp.length} Schools)
                  </Badge>
                )}
                <Medal className="w-7 h-7 text-slate-400 shrink-0" />
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-3">
              {podiumGroups.firstRunnersUp.length === 0 ? (
                <div className="py-4 text-center text-xs font-semibold text-muted-foreground">
                  Pending Placements
                </div>
              ) : (
                podiumGroups.firstRunnersUp.map((school, sIdx) => (
                  <div
                    key={school.schoolName}
                    className={`p-3 rounded-2xl bg-background/80 border border-slate-200 dark:border-slate-800 space-y-2 ${
                      sIdx > 0 ? "mt-2" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-foreground line-clamp-1">
                          {school.schoolName}
                        </h4>
                        <p className="text-[11px] font-bold text-muted-foreground">
                          {school.schoolAbbr}
                        </p>
                      </div>
                      <div className="text-xl font-black font-mono text-slate-700 dark:text-slate-300 shrink-0">
                        {school.totalPoints} <span className="text-[10px] font-bold text-muted-foreground">pts</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[11px] font-bold text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-0.5 text-amber-600"><Trophy className="w-3 h-3" /> {school.championsCount}</span>
                      <span className="flex items-center gap-0.5 text-slate-500"><Medal className="w-3 h-3" /> {school.firstRunnerUpCount}</span>
                      <span className="flex items-center gap-0.5 text-amber-800"><Medal className="w-3 h-3" /> {school.secondRunnerUpCount}</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground"><Ticket className="w-3 h-3" /> {school.participationCount}</span>
                      {school.specialAwardsCount > 0 && (
                        <span className="flex items-center gap-0.5 text-primary"><Sparkles className="w-3 h-3" /> +{school.specialAwardsPoints} pts</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </div>
        </Card>

        {/* 1st Place Champion Gold Podium Card */}
        <Card className="rounded-3xl border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent shadow-xl relative overflow-hidden md:-translate-y-2 flex flex-col justify-between">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
          <div>
            <CardHeader className="pb-3 border-b border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> Overall Champion
                </Badge>
                {podiumGroups.champions.length > 1 && (
                  <Badge className="bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1">
                    <Users className="w-3 h-3" /> Co-Champions ({podiumGroups.champions.length} Schools)
                  </Badge>
                )}
                <Crown className="w-8 h-8 text-amber-500 shrink-0" />
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-3">
              {podiumGroups.champions.length === 0 ? (
                <div className="py-4 text-center text-xs font-semibold text-muted-foreground">
                  Pending Placements
                </div>
              ) : (
                podiumGroups.champions.map((school, sIdx) => (
                  <div
                    key={school.schoolName}
                    className={`p-3.5 rounded-2xl bg-background/90 border-2 border-amber-300 dark:border-amber-700/60 shadow-md space-y-2 ${
                      sIdx > 0 ? "mt-2" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-black text-foreground line-clamp-1">
                          {school.schoolName}
                        </h4>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          {school.schoolAbbr}
                        </p>
                      </div>
                      <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 shrink-0">
                        {school.totalPoints} <span className="text-xs font-bold text-muted-foreground">pts</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1.5 border-t border-amber-200 dark:border-amber-900/50 text-xs font-bold text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-0.5 text-amber-600 font-black"><Trophy className="w-3.5 h-3.5" /> {school.championsCount}</span>
                      <span className="flex items-center gap-0.5 text-slate-500"><Medal className="w-3.5 h-3.5" /> {school.firstRunnerUpCount}</span>
                      <span className="flex items-center gap-0.5 text-amber-800"><Medal className="w-3.5 h-3.5" /> {school.secondRunnerUpCount}</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground"><Ticket className="w-3.5 h-3.5" /> {school.participationCount}</span>
                      {school.specialAwardsCount > 0 && (
                        <span className="flex items-center gap-0.5 text-primary font-black"><Sparkles className="w-3.5 h-3.5" /> +{school.specialAwardsPoints} pts</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </div>
        </Card>

        {/* 3rd Place Bronze Podium Card */}
        <Card className="rounded-3xl border-2 border-amber-800/40 dark:border-amber-900/60 bg-gradient-to-b from-amber-950/10 to-transparent shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Medal className="w-3 h-3 text-amber-700" /> 3rd Overall (2nd Runner Up)
                </Badge>
                {podiumGroups.secondRunnersUp.length > 1 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-bold text-[10px] flex items-center gap-1">
                    <Users className="w-3 h-3" /> Tied ({podiumGroups.secondRunnersUp.length} Schools)
                  </Badge>
                )}
                <Medal className="w-7 h-7 text-amber-700 dark:text-amber-500 shrink-0" />
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-3">
              {podiumGroups.secondRunnersUp.length === 0 ? (
                <div className="py-4 text-center text-xs font-semibold text-muted-foreground">
                  Pending Placements
                </div>
              ) : (
                podiumGroups.secondRunnersUp.map((school, sIdx) => (
                  <div
                    key={school.schoolName}
                    className={`p-3 rounded-2xl bg-background/80 border border-amber-200 dark:border-amber-900/40 space-y-2 ${
                      sIdx > 0 ? "mt-2" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-foreground line-clamp-1">
                          {school.schoolName}
                        </h4>
                        <p className="text-[11px] font-bold text-muted-foreground">
                          {school.schoolAbbr}
                        </p>
                      </div>
                      <div className="text-xl font-black font-mono text-amber-800 dark:text-amber-500 shrink-0">
                        {school.totalPoints} <span className="text-[10px] font-bold text-muted-foreground">pts</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[11px] font-bold text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-0.5 text-amber-600"><Trophy className="w-3 h-3" /> {school.championsCount}</span>
                      <span className="flex items-center gap-0.5 text-slate-500"><Medal className="w-3 h-3" /> {school.firstRunnerUpCount}</span>
                      <span className="flex items-center gap-0.5 text-amber-800"><Medal className="w-3 h-3" /> {school.secondRunnerUpCount}</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground"><Ticket className="w-3 h-3" /> {school.participationCount}</span>
                      {school.specialAwardsCount > 0 && (
                        <span className="flex items-center gap-0.5 text-primary"><Sparkles className="w-3 h-3" /> +{school.specialAwardsPoints} pts</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Tabulation Matrix Card */}
      <Card className="rounded-[2rem] border-2 border-border/80 shadow-2xl overflow-hidden bg-card w-full">
        <CardHeader className="pb-4 border-b border-border/80 bg-secondary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-primary" /> Consolidated Overall Point Matrix ({leaderboard.length} Participating Schools)
              </CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">
                Tabulation Basis: Champion = 10 pts, 1st Runner Up = 7 pts, 2nd Runner Up = 4 pts, Participation = 1 pt (automatic for registered schools), Special Awards = +2 pts each.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search school name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 rounded-xl bg-background border-border/80 text-xs font-medium"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-secondary text-muted-foreground font-black uppercase tracking-wider text-[10px]">
                  <th className="p-3 sticky left-0 z-30 bg-secondary w-[64px] min-w-[64px] max-w-[64px] text-center border-r border-border/60">
                    Rank
                  </th>
                  <th className="p-3 sticky left-[64px] z-30 bg-secondary min-w-[220px] max-w-[300px] border-r-2 border-border/80 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.12)]">
                    School Institution
                  </th>
                  {events.map((ev) => (
                    <th key={ev.id} className="p-2.5 text-center min-w-[110px] max-w-[130px] border-l border-border/40">
                      <div className="font-extrabold text-foreground line-clamp-1" title={ev.title}>
                        {ev.title}
                      </div>
                      <div className="text-[9px] font-medium text-muted-foreground capitalize">
                        {ev.subcategory || ev.category || "Event"}
                      </div>
                    </th>
                  ))}
                  <th className="p-2.5 text-center bg-amber-500/10 text-amber-700 dark:text-amber-300 border-l border-border/60 min-w-[50px] font-black">
                    <Trophy className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    Gold
                  </th>
                  <th className="p-2.5 text-center bg-slate-500/10 text-slate-700 dark:text-slate-300 min-w-[50px] font-black">
                    <Medal className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    Silver
                  </th>
                  <th className="p-2.5 text-center bg-amber-800/10 text-amber-900 dark:text-amber-200 min-w-[50px] font-black">
                    <Medal className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    Bronze
                  </th>
                  <th className="p-2.5 text-center bg-secondary/80 min-w-[50px] font-black">
                    <Ticket className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    Parts
                  </th>
                  <th className="p-2.5 text-center bg-primary/10 text-primary min-w-[65px] font-black border-l border-border/60">
                    <Sparkles className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    Special (+2)
                  </th>
                  <th className="p-3 pr-4 text-center bg-primary text-white sticky right-0 z-20 min-w-[85px] font-black shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    TOTAL PTS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={events.length + 8} className="p-8 text-center text-muted-foreground font-semibold">
                      No participating schools found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((row) => {
                    const isChampion = row.rank === 1 && row.totalPoints > 0;
                    const isSecond = row.rank === 2 && row.totalPoints > 0;
                    const isThird = row.rank === 3 && row.totalPoints > 0;
                    const isTied = (rankCounts[row.rank] || 0) > 1 && row.totalPoints > 0;

                    let rowBg = "hover:bg-muted/40 transition-colors";
                    let frozenCellBg = "bg-card";
                    if (isChampion) {
                      rowBg = "bg-amber-500/5 hover:bg-amber-500/10 font-medium";
                      frozenCellBg = "bg-amber-50 dark:bg-amber-950/40";
                    } else if (isSecond) {
                      rowBg = "bg-slate-500/5 hover:bg-slate-500/10";
                      frozenCellBg = "bg-slate-100 dark:bg-slate-900/60";
                    } else if (isThird) {
                      rowBg = "bg-amber-800/5 hover:bg-amber-800/10";
                      frozenCellBg = "bg-amber-100/50 dark:bg-amber-950/30";
                    }

                    return (
                      <tr key={row.schoolName} className={rowBg}>
                        {/* Rank (Frozen Column 1) */}
                        <td className={`p-3 sticky left-0 z-20 ${frozenCellBg} w-[64px] min-w-[64px] max-w-[64px] text-center font-mono font-black border-r border-border/60`}>
                          {isChampion ? (
                            <Badge className="bg-amber-500 text-white font-black text-xs px-2 py-0.5 shadow-sm">
                              {isTied ? "T-1st" : "1st"}
                            </Badge>
                          ) : isSecond ? (
                            <Badge className="bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-black text-xs px-2 py-0.5">
                              {isTied ? "T-2nd" : "2nd"}
                            </Badge>
                          ) : isThird ? (
                            <Badge className="bg-amber-800 dark:bg-amber-900 text-white font-black text-xs px-2 py-0.5">
                              {isTied ? "T-3rd" : "3rd"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              {isTied ? `T-${row.rank}` : row.rank}
                            </span>
                          )}
                        </td>

                        {/* School Name (Frozen Column 2) */}
                        <td className={`p-3 sticky left-[64px] z-20 ${frozenCellBg} min-w-[220px] max-w-[300px] font-bold text-foreground border-r-2 border-border/80 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.12)]`}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <div className="line-clamp-1">{row.schoolName}</div>
                              <div className="text-[10px] font-medium text-muted-foreground">
                                {row.schoolAbbr}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Per-Event Scores */}
                        {events.map((ev) => {
                          const evScore = row.eventScores[ev.id];
                          if (!evScore || evScore.points === 0) {
                            return (
                              <td key={ev.id} className="p-2.5 text-center text-muted-foreground/30 font-mono text-[11px] border-l border-border/30">
                                -
                              </td>
                            );
                          }

                          let cellBadge = "bg-secondary text-muted-foreground border-border/40";
                          let labelText = String(evScore.points);

                          if (evScore.points > 10) {
                            cellBadge = "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black shadow-md border-amber-300";
                          } else if (evScore.points === 10) {
                            cellBadge = "bg-amber-500 text-white font-black shadow-sm";
                          } else if (evScore.points === 7) {
                            cellBadge = "bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold";
                          } else if (evScore.points === 4) {
                            cellBadge = "bg-amber-800/80 text-white font-bold";
                          } else if (evScore.points === 1) {
                            cellBadge = "bg-secondary text-muted-foreground border-border/40";
                          }

                          return (
                            <td key={ev.id} className="p-2 text-center border-l border-border/30">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-mono border ${cellBadge}`}
                                title={`${ev.title}: ${evScore.label} (${evScore.points} pts)`}
                              >
                                {labelText}
                              </span>
                            </td>
                          );
                        })}

                        {/* Gold / Champion count */}
                        <td className="p-2 text-center font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/5 border-l border-border/60">
                          {row.championsCount > 0 ? row.championsCount : "-"}
                        </td>

                        {/* Silver / 1st Runner Up count */}
                        <td className="p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-500/5">
                          {row.firstRunnerUpCount > 0 ? row.firstRunnerUpCount : "-"}
                        </td>

                        {/* Bronze / 2nd Runner Up count */}
                        <td className="p-2 text-center font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-800/5">
                          {row.secondRunnerUpCount > 0 ? row.secondRunnerUpCount : "-"}
                        </td>

                        {/* Participation count */}
                        <td className="p-2 text-center font-mono text-muted-foreground bg-secondary/30">
                          {row.participationCount > 0 ? row.participationCount : "-"}
                        </td>

                        {/* Special Awards (+2 pts each) */}
                        <td className="p-2 text-center font-mono font-bold text-primary bg-primary/5 border-l border-border/60">
                          {row.specialAwardsCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px]">
                              <Sparkles className="w-2.5 h-2.5" /> +{row.specialAwardsPoints}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Total Points */}
                        <td className="p-3 pr-4 text-center font-mono font-black text-sm text-primary sticky right-0 z-10 bg-card border-l border-primary/20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {row.totalPoints}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Special Awards Summary Section */}
      <Card className="rounded-[2rem] border-2 border-border/80 shadow-xl overflow-hidden bg-card">
        <CardHeader className="pb-3 border-b border-border/80 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-black tracking-tight text-foreground uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Special Awards & Recognitions
              </CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">
                Each special award contributes +2 points directly to the winning school's overall tabulation points.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-bold text-xs">
              {specialAwards.filter((a) => a.winnerName || a.schoolName).length} / {specialAwards.length} Awarded
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {specialAwards.map((a, idx) => {
              const hasWinner = Boolean((a.winnerName && a.winnerName.trim()) || (a.schoolName && a.schoolName.trim()));

              return (
                <div
                  key={a.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    hasWinner
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-secondary/20 border-border/50 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/40">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold border-border/60">
                      {a.category}
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-primary flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" /> +2 pts
                    </span>
                  </div>

                  <div className="pt-2 space-y-1">
                    <h5 className="text-xs font-black text-foreground line-clamp-1">{a.awardTitle}</h5>
                    {hasWinner ? (
                      <div className="space-y-0.5">
                        {a.awardType === "INDIVIDUAL" && a.winnerName && (
                          <p className="text-xs font-bold text-primary line-clamp-1">{a.winnerName}</p>
                        )}
                        <p className="text-[11px] font-bold text-foreground flex items-center gap-1 line-clamp-1">
                          <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                          {a.schoolName || "No School Selected"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-muted-foreground italic">
                        Not yet determined
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

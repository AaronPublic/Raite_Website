"use client";

import { useState, useEffect, useMemo } from "react";
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
  Lock, 
  Unlock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  Ticket, 
  ArrowLeft,
  Building2,
  AlertCircle,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface SecretOverallRankingsClientProps {
  events: TabulationEventInfo[];
  schools: string[];
  leaderboard: SchoolTabulationRow[];
  specialAwards: SpecialAwardEntry[];
}

const SECRET_PASSWORD = "RAITE2026-RANKINGS";
const STORAGE_KEY = "raite_overall_rankings_unlocked";

export default function SecretOverallRankingsClient({
  events,
  schools,
  leaderboard,
  specialAwards,
}: SecretOverallRankingsClientProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === SECRET_PASSWORD) {
      setIsUnlocked(true);
      setErrorMsg(null);
      sessionStorage.setItem(STORAGE_KEY, "true");
      toast.success("Security verified! Consolidated overall rankings unlocked.");
    } else {
      setErrorMsg("Incorrect password. Access to overall tabulation ranking denied.");
      toast.error("Invalid password.");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPasswordInput("");
    setErrorMsg(null);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.info("Overall rankings matrix locked.");
  };

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

  if (!mounted) return null;

  // PASSWORD SECURITY GATE SCREEN
  if (!isUnlocked) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/tabulation"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tabulation Setup
          </Link>
        </div>

        <Card className="rounded-[2.5rem] border-2 border-border/80 shadow-2xl bg-card overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent p-6 sm:p-8 border-b border-border/60 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Overall Rankings
            </h2>
            <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
              Restricted Area: Enter the administrator security password to reveal the final official rankings and points matrix.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Security Password
                </label>

                <div className="relative">
                  <Input
                    autoFocus
                    type={showPassword ? "text" : "password"}
                    placeholder="Type password..."
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="h-12 px-4 pr-12 rounded-xl text-sm font-mono font-bold bg-background border-border/80 focus:ring-2 focus:ring-primary shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 pt-1 animate-in fade-in-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Overall Rankings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // UNLOCKED OVERALL RANKING DASHBOARD
  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      {/* Top Header & Security Bar */}
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
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Master Access Granted
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Overall Rankings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/tabulation">
            <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs border-border/80">
              Edit Placements & Awards
            </Button>
          </Link>
          <Button
            onClick={handleLock}
            variant="outline"
            size="sm"
            className="rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground border-border/80"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" /> Lock Matrix
          </Button>
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
                <tr className="border-b-2 border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-secondary/60">
                  <th className="px-3 py-3 border-r border-border/80 min-w-[75px] text-center">
                    Rank
                  </th>
                  <th className="px-4 py-3 border-r border-border/80 min-w-[200px]">
                    School Institution
                  </th>
                  {events.map((ev) => (
                    <th
                      key={ev.id}
                      className="px-2.5 py-3 border-r border-border/80 text-center min-w-[120px] max-w-[160px]"
                    >
                      <div className="flex flex-col items-center justify-center text-center gap-0.5">
                        <span className="text-[11px] font-black text-foreground whitespace-normal break-words leading-tight">
                          {ev.title}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          {ev.category || "Event"}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-2.5 py-3 border-r border-border/80 text-center min-w-[65px] bg-secondary/80">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gold</span>
                    </div>
                  </th>
                  <th className="px-2.5 py-3 border-r border-border/80 text-center min-w-[65px] bg-secondary/80">
                    <div className="flex items-center justify-center gap-1">
                      <Medal className="w-3.5 h-3.5 text-slate-400" />
                      <span>Silver</span>
                    </div>
                  </th>
                  <th className="px-2.5 py-3 border-r border-border/80 text-center min-w-[65px] bg-secondary/80">
                    <div className="flex items-center justify-center gap-1">
                      <Medal className="w-3.5 h-3.5 text-amber-700" />
                      <span>Bronze</span>
                    </div>
                  </th>
                  <th className="px-2.5 py-3 border-r border-border/80 text-center min-w-[65px] bg-secondary/80">
                    <div className="flex items-center justify-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Parts.</span>
                    </div>
                  </th>
                  <th className="px-2.5 py-3 border-r border-border/80 text-center min-w-[80px] bg-primary/10 text-primary font-black">
                    <div className="flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Special (+2)</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center min-w-[100px] bg-primary/20 text-primary font-black">
                    Total Points
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={events.length + 8} className="text-center py-16 text-muted-foreground">
                      No participating schools found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((row, idx) => {
                    const isGold = row.rank === 1 && row.totalPoints > 0;
                    const isSilver = row.rank === 2 && row.totalPoints > 0;
                    const isBronze = row.rank === 3 && row.totalPoints > 0;
                    const isTied = (rankCounts[row.rank] || 0) > 1;

                    return (
                      <tr
                        key={row.schoolName}
                        className={`transition-colors font-medium ${
                          isGold
                            ? "bg-amber-500/10 hover:bg-amber-500/15"
                            : isSilver
                            ? "bg-slate-200/40 dark:bg-slate-800/30 hover:bg-slate-200/60"
                            : isBronze
                            ? "bg-amber-900/10 hover:bg-amber-900/15"
                            : idx % 2 === 0
                            ? "bg-card"
                            : "bg-secondary/[0.15]"
                        } hover:bg-primary/[0.04]`}
                      >
                        {/* Rank with Tie support */}
                        <td className="px-3 py-3 border-r border-border/80 text-center align-middle">
                          {isGold ? (
                            <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 shadow-sm inline-flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> {isTied ? "T-1st" : "1st"}
                            </Badge>
                          ) : isSilver ? (
                            <Badge className="bg-slate-400 dark:bg-slate-600 text-white font-black text-xs px-2.5 py-0.5 shadow-sm inline-flex items-center gap-1">
                              <Medal className="w-3 h-3" /> {isTied ? "T-2nd" : "2nd"}
                            </Badge>
                          ) : isBronze ? (
                            <Badge className="bg-amber-700 text-white font-black text-xs px-2.5 py-0.5 shadow-sm inline-flex items-center gap-1">
                              <Medal className="w-3 h-3" /> {isTied ? "T-3rd" : "3rd"}
                            </Badge>
                          ) : (
                            <span className="font-mono font-bold text-xs text-muted-foreground">
                              {isTied ? `T-#${row.rank}` : `#${row.rank}`}
                            </span>
                          )}
                        </td>

                        {/* School Name */}
                        <td className="px-4 py-3 border-r border-border/80 align-middle">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-xs">{row.schoolName}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground">{row.schoolAbbr}</span>
                          </div>
                        </td>

                        {/* Event Cells */}
                        {events.map((ev) => {
                          const cell = row.eventScores[ev.id] || { points: 0, label: "None" };

                          return (
                            <td
                              key={ev.id}
                              className="px-2.5 py-3 border-r border-border/80 text-center align-middle font-mono text-xs"
                            >
                              {cell.label === "Champion" ? (
                                <Badge className="bg-amber-500 text-white font-black text-[11px] px-2 py-0.5 shadow-sm inline-flex items-center gap-1">
                                  <Trophy className="w-2.5 h-2.5" /> +10
                                </Badge>
                              ) : cell.label === "1st Runner Up" ? (
                                <Badge className="bg-slate-400 dark:bg-slate-600 text-white font-black text-[11px] px-2 py-0.5 shadow-sm inline-flex items-center gap-1">
                                  <Medal className="w-2.5 h-2.5" /> +7
                                </Badge>
                              ) : cell.label === "2nd Runner Up" ? (
                                <Badge className="bg-amber-700 text-white font-black text-[11px] px-2 py-0.5 shadow-sm inline-flex items-center gap-1">
                                  <Medal className="w-2.5 h-2.5" /> +4
                                </Badge>
                              ) : cell.label === "Participation" ? (
                                <Badge variant="outline" className="bg-secondary/60 text-muted-foreground font-bold text-[10px] px-1.5 py-0.5 inline-flex items-center gap-1">
                                  <Ticket className="w-2.5 h-2.5" /> +1 pt
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/30 font-sans">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary Counts */}
                        <td className="px-2.5 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-amber-600">
                          {row.championsCount}
                        </td>
                        <td className="px-2.5 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-slate-500">
                          {row.firstRunnerUpCount}
                        </td>
                        <td className="px-2.5 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-amber-800">
                          {row.secondRunnerUpCount}
                        </td>
                        <td className="px-2.5 py-3 border-r border-border/80 text-center align-middle font-mono text-muted-foreground">
                          {row.participationCount}
                        </td>

                        {/* Special Awards (+2 pts each) */}
                        <td className="px-2.5 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-primary bg-primary/[0.03]">
                          {row.specialAwardsCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 font-black text-primary">
                              +{row.specialAwardsPoints} <span className="text-[9px] font-normal text-muted-foreground">({row.specialAwardsCount})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 font-normal">0</span>
                          )}
                        </td>

                        {/* Total Points */}
                        <td className="px-4 py-3 text-center align-middle bg-primary/10 font-black font-mono text-sm text-primary">
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
    </div>
  );
}

"use client";

import { useState, useTransition, useMemo } from "react";
import { 
  TabulationEventInfo, 
  SchoolTabulationRow, 
  SpecialAwardEntry, 
  ParticipantOption,
  saveEventPlacements, 
  saveSpecialAwards 
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
  Save, 
  Loader2, 
  Search, 
  Award, 
  Gamepad2, 
  Film, 
  Check, 
  Calculator,
  UserCheck,
  Building2,
  FileSpreadsheet,
  Star
} from "lucide-react";
import { toast } from "sonner";

interface TabulationClientProps {
  initialEvents: TabulationEventInfo[];
  initialSchools: string[];
  initialLeaderboard: SchoolTabulationRow[];
  initialSpecialAwards: SpecialAwardEntry[];
  participantsList: ParticipantOption[];
}

const DEFAULT_SPECIAL_AWARDS = [
  { category: "E-Games", awardTitle: "Mobile Legends MVP Award", awardType: "INDIVIDUAL" as const },
  { category: "E-Games", awardTitle: "Valorant MVP Award", awardType: "INDIVIDUAL" as const },
  { category: "Micro Short Film", awardTitle: "Best Screenplay", awardType: "SCHOOL" as const },
  { category: "Micro Short Film", awardTitle: "Best Actor", awardType: "INDIVIDUAL" as const },
  { category: "Micro Short Film", awardTitle: "Best Actress", awardType: "INDIVIDUAL" as const },
  { category: "Micro Short Film", awardTitle: "Best Editing", awardType: "SCHOOL" as const },
  { category: "Micro Short Film", awardTitle: "Best Social Impact Film", awardType: "SCHOOL" as const },
  { category: "Micro Short Film", awardTitle: "Best Visual Effects", awardType: "SCHOOL" as const },
  { category: "Micro Short Film", awardTitle: "Social Media Choice Award", awardType: "SCHOOL" as const },
];

export default function TabulationClient({
  initialEvents,
  initialSchools,
  initialLeaderboard,
  initialSpecialAwards,
  participantsList,
}: TabulationClientProps) {
  const [activeTab, setActiveTab] = useState<"tabulation" | "placements" | "awards">("tabulation");
  const [events, setEvents] = useState<TabulationEventInfo[]>(initialEvents);
  const [schools] = useState<string[]>(initialSchools);
  const [leaderboard, setLeaderboard] = useState<SchoolTabulationRow[]>(initialLeaderboard);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Local state for placements
  const [placementsState, setPlacementsState] = useState<
    Record<string, { championSchool: string; firstRunnerUp: string; secondRunnerUp: string }>
  >(() => {
    const map: Record<string, { championSchool: string; firstRunnerUp: string; secondRunnerUp: string }> = {};
    initialEvents.forEach((ev) => {
      map[ev.id] = {
        championSchool: ev.placement?.championSchool || "",
        firstRunnerUp: ev.placement?.firstRunnerUp || "",
        secondRunnerUp: ev.placement?.secondRunnerUp || "",
      };
    });
    return map;
  });

  // Local state for special awards
  const [specialAwardsState, setSpecialAwardsState] = useState<
    Record<string, { winnerName: string; schoolName: string }>
  >(() => {
    const map: Record<string, { winnerName: string; schoolName: string }> = {};
    DEFAULT_SPECIAL_AWARDS.forEach((def) => {
      const found = initialSpecialAwards.find((a) => a.awardTitle === def.awardTitle);
      map[def.awardTitle] = {
        winnerName: found?.winnerName || "",
        schoolName: found?.schoolName || "",
      };
    });
    return map;
  });

  const [isPlacementsDirty, setIsPlacementsDirty] = useState(false);
  const [isAwardsDirty, setIsAwardsDirty] = useState(false);

  // Recalculate leaderboard dynamically based on local placementsState
  const liveLeaderboard = useMemo(() => {
    const rows = schools.map((schoolName) => {
      const eventScores: SchoolTabulationRow["eventScores"] = {};
      let totalPoints = 0;
      let championsCount = 0;
      let firstRunnerUpCount = 0;
      let secondRunnerUpCount = 0;
      let participationCount = 0;

      events.forEach((ev) => {
        const participated = ev.participatingSchools.includes(schoolName);
        const p = placementsState[ev.id];

        if (p?.championSchool === schoolName) {
          eventScores[ev.id] = { points: 10, label: "Champion" };
          totalPoints += 10;
          championsCount++;
        } else if (p?.firstRunnerUp === schoolName) {
          eventScores[ev.id] = { points: 7, label: "1st Runner Up" };
          totalPoints += 7;
          firstRunnerUpCount++;
        } else if (p?.secondRunnerUp === schoolName) {
          eventScores[ev.id] = { points: 4, label: "2nd Runner Up" };
          totalPoints += 4;
          secondRunnerUpCount++;
        } else if (participated) {
          eventScores[ev.id] = { points: 1, label: "Participation" };
          totalPoints += 1;
          participationCount++;
        } else {
          eventScores[ev.id] = { points: 0, label: "None" };
        }
      });

      const existingRow = leaderboard.find((r) => r.schoolName === schoolName);

      return {
        schoolName,
        schoolAbbr: existingRow?.schoolAbbr || schoolName,
        eventScores,
        totalPoints,
        championsCount,
        firstRunnerUpCount,
        secondRunnerUpCount,
        participationCount,
        rank: 0,
      };
    });

    // Sort by Total Points descending, Champions count, 1st Runner Up count
    rows.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.championsCount !== a.championsCount) return b.championsCount - a.championsCount;
      if (b.firstRunnerUpCount !== a.firstRunnerUpCount) return b.firstRunnerUpCount - a.firstRunnerUpCount;
      if (b.secondRunnerUpCount !== a.secondRunnerUpCount) return b.secondRunnerUpCount - a.secondRunnerUpCount;
      return a.schoolName.localeCompare(b.schoolName);
    });

    // Assign dense ranks
    rows.forEach((row, idx) => {
      if (idx > 0) {
        const prev = rows[idx - 1];
        if (
          row.totalPoints === prev.totalPoints &&
          row.championsCount === prev.championsCount &&
          row.firstRunnerUpCount === prev.firstRunnerUpCount &&
          row.secondRunnerUpCount === prev.secondRunnerUpCount
        ) {
          row.rank = prev.rank;
        } else {
          row.rank = idx + 1;
        }
      } else {
        row.rank = 1;
      }
    });

    return rows;
  }, [schools, events, placementsState, leaderboard]);

  const filteredLeaderboard = useMemo(() => {
    return liveLeaderboard.filter((r) =>
      r.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.schoolAbbr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [liveLeaderboard, searchTerm]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) =>
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.category && ev.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [events, searchTerm]);

  // Top 3 Podium
  const podium = useMemo(() => {
    return {
      first: liveLeaderboard.find((r) => r.rank === 1 && r.totalPoints > 0) || null,
      second: liveLeaderboard.find((r) => r.rank === 2 && r.totalPoints > 0) || null,
      third: liveLeaderboard.find((r) => r.rank === 3 && r.totalPoints > 0) || null,
    };
  }, [liveLeaderboard]);

  const handlePlacementChange = (
    eventId: string,
    field: "championSchool" | "firstRunnerUp" | "secondRunnerUp",
    value: string
  ) => {
    setPlacementsState((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || { championSchool: "", firstRunnerUp: "", secondRunnerUp: "" }),
        [field]: value,
      },
    }));
    setIsPlacementsDirty(true);
  };

  const handleSavePlacements = () => {
    startTransition(async () => {
      const payload = Object.entries(placementsState).map(([eventId, p]) => ({
        eventId,
        championSchool: p.championSchool || null,
        firstRunnerUp: p.firstRunnerUp || null,
        secondRunnerUp: p.secondRunnerUp || null,
      }));

      const res = await saveEventPlacements(payload);
      if (res.success) {
        toast.success("Competition winners & placements saved successfully!");
        setIsPlacementsDirty(false);
        setLeaderboard(liveLeaderboard);
      } else {
        toast.error(res.error || "Failed to save placements");
      }
    });
  };

  const handleAwardChange = (awardTitle: string, field: "winnerName" | "schoolName", value: string) => {
    setSpecialAwardsState((prev) => ({
      ...prev,
      [awardTitle]: {
        ...(prev[awardTitle] || { winnerName: "", schoolName: "" }),
        [field]: value,
      },
    }));
    setIsAwardsDirty(true);
  };

  const handleSaveAwards = () => {
    startTransition(async () => {
      const payload = DEFAULT_SPECIAL_AWARDS.map((def) => {
        const state = specialAwardsState[def.awardTitle] || { winnerName: "", schoolName: "" };
        return {
          awardTitle: def.awardTitle,
          category: def.category,
          awardType: def.awardType,
          winnerName: state.winnerName,
          schoolName: state.schoolName,
        };
      });

      const res = await saveSpecialAwards(payload);
      if (res.success) {
        toast.success("Special awards updated successfully!");
        setIsAwardsDirty(false);
      } else {
        toast.error(res.error || "Failed to save special awards");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto p-1 bg-secondary/50 rounded-2xl border border-border/60">
          <button
            onClick={() => setActiveTab("tabulation")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "tabulation"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Overall Tabulation Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("placements")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "placements"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Competition Placements</span>
            {isPlacementsDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("awards")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "awards"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Special Awards</span>
            {isAwardsDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Global Save Indicator / Action */}
        <div className="flex items-center gap-3">
          {activeTab === "placements" && (
            <Button
              onClick={handleSavePlacements}
              disabled={isPending}
              className={`rounded-xl font-bold text-xs h-10 px-5 shadow-md ${
                isPlacementsDirty
                  ? "bg-primary hover:bg-primary/90 text-white animate-pulse"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/80"
              }`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isPlacementsDirty ? (
                <Save className="w-4 h-4 mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2 text-emerald-500" />
              )}
              {isPlacementsDirty ? "Save Placements" : "Placements Up-to-Date"}
            </Button>
          )}

          {activeTab === "awards" && (
            <Button
              onClick={handleSaveAwards}
              disabled={isPending}
              className={`rounded-xl font-bold text-xs h-10 px-5 shadow-md ${
                isAwardsDirty
                  ? "bg-primary hover:bg-primary/90 text-white animate-pulse"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border/80"
              }`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isAwardsDirty ? (
                <Save className="w-4 h-4 mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2 text-emerald-500" />
              )}
              {isAwardsDirty ? "Save Special Awards" : "Awards Up-to-Date"}
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: OVERALL TABULATION MATRIX */}
      {activeTab === "tabulation" && (
        <div className="space-y-8">
          {/* Podium Highlight Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 2nd Place Silver */}
            <Card className="rounded-3xl border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-100/60 to-transparent dark:from-slate-900/40 shadow-lg relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 font-black text-[10px] uppercase tracking-wider">
                    2nd Overall (1st Runner Up)
                  </Badge>
                  <Medal className="w-7 h-7 text-slate-400" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight text-foreground line-clamp-1 mt-2">
                  {podium.second?.schoolName || "TBD"}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-muted-foreground">
                  {podium.second?.schoolAbbr || "Pending Placements"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 flex items-baseline justify-between border-t border-border/40">
                <div className="text-xs font-bold text-muted-foreground">
                  🥇 {podium.second?.championsCount || 0} | 🥈 {podium.second?.firstRunnerUpCount || 0} | 🥉 {podium.second?.secondRunnerUpCount || 0}
                </div>
                <div className="text-2xl font-black font-mono text-slate-700 dark:text-slate-300">
                  {podium.second?.totalPoints || 0} <span className="text-xs font-bold text-muted-foreground">pts</span>
                </div>
              </CardContent>
            </Card>

            {/* 1st Place Champion Gold */}
            <Card className="rounded-3xl border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent shadow-xl relative overflow-hidden md:-translate-y-2">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider shadow-sm">
                    🏆 Overall Champion
                  </Badge>
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-foreground line-clamp-1 mt-2">
                  {podium.first?.schoolName || "TBD"}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {podium.first?.schoolAbbr || "Pending Placements"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 flex items-baseline justify-between border-t border-amber-200 dark:border-amber-900/50">
                <div className="text-xs font-bold text-muted-foreground">
                  🥇 {podium.first?.championsCount || 0} | 🥈 {podium.first?.firstRunnerUpCount || 0} | 🥉 {podium.first?.secondRunnerUpCount || 0}
                </div>
                <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {podium.first?.totalPoints || 0} <span className="text-xs font-bold text-muted-foreground">pts</span>
                </div>
              </CardContent>
            </Card>

            {/* 3rd Place Bronze */}
            <Card className="rounded-3xl border-2 border-amber-800/40 dark:border-amber-900/60 bg-gradient-to-b from-amber-950/10 to-transparent shadow-lg relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 font-black text-[10px] uppercase tracking-wider">
                    3rd Overall (2nd Runner Up)
                  </Badge>
                  <Medal className="w-7 h-7 text-amber-700 dark:text-amber-500" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight text-foreground line-clamp-1 mt-2">
                  {podium.third?.schoolName || "TBD"}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-muted-foreground">
                  {podium.third?.schoolAbbr || "Pending Placements"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 flex items-baseline justify-between border-t border-border/40">
                <div className="text-xs font-bold text-muted-foreground">
                  🥇 {podium.third?.championsCount || 0} | 🥈 {podium.third?.firstRunnerUpCount || 0} | 🥉 {podium.third?.secondRunnerUpCount || 0}
                </div>
                <div className="text-2xl font-black font-mono text-amber-800 dark:text-amber-500">
                  {podium.third?.totalPoints || 0} <span className="text-xs font-bold text-muted-foreground">pts</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabulation Matrix Card */}
          <Card className="rounded-[2rem] border-2 border-border/80 shadow-2xl overflow-hidden bg-card">
            <CardHeader className="pb-4 border-b border-border/80 bg-secondary/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black tracking-tight text-foreground uppercase flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-primary" /> Consolidated Overall Point Matrix
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground">
                    Tabulation Basis: Champion = 10 pts, 1st Runner Up = 7 pts, 2nd Runner Up = 4 pts, Participation = 1 pt (automatic for schools with entries).
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-secondary/60">
                      <th className="px-4 py-3 border-r border-border/80 min-w-[70px] text-center">
                        Rank
                      </th>
                      <th className="px-4 py-3 border-r border-border/80 min-w-[220px]">
                        School Institution
                      </th>
                      {events.map((ev) => (
                        <th
                          key={ev.id}
                          className="px-3 py-3 border-r border-border/80 text-center min-w-[130px] max-w-[170px]"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-black text-foreground line-clamp-2 leading-tight">
                              {ev.title}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground mt-0.5">
                              {ev.category || "Event"}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 border-r border-border/80 text-center min-w-[80px] bg-secondary/80">
                        🥇 Gold
                      </th>
                      <th className="px-3 py-3 border-r border-border/80 text-center min-w-[80px] bg-secondary/80">
                        🥈 Silver
                      </th>
                      <th className="px-3 py-3 border-r border-border/80 text-center min-w-[80px] bg-secondary/80">
                        🥉 Bronze
                      </th>
                      <th className="px-3 py-3 border-r border-border/80 text-center min-w-[80px] bg-secondary/80">
                        🎟️ Parts.
                      </th>
                      <th className="px-4 py-3 text-center min-w-[100px] bg-primary/10 text-primary font-black">
                        Total Points
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {filteredLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={events.length + 7} className="text-center py-16 text-muted-foreground">
                          No schools found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredLeaderboard.map((row, idx) => {
                        const isGold = row.rank === 1 && row.totalPoints > 0;
                        const isSilver = row.rank === 2 && row.totalPoints > 0;
                        const isBronze = row.rank === 3 && row.totalPoints > 0;

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
                            {/* Rank */}
                            <td className="px-4 py-3 border-r border-border/80 text-center align-middle">
                              {isGold ? (
                                <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 shadow-sm">
                                  1st 🏆
                                </Badge>
                              ) : isSilver ? (
                                <Badge className="bg-slate-400 dark:bg-slate-600 text-white font-black text-xs px-2.5 py-0.5 shadow-sm">
                                  2nd 🥈
                                </Badge>
                              ) : isBronze ? (
                                <Badge className="bg-amber-700 text-white font-black text-xs px-2.5 py-0.5 shadow-sm">
                                  3rd 🥉
                                </Badge>
                              ) : (
                                <span className="font-mono font-bold text-xs text-muted-foreground">
                                  #{row.rank}
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
                                  className="px-3 py-3 border-r border-border/80 text-center align-middle font-mono text-xs"
                                >
                                  {cell.label === "Champion" ? (
                                    <Badge className="bg-amber-500 text-white font-black text-[11px] px-2 py-0.5 shadow-sm">
                                      +10 🥇
                                    </Badge>
                                  ) : cell.label === "1st Runner Up" ? (
                                    <Badge className="bg-slate-400 dark:bg-slate-600 text-white font-black text-[11px] px-2 py-0.5 shadow-sm">
                                      +7 🥈
                                    </Badge>
                                  ) : cell.label === "2nd Runner Up" ? (
                                    <Badge className="bg-amber-700 text-white font-black text-[11px] px-2 py-0.5 shadow-sm">
                                      +4 🥉
                                    </Badge>
                                  ) : cell.label === "Participation" ? (
                                    <Badge variant="outline" className="bg-secondary/60 text-muted-foreground font-bold text-[10px] px-1.5 py-0.5">
                                      +1 pt
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground/30 font-sans">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Summary Counts */}
                            <td className="px-3 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-amber-600">
                              {row.championsCount}
                            </td>
                            <td className="px-3 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-slate-500">
                              {row.firstRunnerUpCount}
                            </td>
                            <td className="px-3 py-3 border-r border-border/80 text-center align-middle font-mono font-bold text-amber-800">
                              {row.secondRunnerUpCount}
                            </td>
                            <td className="px-3 py-3 border-r border-border/80 text-center align-middle font-mono text-muted-foreground">
                              {row.participationCount}
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
      )}

      {/* TAB 2: COMPETITION PLACEMENTS FORM */}
      {activeTab === "placements" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/40 p-4 rounded-2xl border border-border/80">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" /> Assign Competition Champions & Runners-Up
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Select the winning schools for each event. The overall tabulation matrix will immediately update with 10 pts (Champion), 7 pts (1st Runner Up), and 4 pts (2nd Runner Up).
              </p>
            </div>

            <Button
              onClick={handleSavePlacements}
              disabled={isPending}
              className="rounded-xl font-bold bg-primary text-white shadow-md shadow-primary/20 shrink-0"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Placements
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((ev) => {
              const currentPlacement = placementsState[ev.id] || {
                championSchool: "",
                firstRunnerUp: "",
                secondRunnerUp: "",
              };

              return (
                <Card
                  key={ev.id}
                  className="rounded-3xl border border-border/80 shadow-md bg-card overflow-hidden transition-all hover:border-primary/40"
                >
                  <CardHeader className="pb-3 bg-secondary/20 border-b border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase"
                      >
                        {ev.category || "Competition"}
                      </Badge>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {ev.participatingSchools.length} Participating Schools
                      </span>
                    </div>
                    <CardTitle className="text-base font-black text-foreground tracking-tight mt-1">
                      {ev.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Champion Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" /> Champion (10 Points)
                        </label>
                        {currentPlacement.championSchool && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            10 pts
                          </span>
                        )}
                      </div>
                      <select
                        value={currentPlacement.championSchool}
                        onChange={(e) => handlePlacementChange(ev.id, "championSchool", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value="">-- Select Champion School --</option>
                        {schools.map((school) => {
                          const isParticipating = ev.participatingSchools.includes(school);
                          return (
                            <option key={school} value={school}>
                              {school} {isParticipating ? "(Participated)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* 1st Runner Up Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Medal className="w-3.5 h-3.5" /> 1st Runner Up (7 Points)
                        </label>
                        {currentPlacement.firstRunnerUp && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-400/10 px-2 py-0.5 rounded-md">
                            7 pts
                          </span>
                        )}
                      </div>
                      <select
                        value={currentPlacement.firstRunnerUp}
                        onChange={(e) => handlePlacementChange(ev.id, "firstRunnerUp", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value="">-- Select 1st Runner Up School --</option>
                        {schools.map((school) => {
                          const isParticipating = ev.participatingSchools.includes(school);
                          return (
                            <option key={school} value={school}>
                              {school} {isParticipating ? "(Participated)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* 2nd Runner Up Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-amber-800 dark:text-amber-500 flex items-center gap-1.5">
                          <Medal className="w-3.5 h-3.5" /> 2nd Runner Up (4 Points)
                        </label>
                        {currentPlacement.secondRunnerUp && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-800/10 px-2 py-0.5 rounded-md">
                            4 pts
                          </span>
                        )}
                      </div>
                      <select
                        value={currentPlacement.secondRunnerUp}
                        onChange={(e) => handlePlacementChange(ev.id, "secondRunnerUp", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:ring-1 focus:ring-primary shadow-sm"
                      >
                        <option value="">-- Select 2nd Runner Up School --</option>
                        {schools.map((school) => {
                          const isParticipating = ev.participatingSchools.includes(school);
                          return (
                            <option key={school} value={school}>
                              {school} {isParticipating ? "(Participated)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SPECIAL AWARDS FORM */}
      {activeTab === "awards" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/40 p-4 rounded-2xl border border-border/80">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Special Awards Configuration
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Select or type the award recipient and associated school for individual MVPs and Micro Short Film special citations.
              </p>
            </div>

            <Button
              onClick={handleSaveAwards}
              disabled={isPending}
              className="rounded-xl font-bold bg-primary text-white shadow-md shadow-primary/20 shrink-0"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Special Awards
            </Button>
          </div>

          {/* E-Games MVP Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                E-Games MVP Awards
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DEFAULT_SPECIAL_AWARDS.filter((a) => a.category === "E-Games").map((award) => {
                const state = specialAwardsState[award.awardTitle] || { winnerName: "", schoolName: "" };

                return (
                  <Card key={award.awardTitle} className="rounded-3xl border border-border/80 bg-card shadow-md">
                    <CardHeader className="pb-3 bg-purple-50/50 dark:bg-purple-950/20 border-b border-border/60">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-600 text-white font-bold text-[10px]">
                          Individual Award
                        </Badge>
                        <Star className="w-4 h-4 text-purple-500" />
                      </div>
                      <CardTitle className="text-base font-black text-foreground mt-1">
                        {award.awardTitle}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-primary" /> MVP Recipient Name
                        </label>
                        <Input
                          placeholder="e.g. Juan Dela Cruz / In-Game Name"
                          value={state.winnerName}
                          onChange={(e) => handleAwardChange(award.awardTitle, "winnerName", e.target.value)}
                          className="h-10 rounded-xl bg-background border-border text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" /> Winning School
                        </label>
                        <select
                          value={state.schoolName}
                          onChange={(e) => handleAwardChange(award.awardTitle, "schoolName", e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:ring-1 focus:ring-primary shadow-sm"
                        >
                          <option value="">-- Select School --</option>
                          {schools.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Micro Short Film Special Awards Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Film className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                Special Awards for Micro Short Film
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DEFAULT_SPECIAL_AWARDS.filter((a) => a.category === "Micro Short Film").map((award) => {
                const state = specialAwardsState[award.awardTitle] || { winnerName: "", schoolName: "" };
                const isIndividual = award.awardType === "INDIVIDUAL";

                return (
                  <Card key={award.awardTitle} className="rounded-3xl border border-border/80 bg-card shadow-md flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-border/60">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={isIndividual ? "default" : "secondary"}
                            className="font-bold text-[10px]"
                          >
                            {isIndividual ? "Individual + School" : "School Citation"}
                          </Badge>
                          <Award className="w-4 h-4 text-blue-500" />
                        </div>
                        <CardTitle className="text-base font-black text-foreground mt-1">
                          {award.awardTitle}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-3">
                        {isIndividual && (
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-primary" /> Actor / Actress Name
                            </label>
                            <Input
                              placeholder="e.g. Maria Santos"
                              value={state.winnerName}
                              onChange={(e) => handleAwardChange(award.awardTitle, "winnerName", e.target.value)}
                              className="h-10 rounded-xl bg-background border-border text-xs font-bold"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-primary" /> Awarded School
                          </label>
                          <select
                            value={state.schoolName}
                            onChange={(e) => handleAwardChange(award.awardTitle, "schoolName", e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:ring-1 focus:ring-primary shadow-sm"
                          >
                            <option value="">-- Select School --</option>
                            {schools.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

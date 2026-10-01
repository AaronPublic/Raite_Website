"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
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
  Star,
  Ticket,
  Edit3,
  Lock,
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import { generateRAITECompetitionWinnersPDF } from "@/lib/pdf-reports";

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
  { category: "Micro Short Film", awardTitle: "Best Actor", awardType: "SCHOOL" as const },
  { category: "Micro Short Film", awardTitle: "Best Actress", awardType: "SCHOOL" as const },
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
  const [activeTab, setActiveTab] = useState<"placements" | "awards">("placements");
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

  // Recalculate leaderboard dynamically based on local placementsState & specialAwardsState (+2 pts each)
  const liveLeaderboard = useMemo(() => {
    const specialAwardsCountMap: Record<string, number> = {};
    DEFAULT_SPECIAL_AWARDS.forEach((def) => {
      const sName = specialAwardsState[def.awardTitle]?.schoolName;
      if (sName && sName.trim()) {
        specialAwardsCountMap[sName.trim()] = (specialAwardsCountMap[sName.trim()] || 0) + 1;
      }
    });

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

      // Special awards (+2 pts each)
      const specialAwardsCount = specialAwardsCountMap[schoolName] || 0;
      const specialAwardsPoints = specialAwardsCount * 2;
      totalPoints += specialAwardsPoints;

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
        specialAwardsCount,
        specialAwardsPoints,
        rank: 0,
      };
    });

    // Sort by Total Points descending, Champions count, 1st Runner Up count
    rows.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.championsCount !== a.championsCount) return b.championsCount - a.championsCount;
      if (b.firstRunnerUpCount !== a.firstRunnerUpCount) return b.firstRunnerUpCount - a.firstRunnerUpCount;
      if (b.secondRunnerUpCount !== a.secondRunnerUpCount) return b.secondRunnerUpCount - a.secondRunnerUpCount;
      if (b.specialAwardsCount !== a.specialAwardsCount) return b.specialAwardsCount - a.specialAwardsCount;
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
          row.secondRunnerUpCount === prev.secondRunnerUpCount &&
          row.specialAwardsCount === prev.specialAwardsCount
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
  }, [schools, events, placementsState, specialAwardsState, leaderboard]);

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

  const handleExportWinnersPDF = () => {
    try {
      const mergedEvents = events.map((ev) => ({
        ...ev,
        placement: placementsState[ev.id] || ev.placement,
      }));

      const mergedSpecialAwards = DEFAULT_SPECIAL_AWARDS.map((def) => {
        const state = specialAwardsState[def.awardTitle] || { winnerName: "", schoolName: "" };
        return {
          awardTitle: def.awardTitle,
          category: def.category,
          awardType: def.awardType,
          winnerName: state.winnerName,
          schoolName: state.schoolName,
        };
      });

      const champions = liveLeaderboard.filter((r) => r.rank === 1 && r.totalPoints > 0);
      const firstRunnersUp = liveLeaderboard.filter((r) => r.rank === 2 && r.totalPoints > 0);
      const secondRunnersUp = liveLeaderboard.filter((r) => r.rank === 3 && r.totalPoints > 0);

      generateRAITECompetitionWinnersPDF({
        events: mergedEvents,
        specialAwards: mergedSpecialAwards,
        overallPodium: {
          champions,
          firstRunnersUp,
          secondRunnersUp,
        },
      });

      toast.success("Competition winners list exported to PDF successfully!");
    } catch (err: any) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto p-1 bg-secondary/50 rounded-2xl border border-border/60">
          <button
            onClick={() => setActiveTab("placements")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "placements"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>1. Competition Placements</span>
            {isPlacementsDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("awards")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "awards"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. Special Awards</span>
            {isAwardsDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Global Save Indicator / Action & Secret Page Link */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportWinnersPDF}
            variant="outline"
            className="rounded-xl font-bold text-xs h-10 px-4 border-primary/30 hover:bg-primary/10 text-primary shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5" />
            Export Winners PDF
          </Button>

          <Link href="/admin/overall-rankings">
            <Button
              variant="outline"
              className="rounded-xl font-black text-xs h-10 px-4 border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              View Overall Rankings
            </Button>
          </Link>

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
                          Individual MVP Award
                        </Badge>
                        <Star className="w-4 h-4 text-purple-500" />
                      </div>
                      <CardTitle className="text-base font-black text-foreground mt-1">
                        {award.awardTitle}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Search and select the MVP from registered {award.awardTitle.includes("Mobile") ? "Mobile Legends" : "Valorant"} competitors.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-4">
                      <SearchableParticipantPicker
                        awardTitle={award.awardTitle}
                        category={award.category}
                        selectedWinner={state.winnerName}
                        selectedSchool={state.schoolName}
                        participantsList={participantsList}
                        schools={schools}
                        onSelect={(winnerName, schoolName) => {
                          handleAwardChange(award.awardTitle, "winnerName", winnerName);
                          handleAwardChange(award.awardTitle, "schoolName", schoolName);
                        }}
                      />
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

                const microFilmEvent = events.find(
                  (e) => e.title.toLowerCase().includes("micro") || e.title.toLowerCase().includes("short film")
                );

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

                      <CardContent className="pt-4 space-y-4">
                        {isIndividual ? (
                          <SearchableParticipantPicker
                            awardTitle={award.awardTitle}
                            category={award.category}
                            selectedWinner={state.winnerName}
                            selectedSchool={state.schoolName}
                            participantsList={participantsList}
                            schools={schools}
                            onSelect={(winnerName, schoolName) => {
                              handleAwardChange(award.awardTitle, "winnerName", winnerName);
                              handleAwardChange(award.awardTitle, "schoolName", schoolName);
                            }}
                          />
                        ) : (
                          <SearchableSchoolPicker
                            awardTitle={award.awardTitle}
                            selectedSchool={state.schoolName}
                            schools={schools}
                            participatingSchools={microFilmEvent?.participatingSchools}
                            onSelect={(schoolName) => {
                              handleAwardChange(award.awardTitle, "schoolName", schoolName);
                            }}
                          />
                        )}
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

// Searchable Participant Picker Component with filter & search
function SearchableParticipantPicker({
  awardTitle,
  category,
  selectedWinner,
  selectedSchool,
  participantsList,
  schools,
  onSelect,
}: {
  awardTitle: string;
  category: string;
  selectedWinner: string;
  selectedSchool: string;
  participantsList: ParticipantOption[];
  schools: string[];
  onSelect: (winnerName: string, schoolName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"relevant" | "all">("relevant");
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualName, setManualName] = useState(selectedWinner);
  const [manualSchool, setManualSchool] = useState(selectedSchool);

  // Filter participants based on award title & category
  const relevantParticipants = useMemo(() => {
    const lower = awardTitle.toLowerCase();
    if (lower.includes("mobile legends") || lower.includes("ml")) {
      return participantsList.filter(
        (p) =>
          p.eventTitle.toLowerCase().includes("mobile") ||
          p.eventTitle.toLowerCase().includes("legends") ||
          p.eventTitle.toLowerCase().includes("ml")
      );
    }
    if (lower.includes("valorant")) {
      return participantsList.filter((p) => p.eventTitle.toLowerCase().includes("valorant"));
    }
    if (lower.includes("actor") || lower.includes("actress") || category === "Micro Short Film") {
      return participantsList.filter(
        (p) =>
          p.eventTitle.toLowerCase().includes("micro") ||
          p.eventTitle.toLowerCase().includes("short film") ||
          p.eventTitle.toLowerCase().includes("film")
      );
    }
    return participantsList;
  }, [awardTitle, category, participantsList]);

  const displayedList = useMemo(() => {
    const baseList = filterMode === "relevant" && relevantParticipants.length > 0 ? relevantParticipants : participantsList;
    const filtered = !searchQuery.trim()
      ? baseList
      : baseList.filter((p) => {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.school.toLowerCase().includes(q) ||
            p.teamName.toLowerCase().includes(q) ||
            (p.email && p.email.toLowerCase().includes(q))
          );
        });

    // Ensure unique participants in dropdown
    const seen = new Set<string>();
    return filtered.filter((p) => {
      const key = `${p.name.trim().toLowerCase()}::${p.school.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filterMode, relevantParticipants, participantsList, searchQuery]);

  if (isManualMode) {
    return (
      <div className="space-y-3 p-3 bg-secondary/30 rounded-2xl border border-border/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-foreground">Manual Write-In Mode</span>
          <button
            type="button"
            onClick={() => setIsManualMode(false)}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            ← Back to Searchable List
          </button>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground">Participant Full Name</label>
          <Input
            placeholder="Type participant name..."
            value={manualName}
            onChange={(e) => {
              setManualName(e.target.value);
              onSelect(e.target.value, manualSchool);
            }}
            className="h-9 rounded-xl bg-background border-border text-xs font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground">School</label>
          <select
            value={manualSchool}
            onChange={(e) => {
              setManualSchool(e.target.value);
              onSelect(manualName, e.target.value);
            }}
            className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-bold text-foreground"
          >
            <option value="">-- Select School --</option>
            {schools.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Current Selection Display Box */}
      {selectedWinner ? (
        <div className="p-3 rounded-2xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/10 flex items-center justify-between gap-2 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-foreground truncate">{selectedWinner}</span>
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 truncate">
                <Building2 className="w-3 h-3 text-primary shrink-0" />
                {selectedSchool || "School unassigned"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-border/80"
            >
              Change
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onSelect("", "")}
              className="h-7 px-2 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-red-500"
            >
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-secondary/20 hover:bg-secondary/40 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span>Search & select participant...</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold bg-background">
            {relevantParticipants.length > 0 ? `${relevantParticipants.length} in Event` : "Browse"}
          </Badge>
        </button>
      )}

      {/* Searchable Picker Dropdown / Panel */}
      {isOpen && (
        <div className="p-3 bg-card rounded-2xl border-2 border-primary/20 shadow-xl space-y-3 mt-2 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search participant or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 rounded-xl bg-background border-border text-xs font-bold"
              />
            </div>
            {relevantParticipants.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterMode("relevant")}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black transition-colors ${
                    filterMode === "relevant"
                      ? "bg-primary text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Event ({relevantParticipants.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black transition-colors ${
                    filterMode === "all"
                      ? "bg-primary text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({participantsList.length})
                </button>
              </div>
            )}
          </div>

          {/* Scrollable participant items list */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {displayedList.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-muted-foreground font-semibold">No participants found matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setIsManualMode(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Write in manually instead →
                </button>
              </div>
            ) : (
              displayedList.map((p) => {
                const isSelected = selectedWinner === p.name && selectedSchool === p.school;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelect(p.name, p.school);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group border ${
                      isSelected
                        ? "bg-primary/10 border-primary font-black"
                        : "hover:bg-secondary/80 border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {p.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 truncate mt-0.5">
                        <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                        {p.school}
                      </span>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <Badge variant="outline" className="text-[9px] font-bold bg-background">
                        {p.teamName}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground font-semibold truncate max-w-[100px]">
                        {p.eventTitle}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setIsManualMode(true)}
              className="text-xs font-bold text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3 text-primary" />
              <span>Write in name manually</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Searchable School Picker Component
function SearchableSchoolPicker({
  awardTitle,
  selectedSchool,
  schools,
  participatingSchools = [],
  onSelect,
}: {
  awardTitle: string;
  selectedSchool: string;
  schools: string[];
  participatingSchools?: string[];
  onSelect: (schoolName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchools = useMemo(() => {
    const sorted = [...schools].sort((a, b) => {
      const aPart = participatingSchools.includes(a);
      const bPart = participatingSchools.includes(b);
      if (aPart && !bPart) return -1;
      if (!aPart && bPart) return 1;
      return a.localeCompare(b);
    });

    if (!searchQuery.trim()) return sorted;
    return sorted.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [schools, participatingSchools, searchQuery]);

  return (
    <div className="space-y-2">
      {selectedSchool ? (
        <div className="p-3 rounded-2xl border-2 border-blue-500/30 bg-blue-50/10 dark:bg-blue-950/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-black text-foreground truncate">{selectedSchool}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-border/80"
            >
              Change
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onSelect("")}
              className="h-7 px-2 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-red-500"
            >
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 rounded-2xl border-2 border-dashed border-border/80 hover:border-blue-500/60 bg-secondary/20 hover:bg-secondary/40 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span>Select awarded school...</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold bg-background">
            {schools.length} Schools
          </Badge>
        </button>
      )}

      {isOpen && (
        <div className="p-3 bg-card rounded-2xl border-2 border-blue-500/20 shadow-xl space-y-3 mt-2 animate-in fade-in-0 zoom-in-95">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search school name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 rounded-xl bg-background border-border text-xs font-bold"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            {filteredSchools.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">No schools found.</p>
            ) : (
              filteredSchools.map((s) => {
                const isSelected = selectedSchool === s;
                const isParticipating = participatingSchools.includes(s);

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onSelect(s);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between group border ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 font-black text-blue-700 dark:text-blue-300"
                        : "hover:bg-secondary/80 border-transparent hover:border-border text-foreground"
                    }`}
                  >
                    <span className="text-xs font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-2">
                      {s}
                    </span>
                    {isParticipating && (
                      <Badge variant="outline" className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                        Participated
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-border/60 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

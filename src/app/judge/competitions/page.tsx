import { getJudgeCompetitions } from "@/app/actions/judging";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronRight, CheckCircle2, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function JudgeCompetitionsPage() {
  const competitions = await getJudgeCompetitions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-purple-600" /> Assigned Competitions
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Select a competition panel to view submitted entries and evaluate them using the official scoring rubric.
        </p>
      </div>

      {competitions.length === 0 ? (
        <Card className="rounded-[2rem] border-dashed border-2 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-gray-800 dark:text-gray-200">No Competitions Assigned Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            An administrator has not assigned you to any competition panels yet. Please contact the RAITE admin committee.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitions.map((comp) => {
            const progressPercent =
              comp.totalSubmissions > 0
                ? Math.round((comp.evaluatedCount / comp.totalSubmissions) * 100)
                : 0;

            const isAllEvaluated =
              comp.totalSubmissions > 0 && comp.evaluatedCount === comp.totalSubmissions;

            return (
              <Card
                key={comp.id}
                className="rounded-[2rem] border-border/60 hover:border-purple-300 dark:hover:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden bg-white dark:bg-gray-900"
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className="font-black text-[10px] uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200"
                    >
                      {comp.category || "Online Competition"}
                    </Badge>
                    {isAllEvaluated ? (
                      <Badge className="bg-green-600 text-white font-bold text-[10px] gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 font-bold text-[10px]">
                        {comp.evaluatedCount} / {comp.totalSubmissions} Evaluated
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-xl font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {comp.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Official Rubric: 95 pts Judge Evaluation + 5 pts Social Media Voting.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                      <span>Evaluation Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">
                      {comp.totalSubmissions} Submissions Ready
                    </span>
                    <Button
                      asChild
                      className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 group-hover:translate-x-0.5 transition-transform"
                    >
                      <Link href={`/judge/competitions/${comp.id}`}>
                        Open Panel <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

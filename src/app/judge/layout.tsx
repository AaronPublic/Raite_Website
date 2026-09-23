import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/data/users";
import { Role } from "@prisma/client";
import { Gavel, Trophy, ArrowLeft } from "lucide-react";
import { SafeUserButton } from "@/components/SafeUserButton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getUserByClerkId(userId);

  if (!user || (user.role !== Role.JUDGE && user.role !== Role.ADMIN)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 flex flex-col">
      {/* Top Judging Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/judge/competitions"
              className="flex items-center gap-2.5 font-black text-gray-900 dark:text-white tracking-tight hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
                <Gavel className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight leading-tight">RAITE 2026</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  Judging Portal
                </span>
              </div>
            </Link>

            <Badge
              variant="outline"
              className="hidden sm:inline-flex bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-purple-200 font-bold text-[10px] uppercase"
            >
              Official Evaluator
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/judge/competitions"
              className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hidden sm:block"
            >
              My Competitions
            </Link>

            {user.role === Role.ADMIN && (
              <Link
                href="/admin/scores"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline hidden sm:block"
              >
                Admin Scores
              </Link>
            )}

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-800">
              <div className="flex flex-col text-right hidden md:block">
                <span className="text-xs font-black text-gray-900 dark:text-white">{user.name || "Judge"}</span>
                <span className="text-[10px] text-gray-400 font-medium">{user.email}</span>
              </div>
              <div className="ring-2 ring-purple-500/20 rounded-full p-0.5">
                <SafeUserButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { getRegistrationsByUserId } from "@/lib/data/registrations";
import { getUpcomingEvents } from "@/lib/data/events";
import { getLatestAnnouncements } from "@/lib/data/announcements";
import { getSystemSetting } from "@/lib/data/settings";
import { getLeaderboard } from "@/app/actions/ranking";
import CountdownTimer from "@/components/home/CountdownTimer";
import AnnouncementList from "@/components/home/AnnouncementList";
import { Calendar, MapPin, School, Mail, ArrowRight, Sparkles, Trophy, Megaphone, GraduationCap, FileUp } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  
  let user = null;
  let hasActiveRegistration = false;
  
  if (userId) {
    user = await getUserByClerkId(userId);
    if (user) {
      const registrations = await getRegistrationsByUserId(user.id);
      hasActiveRegistration = registrations.length > 0;
    }
  }

  const upcomingEvents = await getUpcomingEvents();
  const announcements = await getLatestAnnouncements(4);
  const leaderboard = await getLeaderboard();
  const missionStartSetting = await getSystemSetting("MISSION_START_DATE");
  
  const missionStartDate = missionStartSetting 
    ? new Date(missionStartSetting) 
    : (upcomingEvents[0]?.startDate || null);

  // Helper to find ranking by place
  const getRanking = (place: number) => leaderboard.find(e => e.place === place) || { name: "TBD", university: "TBD" };
  const first = getRanking(1);
  const second = getRanking(2);
  const third = getRanking(3);

  // DEBUGGING: Log to verify what's happening
  console.log("Debug [HomePage Auth]:", { 
    userId, 
    user: user ? { id: user.id, email: user.email, role: user.role } : "null", 
    hasActiveRegistration 
  });

  // Determine if user can see the registration buttons
  const isGuest = !userId;
  const isNewUser = userId && !user?.role;
  const isAdminOrCoach = user?.role === "ADMIN" || user?.role === "FACULTY_COACH";
  const isParticipant = user?.role === "PARTICIPANT";

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-20 pb-32 overflow-hidden bg-white dark:bg-gray-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-[120px] dark:bg-blue-600/10" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] dark:bg-purple-600/10" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4" />
            Regional AI & IT Expo 2025
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-gray-900 dark:text-white leading-[0.9]">
              THE FUTURE <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                IS NOW.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
              Join Region III's most prestigious technology competition. 
              Showcase your innovation, compete with the best, and shape the digital horizon.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isGuest && (
              <Button asChild size="lg" className="h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                <Link href="/sign-in">
                  GET STARTED
                </Link>
              </Button>
            )}


            {isNewUser && (
              <Button size="lg" className="h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                <Link href="/profile/complete">
                  FINAL BOARDING CALL
                </Link>
              </Button>
            )}

            {isAdminOrCoach && (
              <>
                <Button size="lg" className="h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                  <Link href="/participants/register">
                    REGISTER PARTICIPANTS
                  </Link>
                </Button>
                <Button size="lg" className="h-16 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-black shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95">
                  <Link href="/register/step-1">
                    REGISTER FOR EVENT
                  </Link>
                </Button>
              </>
            )}

            {isParticipant && (
              <>
                {!hasActiveRegistration ? (
                  <Button size="lg" className="h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                    <Link href="/register/step-1">
                      REGISTER NOW
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="h-16 px-10 rounded-full bg-green-600 hover:bg-green-700 text-white text-lg font-black shadow-2xl shadow-green-600/30 transition-all hover:scale-105 active:scale-95">
                    <Link href="/registrations/my">
                      VIEW MY STATUS
                    </Link>
                  </Button>
                )}
              </>
            )}
            
            <Button variant="outline" size="lg" className="h-16 px-10 rounded-full border-2 border-gray-200 dark:border-gray-800 text-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
              <Link href="/competitions">Explore Events</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="pb-32 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)]">
            
            {/* Countdown Box */}
            <div className="md:col-span-12 bg-gray-50 dark:bg-gray-900/40 rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-blue-600/10 dark:text-blue-600/5 group-hover:scale-110 transition-transform duration-500">
                <Calendar className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-8 text-center">
                <div>
                  <h3 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">MISSION START IN</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs mt-4">Countdown to RAITE 2025 Kick-off</p>
                </div>
                <div className="w-full max-w-4xl">
                  {missionStartDate ? (
                    <CountdownTimer targetDate={missionStartDate} />
                  ) : (
                    <p className="text-xl font-bold text-gray-400">Schedule pending...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Ranking Podium */}
            <div className="md:col-span-12 bg-white dark:bg-gray-900/40 rounded-[2.5rem] p-10 md:p-16 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center space-y-12 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 text-blue-600/5 dark:text-blue-600/5 group-hover:scale-110 transition-transform duration-700">
                <Trophy className="w-64 h-64" />
              </div>
              
              <div className="text-center relative z-10">
                <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">Overall Ranking</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Region III Leaderboard Standing</p>
              </div>

              <div className="flex items-end justify-center gap-4 md:gap-8 w-full max-w-5xl pt-10 relative z-10">
                {/* 2nd Place */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 border-4 border-gray-300 shadow-lg ring-8 ring-gray-100/50 dark:ring-gray-800/50">
                    <span className="text-2xl font-black text-gray-400">2</span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-gray-800/60 rounded-t-[2rem] p-6 md:p-10 text-center h-48 md:h-64 flex flex-col justify-between border-x border-t border-gray-200 dark:border-gray-700 shadow-inner">
                    <div className="space-y-2">
                      <p className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-sm md:text-xl line-clamp-1">{second.name}</p>
                      <p className="text-[10px] md:text-xs text-gray-500 font-black uppercase tracking-widest">{second.university}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl md:text-5xl">🥈</p>
                      <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">1st Runner Up</p>
                    </div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center flex-1 -mt-12 md:-mt-20">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-6 border-4 border-yellow-400 shadow-2xl shadow-yellow-400/20 ring-12 ring-yellow-400/10">
                    <span className="text-4xl font-black text-yellow-600">1</span>
                  </div>
                  <div className="w-full bg-blue-600 rounded-t-[2.5rem] p-8 md:p-12 text-center h-64 md:h-80 flex flex-col justify-between shadow-2xl shadow-blue-600/30 border-x border-t border-blue-500 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-blue-900 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg">
                      Overall Winner
                    </div>
                    <div className="space-y-3 pt-4">
                      <p className="font-black text-white uppercase tracking-tighter text-xl md:text-3xl leading-none">{first.name}</p>
                      <p className="text-[10px] md:text-sm text-blue-100 font-black uppercase tracking-[0.2em]">{first.university}</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-center -space-x-2">
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                        <Trophy className="w-12 h-12 md:w-16 md:h-12 text-yellow-400" />
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse delay-75" />
                      </div>
                      <p className="text-[10px] md:text-xs text-blue-100 font-black uppercase tracking-[0.3em]">Grand Champion</p>
                    </div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-6 border-4 border-orange-400 shadow-lg ring-8 ring-orange-100/50 dark:ring-orange-900/50">
                    <span className="text-xl font-black text-orange-600">3</span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-gray-800/60 rounded-t-[2rem] p-6 md:p-8 text-center h-40 md:h-52 flex flex-col justify-between border-x border-t border-gray-200 dark:border-gray-700 shadow-inner">
                    <div className="space-y-1">
                      <p className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-sm md:text-lg line-clamp-1">{third.name}</p>
                      <p className="text-[10px] md:text-xs text-gray-500 font-black uppercase tracking-widest">{third.university}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl md:text-4xl">🥉</p>
                      <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">2nd Runner Up</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats / Info (Left Side - Tall) */}
            <div className="md:col-span-4 md:row-span-2 bg-blue-600 rounded-[2.5rem] p-10 md:p-12 flex flex-col items-center justify-between text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden group border-none">
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <Trophy className="w-16 h-16 mb-8 text-blue-200 relative z-10" />
              <div className="flex flex-col items-center justify-center gap-12 relative z-10 w-full">
                <div className="text-center space-y-2">
                  <h4 className="text-6xl font-black leading-none">15+</h4>
                  <p className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">Competitions</p>
                </div>
                <div className="w-12 h-px bg-white/10" />
                <div className="text-center space-y-2">
                  <h4 className="text-6xl font-black leading-none">50+</h4>
                  <p className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">Schools</p>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-white/10 w-full text-center relative z-10">
                <p className="text-[10px] font-medium text-blue-100 uppercase tracking-widest leading-relaxed">
                  Largest IT <br /> Gathering in <br /> Region III
                </p>
              </div>
            </div>

            {/* Event Details Box (Right Side - Top) */}
            <div className="md:col-span-8 bg-white dark:bg-gray-900/40 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center group">
              <div className="flex flex-col md:flex-row items-center gap-10 w-full">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform shrink-0">
                  <MapPin className="w-10 h-10" />
                </div>
                <div className="space-y-2 text-center md:text-left flex-1">
                  <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Event Venue</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Holy Angel University, Angeles City</p>
                </div>
                
                <div className="flex flex-col gap-3 shrink-0">
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <School className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">PSITE Region III Host</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">support@raite.org</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcements Box (Right Side - Bottom) */}
            <div className="md:col-span-8 bg-white dark:bg-gray-900/40 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col group">
              <div className="w-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Broadcasts</h3>
                  </div>
                  <Link href="/announcements" className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-2 uppercase tracking-widest">
                    Read All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="w-full">
                  <AnnouncementList announcements={announcements} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t dark:border-gray-800 bg-white dark:bg-gray-950 text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            © 2025 PSITE Region III • RAITE Registration Platform
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/privacy" className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">PRIVACY POLICY</Link>
            <Link href="/terms" className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">TERMS OF SERVICE</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

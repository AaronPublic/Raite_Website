import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { getRegistrationsByUserId } from "@/lib/data/registrations";
import { getUpcomingEvents } from "@/lib/data/events";
import { getLatestAnnouncements } from "@/lib/data/announcements";
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
  const nextEvent = upcomingEvents[0];
  const announcements = await getLatestAnnouncements(4);

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
              <Button size="lg" className="h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
                <Link href="/sign-in">
                  GET STARTED <ArrowRight className="ml-2 w-6 h-6" />
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
            <div className="md:col-span-8 bg-gray-50 dark:bg-gray-900/40 rounded-[2.5rem] p-10 flex flex-col justify-center border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-blue-600/10 dark:text-blue-600/5 group-hover:scale-110 transition-transform duration-500">
                <Calendar className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">MISSION START IN</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-bold">Countdown to RAITE 2025 Kick-off</p>
                </div>
                {nextEvent ? (
                  <CountdownTimer targetDate={nextEvent.startDate} />
                ) : (
                  <p className="text-xl font-bold text-gray-400">Schedule pending...</p>
                )}
              </div>
            </div>

            {/* Quick Stats / Info */}
            <div className="md:col-span-4 bg-blue-600 rounded-[2.5rem] p-10 flex flex-col justify-between text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <Trophy className="w-12 h-12 mb-8 text-blue-200" />
              <div className="space-y-2">
                <h4 className="text-4xl font-black leading-none">15+</h4>
                <p className="text-blue-100 font-bold uppercase tracking-widest text-sm">Competitions</p>
              </div>
              <div className="space-y-2 mt-8">
                <h4 className="text-4xl font-black leading-none">50+</h4>
                <p className="text-blue-100 font-bold uppercase tracking-widest text-sm">Schools</p>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm font-medium text-blue-100 italic">Largest IT Gathering in Region III</p>
              </div>
            </div>

            {/* Event Details Box */}
            <div className="md:col-span-5 bg-white dark:bg-gray-900/40 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform">
                  <MapPin className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">EVENT VENUE</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Holy Angel University, Angeles City</p>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <School className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">PSITE Region III Host</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">gepastoral.student@ua.edu.ph</span>
                </div>
              </div>
            </div>

            {/* Announcements Box */}
            <div className="md:col-span-7 bg-white dark:bg-gray-900/40 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">LATEST BROADCASTS</h3>
                </div>
                <Link href="/announcements" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Read All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex-1 overflow-hidden">
                <AnnouncementList announcements={announcements} />
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

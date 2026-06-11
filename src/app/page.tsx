import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { getRegistrationsByUserId } from "@/lib/data/registrations";
import { getUpcomingEvents } from "@/lib/data/events";
import { getLatestAnnouncements } from "@/lib/data/announcements";
import { getSystemSetting } from "@/lib/data/settings";
import { getLeaderboard, getCompetitionWinners } from "@/app/actions/ranking";
import CountdownTimer from "@/components/home/CountdownTimer";
import AnnouncementCarousel from "@/components/home/AnnouncementCarousel";
import DecorativeLayout from "@/components/layout/DecorativeLayout";
import { Calendar, MapPin, School, Mail, ArrowRight, Sparkles, Trophy, Megaphone, ChevronRight, BookOpen } from "lucide-react";
import * as motion from "framer-motion/client";
import { Suspense } from "react";

async function HeroActions() {
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

  const isGuest = !userId;
  const isNewUser = userId && !user?.role;
  const isAdminOrCoach = user?.role === "ADMIN" || user?.role === "FACULTY_COACH";
  const isParticipant = user?.role === "PARTICIPANT";

  const guidelinesUrl = await getSystemSetting("GENERAL_GUIDELINES_URL");
  const guidelinesHref = guidelinesUrl || "/competitions";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
      {isGuest && <Button asChild size="lg" className="h-16 px-10 rounded-xl text-lg font-bold shadow-2xl shadow-primary/30"><Link href="/sign-in">Get Started</Link></Button>}
      {isNewUser && <Button size="lg" className="h-16 px-10 rounded-xl text-lg font-bold shadow-2xl shadow-primary/30"><Link href="/profile/complete">Complete Profile</Link></Button>}
      {isAdminOrCoach && (
        <>
          <Button size="lg" className="h-16 px-10 rounded-xl text-lg font-bold shadow-2xl shadow-primary/30"><Link href="/participants/register">Register Participants</Link></Button>
          <Button size="lg" variant="secondary" className="h-16 px-10 rounded-xl text-lg font-bold"><Link href="/register/step-1">Registration</Link></Button>
        </>
      )}
      {isParticipant && (
        <>
          {!hasActiveRegistration ? <Button size="lg" className="h-16 px-10 rounded-xl text-lg font-bold shadow-2xl shadow-primary/30"><Link href="/register/step-1">Register Now</Link></Button> : <Button size="lg" className="h-16 px-10 rounded-xl text-lg font-bold shadow-2xl shadow-primary/30"><Link href="/registrations/my">My Status</Link></Button>}
        </>
      )}
      <Button asChild variant="ghost" size="lg" className="h-16 px-8 rounded-xl text-lg font-bold group border border-border/50">
        <Link 
          href={guidelinesHref} 
          target={guidelinesUrl ? "_blank" : undefined} 
          rel={guidelinesUrl ? "noopener noreferrer" : undefined}
          className="flex items-center gap-2"
        >
          General Guidelines
          <BookOpen className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
}

async function HeroCountdown() {
  const upcomingEvents = await getUpcomingEvents();
  const missionStartSetting = await getSystemSetting("MISSION_START_DATE");
  
  const missionStartDate = missionStartSetting 
    ? new Date(missionStartSetting) 
    : (upcomingEvents[0]?.startDate || null);

  return (
    <div className="w-full">
      {missionStartDate ? <CountdownTimer targetDate={missionStartDate} /> : <p className="text-xl font-bold text-white/50 tracking-widest">SCHEDULE PENDING</p>}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden z-10">
      <div className="absolute inset-0 -z-10 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <Image 
          src="/hero-bg.jpg" 
          alt="Hero Background" 
          fill 
          className="object-cover" 
          priority 
          sizes="100vw"
        />
      </div>
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="w-32 h-16 mx-auto lg:mx-0 shrink-0 relative"
          >
            <Image 
              src="/psite.png" 
              alt="PSITE Logo" 
              fill 
              className="object-contain" 
              priority 
              sizes="128px"
            />
          </motion.div>
          
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }} 
              className="text-7xl md:text-9xl font-black tracking-tighter leading-none"
            >
              <span className="bg-gradient-to-r from-[#0038A8] via-[#CE1126] to-[#FCD116] bg-clip-text text-transparent">RAITE 2026</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-xl mx-auto lg:mx-0 text-xl md:text-2xl font-black tracking-tight text-foreground leading-tight">
              CTRL + NEXT: <br />
              <span className="text-muted-foreground font-medium text-lg md:text-xl italic">Empowering Students as Future-Ready Digital Innovators and Technology Leaders</span>
            </motion.p>
          </div>

          <Suspense fallback={<div className="h-16 w-full bg-muted animate-pulse rounded-xl" />}>
            <HeroActions />
          </Suspense>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8 }} className="hidden lg:flex items-center justify-center relative">
          <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-black tracking-[0.2em] uppercase text-white/90">Mission Start In</h3>
                <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px] bg-accent/20 px-3 py-1 rounded-full">RAITE 2026 Countdown</p>
              </div>
              <Suspense fallback={<div className="h-20 w-full bg-white/5 animate-pulse rounded-xl" />}>
                <HeroCountdown />
              </Suspense>
              <div className="pt-4 border-t border-white/10 w-full">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">PAMPANGA STATE UNIVERSITY • SEPTEMBER 2026</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

async function RankingSection() {
  const leaderboard = await getLeaderboard();
  const competitionWinners = await getCompetitionWinners();
  
  const getRankEntries = (place: number) => leaderboard.filter(e => e.place === place);
  const firstPlace = getRankEntries(1);
  const secondPlace = getRankEntries(2);
  const thirdPlace = getRankEntries(3);

  return (
    <>
      <Card className="md:col-span-12 p-8 md:p-12 border border-border bg-card/80 overflow-hidden relative shadow-sm">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold tracking-tight uppercase leading-none text-foreground">RAITE 2025</h3>
          <p className="text-primary font-bold uppercase tracking-widest text-xs mt-4">Overall Ranking</p>
        </div>

        <div className="flex items-end justify-center gap-4 md:gap-8 w-full max-w-5xl mx-auto pt-10">
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6 border border-border shadow-sm"><span className="text-xl font-bold text-primary">2</span></div>
            <div className="w-full bg-secondary/50 rounded-t-xl p-6 md:p-8 text-center min-h-48 md:min-h-64 flex flex-col justify-between border-t border-x border-border">
              <div className="space-y-3">{secondPlace.length > 0 ? secondPlace.map((e, i) => <div key={i} className="space-y-1"><p className="font-bold text-foreground text-sm md:text-xl line-clamp-2">{e.university}</p>{i < secondPlace.length - 1 && <div className="h-px bg-border/50 w-1/2 mx-auto" />}</div>) : <p className="text-muted-foreground italic text-sm">TBD</p>}</div>
              <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">1st Runner Up</p></div>
            </div>
          </div>

          <div className="flex flex-col items-center flex-1 -mt-8 md:-mt-12">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 border-4 border-white shadow-md"><span className="text-2xl font-bold text-white">1</span></div>
            <div className="w-full bg-primary rounded-t-2xl p-8 md:p-10 text-center min-h-64 md:min-h-80 flex flex-col justify-between border-t border-x border-primary relative shadow-lg">
              <div className="space-y-4">{firstPlace.length > 0 ? firstPlace.map((e, i) => <div key={i} className="space-y-1 text-white"><p className="font-bold text-lg md:text-2xl leading-tight line-clamp-2">{e.university}</p>{i < firstPlace.length - 1 && <div className="h-px bg-white/20 w-1/2 mx-auto" />}</div>) : <p className="text-white/60 italic text-sm">TBD</p>}</div>
              <div className="mt-4"><p className="text-[10px] md:text-xs text-white font-black uppercase tracking-[0.2em]">Grand Champion</p></div>
            </div>
          </div>

          <div className="flex flex-col items-center flex-1">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-6 border border-border shadow-sm"><span className="text-lg font-bold text-primary">3</span></div>
            <div className="w-full bg-secondary/50 rounded-t-xl p-6 md:p-8 text-center min-h-40 md:min-h-52 flex flex-col justify-between border-t border-x border-border">
              <div className="space-y-2">{thirdPlace.length > 0 ? thirdPlace.map((e, i) => <div key={i} className="space-y-1"><p className="font-bold text-foreground text-xs md:text-lg line-clamp-2">{e.university}</p>{i < thirdPlace.length - 1 && <div className="h-px bg-border/50 w-1/2 mx-auto" />}</div>) : <p className="text-muted-foreground italic text-sm">TBD</p>}</div>
              <div className="mt-4"><p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">2nd Runner Up</p></div>
            </div>
          </div>
        </div>
      </Card>

      {competitionWinners.length > 0 && (
        <Card className="md:col-span-12 p-8 md:p-12 border border-border bg-card/80 overflow-hidden relative shadow-sm">
          <div className="text-center mb-10"><h3 className="text-2xl md:text-3xl font-bold tracking-tight uppercase text-foreground">RAITE 2025 Competition Winners</h3><p className="text-primary font-bold uppercase tracking-widest text-[10px] mt-2">Individual Events Hall of Fame</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  <th className="py-4 px-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Competition</th>
                  <th className="py-4 px-4 font-black uppercase text-[10px] tracking-widest text-primary">Champion</th>
                  <th className="py-4 px-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">1st Runner Up</th>
                  <th className="py-4 px-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground">2nd Runner Up</th>
                </tr>
              </thead>
              <tbody>
                {competitionWinners.map((winner, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-primary/5 transition-colors group">
                    <td className="py-5 px-4 font-bold text-sm text-foreground">{winner.competitionName}</td>
                    <td className="py-5 px-4 text-sm font-black text-primary">{winner.champion}</td>
                    <td className="py-5 px-4 text-sm font-medium text-muted-foreground">{winner.firstRunnerUp}</td>
                    <td className="py-5 px-4 text-sm font-medium text-muted-foreground">{winner.secondRunnerUp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

async function BroadcastSection() {
  const announcements = await getLatestAnnouncements(10);
  return (
    <div className="md:col-span-12 flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary border border-primary/10"><Megaphone className="w-5 h-5" /></div>
          <h3 className="text-xl font-bold tracking-tight uppercase text-foreground">Latest Broadcasts</h3>
        </div>
        <Link href="/announcements" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-2 uppercase tracking-widest transition-all hover:translate-x-1">Read All <ArrowRight className="w-3 h-3" /></Link>
      </div>
      <AnnouncementCarousel announcements={announcements} />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      <HeroSection />

      <DecorativeLayout className="py-24 px-4 border-t border-border z-10 bg-slate-50/50 dark:bg-blue-950/50 backdrop-blur-[2px]">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <Card className="md:col-span-12 p-10 flex flex-col justify-center border border-border bg-card/80 overflow-hidden shadow-sm group transition-all duration-500 relative min-h-[280px]">
              <div className="absolute inset-0 z-0 transition-opacity duration-700 group-hover:opacity-0 overflow-hidden h-full w-full">
                <Image 
                  src="/venue.jpg" 
                  alt="Pampanga State University" 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-white/60 dark:bg-[#07142F]/70" />
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10">
                <iframe width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }} loading="lazy" src="https://maps.google.com/maps?q=Cabambangan,+Bacolor,+2001+Pampanga&t=&z=15&ie=UTF8&iwloc=&output=embed"></iframe>
                <div className="absolute inset-0 bg-white/50 dark:bg-[#07142F]/60 pointer-events-none" />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-10 w-full relative z-20 transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-primary border border-primary/10 shrink-0 group-hover:bg-white group-hover:shadow-lg transition-all"><MapPin className="w-10 h-10" /></div>
                <div className="space-y-2 text-center md:text-left flex-1">
                  <h3 className="text-2xl font-bold tracking-tight uppercase text-foreground group-hover:text-primary transition-colors">Event Venue</h3>
                  <p className="text-primary text-xl font-black group-hover:text-primary transition-colors">Pampanga State University</p>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors duration-500">Cabambangan, Bacolor, 2001 Pampanga</p>
                </div>
              </div>
            </Card>

            <Suspense fallback={<Card className="md:col-span-12 h-96 flex items-center justify-center border border-border bg-card animate-pulse">Loading Rankings...</Card>}>
              <RankingSection />
            </Suspense>

            <Suspense fallback={<Card className="md:col-span-12 h-48 flex items-center justify-center border border-border bg-card animate-pulse">Loading Announcements...</Card>}>
              <BroadcastSection />
            </Suspense>
          </div>
        </div>
      </DecorativeLayout>

      <footer className="py-16 border-t border-border bg-background text-center relative z-10">
        <div className="container mx-auto px-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6 text-foreground">© 2025 PSITE Region III • RAITE Registration Platform</p>
          <div className="flex justify-center gap-8">
            <Link href="/privacy" className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Privacy Policy</Link>
            <Link href="/terms" className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

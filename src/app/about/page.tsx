"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Code,
  Users,
  Globe,
  Lightbulb,
  Target,
  Cpu,
  Award,
  Network,
  ArrowRight,
  ChevronRight,
  Rocket,
  Shield,
  Zap,
  BookOpen,
  Building
} from "lucide-react";
import DecorativeLayout from "@/components/layout/DecorativeLayout";

const OFFICERS = [
  { name: "Jonilo C. Mababa, DIT, PHD", position: "President" },
  { name: "Raquel C. Adriano, DIT, PhD", position: "Vice President Internal" },
  { name: "Rolaida L. Sonza, DIT", position: "Vice President External" },
  { name: "Alma Theresa D. Manaloto, DIT", position: "Secretary" },
  { name: "Denise Lou B. Punzalan, MCSC", position: "Assistant Secretary" },
  { name: "Eugene S. Perez, MIT", position: "Treasurer" },
  { name: "Evelyn A. Villanueva, MIT", position: "Assistant Treasurer" },
  { name: "Jenice Anne Marie B. Visperas, MIT", position: "Auditor" },
  { name: "Mark Anthony D. Madalipay, MIT", position: "Public Relations Officer" },
];

const STATS = [
  { label: "Institutional Members", value: "100+", icon: Building },
  { label: "Active Students", value: "5k+", icon: Users },
  { label: "Annual Events", value: "12+", icon: Zap },
  { label: "Industry Partners", value: "50+", icon: Network },
];

// Change this URL to your group photo path
const GROUP_PHOTO_URL = "https://scontent.fcrk1-5.fna.fbcdn.net/v/t39.30808-6/696374192_1581282134005619_5236327540381819861_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_ohc=DGElONt88BMQ7kNvwFQCPf4&_nc_oc=Adr2QbDVgexFKG9Ou_ScxKDMy2bVChrjA3OMNtm1QTIWiMvTbR_jIradgci4AA8QZkw&_nc_zt=23&_nc_ht=scontent.fcrk1-5.fna&_nc_gid=m71H1xQf0f9elEa1u9ba1w&_nc_ss=7b2a8&oh=00_Af8wm4J5qSTxTev1MlfqBhBmIWsiLhZw0jzqTIcDMZQeag&oe=6A284687"; 

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      <section className="relative pt-32 pb-48 overflow-hidden bg-[#07142F] z-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0038A8]/80 mix-blend-multiply" />
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 0.4 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://scontent.fcrk1-4.fna.fbcdn.net/v/t39.30808-6/573891354_1324598456346202_4630831899425841937_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=7avFUV00kPcQ7kNvwHKtwdy&_nc_oc=AdqbmfkJAsIDd1X6bQoYSa6rJWiDf9KY6bGQSHpuvmJd-Qeh8aj9PDl_uA_2IgUub3U&_nc_zt=23&_nc_ht=scontent.fcrk1-4.fna&_nc_gid=lMYxHHcTzEaewAeoBjaJLw&_nc_ss=7b2a8&oh=00_Af8FSYzv7FaWioiw1lKuSR6XFEis43H1BOLkBw0DQ1akqg&oe=6A285C06')" }}
          />
          <div className="absolute top-0 right-0 h-full w-2 bg-primary" />
          <div className="absolute top-0 right-2 h-full w-1 bg-accent" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[#FCD116] text-xs font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-sm"
          >
            Established for Excellence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tighter"
          >
            Driving Innovation. <br />
            <span className="text-[#FCD116]">Shaping the IT Future.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-white/80 font-medium mb-12 leading-relaxed max-w-3xl mx-auto"
          >
            PSITE Region 3 is the premier network of IT educators and students dedicated to bridging the gap between the classroom and the global tech industry.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/competitions" className={cn(buttonVariants({ variant: "default", size: "lg" }), "bg-[#FCD116] hover:bg-[#E6BD12] text-[#07142F] rounded-full px-10 h-16 text-lg font-bold shadow-2xl shadow-black/20 hover:scale-105 transition-all")}>Explore Competitions</Link>
            <Link href="/contact" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "bg-transparent text-white border-white/20 hover:bg-white/10 rounded-full px-10 h-16 text-lg font-bold backdrop-blur-md flex items-center")}>
              Join the Community <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <DecorativeLayout className="py-32">
        <div className="container mx-auto max-w-6xl relative z-10 space-y-32">
            {/* 2. ABOUT PSITE REGION 3 */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative group"
              >
                <div className="absolute -inset-6 bg-accent/25 rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform duration-700" />
                <div className="relative h-[500px] rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-100 dark:border-gray-800">
                  <img 
                    src="https://scontent.fcrk1-1.fna.fbcdn.net/v/t39.30808-6/571216183_1324598803012834_1811327419381667676_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=NAW_FzOM49YQ7kNvwFdyjDV&_nc_oc=Adroqx4dCCgxixtC62Cf6dQMon1hQNpXH9Sfu8h03ZXmSnM3cg94-l3tHqUU8OANTvs&_nc_zt=23&_nc_ht=scontent.fcrk1-1.fna&_nc_gid=kSlRlJv3ewAHOD1_wswrkw&_nc_ss=7b2a8&oh=00_Af-zYtT55Ov8Uhmhmy9XmJLYh1YmSUwBvc9oxnZVXvzEOA&oe=6A285015" 
                    alt="IT Educators Workshop" 
                    className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
                  />
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-10 -right-10 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 hidden md:block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">Region 3</p>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Flagship Chapter</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-primary text-sm font-black uppercase tracking-widest border border-border">
                  Our Identity
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.2] tracking-tight">
                  Bridging the Gap Between <br className="hidden md:block" />
                  <span className="text-primary underline decoration-accent decoration-4 underline-offset-4">Academe & Industry</span>
                </h2>
                <div className="space-y-6 text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  <p>
                    The Philippine Society of Information Technology Educators - Region 3 (PSITE R3) stands as the vanguard of IT education in Central Luzon. As a professional organization, we serve as the primary link between the academic sector and the rapidly evolving technology industry.
                  </p>
                  <p>
                    We believe that the future of Central Luzon depends on the strength of its educators. Through continuous faculty development, research initiatives, and strategic industry partnerships, we empower our members to deliver world-class instruction that prepares students for the challenges of the digital age.
                  </p>
                </div>
                <div className="pt-6 grid grid-cols-2 gap-8">
                  {STATS.slice(0, 2).map((stat, i) => (
                    <div key={i}>
                      <h4 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h4>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* 3. RAITE LEGACY */}
            <section className="container mx-auto max-w-5xl">
              <motion.div 
                {...fadeInUp}
                className="bg-white dark:bg-gray-900 p-12 md:p-16 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-full w-3 bg-primary" />
                <div className="absolute top-0 right-3 h-full w-2 bg-accent" />
                
                <div className="relative z-10 space-y-10">
                  <div className="space-y-4">
                    <span className="text-primary font-black uppercase tracking-[0.2em] text-xs">The Flagship Event</span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                      Regional Assembly on <br />
                      <span className="text-primary">Information Technology Education</span>
                    </h2>
                  </div>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                    For over two decades, RAITE has served as the premier annual gathering for the Information Technology education community in Central Luzon. Established as a core initiative of PSITE Region 3, the assembly was created to provide a centralized platform where academic theory meets real-world industry competitiveness.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                    {[
                      { title: "When It Starts", desc: "Held annually every October (First Semester of the Academic Year)." },
                      { title: "The Scale", desc: "Brings together thousands of delegates, representing over 20+ Higher Education Institutions (HEIs) across Central Luzon." },
                      { title: "The Core Purpose", desc: "The ultimate proving ground for computing students through high-stakes skills competitions." }
                    ].map((item, i) => (
                      <div key={i} className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary border border-border">
                          <Rocket className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-gray-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </section>

            {/* 4. MISSION & VISION */}
            <section className="container mx-auto max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="p-12 md:p-16 rounded-[3rem] bg-primary text-white shadow-3xl relative overflow-hidden group flag-panel"
                >
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <Globe className="w-64 h-64" />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-8 uppercase tracking-tighter">Our Vision</h2>
                    <p className="text-2xl leading-relaxed text-white/90 font-medium">
                      To be the driving force in transforming Central Luzon into a premier global hub for world-class IT professionals and visionary educators.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="p-12 md:p-16 rounded-[3rem] bg-secondary dark:bg-gray-900 border border-border shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-4xl font-black mb-10 uppercase tracking-tighter text-gray-900 dark:text-white">Our Mission</h2>
                    <ul className="space-y-6">
                      {[
                        { title: "Elevate Excellence", desc: "Upgrade IT education standards through specialized faculty training." },
                        { title: "Foster Innovation", desc: "Promote research that addresses regional and global challenges." },
                        { title: "Bridge the Gap", desc: "Sustain collaboration between academe, industry, and government." }
                      ].map((item, i) => (
                        <motion.li 
                          key={i} 
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-5 group"
                        >
                          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1 text-accent-foreground group-hover:scale-125 transition-transform">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-gray-900 dark:text-white block text-lg">{item.title}</span>
                            <span className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{item.desc}</span>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* 5. BOARD OF OFFICERS */}
            <section className="container mx-auto max-w-6xl text-center">
              <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-primary text-sm font-black uppercase tracking-widest mb-6 border border-border">
                Meet the Leadership
              </motion.div>
              <motion.h2 {...fadeInUp} className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-20 tracking-tight">
                The PSITE Region 3 Board of Officers
              </motion.h2>
              
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="group relative max-w-4xl mx-auto"
              >
                <div className="absolute -inset-4 bg-accent/20 rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] dark:shadow-none hover:shadow-xl transition-all duration-500">
                  <div className="aspect-[21/9] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {GROUP_PHOTO_URL ? (
                      <img 
                        src={GROUP_PHOTO_URL} 
                        alt="Board of Officers" 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="w-20 h-20 text-gray-200 dark:text-gray-700" />
                        <p className="absolute bottom-6 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Group Photo</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gray-950/70 opacity-80" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest mb-3">
                        2024-2025
                      </div>
                      <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none">
                        Executive Board of Officers
                      </h3>
                    </div>
                  </div>
                  <div className="p-8 md:p-12 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
                      {OFFICERS.map((officer, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 + (i * 0.05) }}
                          className="group/item"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest block leading-tight">
                              {officer.position}
                            </span>
                            <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight group-hover/item:text-primary transition-colors leading-tight">
                              {officer.name}
                            </h4>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Shield className="w-3 h-3" />
                        <p className="text-[8px] font-bold uppercase tracking-widest leading-none">Officially Recognized Chapter</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* 7. FINAL CTA */}
            <section className="py-20 px-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary" />
              <div className="absolute left-0 top-0 h-full w-4 bg-accent" />
              <div className="absolute right-0 top-0 h-full w-6 bg-destructive" />
              <div 
                className="absolute inset-0 opacity-15" 
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}
              />
              
              <div className="container mx-auto max-w-2xl relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                    Ready to Shape the Future?
                  </h2>
                  <p className="text-lg text-white font-medium opacity-90">
                    Join PSITE Region 3 today and be part of the community.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/contact" className={cn(buttonVariants({ variant: "default", size: "lg" }), "bg-white text-primary hover:bg-gray-50 rounded-full px-10 h-12 text-sm font-black transition-all hover:scale-105")}>Become a Member</Link>
                    <Link href="/competitions" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "bg-transparent text-white border-white/30 hover:bg-white/10 rounded-full px-10 h-12 text-sm font-black backdrop-blur-md transition-all")}>View Events</Link>
                  </div>
                </motion.div>
              </div>
            </section>
        </div>
      </DecorativeLayout>
    </div>
  );
}

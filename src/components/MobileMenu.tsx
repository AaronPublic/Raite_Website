"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  Home, 
  Trophy, 
  Mail, 
  User, 
  Shield, 
  Briefcase, 
  LogIn, 
  UserPlus,
  LayoutDashboard,
  Users,
  ClipboardList,
  Megaphone,
  FileText,
  BarChart3,
  Settings
} from "lucide-react";
import { Button } from "./ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  userId: string | null;
  userRole: string | null;
}

export default function MobileMenu({ userId, userRole }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close menu when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Competitions", href: "/competitions", icon: Trophy },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Activate Membership", href: "https://docs.google.com/forms/d/e/1FAIpQLSem1wHAV_OFiGYfygqFzZ-X4-vgsROcPf-DQyvuTODRDOkndQ/viewform", icon: UserPlus },
  ];

  const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, role: "ADMIN" },
    { name: "Competitions", href: "/admin/competitions", icon: Trophy, role: "ADMIN" },
    { name: "Users", href: "/admin/users", icon: Users, role: "ADMIN" },
    { name: "Registrations", href: "/admin/registrations", icon: ClipboardList, role: "ADMIN" },
    { name: "Submissions", href: "/admin/submissions", icon: FileText, role: "ADMIN" },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone, role: "ADMIN" },
    { name: "Guidelines", href: "/admin/guidelines", icon: FileText, role: "ADMIN" },
    { name: "Reports", href: "/admin/reports", icon: BarChart3, role: "ADMIN" },
    { name: "Ranking", href: "/admin/ranking", icon: Trophy, role: "ADMIN" },
    { name: "Settings", href: "/admin/settings", icon: Settings, role: "ADMIN" },
    { name: "My Competitions", href: "/sub-admin/competitions", icon: Briefcase, role: "SUB_ADMIN" },
    { name: "Submissions", href: "/sub-admin/submissions", icon: FileText, role: "SUB_ADMIN" },
    { name: "My Registrations", href: "/registrations/my", icon: User, role: "SUB_ADMIN" },
    { name: "My Registrations", href: "/registrations/my", icon: User, role: "FACULTY_COACH" },
  ];

  const activeAdminLinks = adminLinks.filter(link => link.role === userRole);

  return (
    <div className="md:hidden flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-50 h-10 w-10 rounded-xl"
        aria-label="Toggle Menu"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md"
              onClick={toggleMenu}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xs border-l bg-background p-6 shadow-2xl"
            >
              <div className="flex flex-col h-full pt-20 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-6 pb-4 no-scrollbar">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Menu</p>
                    <nav className="flex flex-col gap-1">
                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        const isExternal = link.href.startsWith("http");

                        if (isExternal) {
                          return (
                            <a
                              key={link.name}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-sm font-bold transition-all text-foreground hover:bg-secondary"
                            >
                              <Icon className="h-5 w-5 text-primary" />
                              {link.name}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-4 rounded-2xl px-4 py-4 text-sm font-bold transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-foreground hover:bg-secondary"
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-primary"}`} />
                            {link.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {activeAdminLinks.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Management</p>
                      <nav className={cn(
                        "px-2",
                        activeAdminLinks.length > 1 ? "grid grid-cols-2 gap-2" : "flex flex-col gap-1"
                      )}>
                        {activeAdminLinks.map((link) => {
                          const Icon = link.icon;
                          const isActive = pathname === link.href;
                          const isCompact = activeAdminLinks.length > 1;

                          return (
                            <Link
                              key={link.name}
                              href={link.href}
                              className={cn(
                                "flex items-center transition-all duration-300",
                                isCompact 
                                  ? "flex-col justify-center gap-2 rounded-2xl p-4 text-[10px] font-black uppercase text-center border border-border/50" 
                                  : "gap-4 rounded-2xl px-4 py-4 text-sm font-bold",
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary"
                                  : "text-foreground hover:bg-secondary bg-secondary/20"
                              )}
                            >
                              <Icon className={cn(
                                "h-5 w-5",
                                isActive ? "text-white" : "text-primary"
                              )} />
                              <span className="truncate w-full">{link.name}</span>
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  )}

                  {!userId && (
                    <div className="space-y-4 px-2 pt-4">
                      <SignInButton mode="modal">
                        <Button variant="outline" className="w-full justify-start gap-4 h-14 rounded-2xl border-border bg-transparent text-sm font-bold">
                          <LogIn className="h-5 w-5 text-primary" />
                          Sign In
                        </Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button className="w-full justify-start gap-4 h-14 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">
                          <UserPlus className="h-5 w-5 text-white" />
                          Register Now
                        </Button>
                      </SignUpButton>
                    </div>
                  )}
                </div>

                <div className="shrink-0 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4 px-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-foreground">RAITE 2026</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">PSITE Region III</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

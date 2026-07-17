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
  Settings,
  ShieldAlert
} from "lucide-react";
import { Button } from "./ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

interface MobileMenuProps {
  userId: string | null;
  userRole: string | null;
  userApproved: boolean;
}

export default function MobileMenu({ userId, userRole, userApproved }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
                            <button
                              key={link.name}
                              onClick={() => {
                                setIsOpen(false);
                                setShowConfirmModal(true);
                              }}
                              className="flex items-center gap-4 rounded-2xl px-4 py-4 text-sm font-bold transition-all text-foreground hover:bg-secondary w-full text-left bg-transparent border-none cursor-pointer"
                            >
                              <Icon className="h-5 w-5 text-primary" />
                              {link.name}
                            </button>
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
                          // Gray out My Registrations for unapproved Faculty Coaches
                          const isDisabled = link.role === "FACULTY_COACH" && link.name === "My Registrations" && !userApproved;

                          if (isDisabled) {
                            return (
                              <div
                                key={link.name}
                                title="Your account must be approved by an Admin before you can access registrations."
                                className={cn(
                                  "flex items-center transition-all duration-300 cursor-not-allowed select-none",
                                  isCompact
                                    ? "flex-col justify-center gap-2 rounded-2xl p-4 text-[10px] font-black uppercase text-center border border-border/50"
                                    : "gap-4 rounded-2xl px-4 py-4 text-sm font-bold",
                                  "text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/30"
                                )}
                              >
                                <ShieldAlert className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                                <span className="truncate w-full">{link.name}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 dark:text-gray-700">(Pending Approval)</span>
                              </div>
                            );
                          }

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

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                External Redirection
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                You are about to open the external Google Form to activate your membership. Do you want to proceed?
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4">
            <Button 
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="w-full sm:w-auto rounded-xl font-bold h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowConfirmModal(false);
                window.open("https://docs.google.com/forms/d/e/1FAIpQLSem1wHAV_OFiGYfygqFzZ-X4-vgsROcPf-DQyvuTODRDOkndQ/viewform", "_blank", "noopener,noreferrer");
              }}
              className="w-full sm:w-auto px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

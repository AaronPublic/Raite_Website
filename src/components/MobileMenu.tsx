"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Trophy, Mail, User, Shield, Briefcase, LogIn, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

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
  ];

  const adminLinks = [
    { name: "Admin Dashboard", href: "/admin/dashboard", icon: Shield, role: "ADMIN" },
    { name: "My Competitions", href: "/sub-admin/competitions", icon: Briefcase, role: "SUB_ADMIN" },
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
              <div className="flex flex-col h-full pt-20">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Menu</p>
                    <nav className="flex flex-col gap-1">
                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
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
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4">Management</p>
                      <nav className="flex flex-col gap-1">
                        {activeAdminLinks.map((link) => {
                          const Icon = link.icon;
                          const isActive = pathname === link.href;
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

                <div className="mt-auto pt-10 border-t border-border/50">
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

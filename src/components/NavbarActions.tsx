"use client";

// Fix: Hydration mismatch workaround for Clerk components in Next.js 16
// Unique ID: v2-clerk-hydration-fix

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeUserButton } from "./SafeUserButton";
import { ShieldAlert } from "lucide-react";

interface NavbarActionsProps {
  userId: string | null;
  userRole: string | null;
  userApproved: boolean;
}

export default function NavbarActions({ userId, userRole, userApproved }: NavbarActionsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3" suppressHydrationWarning>
        <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3" suppressHydrationWarning>
      {userRole === "FACULTY_COACH" && (
        userApproved ? (
          <Link
            href="/registrations/my"
            className="hidden items-center justify-center rounded-full border border-border bg-secondary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-accent/20 sm:inline-flex"
          >
            My Registrations
          </Link>
        ) : (
          <div
            title="Your account must be approved by an Admin before you can access registrations."
            className="hidden items-center justify-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 cursor-not-allowed sm:inline-flex select-none"
          >
            <ShieldAlert className="w-3 h-3" />
            My Registrations
          </div>
        )
      )}

      {userRole === "ADMIN" && (
        <Link
          href="/admin/dashboard"
          className="hidden items-center justify-center sm:inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Admin
        </Link>
      )}

      {userRole === "SUB_ADMIN" && (
        <div className="hidden items-center gap-3 sm:inline-flex">
          <Link
            href="/sub-admin/competitions"
            className="inline-flex items-center justify-center rounded-full border border-blue-600/20 bg-blue-600/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
          >
            My Competitions
          </Link>
          <Link
            href="/registrations/my"
            className="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-accent/20"
          >
            My Registrations
          </Link>
        </div>
      )}

      {!userId ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="hidden rounded-full px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary hover:text-primary sm:inline-flex"
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              size="sm"
              className="hidden sm:inline-flex h-10 rounded-full border-primary bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_10px_20px_rgba(0,56,168,0.22)] hover:bg-[#002673] sm:px-6"
            >
              Register
            </Button>
          </SignUpButton>
        </div>
      ) : (
        <div className="flex items-center">
          <SafeUserButton afterSignOutUrl="/" />
        </div>
      )}
    </div>
  );
}

"use client";

// Fix: Hydration mismatch workaround for Clerk components in Next.js 16
// Unique ID: v2-clerk-hydration-fix

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeUserButton } from "./SafeUserButton";

interface NavbarActionsProps {
  userId: string | null;
  userRole: string | null;
}

export default function NavbarActions({ userId, userRole }: NavbarActionsProps) {
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
        <Link 
          href="/registrations/my" 
          className="hidden rounded-full border border-border bg-secondary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-accent/20 sm:inline-flex"
        >
          My Registrations
        </Link>
      )}

      {userRole === "ADMIN" && (
        <Link 
          href="/admin/dashboard" 
          className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Admin
        </Link>
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
              className="h-10 rounded-full border-primary bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_10px_20px_rgba(0,56,168,0.22)] hover:bg-[#002673] sm:px-6"
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

import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import NavItems from "./NavItems";

export default async function Navbar() {
  try {
    const { userId } = await auth();
    const user = userId ? await getUserByClerkId(userId) : null;

    return (
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-white/95 dark:bg-[#07142F]/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,56,168,0.08)] transition-colors duration-300">
        <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true">
          <span className="flex-1 bg-primary" />
          <span className="flex-1 bg-accent" />
          <span className="flex-1 bg-destructive" />
        </div>

        <div className="container mx-auto px-4 h-20 pt-1.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="transition-opacity hover:opacity-80">
            <div className="relative size-12">
              <Image
                src="/RAITE.png"
                alt="RAITE Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Links (Client Component for active indicator) */}
          <NavItems />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {user?.role === "FACULTY_COACH" && (
              <Link href="/registrations/my" className="hidden rounded-full border border-border bg-secondary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-accent/20 sm:inline-flex">
                My Registrations
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <Link href="/admin/dashboard" className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                Admin
              </Link>
            )}

            {!userId ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="hidden rounded-full px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary hover:text-primary sm:inline-flex">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="h-10 rounded-full border-primary bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_10px_20px_rgba(0,56,168,0.22)] hover:bg-[#002673] sm:px-6">
                    Register
                  </Button>
                </SignUpButton>
              </div>
            ) : (
              <UserButton />
            )}
          </div>
        </div>
      </nav>
    );
  } catch (error) {
    console.error("Navbar: Error rendering Navbar:", error);
    return (
      <nav className="border-b bg-background h-16 flex items-center px-4">
        <span className="text-red-500">Error loading Navbar</span>
      </nav>
    );
  }
}

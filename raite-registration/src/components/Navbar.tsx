import Link from "next/link";
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
      <nav className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-lg font-black tracking-tighter text-gray-900 dark:text-white">
            RAITE<span className="text-blue-600">.</span>
          </Link>

          {/* Desktop Links (Client Component for active indicator) */}
          <NavItems />

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {user?.role === "FACULTY_COACH" && (
              <Link href="/registrations/my" className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                My Registrations
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Admin
              </Link>
            )}

            {!userId ? (
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full px-6 h-9 text-xs font-black uppercase tracking-widest hover:opacity-90">
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
      <nav className="border-b bg-white dark:bg-gray-950 h-16 flex items-center px-4">
        <span className="text-red-500">Error loading Navbar</span>
      </nav>
    );
  }
}

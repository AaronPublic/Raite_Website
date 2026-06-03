import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";

export default async function Navbar() {
  console.log("Navbar: Starting execution");
  try {
    const { userId } = await auth();
    console.log("Navbar: userId =", userId);
    
    const user = userId ? await getUserByClerkId(userId) : null;
    console.log("Navbar: user found =", !!user);

    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-white/70 dark:bg-gray-950/70 backdrop-blur-md transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            RAITE Registration
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/register/step-1" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Register
            </Link>
            {user?.role === "ADMIN" && (
              <Link href="/admin/dashboard" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Admin
              </Link>
            )}
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden md:block" />
            
            <ThemeToggle />
            
            {!userId ? (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="hidden md:flex">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5">Sign Up</Button>
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

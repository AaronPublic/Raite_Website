import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/data/users";
import { ThemeToggle } from "./ThemeToggle";
import NavItems from "./NavItems";
import NavbarActions from "./NavbarActions";
import MobileMenu from "./MobileMenu";

export default async function Navbar() {
  try {
    const { userId } = await auth();
    const user = userId ? await getUserByClerkId(userId) : null;

    return (
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-white dark:bg-[#07142F] shadow-[0_10px_30px_rgba(0,56,168,0.08)] transition-colors duration-300">
        <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true">
          <span className="flex-1 bg-primary" />
          <span className="flex-1 bg-accent" />
          <span className="flex-1 bg-destructive" />
        </div>

        <div className="container mx-auto px-4 h-20 pt-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="transition-opacity hover:opacity-80">
              <div className="relative w-12 h-12" style={{ position: 'relative', width: '3rem', height: '3rem' }}>
                <Image
                  src="/RAITE.png"
                  alt="RAITE Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="48px"
                />
              </div>
            </Link>

            {/* Desktop Links (Client Component for active indicator) */}
            <NavItems userRole={user?.role || null} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NavbarActions userId={userId} userRole={user?.role || null} />
            <MobileMenu userId={userId} userRole={user?.role || null} />
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

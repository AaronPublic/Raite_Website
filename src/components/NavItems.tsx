"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemsProps {
  userRole: string | null;
}

export default function NavItems({ userRole }: NavItemsProps) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Competitions", href: "/competitions" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <div className="hidden md:flex items-center gap-1 rounded-full border border-border bg-secondary/80 p-1 shadow-inner">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link 
            key={link.name} 
            href={link.href} 
            className={`flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-white dark:hover:bg-white/10 hover:text-primary"
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </div>
  );
}

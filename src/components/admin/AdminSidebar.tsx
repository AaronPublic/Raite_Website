"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  ClipboardList, 
  Megaphone, 
  BarChart3,
  ChevronRight,
  ShieldAlert,
  Settings,
  FileText,
  CreditCard,
  School,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeUserButton } from "@/components/SafeUserButton";

export function AdminSidebar({ user }: { user: { name: string | null; role: string } }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/competitions", label: "Competitions", icon: Trophy },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/schools", label: "Manage Schools", icon: School },
    { href: "/admin/coaches", label: "Faculty Coaches", icon: UserCheck },
    { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
    { href: "/admin/submissions", label: "Submissions", icon: FileText },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/guidelines", label: "Guidelines", icon: FileText },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/ranking", label: "Ranking", icon: Trophy },
    { href: "/admin/billing", label: "Billing", icon: CreditCard },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-10 border-b dark:border-gray-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
          <ShieldAlert className="w-24 h-24 text-blue-600" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">RAITE Admin</h2>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em]">Command Unit</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between group p-3.5 rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
              )}
            >
              <div className="flex items-center gap-4">
                <link.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                )} />
                <span className={cn(
                  "text-sm font-bold transition-colors",
                  isActive ? "text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                )}>{link.label}</span>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 transition-all",
                isActive ? "text-white opacity-100" : "text-gray-300 dark:text-gray-700 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
              )} />
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
          <div className="ring-2 ring-blue-500/20 rounded-full p-0.5 shrink-0">
            <SafeUserButton />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-gray-900 dark:text-white truncate">{user.name || "Administrator"}</span>
            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">System Access Level 4</span>
          </div>
        </div>
      </div>
    </div>
  );
}

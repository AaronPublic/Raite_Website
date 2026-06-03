import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/data/users";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  ClipboardList, 
  Megaphone, 
  BarChart3,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getUserByClerkId(userId);

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/competitions", label: "Competitions", icon: Trophy },
    { href: "/admin/participants", label: "Participants", icon: Users },
    { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-950 transition-colors duration-300">
      <aside className="w-80 border-r dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sticky top-0 h-screen shadow-2xl shadow-blue-600/5 overflow-hidden z-40">
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
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className="flex items-center justify-between group p-4 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <link.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{link.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </Link>
          ))}
        </nav>

        <div className="p-8 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
            <div className="ring-2 ring-blue-500/20 rounded-full p-0.5">
              <UserButton afterSignOutUrl="/" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-gray-900 dark:text-white truncate">{user.name || "Administrator"}</span>
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">System Access Level 4</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-16 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

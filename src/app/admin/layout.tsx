import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/data/users";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

async function AdminNavContainer() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getUserByClerkId(userId);

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const userData = {
    name: user.name,
    role: user.role,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 border-r dark:border-gray-800 bg-white dark:bg-gray-900 flex-col h-full shadow-2xl shadow-blue-600/5 overflow-hidden z-40 sticky top-0">
        <AdminSidebar user={userData} />
      </aside>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-64px)] bg-gray-50/50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      <Suspense fallback={<div className="hidden lg:flex w-80 bg-muted animate-pulse" />}>
        <AdminNavContainer />
      </Suspense>

      <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 scroll-smooth">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1750px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import SubAdminRegistrationsTable from "@/components/sub-admin/SubAdminRegistrationsTable";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SubAdminEventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkId: userId as string } });

  if (!user) redirect("/sign-in");

  const event = await db.event.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          user: true,
          event: true,
          coach: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) notFound();

  // Security check: Is this sub-admin assigned to this event?
  if (event.subAdminId !== user.id) {
    redirect("/sub-admin/competitions");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link href="/sub-admin/competitions" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to my competitions
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            Registrations for {event.title}
            <Badge variant="outline" className="text-xs font-black uppercase tracking-widest text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/50 shrink-0">
              {event.registrations.length} Total
            </Badge>
          </h1>
          <p className="text-gray-500 text-sm">Review and manage participant registrations.</p>
        </div>
      </div>

      <SubAdminRegistrationsTable initialData={event.registrations as any} eventId={id} />
    </div>
  );
}

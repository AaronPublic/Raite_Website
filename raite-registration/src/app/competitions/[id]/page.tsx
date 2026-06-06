import { getEventById } from "@/lib/data/events";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Info, BookOpen, ArrowLeft, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  const user = await currentUser();

  if (!event) {
    notFound();
  }

  // Fetch user role from DB
  let userRole = "PARTICIPANT";
  if (user) {
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });
    if (dbUser) userRole = dbUser.role;
  }

  const isOpen = event.status === "UPCOMING";
  const canRegister = userRole === "FACULTY_COACH" || userRole === "ADMIN";

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-gray-900 dark:text-gray-100">
      <Link href="/competitions" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Competitions
      </Link>

      <div className="grid gap-12">
        {event.imageUrl && (
          <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              {event.category && (
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
                  {event.category}
                </Badge>
              )}
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                {event.title}
              </h1>
            </div>
            <Badge 
              variant={isOpen ? "default" : "secondary"} 
              className={cn(
                "text-lg py-1 px-4 border",
                isOpen 
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-700" 
                  : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700"
              )}
            >
              {isOpen ? "Registration Open" : "Registration Closed"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold">{new Date(event.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Reg. Limit</p>
                <p className="text-sm font-semibold">{event.maxRegistrations || "∞"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Team Size</p>
                <p className="text-sm font-semibold">{event.maxParticipantsPerRegistration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold">{event.status}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Mechanics & Rules
              </h2>
              <a
                href={event.rulesPdfUrl || "/assets/mechanics-and-rules.pdf"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="bg-blue-50/50 dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 leading-relaxed transition-all hover:bg-blue-100/50 dark:hover:bg-gray-750 hover:border-blue-200 hover:shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 leading-tight">Download / View Mechanics & Rules (PDF)</h3>
                      <p className="text-sm text-blue-600/70 dark:text-blue-300/70">
                        {event.rulesPdfUrl 
                          ? "Click to open the official guidelines for this competition" 
                          : "Click to open the general guidelines in a new tab"}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-blue-400 dark:text-blue-500 group-hover:text-blue-600 transition-colors" />
                </div>
              </a>
            </div>
          </div>

          <aside>
            <div className="sticky top-24 p-6 bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-gray-800 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-xl font-bold">Ready to compete?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Ensure you have all the necessary requirements ready before proceeding with the registration.
              </p>
              
              {isOpen ? (
                user ? (
                  canRegister ? (
                    <Button className="w-full h-12 text-lg font-bold">
                      <Link href={`/register/step-1?eventId=${event.id}`}>
                        Register Team
                      </Link>
                    </Button>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-semibold">
                      Registration is only allowed for Faculty Coaches. Please contact your coach.
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <Button className="w-full h-12 text-lg font-bold">
                      <Link href="/sign-in">Sign in to register</Link>
                    </Button>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 italic">
                      Registration requires a verified faculty account.
                    </p>
                  </div>
                )
              ) : (
                <Button disabled className="w-full h-12 text-lg font-bold">
                  Registration Closed
                </Button>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

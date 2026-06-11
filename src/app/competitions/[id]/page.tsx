import { getEventById } from "@/lib/data/events";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Calendar, Users, Info, BookOpen, ArrowLeft, FileText, ExternalLink, Eye, Download } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getSystemSetting } from "@/lib/data/settings";

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

  // Fetch general guidelines as fallback
  const generalGuidelinesUrl = await getSystemSetting("GENERAL_GUIDELINES_URL");
  const rulesUrl = event.rulesPdfUrl || generalGuidelinesUrl || "/assets/mechanics-and-rules.pdf";

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
      <Link href="/competitions" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-8 group">
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
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary" />
            <div className="absolute bottom-2 left-0 right-0 h-1 bg-accent" />
          </div>
        )}

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              {event.category && (
                <Badge variant="outline" className="text-primary border-border bg-secondary">
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
              <Calendar className="w-5 h-5 text-primary" />
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
              <Users className="w-5 h-5 text-accent-foreground" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Team Size</p>
                <p className="text-sm font-semibold">{event.maxParticipantsPerRegistration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Info className="w-5 h-5 text-destructive" />
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
                <BookOpen className="w-6 h-6 text-primary" />
                Mechanics & Rules
              </h2>
              
              <div className="bg-secondary dark:bg-gray-800 p-8 rounded-[2rem] border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl text-primary border border-border shadow-sm shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Competition Guidelines</h3>
                    <p className="text-sm text-muted-foreground font-medium">Official mechanics, rules, and technical requirements for this event.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <a
                    href={rulesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-14 rounded-xl font-bold border-2 group transition-all hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                    )}
                  >
                    <Eye className="w-5 h-5 transition-transform group-hover:scale-110" />
                    View Rules
                  </a>
                  <a
                    href={rulesUrl}
                    download={`RAITE_2026_${event.title.replaceAll(" ", "_")}_Rules.pdf`}
                    className={cn(
                      buttonVariants(),
                      "h-14 rounded-xl font-bold shadow-lg shadow-primary/20 group transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    )}
                  >
                    <Download className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>

          <aside>
            <div className="sticky top-24 p-6 bg-white dark:bg-gray-900 border-2 border-border rounded-2xl shadow-xl space-y-6">
              <h3 className="text-xl font-bold">Ready to compete?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Ensure you have all the necessary requirements ready before proceeding with the registration.
              </p>
              
              {isOpen ? (
                user ? (
                  canRegister ? (
                    <Link 
                      href={`/register/step-2?eventId=${event.id}`}
                      className={cn(buttonVariants(), "w-full h-12 text-lg font-bold flex items-center justify-center")}
                    >
                      Register Team
                    </Link>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-semibold">
                      Registration is only allowed for Faculty Coaches. Please contact your coach.
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <Link 
                      href="/sign-in"
                      className={cn(buttonVariants(), "w-full h-12 text-lg font-bold flex items-center justify-center")}
                    >
                      Sign in to register
                    </Link>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 italic">
                      Registration requires a verified faculty account.
                    </p>
                  </div>
                )
              ) : (
                <button 
                  disabled 
                  className={cn(buttonVariants({ variant: "secondary" }), "w-full h-12 text-lg font-bold opacity-50 cursor-not-allowed")}
                >
                  Registration Closed
                </button>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

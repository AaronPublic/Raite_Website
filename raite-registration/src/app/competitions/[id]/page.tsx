import { getEventById } from "@/lib/data/events";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Info, BookOpen, ArrowLeft, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

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
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/competitions" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-8 group">
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
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                  {event.category}
                </Badge>
              )}
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                {event.title}
              </h1>
            </div>
            <Badge variant={isOpen ? "default" : "secondary"} className="text-lg py-1 px-4">
              {isOpen ? "Registration Open" : "Registration Closed"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold">{new Date(event.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Reg. Limit</p>
                <p className="text-sm font-semibold">{event.maxRegistrations || "∞"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Team Size</p>
                <p className="text-sm font-semibold">{event.maxParticipantsPerRegistration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
              <Info className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold">{event.status}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Mechanics & Rules
              </h2>
              <a
                href={event.rulesPdfUrl || "/assets/mechanics-and-rules.pdf"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-gray-700 leading-relaxed transition-all hover:bg-blue-100/50 hover:border-blue-200 hover:shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 leading-tight">Download / View Mechanics & Rules (PDF)</h3>
                      <p className="text-sm text-blue-600/70">
                        {event.rulesPdfUrl 
                          ? "Click to open the official guidelines for this competition" 
                          : "Click to open the general guidelines in a new tab"}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-blue-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </a>
            </div>
          </div>

          <aside>
            <div className="sticky top-24 p-6 bg-white border-2 border-blue-50 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-xl font-bold">Ready to compete?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Ensure you have all the necessary requirements ready before proceeding with the registration.
              </p>
              
              {isOpen ? (
                user ? (
                  canRegister ? (
                    <Button asChild className="w-full h-12 text-lg font-bold">
                      <Link href={`/register/step-1?eventId=${event.id}`}>
                        Register Team
                      </Link>
                    </Button>
                  ) : (
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm font-semibold">
                      Registration is only allowed for Faculty Coaches. Please contact your coach.
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <Button asChild className="w-full h-12 text-lg font-bold">
                      <Link href="/sign-in">Sign in to register</Link>
                    </Button>
                    <p className="text-center text-xs text-gray-400 italic">
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

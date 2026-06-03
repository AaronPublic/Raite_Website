import { getEventById } from "@/lib/data/events";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Info, BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

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

  const isOpen = event.status === "UPCOMING";

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Capacity</p>
                <p className="text-sm font-semibold">{event.capacity || "Unlimited"}</p>
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
                <Info className="w-6 h-6 text-blue-600" />
                Description
              </h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {event.description || "No description provided for this competition."}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Mechanics & Rules
              </h2>
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.rules || "The rules for this competition will be announced soon."}
              </div>
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
                  <Button asChild className="w-full h-12 text-lg font-bold">
                    <Link href={`/register/step-1?event=${event.id}`}>
                      Register Now
                    </Link>
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Button asChild className="w-full h-12 text-lg font-bold">
                      <Link href="/sign-in">Sign in to register</Link>
                    </Button>
                    <p className="text-center text-xs text-gray-400 italic">
                      Registration requires a verified student account.
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

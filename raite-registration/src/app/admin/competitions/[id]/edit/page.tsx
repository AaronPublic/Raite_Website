import { getEventById } from "@/lib/data/events";
import CompetitionForm from "@/components/admin/CompetitionForm";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-4">
        <Link href="/admin/competitions" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to competitions
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Competition</h1>
          <p className="text-gray-500">Update the details for "{event.title}".</p>
        </div>
      </div>

      <CompetitionForm initialData={event} />
    </div>
  );
}

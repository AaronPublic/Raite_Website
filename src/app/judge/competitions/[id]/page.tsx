import { getJudgeCompetitionSubmissions } from "@/app/actions/judging";
import CompetitionSubmissionsClient from "@/components/judge/CompetitionSubmissionsClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JudgeCompetitionPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const data = await getJudgeCompetitionSubmissions(id);
    return (
      <CompetitionSubmissionsClient
        event={data.event}
        rubric={data.rubric}
        submissions={data.submissions}
      />
    );
  } catch (error: any) {
    console.error("Failed to load competition submissions:", error);
    notFound();
  }
}

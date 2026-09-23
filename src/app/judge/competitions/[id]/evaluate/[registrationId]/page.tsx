import { getSubmissionForEvaluation } from "@/app/actions/judging";
import RubricEvaluationForm from "@/components/judge/RubricEvaluationForm";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
    registrationId: string;
  }>;
}

export default async function JudgeEvaluatePage({ params }: PageProps) {
  const { registrationId } = await params;

  try {
    const data = await getSubmissionForEvaluation(registrationId);
    return (
      <RubricEvaluationForm
        registration={data.registration}
        rubric={data.rubric}
        existingScore={data.existingScore}
      />
    );
  } catch (error: any) {
    console.error("Failed to load submission for evaluation:", error);
    notFound();
  }
}

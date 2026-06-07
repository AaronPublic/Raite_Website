import ReviewStep from "@/components/registration/ReviewStep";

export default function Step4Page() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Final Review</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-lg">Verify your details before submitting your registration.</p>
      </div>
      
      <div className="bento-card p-8">
        <ReviewStep />
      </div>
    </div>
  );
}

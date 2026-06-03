import ReviewStep from "@/components/registration/ReviewStep";

export default function Step4Page() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Step 4: Final Review</h2>
        <p className="text-gray-500">Please double-check all information before submitting.</p>
      </div>
      
      <ReviewStep />
    </div>
  );
}

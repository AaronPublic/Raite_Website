import RequirementsForm from "@/components/registration/RequirementsForm";

export default function Step3Page() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Step 3: Upload Requirements</h2>
        <p className="text-gray-500">Provide the necessary documents for verification.</p>
      </div>
      
      <RequirementsForm />
    </div>
  );
}

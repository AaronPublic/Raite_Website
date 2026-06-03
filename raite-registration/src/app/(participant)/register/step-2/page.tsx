import TeamForm from "@/components/registration/TeamForm";

export default function Step2Page() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Step 2: Team Information</h2>
        <p className="text-gray-500">Tell us who is participating.</p>
      </div>
      
      <TeamForm />
    </div>
  );
}

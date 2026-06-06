import TeamForm from "@/components/registration/TeamForm";

export default function Step2Page() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Team Information</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-lg">Enter your team name and add participating members to your registration.</p>
      </div>
      
      <div className="bento-card p-8">
        <TeamForm />
      </div>
    </div>
  );
}

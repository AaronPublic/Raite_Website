import DocumentsForm from "@/components/registration/DocumentsForm";

export default function Step3Page() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Required Documents</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-lg">Please provide links to your necessary verification documents.</p>
      </div>
      
      <div className="bento-card p-8">
        <DocumentsForm />
      </div>
    </div>
  );
}

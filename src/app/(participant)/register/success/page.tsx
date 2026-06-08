import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="bg-green-100 p-4 rounded-full">
        <CheckCircle2 className="w-16 h-16 text-green-600" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Registration Submitted!</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Thank you for registering. Your application is now being reviewed by our team. 
          You will receive an email confirmation shortly.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Return Home
        </Link>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "default" }))}>
          View My Registrations
        </Link>
      </div>
    </div>
  );
}

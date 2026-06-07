"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
      <div className="p-4 bg-red-50 rounded-full text-red-600">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h2>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          We encountered an unexpected error while loading this page. This has been logged for our team to review.
        </p>
      </div>
      <Button onClick={() => reset()} className="gap-2">
        <RefreshCcw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}

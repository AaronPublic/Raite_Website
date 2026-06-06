"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Trophy, Users, FileCheck, Loader2 } from "lucide-react";
import { useWizard } from "./WizardProvider";
import { submitRegistration } from "@/app/actions/registration";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function ReviewStep() {
  const { data, isReady, clearData } = useWizard();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && !data.eventId) {
      router.push("/register/step-1");
    }
  }, [isReady, data.eventId, router]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-bold">Loading...</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitRegistration({
        eventId: data.eventId!,
        teamName: data.teamName,
        members: data.members || [],
        requirements: data.requirements || {},
      });

      if (result.success) {
        clearData();
        router.push("/register/success");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const reqs = data.requirements as Record<string, string>;

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <div className="grid gap-8">
        <Card className="rounded-[2rem] border-2 border-gray-100 bg-white p-8">
          <CardTitle className="text-xl font-black mb-4">Competition Details</CardTitle>
          <p className="font-bold text-2xl">{data.eventTitle}</p>
        </Card>

        <Card className="rounded-[2rem] border-2 border-gray-100 bg-white p-8">
          <CardTitle className="text-xl font-black mb-4">Team Information</CardTitle>
          <p className="font-bold">Team: {data.teamName || "N/A"}</p>
          <p className="font-bold">Members: {data.members?.join(", ")}</p>
        </Card>

        <Card className="rounded-[2rem] border-2 border-gray-100 bg-white p-8">
          <CardTitle className="text-xl font-black mb-4">Required Documents</CardTitle>
          <div className="space-y-2">
            {Object.entries(reqs || {}).map(([key, value]) => (
              <p key={key} className="font-bold capitalize">
                {key.replace(/([A-Z])/g, " $1")}:{" "}
                <a href={value} target="_blank" className="text-blue-600 hover:underline break-all">
                  {value}
                </a>
              </p>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-between pt-8 border-t">
        <Button variant="ghost" onClick={() => router.push("/register/step-3")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 text-white rounded-full px-8">
          {isSubmitting ? "Submitting..." : "Finalize Registration"}
          <CheckCircle className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

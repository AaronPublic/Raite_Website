"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Trophy, Users, FileCheck, Loader2 } from "lucide-react";
import { useWizard } from "./WizardProvider";
import { submitRegistration } from "@/app/actions/registration";
import { getEligibleParticipants } from "@/app/actions/participants";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ParticipantInfo {
  name: string | null;
  uniqueId: string | null;
  email: string;
}

export default function ReviewStep() {
  const { data, isReady, clearData } = useWizard();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantDetails, setParticipantInfo] = useState<ParticipantInfo[]>([]);

  useEffect(() => {
    if (isReady && !data.eventId) {
      router.push("/register/step-1");
    }
  }, [isReady, data.eventId, router]);

  useEffect(() => {
    async function resolveParticipants() {
      if (data.members && data.members.length > 0) {
        try {
          const allEligible = await getEligibleParticipants();
          const details = data.members.map(email => {
            const match = allEligible.find(p => p.email === email);
            return {
              email,
              name: match?.name || "Unknown",
              uniqueId: match?.uniqueId || "N/A"
            };
          });
          setParticipantInfo(details);
        } catch (err) {
          console.error("Error resolving participant names:", err);
        }
      }
    }
    if (isReady) resolveParticipants();
  }, [isReady, data.members]);

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
    setError(null);
    try {
      const finalRequirements = { ...(data.requirements || {}) };
      if (data.eventSubcategory === "ONSITE_PAGEANT") {
        if (data.repName) finalRequirements.repName = data.repName;
        if (data.repContact) finalRequirements.repContact = data.repContact;
        if (data.repEmail) finalRequirements.repEmail = data.repEmail;
      }

      const result = await submitRegistration({
        eventId: data.eventId!,
        teamName: data.teamName,
        members: data.members || [],
        requirements: finalRequirements,
      });

      if (result.success) {
        clearData();
        router.push("/");
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reqs = data.requirements as Record<string, string>;

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <div className="grid gap-8">
        <Card className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-sm">
          <CardTitle className="text-xl font-black mb-4 dark:text-white">Competition Details</CardTitle>
          <p className="font-bold text-2xl text-gray-900 dark:text-white">{data.eventTitle}</p>
        </Card>

        <Card className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-sm">
          <CardTitle className="text-xl font-black mb-4 dark:text-white">Team Information</CardTitle>
          <div className="space-y-4">
            <p className="font-bold text-lg text-gray-900 dark:text-white">Team: {data.teamName || "N/A"}</p>
            
            {data.eventSubcategory === "ONSITE_PAGEANT" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">School Representative</p>
                <div className="space-y-1">
                  <p className="font-black text-gray-900 dark:text-white">{data.repName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1.5 uppercase tracking-tighter">Email: {data.repEmail}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">Members</p>
              {participantDetails.map((p, i) => (
                <div key={i} className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <span className="font-black text-gray-900 dark:text-white">{p.name}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tighter">ID: {p.uniqueId}</span>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{p.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-sm">
          <CardTitle className="text-xl font-black mb-4 dark:text-white">Required Documents</CardTitle>
          <div className="space-y-2">
            {Object.entries(reqs || {}).map(([key, value]) => (
              <p key={key} className="font-bold capitalize text-gray-900 dark:text-white">
                {key.replace(/([A-Z])/g, " $1")}:{" "}
                <a href={value} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                  {value}
                </a>
              </p>
            ))}
          </div>
        </Card>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-xl font-bold">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-8 border-t">
        <Button variant="ghost" onClick={() => router.push("/register/step-2")}>
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

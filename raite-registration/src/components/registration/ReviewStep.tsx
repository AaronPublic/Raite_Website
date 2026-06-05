"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, AlertCircle, Trophy, Users, FileCheck, Loader2 } from "lucide-react";
import { useWizard } from "./WizardProvider";
import { submitRegistration } from "@/app/actions/registration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ReviewStep() {
  const { data, isReady, clearData } = useWizard();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !data.eventId) {
      router.push("/register/step-1");
    }
  }, [isReady, data.eventId, router]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-bold">Loading your registration...</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
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
      } else {
        setError(result.error || "Submission failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Review Registration</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Please double-check all details before final submission.</p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 font-bold"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </motion.div>
      )}

      <div className="grid gap-8">
        {/* Competition Section */}
        <Card className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-black tracking-tight">Competition Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest text-blue-600">Selected Event</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {data.eventTitle || "Loading event details..."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-black tracking-tight">Team Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest text-purple-600">Registration Type</p>
              <Badge variant="outline" className="rounded-full px-4 py-1.5 border-purple-200 text-purple-700 bg-purple-50 font-bold">
                {data.teamName ? `Team: ${data.teamName}` : "Individual Participant"}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-widest text-purple-600">Members ({data.members?.length || 0})</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.members?.map((email, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 font-medium text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    {email}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Section */}
        <Card className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-black tracking-tight">Documents & Files</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {data.requirements && Object.keys(data.requirements).length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {Object.entries(data.requirements).map(([key, url]) => (
                  <div key={key} className="space-y-3">
                    <p className="text-sm font-black uppercase tracking-widest text-green-600">
                      {key === "studentId" ? "Student ID / Proof" : key}
                    </p>
                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 group">
                      {url.endsWith(".pdf") ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-2">
                          <FileCheck className="w-8 h-8 text-green-600" />
                          <span className="text-xs font-bold text-gray-500">PDF Document Uploaded</span>
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          alt={key} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white text-black rounded-full text-xs font-black shadow-xl"
                        >
                          View Full File
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 font-bold border-2 border-red-100">
                <AlertCircle className="w-5 h-5" />
                No documents uploaded
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t dark:border-gray-800">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/register/step-3")}
          className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full px-6 order-2 sm:order-1"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !data.eventId}
          className={cn(
            "rounded-full px-12 h-14 font-black transition-all shadow-2xl flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto",
            "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:scale-105 active:scale-95"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Finalize Registration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

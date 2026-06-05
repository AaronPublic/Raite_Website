"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useWizard } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, ArrowRight, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { isUserInOtherTeam } from "@/app/actions/registration";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const teamSchema = z.object({
  teamName: z.string().optional(),
  members: z.array(z.string().email("Invalid email")).min(1, "At least one member email is required"),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function TeamForm() {
  const { data, isReady, updateData } = useWizard();
  const router = useRouter();
  const [validating, setValidating] = useState<Record<number, boolean>>({});
  const [memberErrors, setMemberErrors] = useState<Record<number, string>>({});

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      teamName: data.teamName || "",
      members: data.members || [""],
    },
  });

  // Sync form with wizard data when isReady
  useEffect(() => {
    if (isReady) {
      reset({
        teamName: data.teamName || "",
        members: data.members && data.members.length > 0 ? data.members : [""],
      });
    }
  }, [isReady, data.teamName, data.members, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  const watchedMembers = watch("members");

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

  const validateMember = async (index: number, email: string) => {
    if (!email || !z.string().email().safeParse(email).success || !data.eventId) {
      setMemberErrors(prev => ({ ...prev, [index]: "" }));
      return;
    }

    setValidating(prev => ({ ...prev, [index]: true }));
    try {
      const isDuplicate = await isUserInOtherTeam(data.eventId, email);
      if (isDuplicate) {
        setMemberErrors(prev => ({ ...prev, [index]: "This participant is already registered for another team in this competition." }));
      } else {
        setMemberErrors(prev => ({ ...prev, [index]: "" }));
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setValidating(prev => ({ ...prev, [index]: false }));
    }
  };

  const onSubmit = (values: TeamFormValues) => {
    if (Object.values(memberErrors).some(err => !!err)) return;
    updateData(values);
    router.push("/register/step-3");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="teamName" className="text-sm font-bold uppercase tracking-wider text-gray-500">Team Name (Optional)</Label>
            <Input
              id="teamName"
              placeholder="e.g. The Innovators"
              {...register("teamName")}
              className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-600/20 transition-all text-lg font-medium"
            />
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">Team Members (Emails)</Label>
              <p className="text-xs text-gray-500 font-medium">Add all team members who will participate.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append("")}
              className="flex items-center gap-2 rounded-full border-blue-100 text-blue-600 hover:bg-blue-50 font-bold"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {fields.map((field, index) => (
                <motion.div 
                  key={field.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative"
                >
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input
                          placeholder={`Member ${index + 1} email address`}
                          {...register(`members.${index}` as const)}
                          onBlur={(e) => validateMember(index, e.target.value)}
                          className={cn(
                            "h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-600/20 transition-all pl-10",
                            memberErrors[index] ? "border-red-500 ring-2 ring-red-500/10" : ""
                          )}
                        />
                        <UserPlus className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        {validating[index] && (
                          <Loader2 className="absolute right-3.5 top-3.5 w-5 h-5 animate-spin text-blue-500" />
                        )}
                      </div>
                      
                      {errors.members?.[index] && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.members[index]?.message}
                        </p>
                      )}
                      
                      {memberErrors[index] && (
                        <p className="text-xs text-red-500 font-bold flex items-center gap-1.5 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {memberErrors[index]}
                        </p>
                      )}
                    </div>
                    
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          remove(index);
                          const newErrors = { ...memberErrors };
                          delete newErrors[index];
                          setMemberErrors(newErrors);
                        }}
                        className="mt-1 h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {errors.members?.root && (
            <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">{errors.members.root.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t dark:border-gray-800">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/register/step-1")}
          className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold"
          disabled={Object.values(validating).some(v => v) || Object.values(memberErrors).some(err => !!err)}
        >
          Continue to Step 3
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

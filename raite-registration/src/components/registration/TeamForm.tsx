"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useWizard } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, ArrowRight, UserPlus, AlertCircle, Loader2, Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { isUserInOtherTeam } from "@/app/actions/registration";
import { getEligibleParticipants } from "@/app/actions/participants";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const teamSchema = z.object({
  teamName: z.string().optional(),
  members: z.array(z.string().email("Invalid email")).min(1, "At least one member email is required"),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface EligibleParticipant {
  id: string;
  name: string | null;
  email: string;
  school: string | null;
  course: string | null;
  uniqueId: string | null;
}

export default function TeamForm() {
  const { data, isReady, updateData } = useWizard();
  const router = useRouter();
  const [validating, setValidating] = useState<Record<number, boolean>>({});
  const [memberErrors, setMemberErrors] = useState<Record<number, string>>({});
  const [eligibleParticipants, setEligibleParticipants] = useState<EligibleParticipant[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [popoversOpen, setPopoversOpen] = useState<Record<number, boolean>>({});

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    register,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      teamName: data.teamName || "",
      members: data.members || [""],
    },
  });

  const memberValues = watch("members");

  // Load eligible participants
  useEffect(() => {
    async function load() {
      try {
        const participants = await getEligibleParticipants();
        setEligibleParticipants(participants);
      } catch (err) {
        console.error("Failed to load eligible participants:", err);
      } finally {
        setLoadingEligible(false);
      }
    }
    load();
  }, []);

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
    control: control as any,
    name: "members" as any,
  });

  useEffect(() => {
    if (isReady && !data.eventId) {
      router.push("/register/step-1");
    }
  }, [isReady, data.eventId, router]);

  if (!isReady || loadingEligible) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-bold">Preparing registration form...</p>
      </div>
    );
  }

  const validateMember = async (index: number, email: string) => {
    if (!email || !z.string().email().safeParse(email).success || !data.eventId) {
      setMemberErrors(prev => ({ ...prev, [index]: "" }));
      return;
    }

    // Check for duplicates within the current form
    const isDuplicateInForm = memberValues.some((val, i) => val === email && i !== index);
    if (isDuplicateInForm) {
      setMemberErrors(prev => ({ ...prev, [index]: "This participant is already added to your team." }));
      return;
    }

    // Check if the email is in the eligible list
    const isEligible = eligibleParticipants.some(p => p.email === email);
    if (!isEligible) {
      setMemberErrors(prev => ({ ...prev, [index]: "This participant is not pre-registered in the system. Please register them first." }));
      return;
    }

    setValidating(prev => ({ ...prev, [index]: true }));
    try {
      const isDuplicateInDB = await isUserInOtherTeam(data.eventId, email);
      if (isDuplicateInDB) {
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
    updateData({ ...values });
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
              <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">Team Members</Label>
              <p className="text-xs text-gray-500 font-medium">Select participants from your school list.</p>
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
                      <Popover 
                        open={!!popoversOpen[index]} 
                        onOpenChange={(open) => setPopoversOpen(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={!!popoversOpen[index]}
                            className={cn(
                              "w-full h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 justify-between px-4 transition-all text-left overflow-hidden hover:border-blue-400/50",
                              memberErrors[index] ? "border-red-500 ring-2 ring-red-500/10" : "",
                              !memberValues[index] && "text-gray-400"
                            )}
                          >

                            <div className="flex items-center gap-3 truncate">
                              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <UserPlus className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={cn("truncate font-black text-lg leading-tight", memberValues[index] ? "text-gray-900 dark:text-white" : "text-gray-400")}>
                                  {memberValues[index] 
                                    ? eligibleParticipants.find(p => p.email === memberValues[index])?.name || memberValues[index]
                                    : `Select member ${index + 1}`}
                                </span>
                                {memberValues[index] && (
                                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                    ID: {eligibleParticipants.find(p => p.email === memberValues[index])?.uniqueId}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[450px] p-0 rounded-2xl shadow-2xl border-gray-100 dark:border-gray-800 overflow-hidden" align="start">
                          <Command className="rounded-2xl">
                            <CommandInput placeholder="Search by student name, ID or email..." className="h-14 text-lg" />
                            <CommandList className="max-h-[400px]">
                              <CommandEmpty className="p-6 text-gray-500 font-medium">No participants found in your school records.</CommandEmpty>
                              <CommandGroup heading="Pre-registered Participants" className="px-2">
                                {eligibleParticipants
                                  .filter(p => !memberValues.includes(p.email) || memberValues[index] === p.email)
                                  .map((participant) => (
                                    <CommandItem
                                      key={participant.id}
                                      value={`${participant.name} ${participant.email} ${participant.uniqueId} ${participant.course}`}
                                      onSelect={() => {
                                        setValue(`members.${index}`, participant.email);
                                        validateMember(index, participant.email);
                                        setPopoversOpen(prev => ({ ...prev, [index]: false }));
                                      }}
                                      className="p-4 rounded-xl mb-1 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 cursor-pointer transition-colors"
                                    >
                                    <div className="flex items-center gap-4 w-full">
                                      <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm",
                                        memberValues[index] === participant.email 
                                          ? "bg-blue-600 text-white" 
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                      )}>
                                        {participant.name?.charAt(0) || "?"}
                                      </div>
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-lg text-gray-900 dark:text-white leading-tight truncate">
                                            {participant.name}
                                          </span>
                                          <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-black border-blue-200 text-blue-600 bg-blue-50">
                                            {participant.uniqueId}
                                          </Badge>
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                                          {participant.email}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                          {participant.course}
                                        </span>
                                      </div>
                                      {memberValues[index] === participant.email && (
                                        <Check className="h-5 w-5 text-blue-600 shrink-0" />
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex items-center gap-2">
                        {validating[index] && (
                          <div className="flex items-center gap-2 text-xs text-blue-500 font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Validating eligibility...
                          </div>
                        )}
                        
                        {errors.members?.[index] && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.members[index]?.message}
                          </p>
                        )}
                        
                        {memberErrors[index] && (
                          <p className="text-xs text-red-500 font-bold flex items-center gap-1.5 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg w-full">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {memberErrors[index]}
                          </p>
                        )}
                      </div>
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
          className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full px-6"
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

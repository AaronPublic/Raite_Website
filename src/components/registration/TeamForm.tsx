"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useWizard } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, ArrowRight, UserPlus, AlertCircle, Loader2, Check, ChevronDown, Info, Search as SearchIcon, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { isUserInOtherTeam, validateParticipantLimits, getEventDetailsForRegistration } from "@/app/actions/registration";
import { getEligibleParticipants } from "@/app/actions/participants";
import { getCoachSchool, getCurrentCoach } from "@/app/actions/user";
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

interface EligibleParticipant {
  id: string;
  name: string | null;
  email: string;
  school: string | null;
  course: string | null;
  uniqueId: string | null;
}

interface CoachDetails {
  id: string;
  name: string | null;
  email: string;
  school: string | null;
}

export default function TeamForm() {
  const { data, isReady, updateData } = useWizard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [validating, setValidating] = useState<Record<number, boolean>>({});
  const [memberErrors, setMemberErrors] = useState<Record<number, string>>({});
  const [eligibleParticipants, setEligibleParticipants] = useState<EligibleParticipant[]>([]);
  const [coachDetails, setCoachDetails] = useState<CoachDetails | null>(null);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [popoversOpen, setPopoversOpen] = useState<Record<string, boolean>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isCheckingLimits, setIsCheckingLimits] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Handle eventId from URL if not in wizard
  useEffect(() => {
    async function init() {
      if (isReady) {
        const eventIdParam = searchParams.get("eventId");
        if (eventIdParam && data.eventId !== eventIdParam) {
          try {
            const event = await getEventDetailsForRegistration(eventIdParam);
            if (event && event.status === "UPCOMING") {
              updateData({
                eventId: event.id,
                eventTitle: event.title,
                eventCategory: event.category || undefined,
                eventSubcategory: event.subcategory || undefined,
                maxParticipantsPerRegistration: event.maxParticipantsPerRegistration
              });
            }
          } catch (err) {
            console.error("Failed to fetch event details:", err);
          }
        }
        setIsInitializing(false);
      }
    }
    init();
  }, [isReady, data.eventId, searchParams, updateData]);

  const teamSchema = z.object({
    teamName: z.string().optional(),
    members: z.array(z.string().email("Invalid email")).length(data.maxParticipantsPerRegistration || 1, `Exactly ${data.maxParticipantsPerRegistration || 1} members are required`),
    repSelectedEmail: z.string().optional(),
    repName: z.string().optional(),
    repEmail: z.string().optional(),
  });

  type TeamFormValues = z.infer<typeof teamSchema>;

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
      members: data.members || Array(data.maxParticipantsPerRegistration || 1).fill(""),
      repSelectedEmail: data.repEmail || "",
      repName: data.repName || "",
      repEmail: data.repEmail || "",
    },
  });

  const memberValues = watch("members");
  const repSelectedEmail = watch("repSelectedEmail");

  // Load eligible participants and coach details
  useEffect(() => {
    async function load() {
      try {
        const [participants, coach] = await Promise.all([
          getEligibleParticipants(),
          getCurrentCoach()
        ]);
        setEligibleParticipants(participants);
        setCoachDetails(coach);
      } catch (err) {
        console.error("Failed to load required data:", err);
      } finally {
        setLoadingEligible(false);
      }
    }
    load();
  }, []);

  // Sync form with wizard data when isReady
  useEffect(() => {
    if (isReady) {
      const initialMembers = data.members && data.members.length === (data.maxParticipantsPerRegistration || 1) 
        ? data.members 
        : Array(data.maxParticipantsPerRegistration || 1).fill("");
        
      reset({
        teamName: data.teamName || "",
        members: initialMembers,
        repSelectedEmail: data.repEmail || "",
        repName: data.repName || "",
        repEmail: data.repEmail || "",
      });
    }
  }, [isReady, data.teamName, data.members, data.maxParticipantsPerRegistration, data.repName, data.repEmail, reset]);

  const { fields } = useFieldArray({
    control: control as any,
    name: "members" as any,
  });

  useEffect(() => {
    if (isReady && !isInitializing && !data.eventId) {
      router.push("/register/step-1");
    }
  }, [isReady, isInitializing, data.eventId, router]);

  if (!isReady || loadingEligible || isInitializing) {
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

  const onSubmit = async (values: TeamFormValues) => {
    if (Object.values(memberErrors).some(err => !!err)) return;
    setGlobalError(null);
    setIsCheckingLimits(true);

    try {
      // Validate participant limits before proceeding
      const limitResult = await validateParticipantLimits(data.eventId!, values.members);
      if (limitResult.error) {
        setGlobalError(limitResult.error);
        setIsCheckingLimits(false);
        return;
      }

      let finalTeamName = values.teamName;
      if (!finalTeamName || finalTeamName.trim() === "") {
        const school = await getCoachSchool();
        if (school) {
          finalTeamName = school;
        }
      }

      // Resolve Representative Info
      let finalRepName = "";
      let finalRepEmail = "";

      if (data.eventSubcategory === "ONSITE_PAGEANT") {
        if (values.repSelectedEmail) {
          const selected = eligibleParticipants.find(p => p.email === values.repSelectedEmail);
          if (selected) {
            finalRepName = selected.name || "";
            finalRepEmail = selected.email;
          }
        } else if (coachDetails) {
          // Fallback to coach
          finalRepName = coachDetails.name || "";
          finalRepEmail = coachDetails.email;
        }
      }

      updateData({ 
        ...values, 
        teamName: finalTeamName,
        repName: finalRepName,
        repEmail: finalRepEmail
      });
      router.push("/register/step-3");
    } catch (err: any) {
      setGlobalError(err.message || "Failed to validate registration limits.");
    } finally {
      setIsCheckingLimits(false);
    }
  };

  const setPopover = (key: string, open: boolean) => {
    setPopoversOpen(prev => ({ ...prev, [key]: open }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
      {globalError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-700">{globalError}</p>
        </motion.div>
      )}

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
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight flex items-center gap-1.5 px-1">
              <Info className="w-3 h-3" />
              Note: If left blank, your school or institution name will be used as the team name.
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">Team Members</Label>
              <p className="text-xs text-gray-500 font-medium">Select participants from your school list.</p>
            </div>
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
                        open={!!popoversOpen[`member-${index}`]} 
                        onOpenChange={(open) => setPopover(`member-${index}`, open)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={!!popoversOpen[`member-${index}`]}
                            className={cn(
                              "w-full h-16 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 justify-between px-4 transition-all text-left overflow-hidden hover:border-blue-500/50 hover:shadow-md group",
                              (memberErrors[index] || errors.members?.[index]) ? "border-red-500 ring-4 ring-red-500/10" : "focus:ring-4 focus:ring-blue-500/10",
                              !memberValues[index] && "text-gray-400"
                            )}
                          >
                            <div className="flex items-center gap-4 truncate">
                              <div className={cn(
                                "p-2.5 rounded-xl shadow-sm transition-all group-hover:scale-110",
                                memberValues[index] ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-gray-900 text-blue-600"
                              )}>
                                <UserPlus className="w-6 h-6 shrink-0" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={cn("truncate font-black text-lg tracking-tight leading-tight", memberValues[index] ? "text-gray-900 dark:text-white" : "text-gray-400")}>
                                  {memberValues[index] 
                                    ? eligibleParticipants.find(p => p.email === memberValues[index])?.name || memberValues[index]
                                    : `Add member ${index + 1}`}
                                </span>
                                {memberValues[index] ? (
                                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                    <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
                                       SELECTED
                                    </Badge>
                                    ID: {eligibleParticipants.find(p => p.email === memberValues[index])?.uniqueId}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                     Required for registration
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg group-hover:bg-blue-50 transition-colors">
                              <ChevronDown className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[450px] p-0 rounded-[2rem] shadow-2xl border-gray-100 dark:border-gray-800 overflow-hidden" align="start">
                          <Command className="rounded-[2rem] border-0 shadow-none">
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-b">
                              <div className="flex items-center gap-3 px-3 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 focus-within:border-blue-500 transition-all">
                                <SearchIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                <CommandInput 
                                  placeholder="Search for a student..." 
                                  className="h-14 border-0 bg-transparent focus:ring-0 text-lg font-medium" 
                                />
                              </div>
                            </div>
                            <CommandList className="max-h-[400px] p-3 no-scrollbar">
                              <CommandEmpty className="py-12 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                   <UserPlus className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="text-center px-6">
                                  <p className="text-gray-900 dark:text-white font-black text-xl">No matches found</p>
                                  <p className="text-gray-500 text-sm mt-1">We couldn't find any pre-registered students matching your search.</p>
                                </div>
                              </CommandEmpty>
                              <CommandGroup heading="Pre-registered Participants" className="px-1 pb-2 pt-4 **:[[cmdk-group-heading]]:font-black **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-[0.2em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:mb-3 **:[[cmdk-group-heading]]:px-2">
                                {eligibleParticipants
                                  .filter(p => !memberValues.includes(p.email) || memberValues[index] === p.email)
                                  .map((participant) => (
                                    <CommandItem
                                      key={participant.id}
                                      value={`${participant.name} ${participant.email} ${participant.uniqueId} ${participant.course}`}
                                      onSelect={() => {
                                        setValue(`members.${index}`, participant.email, { shouldValidate: true });
                                        validateMember(index, participant.email);
                                        setPopover(`member-${index}`, false);
                                      }}
                                      className="p-3 rounded-2xl mb-2 bg-gray-100/50 dark:bg-gray-800/50 border-2 border-transparent data-selected:bg-blue-50/50 dark:data-selected:bg-blue-900/20 data-selected:border-blue-100 dark:data-selected:border-blue-800/50 data-selected:shadow-sm cursor-pointer transition-all group/item"
                                    >
                                    <div className="flex items-center gap-4 w-full">
                                      <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg transition-all shadow-sm",
                                        memberValues[index] === participant.email 
                                          ? "bg-blue-600 text-white shadow-md" 
                                          : "bg-white dark:bg-gray-900 text-gray-500 group-data-selected/item:text-blue-600"
                                      )}>
                                        {participant.name?.charAt(0) || "?"}
                                      </div>
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            "font-black text-lg tracking-tight leading-tight truncate",
                                            memberValues[index] === participant.email ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200 group-data-selected/item:text-blue-700"
                                          )}>
                                            {participant.name}
                                          </span>
                                          <Badge variant="outline" className={cn(
                                            "h-5 px-1.5 text-[9px] font-black transition-colors",
                                            memberValues[index] === participant.email ? "bg-blue-600 text-white border-transparent" : "text-blue-600 border-blue-200 bg-blue-50/50"
                                          )}>
                                            {participant.uniqueId}
                                          </Badge>
                                        </div>
                                        <span className={cn(
                                          "text-sm font-medium truncate opacity-70 mt-0.5",
                                          memberValues[index] === participant.email ? "text-gray-500" : "text-gray-500 group-data-selected/item:text-blue-600/70"
                                        )}>
                                          {participant.email}
                                        </span>
                                        <div className={cn(
                                          "text-[10px] uppercase tracking-[0.1em] font-black mt-1 flex items-center gap-2",
                                          memberValues[index] === participant.email ? "text-blue-600" : "text-gray-400 group-data-selected/item:text-blue-500"
                                        )}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                                          {participant.course}
                                        </div>
                                      </div>
                                      {memberValues[index] === participant.email && (
                                        <div className="bg-blue-600 p-1.5 rounded-full shadow-lg shadow-blue-600/20">
                                          <Check className="h-4 w-4 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex items-center gap-2 min-h-[1.5rem]">
                        {validating[index] && (
                          <div className="flex items-center gap-2 text-xs text-blue-500 font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Validating eligibility...
                          </div>
                        )}
                        
                        {(errors.members?.[index] || memberErrors[index]) && (
                          <p className="text-xs text-red-500 font-bold flex items-center gap-1.5 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg w-full">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {errors.members?.[index]?.message || memberErrors[index]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {data.eventSubcategory === "ONSITE_PAGEANT" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-6 border-t dark:border-gray-800"
            >
              <div className="space-y-1">
                <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">School Representative</Label>
                <p className="text-xs text-gray-500 font-medium text-justify">Select a registered participant to act as the official representative. If left blank, you (the coach) will be designated as the representative.</p>
              </div>

              <div className="space-y-4">
                <Popover 
                  open={!!popoversOpen['rep']} 
                  onOpenChange={(open) => setPopover('rep', open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={!!popoversOpen['rep']}
                      className={cn(
                        "w-full h-20 rounded-[2rem] bg-blue-50/30 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-800/50 justify-between px-6 transition-all text-left overflow-hidden hover:border-blue-500/50 hover:shadow-lg group",
                        !repSelectedEmail && "text-gray-400"
                      )}
                    >
                      <div className="flex items-center gap-4 truncate">
                        <div className={cn(
                          "p-3 rounded-2xl shadow-sm transition-all group-hover:scale-110",
                          repSelectedEmail ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-900 text-blue-600 border border-blue-50"
                        )}>
                          <UserCheck className="w-6 h-6 shrink-0" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={cn("truncate font-black text-xl tracking-tight leading-tight", repSelectedEmail ? "text-gray-900 dark:text-white" : "text-gray-500")}>
                            {repSelectedEmail 
                              ? eligibleParticipants.find(p => p.email === repSelectedEmail)?.name || repSelectedEmail
                              : `Designate School Representative`}
                          </span>
                          {repSelectedEmail ? (
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                              ID: {eligibleParticipants.find(p => p.email === repSelectedEmail)?.uniqueId} • OFFICIAL REP
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                               Optional: Click to select a participant
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0 rounded-[2.5rem] shadow-2xl border-gray-100 dark:border-gray-800 overflow-hidden" align="start">
                    <Command className="rounded-[2.5rem] border-0 shadow-none">
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-b">
                        <div className="flex items-center gap-3 px-3 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 focus-within:border-blue-500 transition-all">
                          <SearchIcon className="h-5 w-5 text-gray-400 shrink-0" />
                          <CommandInput 
                            placeholder="Search for a representative..." 
                            className="h-14 border-0 bg-transparent focus:ring-0 text-lg font-medium" 
                          />
                        </div>
                      </div>
                      <CommandList className="max-h-[400px] p-3 no-scrollbar">
                        <CommandEmpty className="py-12 flex flex-col items-center gap-4">
                          <p className="text-gray-900 dark:text-white font-black text-xl">No participants found</p>
                        </CommandEmpty>
                        <CommandGroup heading="Available Participants" className="px-1 pb-2 pt-4 **:[[cmdk-group-heading]]:font-black **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-[0.2em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:mb-3 **:[[cmdk-group-heading]]:px-2">
                          {/* Option to clear selection */}
                          {repSelectedEmail && (
                             <CommandItem
                               onSelect={() => {
                                 setValue('repSelectedEmail', '', { shouldValidate: true });
                                 setPopover('rep', false);
                               }}
                               className="p-3 rounded-2xl mb-2 text-red-600 font-bold hover:bg-red-50 cursor-pointer transition-all"
                             >
                               Remove Representative (Default to Coach)
                             </CommandItem>
                          )}
                          {eligibleParticipants
                            .map((participant) => (
                              <CommandItem
                                key={participant.id}
                                value={`${participant.name} ${participant.email} ${participant.uniqueId} ${participant.school}`}
                                onSelect={() => {
                                  setValue(`repSelectedEmail`, participant.email, { shouldValidate: true });
                                  setPopover('rep', false);
                                }}
                                className="p-3 rounded-2xl mb-2 bg-gray-100/50 dark:bg-gray-800/50 border-2 border-transparent data-selected:bg-blue-50/50 dark:data-selected:bg-blue-900/20 data-selected:border-blue-100 dark:data-selected:border-blue-800/50 data-selected:shadow-sm cursor-pointer transition-all group/item"
                              >
                              <div className="flex items-center gap-4 w-full">
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg transition-all shadow-sm",
                                  repSelectedEmail === participant.email 
                                    ? "bg-blue-600 text-white shadow-md" 
                                    : "bg-white dark:bg-gray-900 text-gray-500 group-data-selected/item:text-blue-600"
                                )}>
                                  {participant.name?.charAt(0) || "?"}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "font-black text-lg tracking-tight leading-tight truncate",
                                      repSelectedEmail === participant.email ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200 group-data-selected/item:text-blue-700"
                                    )}>
                                      {participant.name}
                                    </span>
                                    <Badge variant="outline" className={cn(
                                      "h-5 px-1.5 text-[9px] font-black transition-colors",
                                      repSelectedEmail === participant.email ? "bg-blue-600 text-white border-transparent" : "text-blue-600 border-blue-200 bg-blue-50/50"
                                    )}>
                                      {participant.uniqueId}
                                    </Badge>
                                  </div>
                                  <span className={cn(
                                    "text-sm font-medium truncate opacity-70 mt-0.5",
                                    repSelectedEmail === participant.email ? "text-gray-500" : "text-gray-500 group-data-selected/item:text-blue-600/70"
                                  )}>
                                    {participant.email}
                                  </span>
                                  <div className={cn(
                                    "text-[10px] uppercase tracking-[0.1em] font-black mt-1 flex items-center gap-2",
                                    repSelectedEmail === participant.email ? "text-blue-600" : "text-gray-400 group-data-selected/item:text-blue-500"
                                  )}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                                    {participant.school}
                                  </div>
                                </div>
                                {repSelectedEmail === participant.email && (
                                  <div className="bg-blue-600 p-1.5 rounded-full shadow-lg shadow-blue-600/20">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {!repSelectedEmail && coachDetails && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Current Designee (Coach)</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{coachDetails.name}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

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
        <div className="flex flex-col items-end gap-2">
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold"
            disabled={Object.values(validating).some(v => v) || Object.values(memberErrors).some(err => !!err) || isCheckingLimits}
          >
            {isCheckingLimits ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Continue to Step 3
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          {Object.keys(errors).length > 0 && (
            <p className="text-[10px] font-black uppercase text-red-500 animate-pulse">Please complete all required fields</p>
          )}
        </div>
      </div>
    </form>
  );
}

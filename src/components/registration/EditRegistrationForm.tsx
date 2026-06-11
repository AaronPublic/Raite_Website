"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save, UserPlus, ChevronDown, Check, AlertCircle, Search as SearchIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { submitRegistration, isUserInOtherTeam } from "@/app/actions/registration";
import { getEligibleParticipants } from "@/app/actions/participants";
import { getCoachSchool } from "@/app/actions/user";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

export default function EditRegistrationForm({ 
  registration,
  eventRequirements,
  maxParticipants
}: { 
  registration: any;
  eventRequirements: string[];
  maxParticipants: number;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibleParticipants, setEligibleParticipants] = useState<any[]>([]);
  const [validating, setValidating] = useState<Record<number, boolean>>({});
  const [memberErrors, setMemberErrors] = useState<Record<number, string>>({});
  const [popoversOpen, setPopoversOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    console.log("EditRegistrationForm registration:", registration);
    async function loadParticipants() {
      const participants = await getEligibleParticipants();
      setEligibleParticipants(participants);
    }
    loadParticipants();
  }, [registration]);

  const editSchema = useMemo(() => z.object({
    teamName: z.string().optional(),
    members: z.array(z.string().email("Invalid email"))
      .length(maxParticipants, `Exactly ${maxParticipants} team members are required`),
    requirements: z.record(z.string(), z.string().url("Must be a valid URL")),
  }), [maxParticipants]);

  type EditFormValues = z.infer<typeof editSchema>;

  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      teamName: registration.teamName || "",
      members: registration.members && registration.members.length === maxParticipants 
        ? registration.members 
        : Array(maxParticipants).fill(""),
      requirements: registration.requirements || {},
    },
  });

  const memberEmails = watch("members");

  const validateMember = async (index: number, email: string) => {
    if (!email || !z.string().email().safeParse(email).success) {
      setMemberErrors(prev => ({ ...prev, [index]: "" }));
      return;
    }

    const isDuplicateInForm = memberEmails.some((val, i) => val === email && i !== index);
    if (isDuplicateInForm) {
      setMemberErrors(prev => ({ ...prev, [index]: "This participant is already added to your team." }));
      return;
    }

    const isEligible = eligibleParticipants.some(p => p.email === email);
    if (!isEligible) {
      setMemberErrors(prev => ({ ...prev, [index]: "This participant is not pre-registered in your school." }));
      return;
    }

    setValidating(prev => ({ ...prev, [index]: true }));
    try {
      const isDuplicateInDB = await isUserInOtherTeam(registration.eventId, email);
      if (isDuplicateInDB) {
        setMemberErrors(prev => ({ ...prev, [index]: "Already registered for another team." }));
      } else {
        setMemberErrors(prev => ({ ...prev, [index]: "" }));
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setValidating(prev => ({ ...prev, [index]: false }));
    }
  };

  const onSubmit = async (values: EditFormValues) => {
    if (Object.values(memberErrors).some(err => !!err)) return;
    setIsSubmitting(true);
    
    let finalTeamName = values.teamName;
    if (!finalTeamName || finalTeamName.trim() === "") {
      const school = await getCoachSchool();
      if (school) {
        finalTeamName = school;
      }
    }

    try {
      const result = await submitRegistration({
        eventId: registration.eventId,
        ...values,
        teamName: finalTeamName,
      });

      if (result.success) {
        toast.success("Registration updated successfully");
        router.push("/registrations/my");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update registration");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="space-y-4">
        <Label className="font-bold uppercase text-xs text-gray-500">Team Name</Label>
        <Input {...register("teamName")} placeholder="Team Name" className="h-12 rounded-xl" />
      </div>

      <div className="space-y-4">
        <Label className="font-bold uppercase text-xs text-gray-500">Team Members</Label>
        <AnimatePresence mode="popLayout">
          {Array.from({ length: maxParticipants }).map((_, index) => {
            const email = memberEmails[index];
            const participant = eligibleParticipants.find(p => p.email === email);

            return (
              <motion.div key={index} layout className="group relative">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Popover open={!!popoversOpen[index]} onOpenChange={(open) => setPopoversOpen(prev => ({ ...prev, [index]: open }))}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={!!popoversOpen[index]}
                          className={cn(
                            "w-full h-16 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 justify-between px-4 transition-all text-left overflow-hidden hover:border-blue-500/50 hover:shadow-md group",
                            memberErrors[index] ? "border-red-500 ring-4 ring-red-500/10" : "focus:ring-4 focus:ring-blue-500/10"
                          )}
                        >
                          <div className="flex items-center gap-4 truncate">
                            <div className={cn(
                              "p-2.5 rounded-xl shadow-sm transition-all group-hover:scale-110",
                              participant ? "bg-blue-600 text-white" : "bg-gray-50 dark:bg-gray-900 text-blue-600"
                            )}>
                              <UserPlus className="w-6 h-6 shrink-0" />
                            </div>
                            <div className="flex flex-col min-w-0 text-left">
                                <span className={cn("truncate font-black text-lg tracking-tight leading-tight", participant ? "text-gray-900 dark:text-white" : "text-gray-400")}>
                                    {participant?.name || email || `Add member ${index + 1}`}
                                </span>
                                {participant ? (
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
                                         SELECTED
                                      </Badge>
                                      ID: {participant.uniqueId}
                                    </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                     Team member required
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
                                <p className="text-gray-500 text-sm mt-1">Check spelling or search for another student.</p>
                              </div>
                            </CommandEmpty>
                            <CommandGroup heading="Pre-registered Participants" className="px-1 pb-2 pt-4 **:[[cmdk-group-heading]]:font-black **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-[0.2em] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:mb-3 **:[[cmdk-group-heading]]:px-2">
                              {eligibleParticipants.map(p => (
                                <CommandItem key={p.email} onSelect={() => {
                                  setValue(`members.${index}`, p.email);
                                  validateMember(index, p.email);
                                  setPopoversOpen(prev => ({ ...prev, [index]: false }));
                                }}
                                className="p-3 rounded-2xl mb-2 bg-gray-100/50 dark:bg-gray-800/50 border-2 border-transparent data-selected:bg-blue-50/50 dark:data-selected:bg-blue-900/20 data-selected:border-blue-100 dark:data-selected:border-blue-800/50 data-selected:shadow-sm cursor-pointer transition-all group/item"
                                >
                                    <div className="flex items-center gap-4 w-full text-left">
                                      <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg transition-all shadow-sm",
                                        email === p.email 
                                          ? "bg-blue-600 text-white shadow-md" 
                                          : "bg-white dark:bg-gray-900 text-gray-500 group-data-selected/item:text-blue-600"
                                      )}>
                                        {p.name?.charAt(0) || "?"}
                                      </div>
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            "font-black text-lg tracking-tight leading-tight truncate",
                                            email === p.email ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200 group-data-selected/item:text-blue-700"
                                          )}>
                                            {p.name}
                                          </span>
                                          <Badge variant="outline" className={cn(
                                            "h-5 px-1.5 text-[9px] font-black transition-colors",
                                            email === p.email ? "bg-blue-600 text-white border-transparent" : "text-blue-600 border-blue-200 bg-blue-50/50"
                                          )}>
                                            {p.uniqueId}
                                          </Badge>
                                        </div>
                                        <span className={cn(
                                          "text-sm font-medium truncate opacity-70 mt-0.5",
                                          email === p.email ? "text-gray-500" : "text-gray-500 group-data-selected/item:text-blue-600/70"
                                        )}>
                                          {p.email}
                                        </span>
                                        <div className={cn(
                                          "text-[10px] uppercase tracking-[0.1em] font-black mt-1 flex items-center gap-2",
                                          email === p.email ? "text-blue-600" : "text-gray-400 group-data-selected/item:text-blue-500"
                                        )}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                                          {p.course}
                                        </div>
                                      </div>
                                      {email === p.email && (
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

                    {memberErrors[index] && <p className="text-xs text-red-500 font-bold">{memberErrors[index]}</p>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <Label className="font-bold uppercase text-xs text-gray-500">Requirements</Label>
        {eventRequirements.map((req) => (
          <div key={req} className="space-y-2">
            <Label className="text-xs">{req.replace(/([A-Z])/g, " $1")}</Label>
            <Input {...register(`requirements.${req}`)} placeholder="URL" className="h-12 rounded-xl" />
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isSubmitting || Object.values(memberErrors).some(err => !!err)} className="w-full h-12 rounded-xl font-bold bg-blue-600">
        {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
      </Button>
    </form>
  );
}


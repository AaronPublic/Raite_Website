"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save, UserPlus, ChevronDown, Check, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { submitRegistration, isUserInOtherTeam } from "@/app/actions/registration";
import { getEligibleParticipants } from "@/app/actions/participants";
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
      .min(1, "At least one member email is required")
      .max(maxParticipants, `Maximum of ${maxParticipants} team members allowed`),
    requirements: z.record(z.string().url("Must be a valid URL")),
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
      members: registration.members || [],
      requirements: registration.requirements || {},
    },
  });

  const memberEmails = watch("members");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members" as any,
  });

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
    try {
      const result = await submitRegistration({
        eventId: registration.eventId,
        ...values,
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
          {fields.map((field, index) => {
            const email = memberEmails[index];
            const participant = eligibleParticipants.find(p => p.email === email);

            return (
              <motion.div key={field.id} layout className="group relative">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Popover open={!!popoversOpen[index]} onOpenChange={(open) => setPopoversOpen(prev => ({ ...prev, [index]: open }))}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-14 rounded-2xl justify-between px-4",
                            memberErrors[index] ? "border-red-500" : ""
                          )}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            <div className="flex flex-col text-left">
                                <span className="font-bold truncate">
                                    {participant?.name || email || `Select member ${index + 1}`}
                                </span>
                                {participant && (
                                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">
                                        ID: {participant.uniqueId}
                                    </span>
                                )}
                            </div>
                          </div>
                          <ChevronDown className="ml-2 h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-0 rounded-2xl">
                        <Command>
                          <CommandInput placeholder="Search participants..." />
                          <CommandList>
                            <CommandEmpty>No participants found.</CommandEmpty>
                            <CommandGroup>
                              {eligibleParticipants.map(p => (
                                <CommandItem key={p.email} onSelect={() => {
                                  setValue(`members.${index}`, p.email);
                                  validateMember(index, p.email);
                                  setPopoversOpen(prev => ({ ...prev, [index]: false }));
                                }}>
                                    <div className="flex flex-col">
                                        <span className="font-bold">{p.name}</span>
                                        <span className="text-xs text-gray-500">{p.email} • {p.uniqueId}</span>
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

                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <Button type="button" onClick={() => append("")} className="rounded-xl w-full" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
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


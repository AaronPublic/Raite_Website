"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { completeProfile } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, AlertCircle, Sparkles, ArrowRight, School } from "lucide-react";
import type { SelectRootChangeEventDetails } from "@base-ui/react/select";
import { School as SchoolType } from "@prisma/client";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  school: z.string().min(2, "School name is required"),
  classification: z.enum(["Participant", "Faculty Coach"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileCompleteForm({ schools }: { schools: SchoolType[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await completeProfile(data);
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchoolChange = (value: string | null) => {
    if (!value) return;
    setValue("school", value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="px-10 space-y-6">
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              First Name
            </Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
              className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
            />
            {errors.firstName && (
              <p className="text-[10px] font-bold text-red-500 ml-1">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Last Name
            </Label>
            <Input
              id="lastName"
              placeholder="Doe"
              {...register("lastName")}
              className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
            />
            {errors.lastName && (
              <p className="text-[10px] font-bold text-red-500 ml-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="school-select" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
            Educational Institution
          </Label>
          <Select onValueChange={handleSchoolChange}>
            <SelectTrigger id="school-select" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-blue-600/20 font-medium px-4">
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <School className="w-4 h-4 text-gray-400 shrink-0" />
                <SelectValue placeholder="Select institution" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 max-h-[300px]">
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.name}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {errors.school && (
            <p className="text-[10px] font-bold text-red-500 ml-1">{errors.school.message}</p>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <Label htmlFor="classification" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
            Classification
          </Label>
          <Select onValueChange={(value) => setValue("classification", value as any)}>
            <SelectTrigger id="classification" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-blue-600/20 font-medium px-4">
              <SelectValue placeholder="Select classification" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
              <SelectItem value="Participant">Participant</SelectItem>
              <SelectItem value="Faculty Coach">Faculty Coach</SelectItem>
            </SelectContent>
          </Select>
          {errors.classification && (
            <p className="text-[10px] font-bold text-red-500 ml-1">{errors.classification.message}</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-10 pt-6">
        <Button 
          type="submit" 
          className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 group" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              PREPARING ACCESS...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              UNLOCK PLATFORM
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}

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
import { GraduationCap, BookOpen, School, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

const profileSchema = z.object({
  school: z.string().min(2, "School name is required"),
  classification: z.enum(["Participant", "Faculty Coach"], {
    errorMap: () => ({ message: "Please select a classification" }),
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const schools = [
  "AMA TARLAC",
  "ANGELES UNIVERSITY FOUNDATION",
  "BATAAN PENINSULA STATE UNIVERSITY",
  "BULACAN POLYTECHNIC COLLEGE",
  "BULACAN STATE UNIVERSITY – MAIN CAMPUS",
  "BULACAN STATE UNIVERSITY – SARMIENTO CAMPUS",
  "CENTRAL LUZON STATE UNIVERSITY",
  "CENTRO ESCOLAR UNIVERSITY MALOLOS",
  "DR. YANGA’S COLLEGE INC.",
  "EASTWOODS PROFESSIONAL COLLEGE OF SCIENCE AND TECHNOLOGY",
  "EXACT COLLEGES OF ASIA",
  "GUAGUA NATIONAL COLLEGES, INC.",
  "GORDON COLLEGE",
  "HOLY ANGEL UNIVERSITY",
  "HOLY CROSS COLLEGE",
  "LA CONSOLACION UNIVERSITY PHILIPPINES",
  "LA VERDAD CHRISTIAN COLLEGE",
  "MANUEL GALLEGO FOUNDATION COLLEGES, INC.",
  "NATIONAL UNIVERSITY BALIWAG",
  "NUEVA ECIJA UNIVERSITY OF SCIENCE AND TECHNOLOGY",
  "OUR LADY OF FATIMA UNIVERSITY - PAMPANGA",
  "PAMPANGA STATE AGRICULTURAL UNIVERSITY",
  "PAMPANGA STATE UNIVERSITY",
  "POLYTECHNIC COLLEGE OF BOTOLAN",
  "RICHWELL COLLEGES, INC.",
  "SANTA RITA COLLEGE OF PAMPANGA",
  "SYSTEMS PLUS COLLEGE FOUNDATION",
  "TARLAC STATE UNIVERSITY",
  "UNIVERSITY OF THE ASSUMPTION",
  "WESLEYAN UNIVERSITY-PHILIPPINES",
  "Others"
];

export default function ProfileCompletePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOtherSchool, setIsOtherSchool] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const handleSchoolChange = (value: string) => {
    if (value === "Others") {
      setIsOtherSchool(true);
      setValue("school", ""); // Clear to let user type
    } else {
      setIsOtherSchool(false);
      setValue("school", value);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-6 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl shadow-blue-600/5 overflow-hidden">
          <CardHeader className="p-10 pb-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Final Boarding Call
              </CardTitle>
              <CardDescription className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3" />
                Complete Your Identity
              </CardDescription>
            </div>
          </CardHeader>
          
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
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <AnimatePresence>
                  {isOtherSchool && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="pt-2 overflow-hidden"
                    >
                      <div className="relative">
                        <Input
                          id="school"
                          placeholder="Type your institution name"
                          {...register("school")}
                          className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 pl-10 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                        />
                        <School className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {errors.school && (
                  <p className="text-[10px] font-bold text-red-500 ml-1">{errors.school.message}</p>
                )}
              </div>

              <div className="space-y-2">
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
        </Card>
      </motion.div>
    </div>
  );
}

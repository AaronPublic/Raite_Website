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
import { GraduationCap, AlertCircle, Sparkles, ArrowRight, School, Loader2, FileUp, CheckCircle2 } from "lucide-react";
import type { SelectRootChangeEventDetails } from "@base-ui/react/select";
import { School as SchoolType } from "@prisma/client";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  school: z.string().min(2, "School name is required"),
  coachCertificateUrl: z.string().optional().nullable(),
  schoolIdUrl: z.string().optional().nullable(),
}).refine(data => data.coachCertificateUrl || data.schoolIdUrl, {
  message: "You must upload either a Coach Certification of Membership or a School ID.",
  path: ["coachCertificateUrl"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileCompleteForm({ schools }: { schools: SchoolType[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isUploadingSchoolId, setIsUploadingSchoolId] = useState(false);
  
  const [uploadedCertName, setUploadedCertName] = useState<string | null>(null);
  const [uploadedSchoolIdName, setUploadedSchoolIdName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      school: "",
      coachCertificateUrl: "",
      schoolIdUrl: ""
    }
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

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF, PNG, or JPEG file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setIsUploadingCert(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/coach-certificate", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload certificate");
      }
      
      setValue("coachCertificateUrl", result.url, { shouldValidate: true });
      setUploadedCertName(file.name);
    } catch (err: any) {
      console.error("Certificate upload error:", err);
      setError(err.message || "Failed to upload certificate. Please try again.");
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleSchoolIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF, PNG, or JPEG file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setIsUploadingSchoolId(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/school-id", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload School ID");
      }
      
      setValue("schoolIdUrl", result.url, { shouldValidate: true });
      setUploadedSchoolIdName(file.name);
    } catch (err: any) {
      console.error("School ID upload error:", err);
      setError(err.message || "Failed to upload School ID. Please try again.");
    } finally {
      setIsUploadingSchoolId(false);
    }
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

        {/* Notice Box for Verification Document */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 text-xs leading-relaxed space-y-1">
          <div className="font-black uppercase tracking-wider flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
            Verification Document Notice
          </div>
          <p className="font-medium text-gray-600 dark:text-gray-400">
            Coaches must upload a verification document to unlock the platform:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 font-bold text-gray-700 dark:text-gray-300">
            <li>If your school is a <span className="text-blue-600 dark:text-blue-400 underline decoration-dashed">MEMBER</span> institution, upload your <strong>Coach Certification of Membership</strong>.</li>
            <li>If your school is a <span className="text-blue-600 dark:text-blue-400 underline decoration-dashed">NON-MEMBER</span> institution, upload your official <strong>School ID</strong>.</li>
          </ul>
        </div>

        {/* 1. Coach Certification of Membership Upload */}
        <div className="space-y-2">
          <Label htmlFor="certificate-upload" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
            Coach Certification of Membership (.pdf, .png, .jpg, .jpeg)
          </Label>
          <div className="relative group">
            <input 
              id="certificate-upload" 
              type="file" 
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={handleCertificateUpload}
              disabled={isUploadingCert || isSubmitting}
              className="hidden"
            />
            <label
              htmlFor="certificate-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/20 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:border-blue-400 transition-colors p-6 cursor-pointer"
            >
              {isUploadingCert ? (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                  <span className="font-bold text-xs">Uploading certificate...</span>
                </div>
              ) : uploadedCertName ? (
                <div className="flex flex-col items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-8 h-8 mb-2" />
                  <span className="font-bold text-xs text-center break-all px-4">{uploadedCertName}</span>
                  <span className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">Click to replace file</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                  <FileUp className="w-8 h-8 mb-2" />
                  <span className="font-bold text-xs">Choose certificate or drag here</span>
                  <span className="text-[10px] text-gray-400 mt-1 font-bold">PDF, PNG, or JPG up to 5MB</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 2. School ID Upload */}
        <div className="space-y-2">
          <Label htmlFor="school-id-upload" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
            School ID (.pdf, .png, .jpg, .jpeg)
          </Label>
          <div className="relative group">
            <input 
              id="school-id-upload" 
              type="file" 
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={handleSchoolIdUpload}
              disabled={isUploadingSchoolId || isSubmitting}
              className="hidden"
            />
            <label
              htmlFor="school-id-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/20 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:border-blue-400 transition-colors p-6 cursor-pointer"
            >
              {isUploadingSchoolId ? (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                  <span className="font-bold text-xs">Uploading School ID...</span>
                </div>
              ) : uploadedSchoolIdName ? (
                <div className="flex flex-col items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-8 h-8 mb-2" />
                  <span className="font-bold text-xs text-center break-all px-4">{uploadedSchoolIdName}</span>
                  <span className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">Click to replace file</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                  <FileUp className="w-8 h-8 mb-2" />
                  <span className="font-bold text-xs">Choose School ID or drag here</span>
                  <span className="text-[10px] text-gray-400 mt-1 font-bold">PDF, PNG, or JPG up to 5MB</span>
                </div>
              )}
            </label>
          </div>
          {errors.coachCertificateUrl && (
            <p className="text-[10px] font-bold text-red-500 ml-1">{errors.coachCertificateUrl.message}</p>
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

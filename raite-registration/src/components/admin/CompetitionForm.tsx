"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventStatus } from "@prisma/client";
import { createCompetition, updateCompetition } from "@/app/actions/competitions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const competitionSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(2, "Category is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  capacity: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce.number().int().positive().nullable().optional()
  ),
  rules: z.string().optional(),
  rulesPdfUrl: z.string().optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  status: z.nativeEnum(EventStatus).default("UPCOMING"),
});

type CompetitionFormValues = z.infer<typeof competitionSchema>;

interface CompetitionFormProps {
  initialData?: any;
}

export default function CompetitionForm({ initialData }: CompetitionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: new Date(initialData.startDate).toISOString().split('T')[0],
      endDate: new Date(initialData.endDate).toISOString().split('T')[0],
      capacity: initialData.capacity ?? "",
      imageUrl: initialData.imageUrl || "",
      rulesPdfUrl: initialData.rulesPdfUrl || "",
    } : {
      title: "",
      description: "",
      category: "",
      startDate: "",
      endDate: "",
      capacity: "",
      rules: "",
      rulesPdfUrl: "",
      imageUrl: "",
      status: "UPCOMING",
    },
  });

  const imageUrl = form.watch("imageUrl");
  const rulesPdfUrl = form.watch("rulesPdfUrl");

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/rules", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload PDF");
      }
      
      form.setValue("rulesPdfUrl", result.url);
    } catch (err: any) {
      console.error("PDF upload error:", err);
      setError(err.message || "Failed to upload PDF. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: CompetitionFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const formattedData = {
      ...values,
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
      capacity: values.capacity === "" || values.capacity === undefined ? null : Number(values.capacity),
    };

    try {
      const result = initialData
        ? await updateCompetition(initialData.id, formattedData as any)
        : await createCompetition(formattedData as any);

      if (result.success) {
        router.push("/admin/competitions");
        router.refresh();
      } else {
        setError(result.error || "Failed to save competition. Please check all fields.");
      }
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="p-3 text-sm text-white bg-red-500 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competition Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hackathon 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Web Development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief overview of the competition" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Pinterest Style)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Link to a high-quality image for the competition card.</FormDescription>
                    <FormMessage />
                    {imageUrl && (
                      <div className="mt-4 relative aspect-[2/3] w-full max-w-[200px] overflow-hidden rounded-xl border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imageUrl} 
                          alt="Preview" 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x600?text=Invalid+URL";
                          }}
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Max participants" {...field} />
                    </FormControl>
                    <FormDescription>Leave empty for unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UPCOMING">Open (Upcoming)</SelectItem>
                        <SelectItem value="ONGOING">Ongoing</SelectItem>
                        <SelectItem value="COMPLETED">Closed (Completed)</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-lg font-bold">Mechanics & Rules (PDF)</FormLabel>
                  <p className="text-sm text-gray-500">Upload the official guidelines for this competition.</p>
                </div>
                {isUploading && (
                  <Badge variant="outline" className="animate-pulse bg-blue-50 text-blue-600 border-blue-200">
                    Uploading...
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {rulesPdfUrl ? (
                  <div className="flex items-center justify-between p-6 bg-blue-50/50 border-2 border-blue-100 rounded-2xl shadow-sm transition-all hover:bg-blue-50 hover:border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-600/20">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-blue-900 truncate max-w-[200px] md:max-w-md">
                          {rulesPdfUrl.split('/').pop()}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <p className="text-xs font-medium text-blue-600/70">Document successfully linked</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="text-blue-600 hover:bg-blue-100"
                      >
                        <a href={rulesPdfUrl} target="_blank" rel="noopener noreferrer">View</a>
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => form.setValue("rulesPdfUrl", "")}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50/50 transition-all group-hover:border-blue-300 group-hover:bg-blue-50/30 group-hover:shadow-inner">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Upload className="w-4 h-4 text-blue-400" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black text-gray-900">Processing Document...</p>
                            <p className="text-xs text-gray-500 mt-1">This will only take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-center">
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                            <Upload className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-700">Click or drag to upload rules PDF</p>
                            <p className="text-xs text-gray-500 mt-2">PDF files only • Maximum size 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="rulesPdfUrl"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update Competition" : "Create Competition"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

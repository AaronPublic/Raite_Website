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
import { Calendar } from "lucide-react";

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

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: new Date(initialData.startDate).toISOString().split('T')[0],
      endDate: new Date(initialData.endDate).toISOString().split('T')[0],
      capacity: initialData.capacity ?? "",
      imageUrl: initialData.imageUrl || "",
    } : {
      title: "",
      description: "",
      category: "",
      startDate: "",
      endDate: "",
      capacity: "",
      rules: "",
      imageUrl: "",
      status: "UPCOMING",
    },
  });

  const imageUrl = form.watch("imageUrl");

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
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mechanics & Rules</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter competition rules and mechanics..." 
                      className="min-h-[200px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Supports plain text and spacing.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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

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
import { Checkbox } from "@/components/ui/checkbox";
import { createAnnouncement, updateAnnouncement } from "@/app/actions/announcements";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  pinned: z.boolean().default(false),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementFormProps {
  initialData?: any;
}

export default function AnnouncementForm({ initialData }: AnnouncementFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      content: initialData.content,
      pinned: initialData.pinned,
    } : {
      title: "",
      content: "",
      pinned: false,
    },
  });

  const onSubmit = async (values: AnnouncementFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = initialData
        ? await updateAnnouncement(initialData.id, values)
        : await createAnnouncement(values);

      if (result.success) {
        router.push("/admin/announcements");
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="p-3 text-sm text-white bg-red-500 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="pt-6 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Announcement Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Registration Deadline Extended" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your announcement here..." 
                      className="min-h-[200px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Pin this announcement</FormLabel>
                    <FormDescription>
                      Pinned announcements will appear at the top of the home page.
                    </FormDescription>
                  </div>
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
            {isSubmitting ? "Saving..." : initialData ? "Update Announcement" : "Create Announcement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

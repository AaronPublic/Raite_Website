"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, X, ExternalLink, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitEntryUrl } from "@/app/actions/registration";
import { toast } from "sonner";

interface EntryUrlEditorProps {
  registrationId: string;
  initialEntryUrl: string | null;
}

export default function EntryUrlEditor({ registrationId, initialEntryUrl }: EntryUrlEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [entryUrl, setEntryUrl] = useState(initialEntryUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialEntryUrl);

  const handleSave = async () => {
    if (!entryUrl.trim()) {
      toast.error("Please provide a valid URL");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitEntryUrl(registrationId, entryUrl);
      if (result.success) {
        toast.success("Submission link updated");
        setCurrentUrl(entryUrl);
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update link");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 w-full">
        <Input
          value={entryUrl}
          onChange={(e) => setEntryUrl(e.target.value)}
          placeholder="https://..."
          className="bg-white dark:bg-gray-900 h-10 rounded-xl"
        />
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 font-bold gap-2 shrink-0"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsEditing(false)}
          className="rounded-xl h-10 w-10 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      {currentUrl ? (
        <a 
          href={currentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-2 truncate text-sm"
        >
          {currentUrl}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <span className="text-gray-500 italic text-sm font-medium">No submission link provided.</span>
      )}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsEditing(true)}
        className="h-8 rounded-lg font-bold gap-1.5 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 shrink-0"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
    </div>
  );
}

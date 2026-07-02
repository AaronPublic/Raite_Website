"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, X, ExternalLink, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitEntryUrl } from "@/app/actions/registration";
import { uploadFileToDrive } from "@/app/actions/gdrive";
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
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1GB maximum limit)
    if (file.size > 1 * 1024 * 1024 * 1024) {
      toast.error("File is too large. Maximum allowed size is 1GB.");
      e.target.value = "";
      return;
    }

    setUploadingFile(true);
    const toastId = toast.loading(`Uploading ${file.name} to Google Drive...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("registrationId", registrationId);

      const result = await uploadFileToDrive(formData);
      if (result.success && result.link) {
        setEntryUrl(result.link);
        toast.success("File uploaded successfully to Google Drive!", { id: toastId });
      } else {
        toast.error(result.error || "Failed to upload file to Google Drive", { id: toastId });
      }
    } catch (error: any) {
      console.error("Upload handler error:", error);
      toast.error(error.message || "An unexpected error occurred during upload", { id: toastId });
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

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
      <div className="flex items-center gap-2 w-full bg-gray-50 dark:bg-gray-800/40 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex-1 min-w-0 px-2 flex items-center">
          {entryUrl ? (
            <a 
              href={entryUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline truncate flex items-center gap-1"
            >
              Uploaded Submission <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-gray-400 italic font-medium">No file selected. Upload a file to submit.</span>
          )}
        </div>
        
        <label className="flex items-center justify-center h-10 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer shrink-0 transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          {uploadingFile ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Upload className="w-4 h-4 text-gray-500" />
          )}
          <span className="ml-1.5 text-xs font-bold text-gray-600 dark:text-gray-400">
            {entryUrl ? "Change File" : "Upload File"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploadingFile || isSubmitting}
          />
        </label>
        
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting || uploadingFile || !entryUrl}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 font-bold gap-2 shrink-0"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsEditing(false)}
          disabled={isSubmitting || uploadingFile}
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

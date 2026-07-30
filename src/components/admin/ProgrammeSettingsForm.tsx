"use client";

import { useState, useRef } from "react";
import { updateSystemSetting } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Upload, Loader2, Link2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgrammeSettingsFormProps {
  initialProgrammeUrl: string | null;
}

export default function ProgrammeSettingsForm({ initialProgrammeUrl }: ProgrammeSettingsFormProps) {
  const [programmeUrl, setProgrammeUrl] = useState(initialProgrammeUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultUrl = "/assets/RAITE-2026-Provisional-Programme.docx";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword"
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only Microsoft Word (.doc, .docx) files are allowed.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/programme", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      setProgrammeUrl(result.url);
      toast.success("Document uploaded successfully. Don't forget to save the setting!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateSystemSetting("EVENT_PROGRAMME_URL", programmeUrl);
      if (result && result.success) {
        toast.success("Event Programme URL updated successfully");
      } else {
        toast.error(result?.error || "Failed to update setting");
      }
    } catch (error: any) {
      toast.error(`System Error: ${error.message || "An unexpected error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const activeUrl = programmeUrl || defaultUrl;

  return (
    <Card className="max-w-2xl border-none shadow-2xl shadow-blue-600/5 bg-white dark:bg-gray-900/40 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 md:p-12 border-b dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Event Programme</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">Upload the provisional programme document or edit its target URL.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Dropzone */}
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Upload New Word Document (.docx)</Label>
            
            <div
              className={cn(
                "relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px]",
                dragActive 
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20" 
                  : "border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/10"
              )}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  <p className="text-sm font-bold text-gray-500">Uploading document to storage...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                      Drag & drop your .docx file here, or <span className="text-blue-600 hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Accepts Word files only (max 10MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-4">
            <Label htmlFor="programmeUrl" className="text-xs font-black uppercase tracking-widest text-gray-400">Programme URL / Target File</Label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="programmeUrl"
                  type="text"
                  placeholder={defaultUrl}
                  value={programmeUrl}
                  onChange={(e) => setProgrammeUrl(e.target.value)}
                  className="h-16 pl-12 pr-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-base font-bold focus:ring-blue-600 transition-all w-full"
                />
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="h-16 w-16 rounded-2xl border-gray-100 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800/50 shrink-0"
                onClick={() => {
                  window.open(activeUrl, "_blank", "noopener,noreferrer");
                }}
                title="Test Link"
              >
                <ExternalLink className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
            
            <p className="text-[10px] text-gray-400 font-medium">
              Leaving this empty will default to loading the pre-bundled: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[9px]">{defaultUrl}</code>.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || isUploading}
            className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? "SAVING SETTING..." : "SAVE PROGRAMME SETTING"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

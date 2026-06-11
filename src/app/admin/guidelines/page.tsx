"use client";

import { useState, useEffect } from "react";
import { updateSystemSetting, fetchSystemSetting } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GuidelinesPage() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSetting() {
      const url = await fetchSystemSetting("GENERAL_GUIDELINES_URL");
      setCurrentUrl(url);
    }
    loadSetting();
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Reusing the existing rules upload API which handles PDFs
      const response = await fetch("/api/upload/rules", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload PDF");
      }
      
      const updateResult = await updateSystemSetting("GENERAL_GUIDELINES_URL", result.url);
      
      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      setCurrentUrl(result.url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("PDF upload error:", err);
      setError(err.message || "Failed to upload PDF. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">General Guidelines</h1>
        <p className="text-gray-500 font-medium">Manage the official RAITE 2026 general guidelines document.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 p-8 border-b dark:border-gray-800">
              <CardTitle className="text-xl font-black uppercase tracking-tight">Upload Guidelines</CardTitle>
              <CardDescription className="font-medium">Choose a PDF file to update the general guidelines for all participants.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label htmlFor="pdf-upload" className="text-sm font-black uppercase tracking-widest text-gray-400">PDF Document</Label>
                
                <div className="relative">
                  <Input 
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                    disabled={isUploading}
                  />
                  
                  <label 
                    htmlFor="pdf-upload"
                    className={`flex flex-col items-center justify-center gap-4 p-12 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer
                      ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
                      ${error ? 'border-red-200 bg-red-50/30' : 'border-gray-200 dark:border-gray-800'}
                    `}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Select PDF File</p>
                          <p className="text-sm text-gray-500 font-medium">Click to browse or drag and drop</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-bold">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 flex items-center gap-3 text-green-600 dark:text-green-400"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-bold">Guidelines successfully updated!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-full">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 p-8 border-b dark:border-gray-800">
              <CardTitle className="text-xl font-black uppercase tracking-tight">Active Document</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6 h-[calc(100%-120px)]">
              {currentUrl ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-800">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Guidelines Active</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Publicly Accessible</p>
                  </div>
                  <Button asChild className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all hover:scale-105">
                    <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      View Document
                    </a>
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-700 mx-auto">
                    <FileText className="w-10 h-10" />
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No document uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

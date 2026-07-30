"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";

interface EventProgrammeModalButtonProps {
  programmeUrl: string;
}

export default function EventProgrammeModalButton({ programmeUrl }: EventProgrammeModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  const defaultUrl = "/assets/RAITE-2026-Provisional-Programme.docx";
  const activeUrl = programmeUrl || defaultUrl;

  // Determine if it is a local URL (e.g. static assets or localhost testing)
  // This is evaluated identically on server and client to avoid hydration mismatch
  const isLocal = 
    !activeUrl || 
    (!activeUrl.startsWith("http://") && !activeUrl.startsWith("https://")) ||
    activeUrl.includes("localhost") ||
    activeUrl.includes("127.0.0.1");

  // Microsoft Office Web Viewer embed link (requires public URL)
  const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeUrl)}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="h-14 sm:h-16 w-full sm:w-auto px-8 rounded-xl text-lg font-bold group border border-blue-600 dark:border-blue-500 flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white hover:bg-transparent dark:hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-blue-500/20 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]"
        >
          Event Programme
          <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] max-w-md md:max-w-5xl h-auto md:h-[85vh] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden">
        {/* Header */}
        <DialogHeader className="pr-12 border-b dark:border-gray-800 pb-4 flex flex-row items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Event <span className="text-blue-600">Programme</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              Preview or download the official RAITE 2026 Provisional Programme document.
            </DialogDescription>
          </div>
          
          <Button
            asChild
            className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <a href={activeUrl} download="RAITE-2026-Provisional-Programme.docx">
              <Download className="w-4 h-4" />
              Download
            </a>
          </Button>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Document Area */}
          <div className="w-full bg-gray-50 dark:bg-gray-950 rounded-2xl flex flex-col items-center justify-center p-4 min-h-[300px] md:min-h-0 md:h-full">
            {isLocal ? (
              <div className="max-w-md p-6 text-center space-y-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Offline Preview Mode</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    The Microsoft Office Document Viewer requires a publicly available internet URL. 
                    Since you are running in a local environment or utilizing a local file asset, you can download the file to view the schedule.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl h-12 px-6 font-bold border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                >
                  <a href={activeUrl} download="RAITE-2026-Provisional-Programme.docx">
                    <Download className="w-4 h-4 mr-2" />
                    Download Word File (.docx)
                  </a>
                </Button>
              </div>
            ) : (
              <div className="w-full h-[45vh] sm:h-[55vh] md:h-full min-h-[300px] md:min-h-0 relative">
                {iframeLoading && (
                  <div className="absolute inset-0 bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-3 z-10 rounded-2xl">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-bold text-gray-500">Loading document preview...</p>
                  </div>
                )}
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  className="border-none w-full h-full min-h-[300px] md:min-h-0 rounded-2xl"
                  onLoad={() => setIframeLoading(false)}
                  title="Provisional Programme Viewer"
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

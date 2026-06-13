"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, AlertCircle, Info, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function DocumentsForm() {
  const { data, isReady, updateData } = useWizard();
  const router = useRouter();

  const isEgames = data.eventCategory === "E-GAMES";

  const reqs = data.requirements as any;

  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isFormEnabled, setIsFormEnabled] = useState(false);

  // Initialize form fields once data is ready
  useEffect(() => {
    if (isReady) {
      if (isEgames) {
        setFormFields({
          crossArmPhoto: reqs?.crossArmPhoto || "",
          creativeShotPhoto: reqs?.creativeShotPhoto || "",
          coachCert: reqs?.coachCert || "",
          participantDocs: reqs?.participantDocs || "",
          schoolLogo: reqs?.schoolLogo || "",
        });
      } else {
        setFormFields({
          coachCert: reqs?.coachCert || "",
          participantDocs: reqs?.participantDocs || "",
        });
      }
    }
  }, [isReady, isEgames]);

  useEffect(() => {
    if (isReady && !data.eventId) {
      router.push("/register/step-1");
    } else if (isReady && (!data.members || data.members.length === 0)) {
      router.push("/register/step-2");
    }
  }, [isReady, data.eventId, data.members, router]);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    const missingFields = Object.keys(formFields).filter((key) => !formFields[key]);
    const invalidUrls: Record<string, string> = {};
    
    Object.keys(formFields).forEach(key => {
      if (formFields[key] && !validateUrl(formFields[key])) {
        invalidUrls[key] = "Please enter a valid URL (starting with http:// or https://)";
      }
    });

    if (missingFields.length > 0 || Object.keys(invalidUrls).length > 0) {
      setShowError(true);
      setUrlErrors(invalidUrls);
      return;
    }
    
    updateData({ requirements: formFields });
    router.push("/register/step-4");
  };

  const handleAgreementContinue = () => {
    if (hasAgreed) {
      setIsModalOpen(false);
      setIsFormEnabled(true);
    }
  };

  const renderInputField = (key: string, label: string, description?: string) => (
    <div
      key={key}
      className={cn(
        "p-6 border-2 rounded-[2rem] space-y-4 transition-all duration-300",
        (showError && !formFields[key]) || urlErrors[key]
          ? "border-red-500 bg-red-50/50 shadow-sm"
          : "border-gray-100 bg-white hover:border-blue-200",
        !isFormEnabled && "opacity-50 grayscale pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Label className="text-lg font-black text-gray-900 leading-tight truncate">{label}</Label>
          {description && <p className="text-sm text-gray-600">{description}</p>}
          {key === "participantDocs" && (
            <a 
              href="/assets/RAITE_2026_COR_TEMPLATE.docx" 
              download
              className="flex items-center gap-1.5 text-xs font-black text-blue-600 uppercase tracking-wider hover:text-blue-800 transition-colors w-fit group/btn"
            >
              <Download className="w-3.5 h-3.5 group-hover/btn:translate-y-0.5 transition-transform" />
              Download Template
            </a>
          )}

        </div>
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold shrink-0",
            (showError && !formFields[key]) || urlErrors[key]
              ? "bg-red-100 text-red-600 border-red-200"
              : "bg-blue-50 text-blue-600 border-blue-100"
          )}
        >
          {urlErrors[key] ? "Invalid Link" : "Required"}
        </Badge>
      </div>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="https://drive.google.com/..."
          value={formFields[key] || ""}
          disabled={!isFormEnabled}
          onChange={(e) => {
            setFormFields((prev) => ({ ...prev, [key]: e.target.value }));
            if (urlErrors[key]) {
              setUrlErrors(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
            }
          }}
          className="h-12 rounded-xl border-gray-200 bg-gray-50 font-medium focus:ring-2 focus:ring-blue-600/10 transition-all"
        />
        {urlErrors[key] && (
          <p className="text-xs text-red-500 font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {urlErrors[key]}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open && isFormEnabled) {
          setIsModalOpen(false);
        }
      }}>
        {/* Adjusted to be wider and highly optimized for viewports */}
        <DialogContent className="w-[95vw] max-w-xl md:max-w-2xl lg:max-w-3xl rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-12 gap-6 md:gap-8 bg-white dark:bg-gray-900 shadow-2xl border-none transition-all duration-300" showCloseButton={false}>
          <DialogHeader className="space-y-4 md:space-y-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-blue-950/50 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-inner">
              <Info className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                Accessibility Agreement
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed pt-2">
                <span className="font-black text-gray-900 dark:text-gray-100 block text-base md:text-lg uppercase tracking-wide mb-2 text-blue-600 dark:text-blue-400">
                  CRITICAL REQUIREMENT:
                </span> 
                All submitted links must be accessible for viewing and downloading by the organizers. 
                Ensure that the sharing settings are configured so that <span className="text-blue-600 dark:text-blue-400 font-black underline underline-offset-4">anyone with the link can access the files</span> without requesting administrative permission. 
                Please verify that each link is correct, fully functional, and holds the appropriate documentation before continuing.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div 
            className="p-5 sm:p-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl md:rounded-3xl border-2 border-gray-100 dark:border-gray-800 flex items-start gap-4 group cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-700/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10" 
            onClick={() => setHasAgreed(!hasAgreed)}
          >
            <Checkbox 
              id="agreement" 
              checked={hasAgreed} 
              onCheckedChange={(checked) => setHasAgreed(checked as boolean)}
              className="mt-1 border-gray-300 dark:border-gray-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md h-5 w-5 transition-all"
            />
            <Label htmlFor="agreement" className="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 leading-snug cursor-pointer group-hover:text-blue-950 dark:group-hover:text-blue-200 selection:bg-transparent">
              I understand and explicitly agree that all submitted links are fully accessible, global-viewable, and functional according to the provided system guidelines.
            </Label>
          </div>

          <DialogFooter className="sm:flex-col pt-2">
            <Button 
              onClick={handleAgreementContinue} 
              disabled={!hasAgreed}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base md:text-lg shadow-xl shadow-blue-600/20 dark:shadow-none transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-40 disabled:grayscale disabled:pointer-events-none"
            >
              Confirm and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={cn("space-y-6 transition-all duration-500", !isFormEnabled && "blur-sm select-none")}>
        {isEgames ? (
          <>
            {renderInputField("crossArmPhoto", "6 Cross Arm Photos (Gdrive Link)")}
            {renderInputField("creativeShotPhoto", "6 Creative Shot Photos (Gdrive Link)")}
            {renderInputField("coachCert", "Coach Membership Certificate", "Upload the official Coach Membership Certificate as proof of eligibility and affiliation.")}
            {renderInputField("participantDocs", "Student–Competitor Certification", "Upload the duly accomplished Student–Competitor Certification in PDF format.")}
            {renderInputField("schoolLogo", "School Institution Logo (PNG Link)")}
          </>
        ) : (
          <>
            {renderInputField("coachCert", "Coach Membership Certificate", "Upload the official Coach Membership Certificate as proof of eligibility and affiliation.")}
            {renderInputField("participantDocs", "Student–Competitor Certification", "Upload the duly accomplished Student–Competitor Certification in PDF format.")}
          </>
        )}
      </div>

      <div className={cn("flex justify-between items-center pt-8 border-t transition-all duration-500", !isFormEnabled && "opacity-0")}>
        <div 
          role="button"
          onClick={() => router.push("/register/step-2")}
          className="cursor-pointer flex items-center hover:text-blue-600 transition-colors font-bold text-gray-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </div>
        <Button 
          onClick={handleNext} 
          disabled={!isFormEnabled}
          className="bg-blue-600 text-white rounded-full px-8 shadow-lg shadow-blue-600/20 font-bold"
        >
          Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DocumentsForm() {
  const { data, isReady, updateData } = useWizard();
  const router = useRouter();

  const isEgames = data.eventCategory === "E-GAMES";

  const reqs = data.requirements as any;

  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});

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

  const renderInputField = (key: string, label: string) => (
    <div
      key={key}
      className={cn(
        "p-6 border-2 rounded-[2rem] space-y-4 transition-all duration-300",
        (showError && !formFields[key]) || urlErrors[key]
          ? "border-red-500 bg-red-50/50 shadow-sm"
          : "border-gray-100 bg-white hover:border-blue-200"
      )}
    >
      <div className="flex items-center justify-between">
        <Label className="text-lg font-black text-gray-900">{label}</Label>
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-3 py-1 text-[10px] uppercase tracking-widest font-bold",
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
      <div className="space-y-6">
        {isEgames ? (
          <>
            {renderInputField("crossArmPhoto", "6 Cross Arm Photos (Gdrive Link)")}
            {renderInputField("creativeShotPhoto", "6 Creative Shot Photos (Gdrive Link)")}
            {renderInputField("coachCert", "Coach Certificate of Membership (PDF Link)")}
            {renderInputField("participantDocs", "ID or Certificate of Registration (PDF Link)")}
            {renderInputField("schoolLogo", "School Institution Logo (PNG Link)")}
          </>
        ) : (
          <>
            {renderInputField("coachCert", "Coach Certificate of Membership (PDF Link)")}
            {renderInputField("participantDocs", "ID or Certificate of Registration (PDF Link - ALL Participants)")}
          </>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t">
        <div 
          role="button"
          onClick={() => router.push("/register/step-2")}
          className="cursor-pointer flex items-center hover:text-blue-600 transition-colors font-bold text-gray-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </div>
        <Button onClick={handleNext} className="bg-blue-600 text-white rounded-full px-8 shadow-lg shadow-blue-600/20 font-bold">
          Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "./WizardProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DocumentsForm() {
  const { data, isReady, updateData } = useWizard();
  const router = useRouter();

  const isEsports = data.eventTitle?.toLowerCase().includes("esport");

  const reqs = data.requirements as any;

  const [formFields, setFormFields] = useState<Record<string, string>>(() => {
    if (isEsports) {
      return {
        crossArmPhoto: reqs?.crossArmPhoto || "",
        creativeShotPhoto: reqs?.creativeShotPhoto || "",
        coachCert: reqs?.coachCert || "",
        participantDocs: reqs?.participantDocs || "",
        schoolLogo: reqs?.schoolLogo || "",
      };
    }
    return {
      coachCert: reqs?.coachCert || "",
      participantDocs: reqs?.participantDocs || "",
    };
  });

  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isReady && !data.eventId) {
      router.push("/register/step-1");
    } else if (isReady && (!data.members || data.members.length === 0)) {
      router.push("/register/step-2");
    }
  }, [isReady, data.eventId, data.members, router]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-bold">Loading...</p>
      </div>
    );
  }

  const handleNext = () => {
    const isInvalid = Object.values(formFields).some((val) => !val);
    if (isInvalid) {
      setShowError(true);
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
        showError && !formFields[key]
          ? "border-red-500 bg-red-50/50"
          : "border-gray-100 bg-white"
      )}
    >
      <div className="flex items-center justify-between">
        <Label className="text-lg font-black text-gray-900">{label}</Label>
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-[10px] uppercase tracking-widest"
        >
          Required
        </Badge>
      </div>
      <Input
        type="text"
        placeholder="https://drive.google.com/..."
        value={formFields[key]}
        onChange={(e) => setFormFields((prev) => ({ ...prev, [key]: e.target.value }))}
        className="h-12 rounded-xl border-gray-200 bg-gray-50 font-medium"
      />
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        {isEsports ? (
          <>
            {renderInputField("crossArmPhoto", "6 Cross Arm Photos (Gdrive)")}
            {renderInputField("creativeShotPhoto", "6 Creative Shot Photos (Gdrive)")}
            {renderInputField("coachCert", "Coach Certificate of Membership (PDF)")}
            {renderInputField("participantDocs", "ID or Certificate of Registration (PDF)")}
            {renderInputField("schoolLogo", "School Institution Logo (PNG)")}
          </>
        ) : (
          <>
            {renderInputField("coachCert", "Coach Certificate of Membership PDF")}
            {renderInputField("participantDocs", "ID or Certificate of Registration PDF (ALL Participants)")}
          </>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t">
        <Button variant="ghost" onClick={() => router.push("/register/step-2")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={handleNext} className="bg-blue-600 text-white rounded-full px-8">
          Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

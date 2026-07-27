"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldAlert, X } from "lucide-react";
import Cookies from "js-cookie";

interface RegisterTeamButtonProps {
  eventId: string;
  isNonMember: boolean;
}

export default function RegisterTeamButton({ eventId, isNonMember }: RegisterTeamButtonProps) {
  const [showFeeModal, setShowFeeModal] = useState(false);
  const router = useRouter();

  const handleRegisterClick = (e: React.MouseEvent) => {
    const acknowledged = Cookies.get("non_member_fee_acknowledged") === "true";
    if (isNonMember && !acknowledged) {
      e.preventDefault();
      setShowFeeModal(true);
    } else {
      router.push(`/register/step-2?eventId=${eventId}`);
    }
  };

  const handleConfirmFee = () => {
    Cookies.set("non_member_fee_acknowledged", "true", { expires: 1 });
    setShowFeeModal(false);
    router.push(`/register/step-2?eventId=${eventId}`);
  };

  const handleCancelFee = () => {
    setShowFeeModal(false);
  };

  return (
    <>
      <Button
        onClick={handleRegisterClick}
        className={cn(buttonVariants(), "w-full h-12 text-lg font-bold flex items-center justify-center cursor-pointer")}
      >
        Register Team
      </Button>

      <Dialog open={showFeeModal} onOpenChange={setShowFeeModal}>
        <DialogContent
          className="w-[calc(100%-2rem)] sm:max-w-md rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Fee Acknowledgment
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelFee}
              className="h-8 w-8 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto py-6 pr-1 custom-scrollbar">
            <DialogDescription className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
              Non-institutional member participants are required to pay an additional P300.00 per competitor. Do you still want to proceed?
            </DialogDescription>
          </div>

          {/* Footer */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <Button
              variant="outline"
              onClick={handleCancelFee}
              className="w-full sm:w-auto px-6 h-11 rounded-xl font-bold active:scale-95"
            >
              No
            </Button>
            <Button
              onClick={handleConfirmFee}
              className="w-full sm:w-auto px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

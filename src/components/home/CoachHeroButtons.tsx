"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldAlert, X } from "lucide-react";

interface CoachHeroButtonsProps {
  isApproved: boolean;
}

export default function CoachHeroButtons({ isApproved }: CoachHeroButtonsProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!isApproved) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <>
      {isApproved ? (
        <>
          <Link
            href="/participants/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-14 sm:h-16 w-full sm:w-auto px-10 rounded-xl text-base sm:text-lg font-bold shadow-2xl shadow-primary/30"
            )}
          >
            Register Competitors
          </Link>
          <Link
            href="/register/step-1"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "h-14 sm:h-16 w-full sm:w-auto px-10 rounded-xl text-lg font-bold"
            )}
          >
            Registration
          </Link>
        </>
      ) : (
        <>
          <button
            onClick={handleClick}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-14 sm:h-16 w-full sm:w-auto px-10 rounded-xl text-base sm:text-lg font-bold bg-primary/40 dark:bg-primary/20 text-white/50 border border-primary/10 dark:border-primary/5 cursor-pointer flex items-center justify-center gap-2 select-none"
            )}
          >
            <ShieldAlert className="w-5 h-5 text-white/70 animate-pulse" />
            Register Competitors
          </button>
          <button
            onClick={handleClick}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "h-14 sm:h-16 w-full sm:w-auto px-10 rounded-xl text-lg font-bold bg-secondary/40 dark:bg-secondary/20 text-foreground/40 border border-border/20 cursor-pointer flex items-center justify-center gap-2 select-none"
            )}
          >
            Registration
          </button>
        </>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="w-[calc(100%-2rem)] sm:max-w-md rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Verification Required
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowModal(false)}
              className="h-8 w-8 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto py-6 pr-1 custom-scrollbar">
            <DialogDescription className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
              Please return to the registration system within 12–24 hours to register your competitors and designate yourself as the faculty coach. This waiting period is necessary to allow the organizers to verify your PSITE membership status. Once your membership has been verified, you may proceed with the registration.
            </DialogDescription>
          </div>

          {/* Footer */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <Button
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

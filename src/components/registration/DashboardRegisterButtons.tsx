"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, ShieldAlert, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DashboardRegisterButtonsProps {
  isApproved: boolean;
}

export default function DashboardRegisterButtons({ isApproved }: DashboardRegisterButtonsProps) {
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
        <Link
          href="/registrations/competitors"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-900 dark:text-white rounded-2xl text-sm font-black transition-all shadow-sm active:scale-[0.98] shrink-0"
        >
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Registered Competitors
        </Link>
      ) : (
        <button
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 rounded-2xl text-sm font-black cursor-pointer transition-all active:scale-[0.98] shrink-0 select-none"
        >
          <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          Registered Competitors
        </button>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NavItemsProps {
  userRole: string | null;
}

export default function NavItems({ userRole }: NavItemsProps) {
  const pathname = usePathname();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Competitions", href: "/competitions" },
    { name: "Contact", href: "/contact" },
    { name: "Activate Membership", href: "https://docs.google.com/forms/d/e/1FAIpQLSem1wHAV_OFiGYfygqFzZ-X4-vgsROcPf-DQyvuTODRDOkndQ/viewform" },
  ];

  return (
    <div className="hidden md:flex items-center gap-1 rounded-full border border-border bg-secondary/80 p-1 shadow-inner">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        const isExternal = link.href.startsWith("http");

        if (isExternal) {
          return (
            <button
              key={link.name}
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all text-muted-foreground hover:bg-white dark:hover:bg-white/10 hover:text-primary cursor-pointer border-none bg-transparent"
            >
              {link.name}
            </button>
          );
        }

        return (
          <Link 
            key={link.name} 
            href={link.href} 
            className={`flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-white dark:hover:bg-white/10 hover:text-primary"
            }`}
          >
            {link.name}
          </Link>
        );
      })}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                External Redirection
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                You are about to open the external Google Form to activate your membership. Do you want to proceed?
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4">
            <Button 
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="w-full sm:w-auto rounded-xl font-bold h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowConfirmModal(false);
                window.open("https://docs.google.com/forms/d/e/1FAIpQLSem1wHAV_OFiGYfygqFzZ-X4-vgsROcPf-DQyvuTODRDOkndQ/viewform", "_blank", "noopener,noreferrer");
              }}
              className="w-full sm:w-auto px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

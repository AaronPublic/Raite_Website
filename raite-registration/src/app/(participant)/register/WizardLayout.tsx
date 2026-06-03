"use client";

import { usePathname } from "next/navigation";
import { WizardProvider, useWizard } from "@/components/registration/WizardProvider";
import { cn } from "@/lib/utils";
import { Check, Trophy, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: "step-1", title: "Event", path: "/register/step-1" },
  { id: "step-2", title: "Team", path: "/register/step-2" },
  { id: "step-3", title: "Files", path: "/register/step-3" },
  { id: "step-4", title: "Review", path: "/register/step-4" },
];

function WizardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useWizard();
  const currentStepIndex = steps.findIndex((step) => pathname.includes(step.id));

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
      <div className="sticky top-16 z-40 w-full bg-white/70 dark:bg-gray-950/70 backdrop-blur-md border-b dark:border-gray-800">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2 md:gap-8 max-w-2xl w-full justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center gap-2 group">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110" 
                      : isCompleted 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-200 dark:bg-gray-800 text-gray-400"
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-widest hidden sm:inline-block transition-colors duration-300",
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                  )}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="h-px w-4 md:w-8 bg-gray-200 dark:bg-gray-800 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Selected Event Context */}
        <AnimatePresence>
          {data.eventTitle && currentStepIndex > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-600 text-white overflow-hidden"
            >
              <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold">
                <Trophy className="w-4 h-4" />
                <span className="opacity-80">Registering for:</span>
                <span className="tracking-tight">{data.eventTitle}</span>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="container mx-auto px-4 py-12">
        <motion.div 
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <WizardContent>{children}</WizardContent>
    </WizardProvider>
  );
}

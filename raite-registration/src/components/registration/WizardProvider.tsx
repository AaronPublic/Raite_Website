"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface WizardData {
  eventId?: string;
  eventTitle?: string;
  teamName?: string;
  members?: string[];
  requirements?: Record<string, string>;
}

interface WizardContextType {
  data: WizardData;
  updateData: (newData: Partial<WizardData>) => void;
  clearData: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<WizardData>({});
  
  const storageKey = user ? `registration_draft_${user.id}` : null;

  useEffect(() => {
    if (isLoaded && storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        setData(JSON.parse(saved));
      } else {
        setData({}); // Reset if no draft for this specific user
      }
    }
  }, [isLoaded, storageKey]);

  const updateData = (newData: Partial<WizardData>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      if (storageKey) {
        sessionStorage.setItem(storageKey, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearData = () => {
    setData({});
    if (storageKey) {
      sessionStorage.removeItem(storageKey);
    }
  };

  return (
    <WizardContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

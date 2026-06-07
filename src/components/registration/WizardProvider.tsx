"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface WizardData {
  eventId?: string;
  eventTitle?: string;
  eventCategory?: string;
  teamName?: string;
  members?: string[];
  requirements?: Record<string, string>;
}

interface WizardContextType {
  data: WizardData;
  isReady: boolean;
  updateData: (newData: Partial<WizardData>) => void;
  clearData: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser();
  const [data, setData] = useState<WizardData>({});
  const [isReady, setIsReady] = useState(false);
  
  const storageKey = user ? `registration_draft_${user.id}` : null;

  useEffect(() => {
    if (userLoaded && storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        setData(JSON.parse(saved));
      }
      setIsReady(true);
    } else if (userLoaded && !user) {
      // User is not logged in, but RegisterLayout handles this.
      // Still, set isReady to true to avoid infinite loading if any.
      setIsReady(true);
    }
  }, [userLoaded, storageKey, user]);

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
    <WizardContext.Provider value={{ data, isReady, updateData, clearData }}>
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

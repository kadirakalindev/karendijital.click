"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { BusinessMembership } from "@/types";

interface BusinessContextType {
  currentBusiness: BusinessMembership | null;
  businesses: BusinessMembership[];
  switchBusiness: (businessId: string) => void;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType>({
  currentBusiness: null,
  businesses: [],
  switchBusiness: () => {},
  isLoading: true,
});

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);

  const memberships = (session as any)?.memberships as BusinessMembership[] | undefined;

  useEffect(() => {
    if (memberships && memberships.length > 0 && !currentBusinessId) {
      const saved = localStorage.getItem("currentBusinessId");
      const exists = memberships.find((m) => m.businessId === saved);
      setCurrentBusinessId(exists ? saved : memberships[0].businessId);
    }
  }, [memberships, currentBusinessId]);

  const switchBusiness = (businessId: string) => {
    setCurrentBusinessId(businessId);
    localStorage.setItem("currentBusinessId", businessId);
  };

  const currentBusiness = memberships?.find(
    (m) => m.businessId === currentBusinessId
  ) ?? null;

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        businesses: memberships ?? [],
        switchBusiness,
        isLoading: status === "loading",
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within BusinessProvider");
  }
  return context;
}

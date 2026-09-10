import { createContext } from "react";
import type { Business } from "@/types";
import type { BusinessOnboardingInput } from "@/lib/validations/business";

export interface BusinessContextValue {
  businesses: Business[];
  activeBusiness: Business | null;
  loading: boolean;
  error: string | null;
  switchBusiness: (businessId: string) => void;
  createBusiness: (input: BusinessOnboardingInput) => Promise<{ error?: string; business?: Business }>;
  refreshBusinesses: () => Promise<void>;
}

export const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

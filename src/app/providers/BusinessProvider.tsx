import { useCallback, useEffect, useState } from "react";
import { BusinessContext } from "@/app/providers/businessContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { BusinessOnboardingInput } from "@/lib/validations/business";
import type { Business } from "@/types";

function activeBusinessStorageKey(userId: string) {
  return `mywallet:activeBusinessId:${userId}`;
}

function toBusiness(row: {
  id: string;
  owner_id: string;
  name: string;
  business_type: Business["businessType"];
  business_type_other: string;
  industry: string;
  currency: string;
  financial_year_start_month: number;
  accounting_basis: Business["accountingBasis"];
  created_at: string;
  updated_at: string;
}): Business {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    businessType: row.business_type,
    businessTypeOther: row.business_type_other,
    industry: row.industry,
    currency: row.currency,
    financialYearStartMonth: row.financial_year_start_month,
    accountingBasis: row.accounting_basis,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Owns the list of businesses the signed-in user belongs to, plus which one
 * is "active" (persisted per-user in localStorage, same convention as
 * per-viewer preferences elsewhere in the app — not stored server-side,
 * since it's a client display concern, not shared business data).
 *
 * Mounted in AppShell next to NotificationsProvider — both are only
 * meaningful once a session exists.
 */
export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async (userId: string) => {
    setLoading(true);
    // RLS already scopes this to businesses the user is a member of.
    const { data, error: fetchError } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at");

    if (fetchError) {
      setError("We couldn't load your businesses.");
      setLoading(false);
      return;
    }

    setError(null);
    const loaded = (data ?? []).map(toBusiness);
    setBusinesses(loaded);

    let storedId: string | null = null;
    try {
      storedId = window.localStorage.getItem(activeBusinessStorageKey(userId));
    } catch {
      storedId = null;
    }
    const stillExists = storedId && loaded.some((b) => b.id === storedId);
    setActiveBusinessId(stillExists ? storedId : (loaded[0]?.id ?? null));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setActiveBusinessId(null);
      setLoading(false);
      return;
    }
    loadBusinesses(user.id);
  }, [user, loadBusinesses]);

  const switchBusiness = useCallback(
    (businessId: string) => {
      setActiveBusinessId(businessId);
      if (!user) return;
      try {
        window.localStorage.setItem(activeBusinessStorageKey(user.id), businessId);
      } catch {
        // Best-effort only — an unavailable localStorage just means the
        // choice won't survive a reload.
      }
    },
    [user],
  );

  const createBusiness = useCallback(
    async (input: BusinessOnboardingInput) => {
      if (!user) return { error: "You must be signed in." };

      const { data, error: insertError } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: input.name,
          business_type: input.businessType,
          business_type_other: input.businessType === "OTHER" ? input.businessTypeOther.trim() : "",
          industry: input.industry ?? "",
          currency: input.currency,
          financial_year_start_month: input.financialYearStartMonth,
          accounting_basis: input.accountingBasis,
        })
        .select("*")
        .single();

      if (insertError || !data) {
        return { error: insertError?.message ?? "We couldn't create your business. Please try again." };
      }

      const business = toBusiness(data);
      setBusinesses((prev) => [...prev, business]);
      switchBusiness(business.id);
      return { business };
    },
    [user, switchBusiness],
  );

  const refreshBusinesses = useCallback(async () => {
    if (user) await loadBusinesses(user.id);
  }, [user, loadBusinesses]);

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? null;

  return (
    <BusinessContext.Provider
      value={{ businesses, activeBusiness, loading, error, switchBusiness, createBusiness, refreshBusinesses }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

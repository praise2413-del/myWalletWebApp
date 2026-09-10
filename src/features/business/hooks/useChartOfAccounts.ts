import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { BusinessAccount } from "@/types";

export function useChartOfAccounts() {
  const { activeBusiness } = useBusiness();
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("accounts")
        .select("id, business_id, code, name, type, subtype, is_default, created_at, updated_at")
        .eq("business_id", activeBusiness!.id)
        .order("code");

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load the chart of accounts.");
        setLoading(false);
        return;
      }

      setError(null);
      setAccounts(
        (data ?? []).map((row) => ({
          id: row.id,
          businessId: row.business_id,
          code: row.code,
          name: row.name,
          type: row.type,
          subtype: row.subtype,
          isDefault: row.is_default,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      );
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness]);

  return { accounts, loading, error };
}

import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { BusinessGoal } from "@/types";

function toGoal(row: {
  id: string;
  business_id: string;
  name: string;
  goal_type: BusinessGoal["goalType"];
  target_amount: number;
  start_date: string;
  target_date: string | null;
  notes: string;
  created_at: string;
}): BusinessGoal {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    goalType: row.goal_type,
    targetAmount: row.target_amount,
    startDate: row.start_date,
    targetDate: row.target_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function useBusinessGoals() {
  const { activeBusiness } = useBusiness();
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeBusiness) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("business_goals")
      .select("*")
      .eq("business_id", activeBusiness.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("We couldn't load goals.");
      setLoading(false);
      return;
    }
    setError(null);
    setGoals((data ?? []).map(toGoal));
    setLoading(false);
  }, [activeBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  return { goals, loading, error, refresh: load };
}

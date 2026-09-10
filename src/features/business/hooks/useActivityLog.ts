import { useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { ActivityLogEntry } from "@/types";

export function useActivityLog() {
  const { activeBusiness } = useBusiness();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);

      const [logRes, emailsRes] = await Promise.all([
        supabase
          .from("activity_log")
          .select("*")
          .eq("business_id", activeBusiness!.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.rpc("get_business_member_emails", { p_business_id: activeBusiness!.id }),
      ]);

      if (!active) return;

      if (logRes.error || emailsRes.error) {
        setError("We couldn't load the activity log.");
        setLoading(false);
        return;
      }

      const emailByUserId = new Map((emailsRes.data ?? []).map((r) => [r.user_id, r.email]));
      setError(null);
      setEntries(
        (logRes.data ?? []).map((row) => ({
          id: row.id,
          businessId: row.business_id,
          userId: row.user_id,
          actorEmail: row.user_id ? (emailByUserId.get(row.user_id) ?? "Former member") : null,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          description: row.description,
          createdAt: row.created_at,
        })),
      );
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeBusiness]);

  return { entries, loading, error };
}

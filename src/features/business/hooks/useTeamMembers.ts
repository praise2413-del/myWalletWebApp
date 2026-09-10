import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { TeamMember } from "@/types";

export function useTeamMembers() {
  const { activeBusiness } = useBusiness();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeBusiness) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [membersRes, emailsRes] = await Promise.all([
      supabase.from("business_members").select("*").eq("business_id", activeBusiness.id),
      supabase.rpc("get_business_member_emails", { p_business_id: activeBusiness.id }),
    ]);

    if (membersRes.error || emailsRes.error) {
      setError("We couldn't load the team.");
      setLoading(false);
      return;
    }

    const emailByUserId = new Map((emailsRes.data ?? []).map((r) => [r.user_id, r.email]));
    setError(null);
    setMembers(
      (membersRes.data ?? [])
        .map((row) => ({
          id: row.id,
          userId: row.user_id,
          businessId: row.business_id,
          email: emailByUserId.get(row.user_id) ?? "Unknown",
          role: row.role,
          isOwner: row.role === "OWNER",
          createdAt: row.created_at,
        }))
        .sort((a, b) => (a.isOwner === b.isOwner ? a.email.localeCompare(b.email) : a.isOwner ? -1 : 1)),
    );
    setLoading(false);
  }, [activeBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  return { members, loading, error, refresh: load };
}

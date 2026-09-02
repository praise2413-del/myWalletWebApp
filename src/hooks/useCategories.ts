import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { Category } from "@/types";

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("id, user_id, name, type, icon, is_default, created_at, updated_at")
        .order("name");

      if (!active) return;

      if (fetchError) {
        setError("We couldn't load your categories.");
        setLoading(false);
        return;
      }

      setError(null);
      setCategories(
        (data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          type: row.type,
          icon: row.icon,
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
  }, [user]);

  return { categories, loading, error };
}

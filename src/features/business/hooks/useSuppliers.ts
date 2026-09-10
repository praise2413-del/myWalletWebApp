import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { Supplier } from "@/types";

function toSupplier(row: {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): Supplier {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useSuppliers() {
  const { activeBusiness } = useBusiness();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeBusiness) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("suppliers")
      .select("*")
      .eq("business_id", activeBusiness.id)
      .order("name");

    if (fetchError) {
      setError("We couldn't load suppliers.");
      setLoading(false);
      return;
    }
    setError(null);
    setSuppliers((data ?? []).map(toSupplier));
    setLoading(false);
  }, [activeBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  return { suppliers, loading, error, refresh: load };
}

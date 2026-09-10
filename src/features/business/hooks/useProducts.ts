import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/lib/supabase/client";
import type { Product } from "@/types";

function toProduct(row: {
  id: string;
  business_id: string;
  sku: string;
  name: string;
  description: string;
  unit_price: number;
  cost_price: number;
  quantity_on_hand: number;
  income_account_id: string;
  expense_account_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): Product {
  return {
    id: row.id,
    businessId: row.business_id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    unitPrice: row.unit_price,
    costPrice: row.cost_price,
    quantityOnHand: row.quantity_on_hand,
    incomeAccountId: row.income_account_id,
    expenseAccountId: row.expense_account_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useProducts() {
  const { activeBusiness } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeBusiness) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", activeBusiness.id)
      .order("name");

    if (fetchError) {
      setError("We couldn't load products.");
      setLoading(false);
      return;
    }
    setError(null);
    setProducts((data ?? []).map(toProduct));
    setLoading(false);
  }, [activeBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  return { products, loading, error, refresh: load };
}

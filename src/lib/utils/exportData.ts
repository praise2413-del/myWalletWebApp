import { supabase } from "@/lib/supabase/client";

interface ExportRow {
  recordType: "Transaction" | "Allocation";
  date: string;
  type: string;
  category: string;
  amount: number;
  note: string;
}

function toCsvValue(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildCsv(rows: ExportRow[]): string {
  const header = ["Record Type", "Date", "Type", "Category", "Amount", "Note"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [row.recordType, row.date, row.type, row.category, row.amount, row.note].map(toCsvValue).join(","),
    );
  }
  return lines.join("\n");
}

export async function exportUserDataAsCsv(userId: string): Promise<{ error?: string }> {
  const [transactionsRes, allocationsRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("transaction_date, type, amount, note, category:categories(name)")
      .eq("user_id", userId)
      .order("transaction_date"),
    supabase
      .from("allocations")
      .select("allocation_date, type, amount, note")
      .eq("user_id", userId)
      .order("allocation_date"),
  ]);

  if (transactionsRes.error || allocationsRes.error) {
    return { error: "We couldn't export your data. Please try again." };
  }

  const rows: ExportRow[] = [
    ...(transactionsRes.data ?? []).map((t) => ({
      recordType: "Transaction" as const,
      date: t.transaction_date,
      type: t.type,
      category: t.category?.name ?? "Other",
      amount: t.amount,
      note: t.note ?? "",
    })),
    ...(allocationsRes.data ?? []).map((a) => ({
      recordType: "Allocation" as const,
      date: a.allocation_date,
      type: a.type,
      category: a.type === "SAVING" ? "Savings" : "Investment",
      amount: a.amount,
      note: a.note ?? "",
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mywallet-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {};
}

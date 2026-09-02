export interface NamedAmount {
  name: string;
  amount: number;
  icon?: string;
}

/**
 * Sorts by amount descending and folds anything past `limit` into a
 * single "Other" bucket — keeps a pie/bar chart legible while the
 * detailed per-category data still exists in the source list.
 */
export function groupTopCategories(entries: NamedAmount[], limit = 5): NamedAmount[] {
  const sorted = [...entries].sort((a, b) => b.amount - a.amount);
  if (sorted.length <= limit) return sorted;

  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const otherTotal = rest.reduce((sum, item) => sum + item.amount, 0);
  return otherTotal > 0 ? [...top, { name: "Other", amount: otherTotal }] : top;
}

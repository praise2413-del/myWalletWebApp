export function friendlyDbError(message: string, fallback: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("category type") || lower.includes("does not match")) {
    return "That category doesn't match the transaction type. Please choose a different category.";
  }
  if (lower.includes("does not belong to this user")) {
    return "That category is no longer available. Please choose a different one.";
  }
  if (lower.includes("check constraint") && lower.includes("amount")) {
    return "Amount must be greater than zero.";
  }
  if (lower.includes("violates row-level security")) {
    return "You don't have permission to do that.";
  }

  return fallback;
}

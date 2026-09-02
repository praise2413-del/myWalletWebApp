import { describe, expect, it } from "vitest";
import { friendlyDbError } from "@/lib/utils/dbErrors";

describe("friendlyDbError", () => {
  it("maps a category/transaction type mismatch", () => {
    expect(friendlyDbError("Category type (EXPENSE) does not match transaction type (INCOME)", "fallback")).toBe(
      "That category doesn't match the transaction type. Please choose a different category.",
    );
  });

  it("maps a category owned by another user", () => {
    expect(friendlyDbError("Category does not belong to this user", "fallback")).toBe(
      "That category is no longer available. Please choose a different one.",
    );
  });

  it("maps the amount check constraint", () => {
    expect(friendlyDbError('new row violates check constraint "transactions_amount_check"', "fallback")).toBe(
      "Amount must be greater than zero.",
    );
  });

  it("maps an RLS violation", () => {
    expect(friendlyDbError("new row violates row-level security policy", "fallback")).toBe(
      "You don't have permission to do that.",
    );
  });

  it("maps a duplicate-name unique constraint violation", () => {
    expect(
      friendlyDbError('duplicate key value violates unique constraint "categories_user_id_name_type_key"', "fallback"),
    ).toBe("You already have a category with that name.");
  });

  it("maps a foreign-key restrict violation on delete", () => {
    expect(
      friendlyDbError(
        'update or delete on table "categories" violates foreign key constraint "transactions_category_id_fkey" on table "transactions"',
        "fallback",
      ),
    ).toBe("This category still has transactions attached. Move or delete those first.");
  });

  it("falls back to the given message for anything unrecognized", () => {
    expect(friendlyDbError("some completely unrelated postgres error", "Something went wrong.")).toBe(
      "Something went wrong.",
    );
  });
});

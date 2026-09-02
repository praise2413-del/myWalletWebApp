import { describe, expect, it } from "vitest";
import { groupTopCategories } from "@/lib/utils/aggregate";

describe("groupTopCategories", () => {
  it("returns entries sorted by amount descending when under the limit", () => {
    const result = groupTopCategories(
      [
        { name: "Food", amount: 100 },
        { name: "Rent", amount: 500 },
        { name: "Transport", amount: 50 },
      ],
      5,
    );
    expect(result.map((r) => r.name)).toEqual(["Rent", "Food", "Transport"]);
  });

  it("folds everything past the limit into a single 'Other' bucket", () => {
    const result = groupTopCategories(
      [
        { name: "A", amount: 10 },
        { name: "B", amount: 9 },
        { name: "C", amount: 8 },
        { name: "D", amount: 1 },
        { name: "E", amount: 1 },
      ],
      3,
    );
    expect(result.map((r) => r.name)).toEqual(["A", "B", "C", "Other"]);
    expect(result.find((r) => r.name === "Other")?.amount).toBe(2);
  });

  it("does not add an 'Other' bucket when the remainder totals zero", () => {
    const result = groupTopCategories(
      [
        { name: "A", amount: 10 },
        { name: "B", amount: 0 },
      ],
      1,
    );
    expect(result.map((r) => r.name)).toEqual(["A"]);
  });

  it("preserves an optional icon field on top entries", () => {
    const result = groupTopCategories([{ name: "Food", amount: 10, icon: "utensils-crossed" }], 5);
    expect(result[0].icon).toBe("utensils-crossed");
  });
});

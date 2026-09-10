import { z } from "zod";

export const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, "Select an account"),
  debit: z.number().min(0, "Cannot be negative"),
  credit: z.number().min(0, "Cannot be negative"),
});

export const journalEntryFormSchema = z
  .object({
    entryDate: z.string().min(1, "Select a date"),
    description: z.string().trim().min(1, "Enter a description").max(200, "Description is too long"),
    reference: z.string().trim().max(50, "Reference is too long"),
    lines: z.array(journalEntryLineSchema).min(2, "A journal entry needs at least two lines"),
  })
  .superRefine((values, ctx) => {
    // Per-line "debit xor credit" is checked here (attaches to a specific
    // field, so it renders cleanly). Whether the whole entry balances is a
    // cross-line property the form itself checks live and gates Save on —
    // not a great fit for a single field-level zod issue, so it's not
    // duplicated here.
    values.lines.forEach((line, index) => {
      const hasDebit = line.debit > 0;
      const hasCredit = line.credit > 0;
      if (hasDebit === hasCredit) {
        ctx.addIssue({
          code: "custom",
          path: ["lines", index, "debit"],
          message: "Enter either a debit or a credit amount, not both",
        });
      }
    });
  });

export type JournalEntryFormInput = z.infer<typeof journalEntryFormSchema>;

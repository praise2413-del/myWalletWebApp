import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { ICON_PICKER_OPTIONS } from "@/lib/utils/categoryVisuals";
import { cn } from "@/lib/utils/cn";
import { type CategoryFormInput, categoryFormSchema } from "@/lib/validations/category";
import type { Category, TransactionType } from "@/types";

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingCategory?: Category | null;
  onSubmit: (values: CategoryFormInput) => Promise<{ error?: string } | void>;
}

export function CategoryFormModal({
  open,
  onClose,
  initialType = "EXPENSE",
  editingCategory,
  onSubmit,
}: CategoryFormModalProps) {
  const isEditing = Boolean(editingCategory);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", type: initialType, icon: "wallet" },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    if (editingCategory) {
      reset({ name: editingCategory.name, type: editingCategory.type, icon: editingCategory.icon });
    } else {
      reset({ name: "", type: initialType, icon: "wallet" });
    }
  }, [open, editingCategory, initialType, reset]);

  const type = watch("type");
  const icon = watch("icon");

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Category" : "Add Category"}
      description={isEditing ? "Update this category's name and icon" : "Create a custom category"}
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);
          const result = await onSubmit(values);
          if (result?.error) {
            setSubmitError(result.error);
          } else {
            onClose();
          }
        })}
        noValidate
        className="flex h-full flex-col"
      >
        <div className="flex-1 space-y-5">
          {submitError && <AlertBanner message={submitError} />}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isEditing}
              onClick={() => setValue("type", "INCOME")}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                type === "INCOME"
                  ? "border-transparent bg-income-500 text-white"
                  : "border-border-strong text-text-secondary hover:bg-background",
                isEditing && "cursor-not-allowed opacity-50",
              )}
            >
              + Income
            </button>
            <button
              type="button"
              disabled={isEditing}
              onClick={() => setValue("type", "EXPENSE")}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                type === "EXPENSE"
                  ? "border-transparent bg-expense-500 text-white"
                  : "border-border-strong text-text-secondary hover:bg-background",
                isEditing && "cursor-not-allowed opacity-50",
              )}
            >
              ✕ Expense
            </button>
          </div>
          {isEditing && (
            <p className="-mt-3 text-xs text-text-tertiary">
              A category's type can't be changed after it's created, to keep past transactions consistent.
            </p>
          )}

          <div>
            <label htmlFor="cat-name" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Name
            </label>
            <input
              id="cat-name"
              type="text"
              placeholder="e.g. Pet Care"
              aria-invalid={Boolean(errors.name)}
              className={cn(
                "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
                errors.name ? "border-expense-500" : "border-border-strong focus:border-primary-500",
              )}
              {...register("name")}
            />
            {errors.name && <p className="mt-1.5 text-xs text-expense-600">{errors.name.message}</p>}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-text-secondary">Icon</span>
            <div className="grid grid-cols-7 gap-2">
              {ICON_PICKER_OPTIONS.map(({ slug, icon: Icon }) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setValue("icon", slug, { shouldValidate: true })}
                  aria-label={slug.replace(/-/g, " ")}
                  aria-pressed={icon === slug}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border transition-colors",
                    icon === slug
                      ? "border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400"
                      : "border-border-strong text-text-tertiary hover:bg-background hover:text-text-secondary",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </button>
              ))}
            </div>
            {errors.icon && <p className="mt-1.5 text-xs text-expense-600">{errors.icon.message}</p>}
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}

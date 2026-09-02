import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ error?: string } | void>;
}

const CONFIRM_WORD = "DELETE";

export function DeleteAccountDialog({ open, onClose, onConfirm }: DeleteAccountDialogProps) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setInput("");
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    const result = await onConfirm();
    setBusy(false);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Delete your account?"
      description="This permanently deletes your account and every transaction, allocation, and category you've recorded. This cannot be undone."
    >
      <div className="space-y-3">
        {error && <p className="text-sm text-expense-600">{error}</p>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-text-secondary">
            Type <span className="font-semibold text-text-primary">{CONFIRM_WORD}</span> to confirm
          </span>
          <input
            type="text"
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            className={cn(
              "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none",
              "border-border-strong focus:border-expense-500",
            )}
          />
        </label>
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={busy || input !== CONFIRM_WORD}>
            {busy ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

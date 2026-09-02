import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Standard modal-dialog focus behavior (WAI-ARIA APG): moves focus into the
 * dialog on open, keeps Tab/Shift+Tab cycling within it while open, and
 * restores focus to whatever triggered it on close — without this, keyboard
 * and screen-reader users can tab into background content hidden behind the
 * overlay, and lose their place in the page once the dialog closes.
 */
export function useFocusTrap(open: boolean, containerRef: RefObject<HTMLElement | null>) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const firstFocusable = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? container)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !container) return;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, containerRef]);
}

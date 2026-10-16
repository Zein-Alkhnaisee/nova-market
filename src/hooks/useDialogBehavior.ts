import { useEffect, useRef } from "react";

/**
 * Baseline dialog behaviour for hand-built overlays (DESIGN_SYSTEM §40):
 * focus moves into the dialog when it opens, Escape closes it, and focus returns
 * to whatever had it before the dialog opened.
 *
 * Attach the returned ref to the element with `role="dialog"` and give that
 * element `tabIndex={-1}` so it can receive focus.
 *
 * `onClose` is read through a ref so a parent re-render that creates a new
 * callback does not re-run the effect (which would steal focus back from a
 * field the person is typing in).
 */
export function useDialogBehavior<T extends HTMLElement>(onClose: () => void) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return dialogRef;
}

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useDialogBehavior } from "../../hooks/useDialogBehavior";

interface FilterDrawerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Mobile filter drawer shared by Shop and Search (lg and up use the sidebar instead).
 * Slides in from the inline-end edge, so it follows the writing direction in RTL.
 * A real dialog: labelled, modal, focus moves in, Escape closes, focus returns.
 */
export function FilterDrawer({ title, onClose, children }: FilterDrawerProps) {
  const { t } = useTranslation("common");
  const dialogRef = useDialogBehavior<HTMLDivElement>(onClose);

  return (
    <div className="fixed inset-0 z-[var(--z-index-modal)] flex lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("actions.close")}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative ms-auto flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-surface p-5 focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("actions.close")}
          className="mb-4 self-end text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

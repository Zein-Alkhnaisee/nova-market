import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, X } from "lucide-react";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { ConversationView } from "../assistant/ConversationView";

export function FloatingAssistant() {
  const { t } = useTranslation("assistant");
  const location = useLocation();
  const aiAssistantEnabled = useFeatureFlag("aiAssistant");
  const [open, setOpen] = useState(false);

  const isDistractionFreeRoute =
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/auth") ||
    location.pathname === "/assistant";

  if (!aiAssistantEnabled || isDistractionFreeRoute) return null;

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={t("title")}
          className="fixed bottom-20 end-4 z-[var(--z-index-drawer)] flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-elevation-xl)]"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">{t("title")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/assistant"
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              >
                {t("openFullPage")}
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ConversationView compact />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("floatingButtonLabel")}
        aria-expanded={open}
        className="fixed bottom-4 end-4 z-[var(--z-index-drawer)] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevation-lg)] hover:opacity-90"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </>
  );
}

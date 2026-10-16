import { useTranslation } from "react-i18next";

/** Suspense fallback while a lazy route chunk loads. Translated and announced to screen readers. */
export function RouteFallback() {
  const { t } = useTranslation("common");
  return (
    <div role="status" className="px-4 py-24 text-center text-sm text-muted-foreground">
      {t("loading")}…
    </div>
  );
}

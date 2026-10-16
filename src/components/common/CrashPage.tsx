import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "../ui/Button";
import { cn } from "../../lib/cn";

interface CrashPageProps {
  /** Fill the viewport (app-level crash) instead of sitting inside the page shell (area-level crash). */
  fullPage?: boolean;
}

/**
 * Shown when a render error is caught by an ErrorBoundary. Deliberately free of
 * router hooks, Redux and anything else that might be the thing that broke:
 * "Go home" is a plain link (a full navigation), "Reload" is a full reload.
 * Never shows the raw error (MASTER_SPEC §46).
 */
export function CrashPage({ fullPage = false }: CrashPageProps) {
  const { t } = useTranslation("errors");
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        fullPage ? "min-h-screen bg-background" : "py-24"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">{t("crash.title")}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("crash.description")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => window.location.reload()}>{t("crash.reload")}</Button>
        <a href="/" className={buttonVariants({ variant: "outline" })}>
          {t("crash.goHome")}
        </a>
      </div>
    </div>
  );
}

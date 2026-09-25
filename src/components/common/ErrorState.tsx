import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation("errors");
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message ?? t("generic")}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}

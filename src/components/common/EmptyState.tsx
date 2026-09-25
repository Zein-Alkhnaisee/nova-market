import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-16 text-center">
      {icon}
      <p className="text-base font-medium text-foreground">{title ?? t("empty.title")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {description ?? t("empty.description")}
      </p>
      {action}
    </div>
  );
}

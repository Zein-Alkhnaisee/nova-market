import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Scale, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { clearCompare, selectCompareIds } from "../../features/compare/compareSlice";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";

export function CompareBar() {
  const { t } = useTranslation("compare");
  const dispatch = useAppDispatch();
  const compareIds = useAppSelector(selectCompareIds);
  const productComparisonEnabled = useFeatureFlag("productComparison");

  if (!productComparisonEnabled || compareIds.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[var(--z-index-drawer)] flex justify-center px-4">
      <div className="flex items-center gap-4 rounded-full border border-border bg-surface-elevated px-5 py-3 shadow-[var(--shadow-elevation-lg)]">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Scale className="h-4 w-4 text-accent" />
          <span className="font-medium">{compareIds.length}</span>
          <span className="hidden sm:inline">{t("title")}</span>
        </div>
        <Link
          to="/compare"
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          {t("title")}
        </Link>
        <button
          type="button"
          onClick={() => dispatch(clearCompare())}
          aria-label={t("clearAll")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import type { SortOption } from "../../services/api/productsApi";

const SORT_OPTIONS: SortOption[] = ["relevance", "price-asc", "price-desc", "rating", "newest"];

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const { t } = useTranslation("shop");
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">{t("sort.label")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm text-foreground"
        aria-label={t("sort.label")}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(`sort.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

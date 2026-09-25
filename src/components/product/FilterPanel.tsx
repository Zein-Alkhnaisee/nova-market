import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { ProductSummary } from "../../types/product";

export interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
}

interface FilterPanelProps {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear: () => void;
  /**
   * The product set filters should be counted against — i.e. everything
   * matching the current category/search/price selection, but *before*
   * rating/stock are applied. Passing this turns the panel into a "smart"
   * filter (MASTER_SPEC §10 "Smart filters"): each rating option shows how
   * many results it would actually leave, and options that would produce
   * zero results are disabled rather than silently emptying the page.
   * Omitting it falls back to a plain, uncounted filter panel.
   */
  facetBaseProducts?: ProductSummary[];
}

const RATING_OPTIONS = [4, 3, 2, 1];

export function FilterPanel({ values, onChange, onClear, facetBaseProducts }: FilterPanelProps) {
  const { t } = useTranslation("shop");
  const hasActiveFilters =
    values.minPrice != null || values.maxPrice != null || values.minRating != null || values.inStockOnly;

  const ratingCount = (rating: number) =>
    facetBaseProducts?.filter((p) => p.rating >= rating).length;
  const inStockCount = facetBaseProducts?.filter((p) => p.inStock).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{t("filters")}</h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            {t("clearFilters")}
          </button>
        ) : null}
      </div>

      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("price")}
        </legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="filter-min-price">
            {t("priceMin")}
          </label>
          <input
            id="filter-min-price"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("priceMin")}
            value={values.minPrice ?? ""}
            onChange={(e) =>
              onChange({ ...values, minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm text-foreground"
          />
          <span className="text-muted-foreground">–</span>
          <label className="sr-only" htmlFor="filter-max-price">
            {t("priceMax")}
          </label>
          <input
            id="filter-max-price"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("priceMax")}
            value={values.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ ...values, maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm text-foreground"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("rating")}
        </legend>
        <div role="radiogroup" aria-label={t("rating")} className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="min-rating"
              checked={values.minRating == null}
              onChange={() => onChange({ ...values, minRating: undefined })}
              className="h-4 w-4 accent-[var(--nova-accent)]"
            />
            {t("anyRating")}
          </label>
          {RATING_OPTIONS.map((rating) => {
            const count = ratingCount(rating);
            const disabled = count === 0;
            return (
              <label
                key={rating}
                className={`flex items-center justify-between gap-2 text-sm ${
                  disabled ? "text-muted-foreground opacity-50" : "text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="min-rating"
                    checked={values.minRating === rating}
                    disabled={disabled}
                    onChange={() => onChange({ ...values, minRating: rating })}
                    className="h-4 w-4 accent-[var(--nova-accent)]"
                  />
                  {rating}+
                </span>
                {count != null ? <span className="text-xs text-muted-foreground">{count}</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label
        className={`flex items-center justify-between gap-2 text-sm ${
          inStockCount === 0 ? "text-muted-foreground opacity-50" : "text-foreground"
        }`}
      >
        <span className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.inStockOnly ?? false}
            disabled={inStockCount === 0}
            onChange={(e) => onChange({ ...values, inStockOnly: e.target.checked || undefined })}
            className="h-4 w-4 accent-[var(--nova-accent)]"
          />
          {t("inStockOnly")}
        </span>
        {inStockCount != null ? <span className="text-xs text-muted-foreground">{inStockCount}</span> : null}
      </label>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X } from "lucide-react";
import { useGetProductsQuery, type SortOption } from "../../services/api/productsApi";
import { useAppDispatch } from "../../app/store/hooks";
import { addRecentSearch } from "../../features/search/recentSearchesSlice";
import { ProductCard } from "../../components/product/ProductCard";
import { FilterPanel, type FilterValues } from "../../components/product/FilterPanel";
import { SortDropdown } from "../../components/product/SortDropdown";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";

function readFiltersFromParams(params: URLSearchParams): FilterValues & { sort: SortOption } {
  return {
    minPrice: params.has("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    minRating: params.has("minRating") ? Number(params.get("minRating")) : undefined,
    inStockOnly: params.get("inStock") === "1" || undefined,
    sort: (params.get("sort") as SortOption) || "relevance",
  };
}

export function SearchPage() {
  const { t } = useTranslation(["search", "shop", "common"]);
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const query = searchParams.get("q") ?? "";
  const { minPrice, maxPrice, minRating, inStockOnly, sort } = readFiltersFromParams(searchParams);

  const {
    data: results,
    isFetching,
    isError,
    refetch,
  } = useGetProductsQuery(
    { q: query, minPrice, maxPrice, minRating, inStockOnly, sort },
    { skip: !query.trim() }
  );

  const { data: facetBaseProducts } = useGetProductsQuery(
    { q: query, minPrice, maxPrice },
    { skip: !query.trim() }
  );

  useEffect(() => {
    if (query.trim()) {
      dispatch(addRecentSearch(query));
    }
    // Only record the search once per landing/query change, not on every filter tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateParams = (updater: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    setSearchParams(next, { replace: true });
  };

  const setFilters = (values: FilterValues) => {
    updateParams((params) => {
      if (values.minPrice != null) params.set("minPrice", String(values.minPrice));
      else params.delete("minPrice");
      if (values.maxPrice != null) params.set("maxPrice", String(values.maxPrice));
      else params.delete("maxPrice");
      if (values.minRating != null) params.set("minRating", String(values.minRating));
      else params.delete("minRating");
      if (values.inStockOnly) params.set("inStock", "1");
      else params.delete("inStock");
    });
  };

  const clearFilters = () => {
    updateParams((params) => {
      params.delete("minPrice");
      params.delete("maxPrice");
      params.delete("minRating");
      params.delete("inStock");
    });
  };

  const setSort = (value: SortOption) => {
    updateParams((params) => {
      if (value === "relevance") params.delete("sort");
      else params.set("sort", value);
    });
  };

  const filterValues: FilterValues = useMemo(
    () => ({ minPrice, maxPrice, minRating, inStockOnly }),
    [minPrice, maxPrice, minRating, inStockOnly]
  );

  if (!query.trim()) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
        <EmptyState title={t("search:startTitle")} description={t("search:startDescription")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("search:resultsTitle", { query })}
        </h1>
        {results ? (
          <p className="text-sm text-muted-foreground">
            {t("search:resultsCount", { count: results.length })}
          </p>
        ) : null}
      </div>

      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-foreground lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("shop:filters")}
        </button>
        <div className="ms-auto">
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      <div className="flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterPanel values={filterValues} onChange={setFilters} onClear={clearFilters} facetBaseProducts={facetBaseProducts} />
        </aside>

        <div className="flex-1">
          {isError ? (
            <ErrorState onRetry={refetch} />
          ) : isFetching ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[4/5] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("search:noResultsTitle", { query })}
              description={t("search:noResultsDescription")}
            />
          )}
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[var(--z-index-modal)] flex lg:hidden">
          <button
            type="button"
            aria-label={t("common:actions.close")}
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative ms-auto flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-surface p-5">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label={t("common:actions.close")}
              className="mb-4 self-end text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <FilterPanel values={filterValues} onChange={setFilters} onClear={clearFilters} facetBaseProducts={facetBaseProducts} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

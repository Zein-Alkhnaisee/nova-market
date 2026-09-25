import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X } from "lucide-react";
import { useGetProductsQuery, type SortOption } from "../../services/api/productsApi";
import { useGetCategoriesQuery } from "../../services/api/categoriesApi";
import { ProductCard } from "../../components/product/ProductCard";
import { FilterPanel, type FilterValues } from "../../components/product/FilterPanel";
import { SortDropdown } from "../../components/product/SortDropdown";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";
import { cn } from "../../lib/cn";

function readFiltersFromParams(params: URLSearchParams): FilterValues & { sort: SortOption } {
  return {
    minPrice: params.has("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    minRating: params.has("minRating") ? Number(params.get("minRating")) : undefined,
    inStockOnly: params.get("inStock") === "1" || undefined,
    sort: (params.get("sort") as SortOption) || "relevance",
  };
}

export function ShopPage() {
  const { category } = useParams<{ category?: string }>();
  const { t } = useTranslation(["common", "shop"]);
  const { data: categories } = useGetCategoriesQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { minPrice, maxPrice, minRating, inStockOnly, sort } = readFiltersFromParams(searchParams);

  const {
    data: products,
    isFetching,
    isError,
    refetch,
  } = useGetProductsQuery({ categoryId: category, minPrice, maxPrice, minRating, inStockOnly, sort });

  // Facet counts are computed against everything matching category+price+sort
  // but before rating/stock are applied — see FilterPanel's `facetBaseProducts`.
  const { data: facetBaseProducts } = useGetProductsQuery({ categoryId: category, minPrice, maxPrice });

  const activeCategory = categories?.find((c) => c.slug === category);

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

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {activeCategory ? activeCategory.name : "Shop"}
        </h1>
        {products ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("shop:resultsCount", { count: products.length })}
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

      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("shop:allCategories")}
          </p>
          <nav className="mb-8 flex flex-col gap-1">
            <Link
              to="/shop"
              className={cn(
                "rounded-[var(--radius-md)] px-3 py-2 text-sm hover:bg-surface-hover",
                !category ? "bg-surface-hover font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {t("shop:allCategories")}
            </Link>
            {categories?.map((c) => (
              <Link
                key={c.id}
                to={`/shop/${c.slug}`}
                className={cn(
                  "rounded-[var(--radius-md)] px-3 py-2 text-sm hover:bg-surface-hover",
                  category === c.slug ? "bg-surface-hover font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {c.name}
              </Link>
            ))}
          </nav>
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
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("empty.title")}
              description={t("empty.description")}
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {t("shop:clearFilters")}
                </button>
              }
            />
          )}
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[var(--z-index-modal)] flex lg:hidden">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative ms-auto flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-surface p-5">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close"
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

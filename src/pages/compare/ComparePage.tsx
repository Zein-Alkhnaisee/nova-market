import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { clearCompare, selectCompareIds, toggleCompare } from "../../features/compare/compareSlice";
import { useGetProductsQuery } from "../../services/api/productsApi";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

export function ComparePage() {
  const { t } = useTranslation(["compare", "product"]);
  const dispatch = useAppDispatch();
  const compareIds = useAppSelector(selectCompareIds);
  const { data: allProducts, isLoading, isError, refetch } = useGetProductsQuery();

  const products = compareIds
    .map((id) => allProducts?.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (isError) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={
            <Link to="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
              Continue shopping
            </Link>
          }
        />
      </div>
    );
  }

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(
      amount
    );

  const rows: { label: string; render: (p: (typeof products)[number]) => React.ReactNode }[] = [
    { label: t("attributes.price"), render: (p) => formatPrice(p.price, p.currency) },
    {
      label: t("attributes.rating"),
      render: (p) => (
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {p.rating}
        </span>
      ),
    },
    { label: t("attributes.reviews"), render: (p) => p.reviewCount },
    { label: t("attributes.brand"), render: (p) => p.brand },
    { label: t("attributes.category"), render: (p) => p.categoryId.replace("-", " ") },
    {
      label: t("attributes.availability"),
      render: (p) => (
        <span className={p.inStock ? "text-success" : "text-danger"}>
          {p.inStock ? t("product:inStock") : t("product:outOfStock")}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
        <button
          type="button"
          onClick={() => dispatch(clearCompare())}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t("clearAll")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="w-40" />
              {products.map((product) => (
                <th key={product.id} className="p-3 text-start align-top">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => dispatch(toggleCompare(product.id))}
                      aria-label={t("remove")}
                      className="absolute -end-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground shadow-[var(--shadow-elevation-sm)] hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <Link to={`/product/${product.slug}`}>
                      <div className="aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-foreground">{product.name}</p>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <th scope="row" className="p-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </th>
                {products.map((product) => (
                  <td key={product.id} className="p-3 text-sm text-foreground">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

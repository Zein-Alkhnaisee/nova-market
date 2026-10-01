import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/ui/Badge";
import { Button, buttonVariants } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { SelectField } from "../../components/ui/SelectField";
import { Skeleton } from "../../components/ui/Skeleton";
import { TextField } from "../../components/ui/TextField";
import { useGetCategoriesQuery } from "../../services/api/categoriesApi";
import {
  useGetAdminProductsQuery,
  useSetAdminProductArchivedMutation,
} from "../../services/api/adminApi";
import type { StoredProduct } from "../../services/catalog/productStore";

const LOW_STOCK_MAX = 5;

type StatusFilter = "active" | "archived" | "all";
type StockFilter = "all" | "in" | "low" | "out";

const isLow = (p: StoredProduct) => p.inventory !== undefined && p.inventory > 0 && p.inventory <= LOW_STOCK_MAX;

interface Notice {
  kind: "archived" | "restored";
  id: string;
  name: string;
}

export function AdminProductsPage() {
  const { t, i18n } = useTranslation("admin");
  const locale = i18n.language;
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [actionFailed, setActionFailed] = useState(false);

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = (searchParams.get("status") as StatusFilter | null) ?? "active";
  const stock = (searchParams.get("stock") as StockFilter | null) ?? "all";

  const { data, isLoading, isError, refetch } = useGetAdminProductsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: categories = [] } = useGetCategoriesQuery();
  const [setArchived, { isLoading: isUpdating }] = useSetAdminProductArchivedMutation();

  const setParam = (key: string, value: string, defaultValue = "") => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== defaultValue) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const hasFilters = Boolean(q || category || status !== "active" || stock !== "all");
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const needle = q.trim().toLowerCase();
  const rows = (data ?? []).filter((p) => {
    const archived = p.archivedAt !== undefined;
    if (status === "active" && archived) return false;
    if (status === "archived" && !archived) return false;
    if (category && p.categoryId !== category) return false;
    if (stock === "in" && !p.inStock) return false;
    if (stock === "out" && p.inStock) return false;
    if (stock === "low" && !isLow(p)) return false;
    if (needle && !(p.name.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle) || p.slug.includes(needle))) {
      return false;
    }
    return true;
  });

  const toggleArchived = async (id: string, name: string, archived: boolean) => {
    setActionFailed(false);
    const result = await setArchived({ id, archived });
    if ("data" in result && result.data?.ok) {
      setNotice({ kind: archived ? "archived" : "restored", id, name });
    } else {
      setNotice(null);
      setActionFailed(true);
    }
  };

  const money = (value: number, currency: string) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

  return (
    <>
      <AdminPageHeader
        title={t("nav.products")}
        description={t("products.description")}
        actions={
          <Link to="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            {t("products.new")}
          </Link>
        }
      />

      <div role="status" aria-live="polite">
        {notice ? (
          <p className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-foreground">
            <span>{t(`products.notice.${notice.kind}`, { name: notice.name })}</span>
            {notice.kind === "archived" ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isUpdating}
                onClick={() => toggleArchived(notice.id, notice.name, false)}
              >
                {t("products.undo")}
              </Button>
            ) : null}
          </p>
        ) : null}
        {actionFailed ? (
          <p className="mb-4 rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-sm text-danger">
            {t("products.actionError")}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-72" />
        </div>
      ) : null}
      {isError ? <ErrorState message={t("products.error")} onRetry={refetch} /> : null}

      {data ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              id="admin-product-search"
              type="search"
              label={t("products.search")}
              placeholder={t("products.searchPlaceholder")}
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
            />
            <SelectField
              id="admin-product-category"
              label={t("products.filters.category")}
              value={category}
              onChange={(e) => setParam("category", e.target.value)}
            >
              <option value="">{t("products.filters.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
            <SelectField
              id="admin-product-status"
              label={t("products.filters.status")}
              value={status}
              onChange={(e) => setParam("status", e.target.value, "active")}
            >
              <option value="active">{t("products.filters.active")}</option>
              <option value="archived">{t("products.filters.archived")}</option>
              <option value="all">{t("products.filters.all")}</option>
            </SelectField>
            <SelectField
              id="admin-product-stock"
              label={t("products.filters.stock")}
              value={stock}
              onChange={(e) => setParam("stock", e.target.value, "all")}
            >
              <option value="all">{t("products.filters.anyStock")}</option>
              <option value="in">{t("products.filters.inStock")}</option>
              <option value="low">{t("products.filters.lowStock", { max: LOW_STOCK_MAX })}</option>
              <option value="out">{t("products.filters.outOfStock")}</option>
            </SelectField>
          </div>
          {hasFilters ? (
            <div className="mb-4">
              <Button variant="ghost" size="sm" onClick={() => setSearchParams({}, { replace: true })}>
                {t("products.filters.clear")}
              </Button>
            </div>
          ) : null}

          {rows.length === 0 ? (
            data.length === 0 ? (
              <EmptyState title={t("products.emptyTitle")} description={t("products.emptyDescription")} />
            ) : (
              <EmptyState title={t("products.noMatchTitle")} description={t("products.noMatchDescription")} />
            )
          ) : (
            <Card className="overflow-x-auto p-4">
              <table className="w-full text-sm">
                <caption className="sr-only">{t("nav.products")}</caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pe-4 text-start font-medium">{t("products.columns.product")}</th>
                    <th scope="col" className="py-2 pe-4 text-start font-medium">{t("products.columns.category")}</th>
                    <th scope="col" className="py-2 pe-4 text-end font-medium">{t("products.columns.price")}</th>
                    <th scope="col" className="py-2 pe-4 text-start font-medium">{t("products.columns.stock")}</th>
                    <th scope="col" className="py-2 pe-4 text-start font-medium">{t("products.columns.status")}</th>
                    <th scope="col" className="py-2 text-end font-medium">{t("products.columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const archived = p.archivedAt !== undefined;
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <th scope="row" className="py-2.5 pe-4 text-start font-normal">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] bg-surface-muted object-cover" />
                            <div className="min-w-0">
                              <Link to={`/admin/products/${p.id}`} className="block truncate font-medium text-foreground hover:text-accent hover:underline">
                                {p.name}
                              </Link>
                              <span className="text-xs text-muted-foreground">{p.brand}</span>
                            </div>
                          </div>
                        </th>
                        <td className="py-2.5 pe-4 text-muted-foreground">{categoryName(p.categoryId)}</td>
                        <td className="py-2.5 pe-4 text-end">
                          <span className="font-medium text-foreground">{money(p.price, p.currency)}</span>
                          {p.previousPrice ? (
                            <span className="ms-2 text-xs text-muted-foreground line-through">{money(p.previousPrice, p.currency)}</span>
                          ) : null}
                        </td>
                        <td className="py-2.5 pe-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground">
                              {p.inventory !== undefined ? new Intl.NumberFormat(locale).format(p.inventory) : t("products.stockNotTracked")}
                            </span>
                            {!p.inStock ? (
                              <Badge tone="danger">{t("products.stockBadge.out")}</Badge>
                            ) : isLow(p) ? (
                              <Badge tone="warning">{t("products.stockBadge.low")}</Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2.5 pe-4">
                          <Badge tone={archived ? "neutral" : "success"}>
                            {t(archived ? "products.status.archived" : "products.status.active")}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-end">
                          <div className="flex justify-end gap-1">
                            <Link
                              to={`/admin/products/${p.id}`}
                              aria-label={t("products.editLabel", { name: p.name })}
                              className={buttonVariants({ variant: "ghost", size: "sm" })}
                            >
                              {t("products.edit")}
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating}
                              aria-label={t(archived ? "products.restoreLabel" : "products.archiveLabel", { name: p.name })}
                              onClick={() => toggleArchived(p.id, p.name, !archived)}
                            >
                              {t(archived ? "products.restore" : "products.archive")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      ) : null}
    </>
  );
}

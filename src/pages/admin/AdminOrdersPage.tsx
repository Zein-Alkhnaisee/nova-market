import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { SelectField } from "../../components/ui/SelectField";
import { Skeleton } from "../../components/ui/Skeleton";
import { TextField } from "../../components/ui/TextField";
import { useGetAdminOrdersQuery } from "../../services/api/adminApi";
import type { OrderStatus } from "../../types/order";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];

export function AdminOrdersPage() {
  const { t, i18n } = useTranslation(["admin", "orders"]);
  const locale = i18n.language;
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  // Only a real status counts: a hand-edited ?status=bogus must not filter to nothing while the dropdown shows "All".
  const rawStatus = searchParams.get("status") ?? "";
  const status = (STATUSES as string[]).includes(rawStatus) ? rawStatus : "";
  const { data, isLoading, isError, refetch } = useGetAdminOrdersQuery(undefined, { refetchOnMountOrArgChange: true });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const needle = q.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (o) =>
      (!status || o.status === status) &&
      (!needle || o.orderNumber.toLowerCase().includes(needle) || o.customerName.toLowerCase().includes(needle))
  );
  const money = (value: number, currency: string) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

  return (
    <>
      <AdminPageHeader title={t("admin:nav.orders")} description={t("admin:orders.description")} />

      {isLoading ? (
        <div aria-busy="true" aria-label={t("common:loading")} className="flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-72" />
        </div>
      ) : null}
      {isError ? <ErrorState message={t("admin:orders.error")} onRetry={refetch} /> : null}

      {data ? (
        data.length === 0 ? (
          <EmptyState title={t("admin:orders.emptyTitle")} description={t("admin:orders.emptyDescription")} />
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                id="admin-order-search"
                type="search"
                label={t("admin:orders.search")}
                placeholder={t("admin:orders.searchPlaceholder")}
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
              <SelectField id="admin-order-status" label={t("admin:orders.statusFilter")} value={status} onChange={(e) => setParam("status", e.target.value)}>
                <option value="">{t("admin:orders.allStatuses")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`orders:status.${s}`)}</option>
                ))}
              </SelectField>
            </div>
            {q || status ? (
              <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={() => setSearchParams({}, { replace: true })}>{t("admin:orders.clear")}</Button>
              </div>
            ) : null}

            {rows.length === 0 ? (
              <EmptyState title={t("admin:orders.noMatchTitle")} description={t("admin:orders.noMatchDescription")} />
            ) : (
              <Card className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <caption className="sr-only">{t("admin:nav.orders")}</caption>
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th scope="col" className="py-2 pe-4 text-start font-medium">{t("admin:orders.columns.order")}</th>
                      <th scope="col" className="py-2 pe-4 text-start font-medium">{t("admin:orders.columns.date")}</th>
                      <th scope="col" className="py-2 pe-4 text-start font-medium">{t("admin:orders.columns.customer")}</th>
                      <th scope="col" className="py-2 pe-4 text-end font-medium">{t("admin:orders.columns.items")}</th>
                      <th scope="col" className="py-2 pe-4 text-start font-medium">{t("admin:orders.columns.status")}</th>
                      <th scope="col" className="py-2 text-end font-medium">{t("admin:orders.columns.total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <th scope="row" className="py-2.5 pe-4 text-start font-medium">
                          <Link to={`/admin/orders/${o.id}`} className="text-foreground hover:text-accent hover:underline">{o.orderNumber}</Link>
                        </th>
                        <td className="py-2.5 pe-4 text-muted-foreground">{new Date(o.placedAt).toLocaleDateString(locale)}</td>
                        <td className="py-2.5 pe-4 text-foreground">
                          {o.customerName}
                          {!o.customerId ? <span className="ms-2 text-xs text-muted-foreground">{t("admin:orders.noAccount")}</span> : null}
                        </td>
                        <td className="py-2.5 pe-4 text-end">{new Intl.NumberFormat(locale).format(o.itemCount)}</td>
                        <td className="py-2.5 pe-4"><OrderStatusBadge status={o.status} /></td>
                        <td className="py-2.5 text-end font-medium text-foreground">{money(o.total, o.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )
      ) : null}
    </>
  );
}

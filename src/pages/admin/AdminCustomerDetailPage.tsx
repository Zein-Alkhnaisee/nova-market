import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { KpiCard } from "../../components/admin/KpiCard";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { buttonVariants } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { useGetAdminCustomerQuery } from "../../services/api/adminApi";

export function AdminCustomerDetailPage() {
  const { t, i18n } = useTranslation("admin");
  const locale = i18n.language;
  const { id = "" } = useParams();
  const { data, isLoading, isError, error, refetch } = useGetAdminCustomerQuery(id, {
    refetchOnMountOrArgChange: true,
  });

  const back = (
    <Link to="/admin/customers" className={buttonVariants({ variant: "outline", size: "sm" })}>
      {t("customers.backToList")}
    </Link>
  );

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
        <Skeleton className="h-10 max-w-xs" />
        <Skeleton className="h-24" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (isError) {
    const notFound = (error as { status?: number } | undefined)?.status === 404;
    return notFound ? (
      <>
        <AdminPageHeader title={t("customers.notFoundTitle")} actions={back} />
        <EmptyState title={t("customers.notFoundTitle")} description={t("customers.notFoundDescription")} />
      </>
    ) : (
      <>
        <AdminPageHeader title={t("nav.customers")} actions={back} />
        <ErrorState message={t("customers.detailError")} onRetry={refetch} />
      </>
    );
  }

  if (!data) return null;

  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: data.currency }).format(value);
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale) : t("customers.never"));

  return (
    <>
      <AdminPageHeader title={data.customer.fullName} description={data.customer.email} actions={back} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t("customers.orders")} value={new Intl.NumberFormat(locale).format(data.orderCount)} />
        <KpiCard label={t("customers.lifetimeSpend")} value={money(data.lifetimeSpend)} hint={t("customers.spendHint")} />
        <KpiCard
          label={t("customers.averageOrder")}
          value={data.averageOrderValue === null ? t("customers.notAvailable") : money(data.averageOrderValue)}
        />
        <KpiCard label={t("customers.lastOrder")} value={date(data.lastOrderAt)} hint={t("customers.firstOrderHint", { date: date(data.firstOrderAt) })} />
      </div>

      <Card className="mt-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("customers.orderHistory")}</h2>
        {data.orders.length === 0 ? (
          <EmptyState title={t("customers.noOrdersTitle")} description={t("customers.noOrdersDescription")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("customers.orderHistory")}</caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("dashboard.recentOrders.order")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("dashboard.recentOrders.date")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("dashboard.recentOrders.status")}</th>
                  <th scope="col" className="py-2 text-end font-medium">{t("dashboard.recentOrders.total")}</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2.5 pe-4 text-start font-medium text-foreground">{o.orderNumber}</th>
                    <td className="py-2.5 pe-4 text-muted-foreground">{date(o.placedAt)}</td>
                    <td className="py-2.5 pe-4"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-2.5 text-end font-medium text-foreground">
                      {new Intl.NumberFormat(locale, { style: "currency", currency: o.currency }).format(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { KpiCard } from "../../components/admin/KpiCard";
import { BarChart } from "../../components/admin/charts/BarChart";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { useGetDashboardStatsQuery } from "../../services/api/adminApi";
import type { DashboardStats } from "../../lib/adminStats";

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="mt-4 h-56" />
    </div>
  );
}

function DashboardContent({ stats }: { stats: DashboardStats }) {
  const { t, i18n } = useTranslation("admin");
  const locale = i18n.language;
  const money = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: stats.currency, maximumFractionDigits: 0 }).format(value);
  const money2 = (value: number, currency = stats.currency) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  const int = (value: number) => new Intl.NumberFormat(locale).format(value);
  const dayLabel = (key: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(`${key}T00:00:00`));

  const hasSales = stats.revenue > 0;
  const topMax = Math.max(1, ...stats.topProducts.map((p) => p.revenue));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={t("dashboard.kpi.revenue")} value={money(stats.revenue)} hint={t("dashboard.kpi.revenueHint")} />
        <KpiCard
          label={t("dashboard.kpi.orders")}
          value={int(stats.orderCount)}
          hint={t("dashboard.kpi.ordersHint", { count: stats.openOrderCount })}
        />
        <KpiCard label={t("dashboard.kpi.customers")} value={int(stats.customerCount)} />
        <KpiCard
          label={t("dashboard.kpi.products")}
          value={int(stats.productCount)}
          hint={t("dashboard.kpi.productsHint", { count: stats.outOfStockCount })}
        />
        <KpiCard
          label={t("dashboard.kpi.conversion")}
          value={
            stats.conversion === null
              ? t("dashboard.kpi.unavailable")
              : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(stats.conversion)
          }
          hint={stats.conversion === null ? t("dashboard.kpi.conversionUnavailable") : undefined}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">{t("dashboard.revenueTrend.title")}</h2>
          <p className="mb-4 text-xs text-muted-foreground">{t("dashboard.revenueTrend.subtitle", { count: stats.revenueByDay.length })}</p>
          {hasSales ? (
            <BarChart
              data={stats.revenueByDay.map((d) => ({ key: d.date, label: dayLabel(d.date), value: d.revenue }))}
              ariaLabel={t("dashboard.revenueTrend.title")}
              formatValue={money2}
              columnLabels={{ label: t("dashboard.revenueTrend.day"), value: t("dashboard.kpi.revenue") }}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("dashboard.revenueTrend.empty")}</p>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">{t("dashboard.topProducts.title")}</h2>
          <p className="mb-4 text-xs text-muted-foreground">{t("dashboard.topProducts.subtitle")}</p>
          {stats.topProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("dashboard.topProducts.empty")}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {stats.topProducts.map((p) => (
                <li key={p.productId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-foreground">{p.name}</span>
                    <span className="shrink-0 font-medium text-foreground">{money2(p.revenue)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(p.revenue / topMax) * 100}%` }} />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{t("dashboard.topProducts.units", { count: p.units })}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("dashboard.recentOrders.title")}</h2>
        {stats.recentOrders.length === 0 ? (
          <EmptyState title={t("dashboard.recentOrders.emptyTitle")} description={t("dashboard.recentOrders.emptyDescription")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("dashboard.recentOrders.order")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("dashboard.recentOrders.customer")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("dashboard.recentOrders.date")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("dashboard.recentOrders.status")}</th>
                  <th scope="col" className="py-2 text-end font-medium">{t("dashboard.recentOrders.total")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2.5 pe-4 text-start font-medium text-foreground">{o.orderNumber}</th>
                    <td className="py-2.5 pe-4 text-foreground">{o.customerName}</td>
                    <td className="py-2.5 pe-4 text-muted-foreground">{new Date(o.placedAt).toLocaleDateString(locale)}</td>
                    <td className="py-2.5 pe-4"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-2.5 text-end font-medium text-foreground">{money2(o.total, o.currency)}</td>
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

export function AdminDashboardPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError, refetch } = useGetDashboardStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <>
      <AdminPageHeader title={t("nav.dashboard")} description={t("dashboard.description")} />
      {isLoading ? <DashboardSkeleton /> : null}
      {isError ? <ErrorState message={t("dashboard.error")} onRetry={refetch} /> : null}
      {data ? <DashboardContent stats={data} /> : null}
    </>
  );
}

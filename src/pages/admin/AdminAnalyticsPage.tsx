import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { KpiCard } from "../../components/admin/KpiCard";
import { BarChart } from "../../components/admin/charts/BarChart";
import { HorizontalBarList } from "../../components/admin/charts/HorizontalBarList";
import { ErrorState } from "../../components/common/ErrorState";
import { Card } from "../../components/ui/Card";
import { SelectField } from "../../components/ui/SelectField";
import { Skeleton } from "../../components/ui/Skeleton";
import { DEFAULT_RANGE, RANGE_OPTIONS, parseRange, type AnalyticsStats } from "../../lib/adminAnalytics";
import { useGetAnalyticsQuery } from "../../services/api/adminApi";

function AnalyticsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="mt-6 h-64" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="mt-4 h-56" />
    </div>
  );
}

function ViewCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </Card>
  );
}

const Empty = ({ text }: { text: string }) => <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;

function AnalyticsContent({ stats }: { stats: AnalyticsStats }) {
  const { t, i18n } = useTranslation(["admin", "orders"]);
  const locale = i18n.language;
  const money = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: stats.currency, maximumFractionDigits: 0 }).format(v);
  const money2 = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: stats.currency }).format(v);
  const int = (v: number) => new Intl.NumberFormat(locale).format(v);
  const dayLabel = (key: string) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(`${key}T00:00:00`));

  const hasOrders = stats.orderCount > 0;
  const hasRevenue = stats.revenue > 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t("admin:analytics.kpi.revenue")} value={money(stats.revenue)} hint={t("admin:analytics.kpi.revenueHint")} />
        <KpiCard label={t("admin:analytics.kpi.orders")} value={int(stats.orderCount)} hint={t("admin:analytics.kpi.ordersHint")} />
        <KpiCard
          label={t("admin:analytics.kpi.average")}
          value={stats.averageOrderValue === null ? t("admin:analytics.kpi.unavailable") : money2(stats.averageOrderValue)}
          hint={t("admin:analytics.kpi.averageHint")}
        />
        <KpiCard
          label={t("admin:analytics.kpi.conversion")}
          value={t("admin:analytics.kpi.unavailable")}
          hint={t("admin:analytics.kpi.conversionUnavailable")}
        />
      </div>

      <div className="mt-6">
        <ViewCard title={t("admin:analytics.revenueTrend.title")} subtitle={t("admin:analytics.revenueTrend.subtitle", { count: stats.rangeDays })}>
          {hasRevenue ? (
            <BarChart
              data={stats.revenueByDay.map((d) => ({ key: d.date, label: dayLabel(d.date), value: d.revenue }))}
              ariaLabel={t("admin:analytics.revenueTrend.title")}
              formatValue={money2}
              columnLabels={{ label: t("admin:analytics.revenueTrend.day"), value: t("admin:analytics.kpi.revenue") }}
            />
          ) : (
            <Empty text={t("admin:analytics.revenueTrend.empty")} />
          )}
        </ViewCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ViewCard title={t("admin:analytics.status.title")} subtitle={t("admin:analytics.status.subtitle")}>
          {hasOrders ? (
            <HorizontalBarList
              ariaLabel={t("admin:analytics.status.title")}
              items={stats.ordersByStatus.map((s) => ({
                key: s.status,
                label: t(`orders:status.${s.status}`),
                value: s.count,
                valueLabel: int(s.count),
              }))}
            />
          ) : (
            <Empty text={t("admin:analytics.status.empty")} />
          )}
        </ViewCard>

        <ViewCard title={t("admin:analytics.topProducts.title")} subtitle={t("admin:analytics.topProducts.subtitle")}>
          {stats.topProducts.length > 0 ? (
            <HorizontalBarList
              ariaLabel={t("admin:analytics.topProducts.title")}
              items={stats.topProducts.map((p) => ({
                key: p.productId,
                label: p.name,
                value: p.revenue,
                valueLabel: money2(p.revenue),
                detail: t("admin:analytics.units", { count: p.units }),
              }))}
            />
          ) : (
            <Empty text={t("admin:analytics.topProducts.empty")} />
          )}
        </ViewCard>
      </div>

      <div className="mt-4">
        <ViewCard title={t("admin:analytics.categories.title")} subtitle={t("admin:analytics.categories.subtitle")}>
          {stats.salesByCategory.length > 0 ? (
            <HorizontalBarList
              ariaLabel={t("admin:analytics.categories.title")}
              items={stats.salesByCategory.map((c) => ({
                key: c.categoryId ?? "unknown",
                label: c.name ?? t("admin:analytics.categories.unknown"),
                value: c.revenue,
                valueLabel: money2(c.revenue),
                detail: t("admin:analytics.units", { count: c.units }),
              }))}
            />
          ) : (
            <Empty text={t("admin:analytics.categories.empty")} />
          )}
        </ViewCard>
      </div>
    </>
  );
}

export function AdminAnalyticsPage() {
  const { t } = useTranslation("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const rangeDays = parseRange(searchParams.get("range"));
  const { currentData, isFetching, isError, refetch } = useGetAnalyticsQuery({ rangeDays }, { refetchOnMountOrArgChange: true });

  const setRange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && Number(value) !== DEFAULT_RANGE) next.set("range", value);
    else next.delete("range");
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <AdminPageHeader
        title={t("nav.analytics")}
        description={t("analytics.description")}
        actions={
          <SelectField id="analytics-range" label={t("analytics.period.label")} value={String(rangeDays)} onChange={(e) => setRange(e.target.value)}>
            {RANGE_OPTIONS.map((d) => (
              <option key={d} value={d}>{t(`analytics.period.last${d}`)}</option>
            ))}
          </SelectField>
        }
      />
      {isFetching && !currentData && !isError ? <AnalyticsSkeleton /> : null}
      {isError ? <ErrorState message={t("analytics.error")} onRetry={refetch} /> : null}
      {currentData ? <AnalyticsContent stats={currentData} /> : null}
    </>
  );
}

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useGetOrdersQuery } from "../../services/api/ordersApi";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

export function OrdersPage() {
  const isAuthenticated = useAuthGuard();
  const { t } = useTranslation("orders");
  const { data: orders, isLoading, isError, refetch } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-foreground">{t("title")}</h2>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-[var(--radius-lg)] border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("orderNumber")} {order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("placedOn", { date: new Date(order.placedAt).toLocaleDateString() })}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="mt-4 flex items-center gap-2">
                {order.items.slice(0, 4).map((item) => (
                  <img
                    key={item.productId}
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-[var(--radius-sm)] object-cover"
                  />
                ))}
                {order.items.length > 4 ? (
                  <span className="text-xs text-muted-foreground">+{order.items.length - 4}</span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("itemsCount", { count: order.items.length })} · {t("total")}:{" "}
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: order.currency,
                    }).format(order.total)}
                  </span>
                </p>
                <Link
                  to={`/account/orders/${order.id}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {t("viewDetails")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={t("empty")}
          description={t("emptyDescription")}
          action={
            <Link to="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
              {t("startShopping")}
            </Link>
          }
        />
      )}
    </div>
  );
}

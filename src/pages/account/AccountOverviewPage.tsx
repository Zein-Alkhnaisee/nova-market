import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../lib/format";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAppSelector } from "../../app/store/hooks";
import { selectWishlistIds } from "../../features/wishlist/wishlistSlice";
import { selectAddresses } from "../../features/account/addressesSlice";
import { useGetOrdersQuery } from "../../services/api/ordersApi";
import { selectUser } from "../../features/auth/authSlice";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

export function AccountOverviewPage() {
  const isAuthenticated = useAuthGuard();
  const { t } = useTranslation(["account", "orders"]);
  const user = useAppSelector(selectUser);
  const wishlistIds = useAppSelector(selectWishlistIds);
  const addresses = useAppSelector(selectAddresses);
  const { data: allOrders, isLoading, isError, refetch } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) return null;

  // Same filter as the orders page — only this account's own orders.
  const orders = allOrders?.filter((o) => o.customerId && o.customerId === user?.id);
  const recentOrders = orders?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t("account:overview.recentOrders")}</h2>
          {recentOrders.length > 0 ? (
            <Link to="/account/orders" className="text-sm font-medium text-accent hover:underline">
              {t("account:overview.viewAllOrders")}
            </Link>
          ) : null}
        </div>

        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/account/orders/${order.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-border p-4 hover:bg-surface-hover"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("orders:itemsCount", { count: order.items.length })} ·{" "}
                      {formatCurrency(order.total, order.currency)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">{t("account:overview.noOrders")}</p>
            <Link to="/shop" className={cn(buttonVariants({ variant: "primary" }), "mt-4")}>
              {t("account:overview.startShopping")}
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/account/wishlist"
          className="rounded-[var(--radius-lg)] border border-border p-5 hover:bg-surface-hover"
        >
          <p className="text-2xl font-semibold text-foreground">{wishlistIds.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("account:overview.savedItems")}</p>
        </Link>
        <Link
          to="/account/addresses"
          className="rounded-[var(--radius-lg)] border border-border p-5 hover:bg-surface-hover"
        >
          <p className="text-2xl font-semibold text-foreground">{addresses.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("account:overview.savedAddresses")}</p>
        </Link>
      </section>
    </div>
  );
}

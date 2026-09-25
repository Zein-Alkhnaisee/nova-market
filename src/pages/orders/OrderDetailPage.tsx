import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check } from "lucide-react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useCancelOrderMutation, useGetOrderByIdQuery } from "../../services/api/ordersApi";
import { useAppDispatch } from "../../app/store/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { useGetProductsQuery } from "../../services/api/productsApi";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import type { OrderStatus } from "../../types/order";

const CANCELLABLE: OrderStatus[] = ["pending", "confirmed", "processing"];

export function OrderDetailPage() {
  const isAuthenticated = useAuthGuard();
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("orders");
  const dispatch = useAppDispatch();
  const { data: order, isLoading, isError, refetch } = useGetOrderByIdQuery(id, { skip: !isAuthenticated });
  const { data: allProducts } = useGetProductsQuery();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState message={t("detail.notFound")} onRetry={refetch} />;
  }

  const format = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: order.currency }).format(amount);

  const handleBuyAgain = () => {
    order.items.forEach((item) => {
      const product = allProducts?.find((p) => p.id === item.productId);
      if (product) dispatch(addToCart({ product, quantity: item.quantity }));
    });
  };

  const handleCancel = async () => {
    if (window.confirm(t("detail.cancelConfirm"))) {
      await cancelOrder(order.id);
    }
  };

  return (
    <div>
      <Link
        to="/account/orders"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("backToOrders")}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("orderNumber")} {order.orderNumber}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("placedOn", { date: new Date(order.placedAt).toLocaleDateString() })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">{t("detail.items")}</h3>
          <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-md)] border border-border">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 p-3">
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-[var(--radius-sm)] object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${item.slug}`} className="text-sm font-medium text-foreground">
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                </div>
                <span className="text-sm text-foreground">{format(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">{t("detail.timeline")}</h3>
          <ol className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border p-4">
            {order.timeline.map((entry, index) => (
              <li key={`${entry.status}-${index}`} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-foreground">{t(`status.${entry.status}`)}</span>
                <time className="ms-auto text-xs text-muted-foreground" dateTime={entry.timestamp}>
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
          {order.status !== "cancelled" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("detail.estimatedDelivery")}:{" "}
              <span className="text-foreground">
                {new Date(order.estimatedDelivery).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-[var(--radius-md)] border border-border p-4">
            <h3 className="text-sm font-medium text-foreground">{t("detail.shippingAddress")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-md)] border border-border p-4">
              <h3 className="text-sm font-medium text-foreground">{t("detail.deliveryMethod")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {order.deliveryOption.label} — {order.deliveryOption.etaDays}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-border p-4">
              <h3 className="text-sm font-medium text-foreground">{t("detail.payment")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {order.paymentSummary.brand} •••• {order.paymentSummary.last4}
              </p>
            </div>
          </section>
        </div>

        <OrderSummary
          pricing={{
            subtotal: order.subtotal,
            discount: order.discount,
            shipping: order.shipping,
            tax: order.tax,
            total: order.total,
            amountUntilFreeShipping: 0,
            qualifiesForFreeShipping: order.shipping === 0,
          }}
          currency={order.currency}
        />

        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">{t("detail.actions")}</h3>
          {order.status === "cancelled" ? (
            <p className="text-sm text-muted-foreground">{t("detail.cancelled")}</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleBuyAgain}
                className="h-11 rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                {t("detail.buyAgain")}
              </button>
              {CANCELLABLE.includes(order.status) ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="h-11 rounded-[var(--radius-md)] border border-border px-5 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-60"
                >
                  {t("detail.cancelOrder")}
                </button>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

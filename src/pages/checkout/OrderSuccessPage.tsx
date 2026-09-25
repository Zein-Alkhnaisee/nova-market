import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { useGetOrderByIdQuery } from "../../services/api/ordersApi";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

export function OrderSuccessPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("checkout");
  const { data: order, isLoading, isError, refetch } = useGetOrderByIdQuery(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-64" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">{t("success.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("success.subtitle")}</p>

      <div className="mt-8 flex justify-center gap-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-start">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("success.orderNumber")}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{order.orderNumber}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("success.estimatedDelivery")}</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {new Date(order.estimatedDelivery).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="mt-8 text-start">
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
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
          {t("success.continueShopping")}
        </Link>
        <Link to={`/account/orders/${order.id}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          {t("success.viewOrder")}
        </Link>
      </div>
    </div>
  );
}

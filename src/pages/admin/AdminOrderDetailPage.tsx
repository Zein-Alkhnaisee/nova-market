import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Button, buttonVariants } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { isDestructiveTransition } from "../../lib/orderTransitions";
import { useGetAdminOrderQuery, useUpdateAdminOrderStatusMutation } from "../../services/api/adminApi";
import type { OrderStatus } from "../../types/order";

function ConfirmStatus({ target, busy, onConfirm, onCancel }: { target: OrderStatus; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation(["admin", "orders"]);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Destructive prompt: land focus on the safe choice.
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="confirm-status-title" aria-describedby="confirm-status-desc" className="mt-4 rounded-[var(--radius-md)] border border-danger/40 bg-danger/5 p-4">
      <h3 id="confirm-status-title" className="text-sm font-semibold text-foreground">{t(`admin:orders.confirm.${target}.title`)}</h3>
      <p id="confirm-status-desc" className="mt-1 text-sm text-muted-foreground">{t(`admin:orders.confirm.${target}.description`)}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button ref={cancelRef} type="button" variant="outline" size="sm" onClick={onCancel}>{t("admin:orders.confirm.keep")}</Button>
        <Button type="button" variant="outline" size="sm" className="border-danger text-danger hover:bg-danger/10" loading={busy} onClick={onConfirm}>
          {t(`admin:orders.actions.${target}`)}
        </Button>
      </div>
    </div>
  );
}

export function AdminOrderDetailPage() {
  const { t, i18n } = useTranslation(["admin", "orders"]);
  const locale = i18n.language;
  const { id = "" } = useParams();
  const { data, isLoading, isError, error, refetch } = useGetAdminOrderQuery(id, { refetchOnMountOrArgChange: true });
  const [updateStatus, { isLoading: updating }] = useUpdateAdminOrderStatusMutation();
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const back = (
    <Link to="/admin/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("admin:orders.backToList")}</Link>
  );

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
        <Skeleton className="h-10 max-w-xs" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (isError) {
    const notFound = (error as { status?: number } | undefined)?.status === 404;
    return (
      <>
        <AdminPageHeader title={t(notFound ? "admin:orders.notFoundTitle" : "admin:nav.orders")} actions={back} />
        {notFound ? (
          <EmptyState title={t("admin:orders.notFoundTitle")} description={t("admin:orders.notFoundDescription")} />
        ) : (
          <ErrorState message={t("admin:orders.detailError")} onRetry={refetch} />
        )}
      </>
    );
  }
  if (!data) return null;

  const { order, customer, allowedNext } = data;
  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: order.currency }).format(value);
  const dateTime = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  const a = order.shippingAddress;

  const apply = async (to: OrderStatus) => {
    setNotice(null);
    setProblem(null);
    const result = await updateStatus({ id: order.id, to });
    setConfirming(null);
    if ("data" in result && result.data?.ok) {
      setNotice(t("admin:orders.notice", { status: t(`orders:status.${to}`) }));
    } else if ("data" in result && result.data && !result.data.ok && result.data.status === 409) {
      setProblem(t("admin:orders.illegal", { from: t(`orders:status.${result.data.from}`), to: t(`orders:status.${result.data.to}`) }));
    } else {
      setProblem(t("admin:orders.actionError"));
    }
  };

  const onAction = (to: OrderStatus) => (isDestructiveTransition(to) ? setConfirming(to) : apply(to));
  const firstForward = allowedNext.find((s) => !isDestructiveTransition(s));

  return (
    <>
      <AdminPageHeader
        title={order.orderNumber}
        description={t("admin:orders.placedOn", { date: dateTime(order.placedAt) })}
        actions={<><OrderStatusBadge status={order.status} />{back}</>}
      />

      <div role="status" aria-live="polite">
        {notice ? <p className="mb-4 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-foreground">{notice}</p> : null}
      </div>
      {problem ? <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-sm text-danger">{problem}</p> : null}

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("admin:orders.updateStatus")}</h2>
        {allowedNext.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin:orders.finalStatus")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allowedNext.map((to) => (
              <Button
                key={to}
                size="sm"
                variant={to === firstForward ? "primary" : "outline"}
                className={isDestructiveTransition(to) ? "border-danger text-danger hover:bg-danger/10" : undefined}
                disabled={updating}
                onClick={() => onAction(to)}
              >
                {t(`admin:orders.actions.${to}`)}
              </Button>
            ))}
          </div>
        )}
        {confirming ? <ConfirmStatus target={confirming} busy={updating} onConfirm={() => apply(confirming)} onCancel={() => setConfirming(null)} /> : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t("admin:orders.items")}</h2>
          <table className="w-full text-sm">
            <caption className="sr-only">{t("admin:orders.items")}</caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="py-2 pe-4 text-start font-medium">{t("admin:orders.itemColumns.product")}</th>
                <th scope="col" className="py-2 pe-4 text-end font-medium">{t("admin:orders.itemColumns.unitPrice")}</th>
                <th scope="col" className="py-2 pe-4 text-end font-medium">{t("admin:orders.itemColumns.quantity")}</th>
                <th scope="col" className="py-2 text-end font-medium">{t("admin:orders.itemColumns.lineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={`${item.productId}-${i}`} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2.5 pe-4 text-start font-normal">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] bg-surface-muted object-cover" />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                  </th>
                  <td className="py-2.5 pe-4 text-end">{money(item.unitPrice)}</td>
                  <td className="py-2.5 pe-4 text-end">{item.quantity}</td>
                  <td className="py-2.5 text-end font-medium text-foreground">{money(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 ms-auto grid max-w-xs grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t("admin:orders.summary.subtotal")}</dt><dd className="text-end">{money(order.subtotal)}</dd>
            {order.discount > 0 ? (<><dt className="text-muted-foreground">{t("admin:orders.summary.discount")}</dt><dd className="text-end">−{money(order.discount)}</dd></>) : null}
            <dt className="text-muted-foreground">{t("admin:orders.summary.shipping")}</dt><dd className="text-end">{money(order.shipping)}</dd>
            <dt className="text-muted-foreground">{t("admin:orders.summary.tax")}</dt><dd className="text-end">{money(order.tax)}</dd>
            <dt className="font-semibold text-foreground">{t("admin:orders.summary.total")}</dt><dd className="text-end font-semibold text-foreground">{money(order.total)}</dd>
          </dl>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{t("admin:orders.customer")}</h2>
            {customer ? (
              <>
                <Link to={`/admin/customers/${customer.id}`} className="text-sm font-medium text-foreground hover:text-accent hover:underline">{customer.fullName}</Link>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">{a.fullName}</p>
                <p className="text-xs text-muted-foreground">{t("admin:orders.notLinked")}</p>
              </>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{t("admin:orders.shippingAddress")}</h2>
            <address className="text-sm not-italic text-muted-foreground">
              {a.fullName}<br />{a.line1}<br />{a.line2 ? <>{a.line2}<br /></> : null}{a.city}, {a.region} {a.postalCode}<br />{a.country}<br />{a.phone}
            </address>
            <p className="mt-3 text-xs text-muted-foreground">{t("admin:orders.delivery", { label: order.deliveryOption.label, eta: order.deliveryOption.etaDays })}</p>
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{t("admin:orders.payment")}</h2>
            <p className="text-sm text-muted-foreground">{t("admin:orders.paymentValue", { brand: order.paymentSummary.brand, last4: order.paymentSummary.last4 })}</p>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("admin:orders.timeline")}</h2>
        <ol className="flex flex-col gap-2">
          {order.timeline.map((entry, i) => (
            <li key={`${entry.status}-${i}`} className="flex items-center justify-between gap-3 text-sm">
              <OrderStatusBadge status={entry.status} />
              <span className="text-muted-foreground">{dateTime(entry.timestamp)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}

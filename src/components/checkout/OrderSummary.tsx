import { useTranslation } from "react-i18next";
import type { PricingBreakdown } from "../../lib/pricing";

interface OrderSummaryProps {
  pricing: PricingBreakdown;
  currency: string;
  couponCode?: string | null;
  shippingNote?: string;
}

export function OrderSummary({ pricing, currency, couponCode, shippingNote }: OrderSummaryProps) {
  const { t } = useTranslation("checkout");
  const format = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(
      amount
    );

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-foreground">{t("summary.title")}</h2>
      <dl className="mt-4 flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("summary.subtotal")}</dt>
          <dd className="text-foreground">{format(pricing.subtotal)}</dd>
        </div>
        {pricing.discount > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t("summary.discount")}
              {couponCode ? ` (${couponCode})` : ""}
            </dt>
            <dd className="text-success">-{format(pricing.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("summary.shipping")}</dt>
          <dd className="text-foreground">
            {shippingNote ?? (pricing.shipping === 0 ? t("summary.free") : format(pricing.shipping))}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("summary.tax")}</dt>
          <dd className="text-foreground">{format(pricing.tax)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
        <span>{t("summary.total")}</span>
        <span>{format(pricing.total)}</span>
      </div>
      {!pricing.qualifiesForFreeShipping && pricing.amountUntilFreeShipping > 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("summary.freeShippingProgress", { amount: format(pricing.amountUntilFreeShipping) })}
        </p>
      ) : null}
    </div>
  );
}

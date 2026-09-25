import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { removeFromCart, selectCartLines, setQuantity } from "../../features/cart/cartSlice";
import { selectCouponCode, selectDiscountPercent, setCoupon } from "../../features/checkout/checkoutSlice";
import { useGetCartSuggestionsQuery } from "../../services/api/recommendationsApi";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { computePricing } from "../../lib/pricing";
import { EmptyState } from "../../components/common/EmptyState";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { CouponInput } from "../../components/checkout/CouponInput";
import { ProductRail } from "../../components/product/ProductRail";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

export function CartPage() {
  const { t: tCart } = useTranslation("cart");
  const { t: tCheckout } = useTranslation("checkout");
  const dispatch = useAppDispatch();
  const lines = useAppSelector(selectCartLines);
  const couponCode = useAppSelector(selectCouponCode);
  const discountPercent = useAppSelector(selectDiscountPercent);
  const smartRecommendationsEnabled = useFeatureFlag("smartRecommendations");
  const cartProductIds = lines.map((line) => line.productId);
  const { data: suggestions, isLoading: suggestionsLoading } = useGetCartSuggestionsQuery(
    { cartProductIds },
    { skip: !smartRecommendationsEnabled || cartProductIds.length === 0 }
  );

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">{tCart("title")}</h1>
        <EmptyState
          title={tCart("empty")}
          description={tCart("emptyDescription")}
          action={
            <Link to="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
              Continue shopping
            </Link>
          }
        />
      </div>
    );
  }

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(
      amount
    );

  const pricing = computePricing(lines, { discountPercent });

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">{tCart("title")}</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col divide-y divide-border">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.configurationSummary ?? "base"}`} className="flex gap-4 py-5">
              <Link
                to={`/product/${line.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted"
              >
                <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/product/${line.slug}`} className="text-sm font-medium text-foreground">
                    {line.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        removeFromCart({ productId: line.productId, configurationSummary: line.configurationSummary })
                      )
                    }
                    aria-label={tCart("remove")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {line.configurationSummary ? (
                  <p className="text-xs text-muted-foreground">{line.configurationSummary}</p>
                ) : null}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-border px-1">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          setQuantity({
                            productId: line.productId,
                            quantity: line.quantity - 1,
                            configurationSummary: line.configurationSummary,
                          })
                        )
                      }
                      aria-label="Decrease quantity"
                      className="flex h-7 w-7 items-center justify-center text-foreground"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm text-foreground">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch(
                          setQuantity({
                            productId: line.productId,
                            quantity: line.quantity + 1,
                            configurationSummary: line.configurationSummary,
                          })
                        )
                      }
                      aria-label="Increase quantity"
                      className="flex h-7 w-7 items-center justify-center text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {formatPrice(line.price * line.quantity, line.currency)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex h-fit flex-col gap-4">
          <CouponInput
            appliedCode={couponCode}
            discountPercent={discountPercent}
            onApply={(coupon) => dispatch(setCoupon(coupon))}
            onRemove={() => dispatch(setCoupon(null))}
          />
          <OrderSummary
            pricing={pricing}
            currency={lines[0]?.currency ?? "USD"}
            couponCode={couponCode}
            shippingNote={tCheckout("summary.calculatedAtCheckout")}
          />
          <Link to="/checkout" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}>
            {tCart("checkout")}
          </Link>
        </div>
      </div>

      {smartRecommendationsEnabled ? (
        <div className="mt-16 border-t border-border pt-12">
          <ProductRail
            title={tCart("smartSuggestions.title")}
            products={suggestions}
            isLoading={suggestionsLoading}
            showReasons
            columns={4}
          />
        </div>
      ) : null}
    </div>
  );
}

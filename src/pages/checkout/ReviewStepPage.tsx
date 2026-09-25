import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCheckoutGuard } from "../../hooks/useCheckoutGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { selectCartLines, clearCart } from "../../features/cart/cartSlice";
import {
  selectCouponCode,
  selectDeliveryOption,
  selectDiscountPercent,
  selectShippingAddress,
  setCoupon,
  resetCheckoutDraft,
} from "../../features/checkout/checkoutSlice";
import { usePlaceOrderMutation } from "../../services/api/ordersApi";
import { computePricing } from "../../lib/pricing";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { CouponInput } from "../../components/checkout/CouponInput";
import { ErrorState } from "../../components/common/ErrorState";

interface PaymentSummary {
  brand: string;
  last4: string;
}

export function ReviewStepPage() {
  useCheckoutGuard("review");
  const { t } = useTranslation("checkout");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const lines = useAppSelector(selectCartLines);
  const shippingAddress = useAppSelector(selectShippingAddress);
  const deliveryOption = useAppSelector(selectDeliveryOption);
  const couponCode = useAppSelector(selectCouponCode);
  const discountPercent = useAppSelector(selectDiscountPercent);
  const [placeOrder, { isLoading, isError, reset }] = usePlaceOrderMutation();

  const paymentSummary = (location.state as { paymentSummary?: PaymentSummary } | null)?.paymentSummary;

  useEffect(() => {
    if (!paymentSummary) {
      navigate("/checkout/payment", { replace: true });
    }
    // Only needs to run once on mount to validate the navigation state we arrived with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!shippingAddress || !deliveryOption || !paymentSummary) return null;

  const pricing = computePricing(lines, { deliveryOption, discountPercent });

  const handlePlaceOrder = async () => {
    const result = await placeOrder({
      lines,
      shippingAddress,
      deliveryOption,
      discountPercent,
      paymentSummary,
    });
    if ("data" in result && result.data) {
      // Navigate away first — otherwise clearing the cart while still on
      // /checkout/review would trip this page's own useCheckoutGuard (cart
      // becomes empty) and redirect to /cart in a race with the intended
      // navigation to the success page.
      navigate(`/order-success/${result.data.id}`, { replace: true });
      dispatch(clearCart());
      dispatch(resetCheckoutDraft());
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">{t("review.title")}</h1>

      <div className="flex flex-col gap-6">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">{t("review.items")}</h2>
          </div>
          <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-md)] border border-border">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-3 p-3">
                <img src={line.image} alt={line.name} className="h-14 w-14 rounded-[var(--radius-sm)] object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{line.name}</p>
                  <p className="text-xs text-muted-foreground">× {line.quantity}</p>
                </div>
                <span className="text-sm text-foreground">
                  {new Intl.NumberFormat(undefined, { style: "currency", currency: line.currency }).format(
                    line.price * line.quantity
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex items-start justify-between rounded-[var(--radius-md)] border border-border p-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">{t("review.shippingAddress")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {shippingAddress.fullName}
              <br />
              {shippingAddress.line1}
              {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}
              <br />
              {shippingAddress.city}, {shippingAddress.region} {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
            </p>
          </div>
          <Link to="/checkout/shipping" className="text-sm font-medium text-accent hover:underline">
            {t("review.edit")}
          </Link>
        </section>

        <section className="flex items-center justify-between rounded-[var(--radius-md)] border border-border p-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">{t("review.deliveryMethod")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {deliveryOption.label} — {deliveryOption.etaDays}
            </p>
          </div>
          <Link to="/checkout/delivery" className="text-sm font-medium text-accent hover:underline">
            {t("review.edit")}
          </Link>
        </section>

        <section className="flex items-center justify-between rounded-[var(--radius-md)] border border-border p-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">{t("review.payment")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {paymentSummary.brand} •••• {paymentSummary.last4}
            </p>
          </div>
          <Link to="/checkout/payment" className="text-sm font-medium text-accent hover:underline">
            {t("review.edit")}
          </Link>
        </section>

        <CouponInput
          appliedCode={couponCode}
          discountPercent={discountPercent}
          onApply={(coupon) => dispatch(setCoupon(coupon))}
          onRemove={() => dispatch(setCoupon(null))}
        />

        <OrderSummary pricing={pricing} currency={lines[0]?.currency ?? "USD"} couponCode={couponCode} />

        {isError ? (
          <ErrorState
            onRetry={() => {
              reset();
              handlePlaceOrder();
            }}
          />
        ) : null}

        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={isLoading}
          className="h-12 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isLoading ? t("review.placingOrder") : t("review.placeOrder")}
        </button>
      </div>
    </div>
  );
}

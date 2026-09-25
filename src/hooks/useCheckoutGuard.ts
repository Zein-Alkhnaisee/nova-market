import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/store/hooks";
import { selectCartLines } from "../features/cart/cartSlice";
import { selectDeliveryOption, selectShippingAddress } from "../features/checkout/checkoutSlice";

export type CheckoutStep = "shipping" | "delivery" | "payment" | "review";

/**
 * Enforces the checkout step order by redirecting away from a step whose
 * prerequisites aren't met yet (e.g. landing on /checkout/review with no
 * shipping address saved) — matches the spec's "do not show unnecessary
 * navigation" rule by making it impossible to be on a step that doesn't
 * have what it needs, rather than showing an error state for it.
 */
export function useCheckoutGuard(step: CheckoutStep) {
  const navigate = useNavigate();
  const lines = useAppSelector(selectCartLines);
  const shippingAddress = useAppSelector(selectShippingAddress);
  const deliveryOption = useAppSelector(selectDeliveryOption);

  useEffect(() => {
    if (lines.length === 0) {
      navigate("/cart", { replace: true });
      return;
    }
    if ((step === "delivery" || step === "payment" || step === "review") && !shippingAddress) {
      navigate("/checkout/shipping", { replace: true });
      return;
    }
    if ((step === "payment" || step === "review") && !deliveryOption) {
      navigate("/checkout/delivery", { replace: true });
    }
    // Deliberately checks prerequisites once per page landing (on mount /
    // step change) rather than continuously on every store update. Re-running
    // reactively would misfire the moment a successful order clears the cart
    // and resets the checkout draft — while this page is still mid-navigation
    // away to the order-success screen — redirecting to /cart in a race with
    // the intended navigation. A guard's job is to stop someone from *landing*
    // on a step without its prerequisites, not to react to state this page's
    // own "next step" action is expected to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
}

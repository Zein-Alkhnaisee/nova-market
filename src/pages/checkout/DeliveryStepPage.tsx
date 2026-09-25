import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCheckoutGuard } from "../../hooks/useCheckoutGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { selectCartLines } from "../../features/cart/cartSlice";
import {
  selectDeliveryOption,
  selectShippingAddress,
  setDeliveryOption,
} from "../../features/checkout/checkoutSlice";
import { deliveryOptions } from "../../mocks/data/deliveryOptions";
import { computePricing } from "../../lib/pricing";
import { cn } from "../../lib/cn";

export function DeliveryStepPage() {
  useCheckoutGuard("delivery");
  const { t } = useTranslation("checkout");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const shippingAddress = useAppSelector(selectShippingAddress);
  const savedOption = useAppSelector(selectDeliveryOption);
  const lines = useAppSelector(selectCartLines);
  const [selected, setSelected] = useState(savedOption?.id ?? deliveryOptions[0]?.id);

  if (!shippingAddress) return null;

  const handleContinue = () => {
    const option = deliveryOptions.find((o) => o.id === selected);
    if (!option) return;
    dispatch(setDeliveryOption(option));
    navigate("/checkout/payment");
  };

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-foreground">{t("deliveryForm.title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("deliveryForm.shippingTo")}: {shippingAddress.line1}, {shippingAddress.city}
      </p>

      <div role="radiogroup" aria-label={t("deliveryForm.title")} className="flex flex-col gap-3">
        {deliveryOptions.map((option) => {
          const { shipping, qualifiesForFreeShipping } = computePricing(lines, { deliveryOption: option });
          const isSelected = selected === option.id;
          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-[var(--radius-md)] border p-4",
                isSelected ? "border-primary" : "border-border hover:border-border-strong"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="delivery-option"
                  checked={isSelected}
                  onChange={() => setSelected(option.id)}
                  className="h-4 w-4 accent-[var(--nova-accent)]"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.etaDays}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">
                {qualifiesForFreeShipping ? t("summary.free") : `$${shipping}`}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <Link to="/checkout/shipping" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {t("back")}
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          className="ms-auto h-12 rounded-[var(--radius-md)] bg-primary px-8 text-sm font-medium text-primary-foreground"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}

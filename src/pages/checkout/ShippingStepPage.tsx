import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCheckoutGuard } from "../../hooks/useCheckoutGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { selectShippingAddress, setShippingAddress } from "../../features/checkout/checkoutSlice";
import { AddressForm } from "../../components/checkout/AddressForm";
import type { ShippingAddress } from "../../types/order";

export function ShippingStepPage() {
  useCheckoutGuard("shipping");
  const { t } = useTranslation("checkout");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const savedAddress = useAppSelector(selectShippingAddress);

  const handleSubmit = (address: ShippingAddress) => {
    dispatch(setShippingAddress(address));
    navigate("/checkout/delivery");
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">{t("shippingForm.title")}</h1>
      <AddressForm initialValue={savedAddress} onSubmit={handleSubmit} submitLabel={t("continue")} />
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { useCheckoutGuard } from "../../hooks/useCheckoutGuard";
import { useAppSelector } from "../../app/store/hooks";
import { selectDeliveryOption, selectShippingAddress } from "../../features/checkout/checkoutSlice";
import {
  detectCardBrand,
  isBlank,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
} from "../../lib/validation";

interface PaymentFormState {
  cardNumber: string;
  expiry: string;
  cvc: string;
  nameOnCard: string;
}

type FieldErrors = Partial<Record<keyof PaymentFormState, string>>;

const EMPTY_FORM: PaymentFormState = { cardNumber: "", expiry: "", cvc: "", nameOnCard: "" };

export function PaymentStepPage() {
  useCheckoutGuard("payment");
  const { t } = useTranslation("checkout");
  const navigate = useNavigate();
  const shippingAddress = useAppSelector(selectShippingAddress);
  const deliveryOption = useAppSelector(selectDeliveryOption);

  // Card data lives only in this component's local state — never in Redux,
  // never persisted to localStorage, and cleared the instant we derive the
  // masked summary that actually travels forward. This is a real backend's
  // job (MASTER_SPEC §29/§111): "never fake successful payment in a way
  // that implies production security."
  const [form, setForm] = useState<PaymentFormState>(EMPTY_FORM);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!shippingAddress || !deliveryOption) return null;

  const setField = (field: keyof PaymentFormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!isValidCardNumber(form.cardNumber)) next.cardNumber = t("paymentForm.errors.cardNumber");
    if (!isValidExpiry(form.expiry)) next.expiry = t("paymentForm.errors.expiry");
    if (!isValidCvc(form.cvc)) next.cvc = t("paymentForm.errors.cvc");
    if (isBlank(form.nameOnCard)) next.nameOnCard = t("paymentForm.errors.nameOnCard");
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const paymentSummary = {
      brand: detectCardBrand(form.cardNumber),
      last4: form.cardNumber.replace(/\s/g, "").slice(-4),
    };
    setForm(EMPTY_FORM); // discard card data immediately — only the masked summary continues.
    navigate("/checkout/review", { state: { paymentSummary } });
  };

  const inputClass = (field: keyof PaymentFormState) =>
    `h-11 rounded-[var(--radius-sm)] border bg-background px-3 text-sm text-foreground ${
      errors[field] ? "border-danger" : "border-border"
    }`;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-foreground">{t("paymentForm.title")}</h1>

      <div className="mb-6 flex gap-2 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
        <p>{t("paymentForm.disclaimer")}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cardNumber" className="text-sm font-medium text-foreground">
            {t("paymentForm.cardNumber")}
          </label>
          <input
            id="cardNumber"
            inputMode="numeric"
            autoComplete="off"
            placeholder="4242 4242 4242 4242"
            value={form.cardNumber}
            onChange={(e) => setField("cardNumber")(e.target.value)}
            aria-invalid={Boolean(errors.cardNumber)}
            aria-describedby={errors.cardNumber ? "cardNumber-error" : undefined}
            className={inputClass("cardNumber")}
          />
          {errors.cardNumber ? (
            <p id="cardNumber-error" className="text-xs text-danger">
              {errors.cardNumber}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expiry" className="text-sm font-medium text-foreground">
              {t("paymentForm.expiry")}
            </label>
            <input
              id="expiry"
              placeholder="MM/YY"
              autoComplete="off"
              value={form.expiry}
              onChange={(e) => setField("expiry")(e.target.value)}
              aria-invalid={Boolean(errors.expiry)}
              className={inputClass("expiry")}
            />
            {errors.expiry ? <p className="text-xs text-danger">{errors.expiry}</p> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cvc" className="text-sm font-medium text-foreground">
              {t("paymentForm.cvc")}
            </label>
            <input
              id="cvc"
              inputMode="numeric"
              autoComplete="off"
              placeholder="123"
              value={form.cvc}
              onChange={(e) => setField("cvc")(e.target.value)}
              aria-invalid={Boolean(errors.cvc)}
              className={inputClass("cvc")}
            />
            {errors.cvc ? <p className="text-xs text-danger">{errors.cvc}</p> : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nameOnCard" className="text-sm font-medium text-foreground">
            {t("paymentForm.nameOnCard")}
          </label>
          <input
            id="nameOnCard"
            autoComplete="off"
            value={form.nameOnCard}
            onChange={(e) => setField("nameOnCard")(e.target.value)}
            aria-invalid={Boolean(errors.nameOnCard)}
            className={inputClass("nameOnCard")}
          />
          {errors.nameOnCard ? <p className="text-xs text-danger">{errors.nameOnCard}</p> : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={billingSameAsShipping}
            onChange={(e) => setBillingSameAsShipping(e.target.checked)}
            className="h-4 w-4 accent-[var(--nova-accent)]"
          />
          {t("paymentForm.billingSameAsShipping")}
        </label>

        <div className="mt-4 flex items-center gap-4">
          <Link to="/checkout/delivery" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("back")}
          </Link>
          <button
            type="submit"
            className="ms-auto h-12 rounded-[var(--radius-md)] bg-primary px-8 text-sm font-medium text-primary-foreground"
          >
            {t("continue")}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, Star } from "lucide-react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import {
  addPaymentMethod,
  removePaymentMethod,
  selectPaymentMethods,
  setDefaultPaymentMethod,
} from "../../features/account/paymentMethodsSlice";
import { TextField } from "../../components/ui/TextField";
import { EmptyState } from "../../components/common/EmptyState";
import { detectCardBrand, isValidCardNumber, isValidExpiry } from "../../lib/validation";

export function PaymentMethodsPage() {
  const isAuthenticated = useAuthGuard();
  const { t } = useTranslation(["account", "checkout"]);
  const dispatch = useAppDispatch();
  const methods = useAppSelector(selectPaymentMethods);

  const [formOpen, setFormOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [errors, setErrors] = useState<{ cardNumber?: string; expiry?: string }>({});

  if (!isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!isValidCardNumber(cardNumber)) next.cardNumber = t("checkout:paymentForm.errors.cardNumber");
    if (!isValidExpiry(expiry)) next.expiry = t("checkout:paymentForm.errors.expiry");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Only the masked summary is ever dispatched to Redux / persisted.
    // The raw number stays in this component's local state and is cleared
    // immediately below — same payment boundary as the checkout Payment step.
    dispatch(
      addPaymentMethod({
        brand: detectCardBrand(cardNumber),
        last4: cardNumber.replace(/\s/g, "").slice(-4),
        expiry: expiry.trim(),
        isDefault: methods.length === 0,
      })
    );
    setCardNumber("");
    setExpiry("");
    setFormOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("account:paymentMethods.title")}</h2>
        {!formOpen ? (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="h-10 rounded-[var(--radius-md)] border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t("account:paymentMethods.addNew")}
          </button>
        ) : null}
      </div>

      <div className="mb-6 flex gap-2 rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
        <p>{t("account:paymentMethods.disclaimer")}</p>
      </div>

      {formOpen ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mb-8 flex max-w-md flex-col gap-4 rounded-[var(--radius-lg)] border border-border p-5"
        >
          <TextField
            id="pm-card-number"
            label={t("checkout:paymentForm.cardNumber")}
            inputMode="numeric"
            autoComplete="off"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            error={errors.cardNumber}
          />
          <TextField
            id="pm-expiry"
            label={t("checkout:paymentForm.expiry")}
            autoComplete="off"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            error={errors.expiry}
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="h-11 rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              {t("account:paymentMethods.save")}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {t("account:paymentMethods.cancel")}
            </button>
          </div>
        </form>
      ) : null}

      {methods.length === 0 && !formOpen ? (
        <EmptyState title={t("account:paymentMethods.empty")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {methods.map((method) => (
            <li key={method.id} className="rounded-[var(--radius-lg)] border border-border p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {method.brand} •••• {method.last4}
                </p>
                {method.isDefault ? (
                  <span className="flex items-center gap-1 text-xs text-accent">
                    <Star className="h-3 w-3 fill-accent" />
                    {t("account:paymentMethods.default")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("account:paymentMethods.expires", { expiry: method.expiry })}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {!method.isDefault ? (
                  <button
                    type="button"
                    onClick={() => dispatch(setDefaultPaymentMethod(method.id))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("account:paymentMethods.setDefault")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => dispatch(removePaymentMethod(method.id))}
                  className="ms-auto text-danger hover:underline"
                >
                  {t("account:paymentMethods.remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

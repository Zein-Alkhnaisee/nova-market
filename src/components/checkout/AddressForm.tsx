import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isBlank, isValidPhone, isValidPostalCode } from "../../lib/validation";
import type { ShippingAddress } from "../../types/order";

interface AddressFormProps {
  initialValue?: ShippingAddress | null;
  onSubmit: (address: ShippingAddress) => void;
  submitLabel: string;
}

type FieldErrors = Partial<Record<keyof ShippingAddress, string>>;

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  phone: "",
};

export function AddressForm({ initialValue, onSubmit, submitLabel }: AddressFormProps) {
  const { t } = useTranslation("checkout");
  const [form, setForm] = useState<ShippingAddress>(initialValue ?? EMPTY_ADDRESS);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = (field: keyof ShippingAddress) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    (["fullName", "line1", "city", "region", "country"] as const).forEach((field) => {
      if (isBlank(form[field] ?? "")) next[field] = t("shippingForm.errors.required");
    });
    if (isBlank(form.postalCode) || !isValidPostalCode(form.postalCode)) {
      next.postalCode = t("shippingForm.errors.postalCode");
    }
    if (isBlank(form.phone) || !isValidPhone(form.phone)) {
      next.phone = t("shippingForm.errors.phone");
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(form);
    }
  };

  const inputClass = (field: keyof ShippingAddress) =>
    `h-11 rounded-[var(--radius-sm)] border bg-background px-3 text-sm text-foreground ${
      errors[field] ? "border-danger" : "border-border"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          {t("shippingForm.fullName")}
        </label>
        <input
          id="fullName"
          value={form.fullName}
          onChange={(e) => setField("fullName")(e.target.value)}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          className={inputClass("fullName")}
        />
        {errors.fullName ? (
          <p id="fullName-error" className="text-xs text-danger">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="line1" className="text-sm font-medium text-foreground">
          {t("shippingForm.line1")}
        </label>
        <input
          id="line1"
          value={form.line1}
          onChange={(e) => setField("line1")(e.target.value)}
          aria-invalid={Boolean(errors.line1)}
          aria-describedby={errors.line1 ? "line1-error" : undefined}
          className={inputClass("line1")}
        />
        {errors.line1 ? (
          <p id="line1-error" className="text-xs text-danger">
            {errors.line1}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="line2" className="text-sm font-medium text-foreground">
          {t("shippingForm.line2")}
        </label>
        <input
          id="line2"
          value={form.line2}
          onChange={(e) => setField("line2")(e.target.value)}
          className={inputClass("line2")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className="text-sm font-medium text-foreground">
            {t("shippingForm.city")}
          </label>
          <input
            id="city"
            value={form.city}
            onChange={(e) => setField("city")(e.target.value)}
            aria-invalid={Boolean(errors.city)}
            className={inputClass("city")}
          />
          {errors.city ? <p className="text-xs text-danger">{errors.city}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="region" className="text-sm font-medium text-foreground">
            {t("shippingForm.region")}
          </label>
          <input
            id="region"
            value={form.region}
            onChange={(e) => setField("region")(e.target.value)}
            aria-invalid={Boolean(errors.region)}
            className={inputClass("region")}
          />
          {errors.region ? <p className="text-xs text-danger">{errors.region}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="postalCode" className="text-sm font-medium text-foreground">
            {t("shippingForm.postalCode")}
          </label>
          <input
            id="postalCode"
            value={form.postalCode}
            onChange={(e) => setField("postalCode")(e.target.value)}
            aria-invalid={Boolean(errors.postalCode)}
            className={inputClass("postalCode")}
          />
          {errors.postalCode ? <p className="text-xs text-danger">{errors.postalCode}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-sm font-medium text-foreground">
            {t("shippingForm.country")}
          </label>
          <input
            id="country"
            value={form.country}
            onChange={(e) => setField("country")(e.target.value)}
            aria-invalid={Boolean(errors.country)}
            className={inputClass("country")}
          />
          {errors.country ? <p className="text-xs text-danger">{errors.country}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          {t("shippingForm.phone")}
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setField("phone")(e.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          className={inputClass("phone")}
        />
        {errors.phone ? (
          <p id="phone-error" className="text-xs text-danger">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className="mt-2 h-12 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground"
      >
        {submitLabel}
      </button>
    </form>
  );
}

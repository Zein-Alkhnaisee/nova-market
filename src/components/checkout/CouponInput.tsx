import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { coupons } from "../../mocks/data/coupons";

interface CouponInputProps {
  appliedCode: string | null;
  discountPercent: number;
  onApply: (coupon: { code: string; percentOff: number }) => void;
  onRemove: () => void;
}

export function CouponInput({ appliedCode, discountPercent, onApply, onRemove }: CouponInputProps) {
  const { t } = useTranslation("checkout");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const match = coupons.find((c) => c.code.toLowerCase() === value.trim().toLowerCase());
    if (!match) {
      setError(t("summary.couponInvalid"));
      return;
    }
    setError(null);
    setValue("");
    onApply({ code: match.code, percentOff: match.percentOff });
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border bg-surface-muted px-3 py-2 text-sm">
        <span className="text-foreground">
          {t("summary.couponApplied", { code: appliedCode, percent: discountPercent })}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("summary.removeCoupon")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-1.5">
      <label htmlFor="coupon-code" className="sr-only">
        {t("summary.couponLabel")}
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("summary.couponPlaceholder")}
          aria-invalid={Boolean(error)}
          className="h-10 flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="h-10 shrink-0 rounded-[var(--radius-sm)] border border-border px-4 text-sm font-medium text-foreground disabled:opacity-40"
        >
          {t("summary.applyCoupon")}
        </button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </form>
  );
}

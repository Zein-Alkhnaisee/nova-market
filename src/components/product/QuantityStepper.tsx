import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function QuantityStepper({ value, onChange, max = 10 }: QuantityStepperProps) {
  const { t } = useTranslation("product");
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border px-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label={t("quantityDecrease", { defaultValue: "Decrease quantity" })}
        className="flex h-11 w-11 items-center justify-center text-foreground disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span aria-live="polite" className="w-6 text-center text-sm font-medium text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={t("quantityIncrease", { defaultValue: "Increase quantity" })}
        className="flex h-11 w-11 items-center justify-center text-foreground disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

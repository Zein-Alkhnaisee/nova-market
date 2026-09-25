import { useTranslation } from "react-i18next";
import type { ConfiguratorGroup } from "../../types/configurator";
import { cn } from "../../lib/cn";

interface ProductConfiguratorProps {
  groups: ConfiguratorGroup[];
  selected: Record<string, string>;
  onSelect: (groupId: string, optionId: string) => void;
  currency: string;
}

export function ProductConfigurator({ groups, selected, onSelect, currency }: ProductConfiguratorProps) {
  const { t } = useTranslation("product");
  const formatDelta = (delta: number) => {
    if (delta === 0) return t("configurator.included");
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.abs(delta));
    return delta > 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-border p-5">
      <div>
        <h2 className="text-sm font-medium text-foreground">{t("configurator.title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("configurator.subtitle")}</p>
      </div>

      {groups.map((group) => (
        <fieldset key={group.id}>
          <legend className="mb-2 text-sm font-medium text-foreground">{group.label}</legend>
          <div role="radiogroup" aria-label={group.label} className="flex flex-col gap-2">
            {group.options.map((option) => {
              const isSelected = selected[group.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(group.id, option.id)}
                  className={cn(
                    "flex items-center justify-between rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-start text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-foreground hover:border-border-strong"
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      option.priceDelta > 0 ? "text-muted-foreground" : "text-success"
                    )}
                  >
                    {formatDelta(option.priceDelta)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

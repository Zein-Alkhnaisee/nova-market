import type { ProductVariantGroup } from "../../types/product";
import { cn } from "../../lib/cn";

interface VariantSelectorProps {
  group: ProductVariantGroup;
  selected: string | undefined;
  onSelect: (option: string) => void;
}

export function VariantSelector({ group, selected, onSelect }: VariantSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">
        {group.label}
        {selected ? <span className="ms-1.5 font-normal text-muted-foreground">— {selected}</span> : null}
      </legend>
      <div role="radiogroup" aria-label={group.label} className="flex flex-wrap gap-2">
        {group.options.map((option) => {
          const isSelected = option === selected;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option)}
              className={cn(
                "rounded-[var(--radius-sm)] border px-3.5 py-2 text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-border-strong"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

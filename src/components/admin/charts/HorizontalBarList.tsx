export interface HorizontalBarItem {
  key: string;
  label: string;
  /** Drives the bar length only. */
  value: number;
  /** The value as text, e.g. "$1,200.00". */
  valueLabel: string;
  /** Optional secondary text next to the bar, e.g. "3 units". */
  detail?: string;
}

/**
 * Ranked comparison as a list of labelled bars — for categorical data where long
 * labels need room (a vertical `BarChart` only labels its first and last bar).
 * Every row shows its label and value as real text, so the data is natively
 * available to assistive tech; the bar itself is decorative (aria-hidden). Uses
 * logical properties, so it mirrors correctly in RTL. Zero-value rows keep their
 * text with an empty bar.
 */
export function HorizontalBarList({ items, ariaLabel }: { items: HorizontalBarItem[]; ariaLabel: string }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">{item.label}</span>
            <span className="shrink-0 font-medium text-foreground">{item.valueLabel}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }} />
            </div>
            {item.detail ? <span className="shrink-0 text-xs text-muted-foreground">{item.detail}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

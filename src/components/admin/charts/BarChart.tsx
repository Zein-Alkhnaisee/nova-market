export interface BarChartDatum {
  key: string;
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  /** Accessible name for the whole chart. */
  ariaLabel: string;
  /** Formats a value for the screen-reader data table. */
  formatValue: (value: number) => string;
  /** Column headers for the screen-reader data table. */
  columnLabels: { label: string; value: string };
  height?: number;
}

const BAR_WIDTH = 16;
const GAP = 8;

/**
 * Restrained token-based SVG bar chart (no charting library). The drawing is
 * decorative to assistive tech (aria-hidden); the same data is exposed as a
 * visually hidden table. Time runs left→right regardless of page direction,
 * as charts conventionally do, so the wrapper is pinned to dir="ltr".
 */
export function BarChart({ data, ariaLabel, formatValue, columnLabels, height = 140 }: BarChartProps) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const width = data.length * (BAR_WIDTH + GAP) - GAP;
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <figure dir="ltr" aria-label={ariaLabel} className="m-0">
      <svg
        viewBox={`0 0 ${Math.max(width, 1)} ${height}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        aria-hidden="true"
      >
        <line x1="0" x2={width} y1={height - 0.5} y2={height - 0.5} className="stroke-border" strokeWidth="1" />
        {data.map((d, i) => {
          const barHeight = max > 0 ? Math.max((d.value / max) * (height - 4), d.value > 0 ? 3 : 0) : 0;
          const x = i * (BAR_WIDTH + GAP);
          return d.value > 0 ? (
            <rect
              key={d.key}
              x={x}
              y={height - 1 - barHeight}
              width={BAR_WIDTH}
              height={barHeight}
              rx="3"
              className="fill-accent"
            />
          ) : (
            <rect key={d.key} x={x} y={height - 3} width={BAR_WIDTH} height="2" rx="1" className="fill-border" />
          );
        })}
      </svg>
      {first && last ? (
        <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
          <span>{first.label}</span>
          <span>{last.label}</span>
        </div>
      ) : null}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">{columnLabels.label}</th>
            <th scope="col">{columnLabels.value}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

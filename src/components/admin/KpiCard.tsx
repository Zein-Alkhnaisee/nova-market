import { Card } from "../ui/Card";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
}

/** Compact stat card for admin overviews. Value is the visual focal point. */
export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

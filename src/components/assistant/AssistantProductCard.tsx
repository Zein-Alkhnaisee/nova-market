import { Link } from "react-router-dom";
import type { ProductSummary } from "../../types/product";

export function AssistantProductCard({ product }: { product: ProductSummary }) {
  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: product.currency,
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="flex w-40 shrink-0 flex-col gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-2 hover:border-border-strong"
    >
      <div className="aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="line-clamp-2 text-xs font-medium text-foreground">{product.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formattedPrice}</p>
      </div>
    </Link>
  );
}

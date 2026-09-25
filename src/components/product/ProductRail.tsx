import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "../ui/Skeleton";
import { SectionHeader } from "../common/SectionHeader";
import type { ProductSummary } from "../../types/product";

interface ProductRailProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  products?: (ProductSummary & { reason?: string })[];
  isLoading?: boolean;
  emptyFallback?: ReactNode;
  columns?: 3 | 4;
  /** Show each product's `reason` (if present) as a caption beneath the card. */
  showReasons?: boolean;
}

export function ProductRail({
  title,
  subtitle,
  viewAllHref,
  products,
  isLoading,
  emptyFallback,
  columns = 4,
  showReasons = false,
}: ProductRailProps) {
  if (!isLoading && (!products || products.length === 0)) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} viewAllHref={viewAllHref} />
      <div className={`grid grid-cols-2 gap-4 sm:gap-6 ${columns === 3 ? "md:grid-cols-3" : "lg:grid-cols-4"}`}>
        {isLoading
          ? Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          : products?.map((product) => (
              <div key={product.id} className="flex flex-col gap-2">
                <ProductCard product={product} />
                {showReasons && product.reason ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 shrink-0 text-accent" />
                    {product.reason}
                  </p>
                ) : null}
              </div>
            ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Heart, Scale, Star } from "lucide-react";
import type { ProductSummary } from "../../types/product";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { toggleWishlist, selectIsWishlisted } from "../../features/wishlist/wishlistSlice";
import { toggleCompare, selectCompareIds } from "../../features/compare/compareSlice";
import { Badge } from "../ui/Badge";
import { QuickViewModal } from "./QuickViewModal";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { cn } from "../../lib/cn";

const badgeTone: Record<NonNullable<ProductSummary["badge"]>, "accent" | "success" | "warning" | "neutral"> = {
  new: "success",
  trending: "accent",
  deal: "warning",
  premium: "neutral",
};

export function ProductCard({ product }: { product: ProductSummary }) {
  const { t } = useTranslation("product");
  const dispatch = useAppDispatch();
  const isWishlisted = useAppSelector(selectIsWishlisted(product.id));
  const compareIds = useAppSelector(selectCompareIds);
  const isComparing = compareIds.includes(product.id);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const productComparisonEnabled = useFeatureFlag("productComparison");

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: product.currency,
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedPrevious = product.previousPrice
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: product.currency,
        maximumFractionDigits: 0,
      }).format(product.previousPrice)
    : null;

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-standard)] group-hover:scale-[1.03]"
          />
        </Link>

        {product.badge ? (
          <Badge tone={badgeTone[product.badge]} className="absolute start-3 top-3 capitalize">
            {product.badge}
          </Badge>
        ) : null}

        <div className="absolute end-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => dispatch(toggleWishlist(product.id))}
            aria-pressed={isWishlisted}
            aria-label={t("addToWishlist")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-[var(--shadow-elevation-sm)] backdrop-blur hover:bg-surface"
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-danger text-danger")} />
          </button>
          {productComparisonEnabled ? (
            <button
              type="button"
              onClick={() => dispatch(toggleCompare(product.id))}
              aria-pressed={isComparing}
              aria-label={t("addToCompare")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-[var(--shadow-elevation-sm)] backdrop-blur hover:bg-surface"
            >
              <Scale className={cn("h-4 w-4", isComparing && "text-accent")} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            aria-label={t("quickView")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-[var(--shadow-elevation-sm)] backdrop-blur hover:bg-surface"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {!product.inStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge tone="neutral">{t("outOfStock")}</Badge>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <span className="text-xs text-muted-foreground">{product.brand}</span>
        <Link to={`/product/${product.slug}`} className="text-sm font-medium text-foreground line-clamp-2">
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span>{product.rating}</span>
          <span className="opacity-60">({product.reviewCount})</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-semibold text-foreground">{formattedPrice}</span>
          {formattedPrevious ? (
            <span className="text-sm text-muted-foreground line-through">{formattedPrevious}</span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => dispatch(addToCart({ product }))}
          className="mt-2 h-9 rounded-[var(--radius-md)] border border-border text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          {t("addToCart")}
        </button>
      </div>
      {quickViewOpen ? <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} /> : null}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { ProductSummary } from "../../types/product";
import { useAppDispatch } from "../../app/store/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { VariantSelector } from "./VariantSelector";
import { QuantityStepper } from "./QuantityStepper";

interface QuickViewModalProps {
  product: ProductSummary;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { t } = useTranslation(["product", "common"]);
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() =>
    Object.fromEntries((product.variants ?? []).map((group) => [group.type, group.options[0]]))
  );

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: product.currency,
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="fixed inset-0 z-[var(--z-index-modal)] flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label={t("common:actions.close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("quickView")}
        className="relative grid max-h-[85vh] w-full max-w-3xl grid-cols-1 gap-6 overflow-y-auto rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-[var(--shadow-elevation-xl)] sm:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common:actions.close")}
          className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
          <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{product.brand}</span>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{product.name}</h2>
          <p className="mt-3 text-2xl font-semibold text-foreground">{formattedPrice}</p>

          <div className="mt-5 flex flex-col gap-5">
            {product.variants?.map((group) => (
              <VariantSelector
                key={group.type}
                group={group}
                selected={selectedVariants[group.type]}
                onSelect={(option) => setSelectedVariants((prev) => ({ ...prev, [group.type]: option }))}
              />
            ))}

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t("cart:quantity", { defaultValue: "Quantity" })}</p>
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => {
                dispatch(addToCart({ product, quantity }));
                onClose();
              }}
              className="h-12 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {product.inStock ? t("addToCart") : t("outOfStock")}
            </button>
            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="text-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("viewFullDetails", { defaultValue: "View full details" })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

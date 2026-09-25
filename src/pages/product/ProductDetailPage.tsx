import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Scale, Star } from "lucide-react";
import { useGetProductBySlugQuery } from "../../services/api/productsApi";
import { useGetRelatedProductsQuery } from "../../services/api/recommendationsApi";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { toggleWishlist, selectIsWishlisted } from "../../features/wishlist/wishlistSlice";
import { toggleCompare, selectCompareIds } from "../../features/compare/compareSlice";
import { recordProductView } from "../../features/products/recentlyViewedSlice";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/ui/Badge";
import { ImageGallery } from "../../components/product/ImageGallery";
import { VariantSelector } from "../../components/product/VariantSelector";
import { ProductConfigurator } from "../../components/product/ProductConfigurator";
import { QuantityStepper } from "../../components/product/QuantityStepper";
import { ReviewsSection } from "../../components/product/ReviewsSection";
import { ProductRail } from "../../components/product/ProductRail";
import { cn } from "../../lib/cn";
import type { ProductSummary } from "../../types/product";

export function ProductDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError, refetch } = useGetProductBySlugQuery(slug);
  const dispatch = useAppDispatch();

  // Recording a view is genuinely a side effect (syncing local Redux state
  // with "what the person looked at"), so it stays in an effect — unlike the
  // quantity/variant selection below, which is per-product UI state and is
  // reset simply by remounting <ProductDetailContent> via `key={product.id}`.
  useEffect(() => {
    if (product) {
      dispatch(recordProductView(product.id));
    }
  }, [product, dispatch]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-10">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return <ProductDetailContent key={product.id} product={product} />;
}

function ProductDetailContent({ product }: { product: ProductSummary }) {
  const { t } = useTranslation("product");
  const dispatch = useAppDispatch();
  const isWishlisted = useAppSelector(selectIsWishlisted(product.id));
  const compareIds = useAppSelector(selectCompareIds);
  const isComparing = compareIds.includes(product.id);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() =>
    Object.fromEntries((product.variants ?? []).map((group) => [group.type, group.options[0]]))
  );

  const productConfiguratorEnabled = useFeatureFlag("productConfigurator");
  const hasConfigurator = productConfiguratorEnabled && (product.configuratorGroups?.length ?? 0) > 0;
  const [selectedConfig, setSelectedConfig] = useState<Record<string, string>>(() =>
    Object.fromEntries((product.configuratorGroups ?? []).map((group) => [group.id, group.options[0].id]))
  );

  const configuredPriceDelta = hasConfigurator
    ? (product.configuratorGroups ?? []).reduce((sum, group) => {
        const selectedOptionId = selectedConfig[group.id];
        const option = group.options.find((o) => o.id === selectedOptionId);
        return sum + (option?.priceDelta ?? 0);
      }, 0)
    : 0;
  const configuredPrice = product.price + configuredPriceDelta;
  const configurationSummary = hasConfigurator
    ? (product.configuratorGroups ?? [])
        .map((group) => group.options.find((o) => o.id === selectedConfig[group.id])?.label)
        .filter(Boolean)
        .join(" / ")
    : undefined;

  const smartRecommendationsEnabled = useFeatureFlag("smartRecommendations");
  const { data: related, isLoading: relatedLoading } = useGetRelatedProductsQuery({
    productId: product.id,
  });

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
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
    <div>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-16">
        <ImageGallery images={images} productName={product.name} />

        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{product.brand}</span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium text-foreground">{product.rating}</span>
            <span>
              ({product.reviewCount} {t("reviews")})
            </span>
            {product.badge ? (
              <Badge tone="accent" className="capitalize">
                {product.badge}
              </Badge>
            ) : null}
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <p className="text-3xl font-semibold text-foreground">
              {hasConfigurator
                ? new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: product.currency,
                    maximumFractionDigits: 0,
                  }).format(configuredPrice)
                : formattedPrice}
            </p>
            {!hasConfigurator && formattedPrevious ? (
              <p className="text-lg text-muted-foreground line-through">{formattedPrevious}</p>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.inStock ? t("inStock") : t("outOfStock")}
          </p>

          {product.description ? (
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          ) : null}

          {hasConfigurator ? (
            <div className="mt-6">
              <ProductConfigurator
                groups={product.configuratorGroups ?? []}
                selected={selectedConfig}
                onSelect={(groupId, optionId) =>
                  setSelectedConfig((prev) => ({ ...prev, [groupId]: optionId }))
                }
                currency={product.currency}
              />
            </div>
          ) : product.variants && product.variants.length > 0 ? (
            <div className="mt-6 flex flex-col gap-5">
              {product.variants.map((group) => (
                <VariantSelector
                  key={group.type}
                  group={group}
                  selected={selectedVariants[group.type]}
                  onSelect={(option) =>
                    setSelectedVariants((prev) => ({ ...prev, [group.type]: option }))
                  }
                />
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-foreground">{t("quantity")}</p>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() =>
                dispatch(
                  addToCart(
                    hasConfigurator
                      ? { product, quantity, overridePrice: configuredPrice, configurationSummary }
                      : { product, quantity }
                  )
                )
              }
              className="h-12 flex-1 rounded-[var(--radius-md)] bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-40 sm:flex-none sm:px-10"
            >
              {t("addToCart")}
            </button>
            <button
              type="button"
              onClick={() => dispatch(toggleWishlist(product.id))}
              aria-pressed={isWishlisted}
              className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-border text-foreground hover:bg-surface-hover"
              aria-label={t("addToWishlist")}
            >
              <Heart className={cn("h-5 w-5", isWishlisted && "fill-danger text-danger")} />
            </button>
            <button
              type="button"
              onClick={() => dispatch(toggleCompare(product.id))}
              aria-pressed={isComparing}
              className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-border text-foreground hover:bg-surface-hover"
              aria-label={t("addToCompare")}
            >
              <Scale className={cn("h-5 w-5", isComparing && "text-accent")} />
            </button>
          </div>

          {product.specs ? (
            <div className="mt-10 border-t border-border pt-6">
              <h2 className="text-sm font-medium text-foreground">{t("specifications")}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-10">
        <ReviewsSection productId={product.id} />
      </div>

      {related && related.length > 0 ? (
        <div className="border-t border-border bg-surface">
          <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10">
            <ProductRail
              title={t("youMayAlsoLike")}
              products={related}
              isLoading={relatedLoading}
              showReasons={smartRecommendationsEnabled}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

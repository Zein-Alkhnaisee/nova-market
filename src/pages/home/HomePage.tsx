import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useGetProductsQuery } from "../../services/api/productsApi";
import { useGetCategoriesQuery } from "../../services/api/categoriesApi";
import { useGetPersonalizedProductsQuery } from "../../services/api/recommendationsApi";
import { useAppSelector } from "../../app/store/hooks";
import { selectWishlistIds } from "../../features/wishlist/wishlistSlice";
import { selectRecentlyViewedIds } from "../../features/products/recentlyViewedSlice";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { ProductRail } from "../../components/product/ProductRail";
import { SectionHeader } from "../../components/common/SectionHeader";
import { ErrorState } from "../../components/common/ErrorState";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

function BadgeRail({
  title,
  viewAllHref,
  badge,
}: {
  title: string;
  viewAllHref: string;
  badge?: "new" | "trending" | "deal" | "premium";
}) {
  const { data, isLoading, isError, refetch } = useGetProductsQuery({ badge, limit: 4 });

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      {isError ? (
        <>
          <SectionHeader title={title} viewAllHref={viewAllHref} />
          <ErrorState onRetry={refetch} />
        </>
      ) : (
        <ProductRail title={title} viewAllHref={viewAllHref} products={data} isLoading={isLoading} />
      )}
    </section>
  );
}

function RecentlyViewedRail() {
  const { t } = useTranslation("home");
  const recentlyViewedIds = useAppSelector(selectRecentlyViewedIds);
  const { data: allProducts, isLoading } = useGetProductsQuery();

  if (recentlyViewedIds.length === 0) return null;

  const products = recentlyViewedIds
    .map((id) => allProducts?.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <ProductRail title={t("sections.recentlyViewed")} products={products} isLoading={isLoading} />
    </section>
  );
}

function PersonalizedRail() {
  const { t } = useTranslation("home");
  const smartRecommendationsEnabled = useFeatureFlag("smartRecommendations");
  const wishlistIds = useAppSelector(selectWishlistIds);
  const recentlyViewedIds = useAppSelector(selectRecentlyViewedIds);
  const { data: allProducts } = useGetProductsQuery();

  const interestedCategoryIds = Array.from(
    new Set(
      [...wishlistIds, ...recentlyViewedIds]
        .map((id) => allProducts?.find((p) => p.id === id)?.categoryId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const excludeIds = Array.from(new Set([...wishlistIds, ...recentlyViewedIds]));

  const { data, isLoading } = useGetPersonalizedProductsQuery({
    categoryIds: interestedCategoryIds,
    excludeIds,
    limit: 4,
  });

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <ProductRail
        title={t("sections.personalized")}
        products={data}
        isLoading={isLoading}
        showReasons={smartRecommendationsEnabled}
      />
    </section>
  );
}

export function HomePage() {
  const { t } = useTranslation("home");
  const { data: categories } = useGetCategoriesQuery();

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium text-accent">{t("hero.eyebrow")}</span>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
                {t("hero.cta")}
              </Link>
              <Link to="/assistant" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                <Sparkles className="h-4 w-4" />
                {t("sections.assistant")}
              </Link>
            </div>
          </div>
          <div className="relative hidden overflow-hidden rounded-[var(--radius-2xl)] bg-surface-muted lg:block">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Category explorer */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <SectionHeader title={t("sections.categories")} />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`/shop/${category.slug}`}
              className="flex shrink-0 items-center rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <PersonalizedRail />
      <BadgeRail title={t("sections.trending")} viewAllHref="/trending" badge="trending" />
      <BadgeRail title={t("sections.deals")} viewAllHref="/deals" badge="deal" />
      <RecentlyViewedRail />
      <BadgeRail title={t("sections.newArrivals")} viewAllHref="/new-arrivals" badge="new" />
      <BadgeRail title={t("sections.premiumPicks")} viewAllHref="/shop" badge="premium" />
    </div>
  );
}

import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useGetCollectionBySlugQuery } from "../../services/api/collectionsApi";
import { useGetProductsQuery } from "../../services/api/productsApi";
import { ProductCard } from "../../components/product/ProductCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";

export function CollectionDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t } = useTranslation("collections");
  const { data: collection, isLoading: loadingCollection, isError, refetch } = useGetCollectionBySlugQuery(slug);
  const { data: allProducts, isLoading: loadingProducts } = useGetProductsQuery();

  const isLoading = loadingCollection || loadingProducts;
  const products = allProducts?.filter((p) => collection?.productIds.includes(p.id));

  if (isError) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <Link
            to="/collections"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backToCollections")}
          </Link>
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-64" />
              <Skeleton className="mt-3 h-5 w-96" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {collection?.title}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">{collection?.description}</p>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("empty")} />
        )}
      </div>
    </div>
  );
}

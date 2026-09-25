import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useAppSelector } from "../../app/store/hooks";
import { selectUserCollectionById } from "../../features/account/userCollectionsSlice";
import { useGetProductsQuery } from "../../services/api/productsApi";
import { ProductCard } from "../../components/product/ProductCard";
import { EmptyState } from "../../components/common/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

export function PublicCollectionPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("collections");
  const collection = useAppSelector(selectUserCollectionById(id));
  const { data: allProducts, isLoading } = useGetProductsQuery();

  // A collection that doesn't exist and a collection that exists but has been
  // made private both render the same "not found" state — the link must not
  // reveal whether a private collection exists behind it.
  if (!collection || !collection.isPublic) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
        <EmptyState title={t("yours.notFound")} description={t("yours.notFoundDescription")} />
      </div>
    );
  }

  const products = allProducts?.filter((p) => collection.productIds.includes(p.id));

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {collection.name}
        </h1>
        <Badge tone="accent">
          <Globe className="me-1 inline h-3 w-3" />
          {t("yours.publicBadge")}
        </Badge>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        {t("yours.itemsCount", { count: collection.productIds.length })}
      </p>

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
        <EmptyState
          title={t("yours.emptyItems")}
          action={
            <Link to="/shop" className={cn(buttonVariants({ variant: "primary" }))}>
              Continue shopping
            </Link>
          }
        />
      )}
    </div>
  );
}

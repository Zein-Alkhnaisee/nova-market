import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../app/store/hooks";
import { selectWishlistIds } from "../../features/wishlist/wishlistSlice";
import { useGetProductsQuery } from "../../services/api/productsApi";
import { ProductCard } from "../../components/product/ProductCard";
import { AddToCollectionMenu } from "../../components/account/AddToCollectionMenu";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

export function WishlistPage() {
  const { t } = useTranslation(["navigation", "common"]);
  const wishlistIds = useAppSelector(selectWishlistIds);
  const { data: allProducts, isLoading, isError, refetch } = useGetProductsQuery();

  const products = allProducts?.filter((p) => wishlistIds.includes(p.id));

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-foreground">{t("wishlist")}</h2>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-2">
              <ProductCard product={product} />
              <AddToCollectionMenu productId={product.id} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("common:empty.title")}
          description={t("common:empty.description")}
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

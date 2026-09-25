import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetCollectionsQuery } from "../../services/api/collectionsApi";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/common/ErrorState";

export function CollectionsPage() {
  const { t } = useTranslation("collections");
  const { data: collections, isLoading, isError, refetch } = useGetCollectionsQuery();

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-10">
        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] w-full" />)
              : collections?.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.slug}`}
                    className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[var(--radius-xl)]"
                  >
                    <img
                      src={collection.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-standard)] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="relative p-5">
                      <p className="text-lg font-semibold text-white">{collection.title}</p>
                      <p className="mt-1 text-sm text-white/80">
                        {t("productsCount", { count: collection.productIds.length })}
                      </p>
                    </div>
                  </Link>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}

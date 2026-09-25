import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Copy, Globe, Lock, Trash2 } from "lucide-react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import {
  deleteCollection,
  removeProductFromCollection,
  renameCollection,
  selectUserCollectionById,
  setCollectionVisibility,
} from "../../features/account/userCollectionsSlice";
import { useGetProductsQuery } from "../../services/api/productsApi";
import { ProductCard } from "../../components/product/ProductCard";
import { EmptyState } from "../../components/common/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";

export function MyCollectionDetailPage() {
  const isAuthenticated = useAuthGuard();
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("collections");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const collection = useAppSelector(selectUserCollectionById(id));
  const { data: allProducts, isLoading } = useGetProductsQuery();

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(collection?.name ?? "");
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isAuthenticated) return null;

  if (!collection) {
    return (
      <div>
        <Link
          to="/account/collections"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("yours.backToCollections")}
        </Link>
        <EmptyState title={t("yours.notFound")} description={t("yours.notFoundDescription")} />
      </div>
    );
  }

  const products = allProducts?.filter((p) => collection.productIds.includes(p.id));
  const shareUrl = `${window.location.origin}/c/${collection.id}`;

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      dispatch(renameCollection({ id: collection.id, name: name.trim() }));
    }
    setRenaming(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — not
      // worth surfacing as an error state, the link is still selectable.
    }
  };

  const handleDelete = () => {
    if (window.confirm(t("yours.deleteConfirm"))) {
      dispatch(deleteCollection(collection.id));
      navigate("/account/collections");
    }
  };

  return (
    <div>
      <Link
        to="/account/collections"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("yours.backToCollections")}
      </Link>

      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        {renaming ? (
          <form onSubmit={handleRename} className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-lg font-semibold text-foreground"
            />
            <button
              type="submit"
              className="h-9 rounded-[var(--radius-sm)] bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              {t("yours.save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setRenaming(false);
                setName(collection.name);
              }}
              className="h-9 rounded-[var(--radius-sm)] px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {t("yours.cancel")}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="text-lg font-semibold text-foreground hover:text-accent"
          >
            {collection.name}
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-sm text-danger hover:underline"
        >
          <Trash2 className="h-4 w-4" />
          {t("yours.delete")}
        </button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {t("yours.itemsCount", { count: collection.productIds.length })}
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-border p-4">
        <button
          type="button"
          onClick={() =>
            dispatch(setCollectionVisibility({ id: collection.id, isPublic: !collection.isPublic }))
          }
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {collection.isPublic ? (
            <>
              <Globe className="h-4 w-4" />
              {t("yours.makePrivate")}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              {t("yours.makePublic")}
            </>
          )}
        </button>

        {collection.isPublic ? (
          <>
            <Badge tone="accent">{t("yours.publicBadge")}</Badge>
            <div className="flex items-center gap-2">
              <code className="rounded-[var(--radius-sm)] bg-surface-muted px-2 py-1 text-xs text-foreground">
                {shareUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {linkCopied ? t("yours.linkCopied") : t("yours.copyLink")}
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t("yours.visibilityHint")}</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-2">
              <ProductCard product={product} />
              <button
                type="button"
                onClick={() =>
                  dispatch(removeProductFromCollection({ collectionId: collection.id, productId: product.id }))
                }
                className="text-start text-xs text-muted-foreground hover:text-danger"
              >
                {t("yours.removeFromCollection")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t("yours.emptyItems")} description={t("yours.emptyItemsDescription")} />
      )}
    </div>
  );
}

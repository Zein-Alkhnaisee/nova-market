import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, Lock, Plus, Trash2 } from "lucide-react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import {
  createCollection,
  deleteCollection,
  selectUserCollections,
  setCollectionVisibility,
} from "../../features/account/userCollectionsSlice";
import { EmptyState } from "../../components/common/EmptyState";

export function MyCollectionsPage() {
  const isAuthenticated = useAuthGuard();
  const { t } = useTranslation("collections");
  const dispatch = useAppDispatch();
  const collections = useAppSelector(selectUserCollections);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("yours.nameRequired"));
      return;
    }
    dispatch(createCollection({ name: name.trim() }));
    setName("");
    setError(null);
    setCreating(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("yours.title")}</h2>
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 h-10 rounded-[var(--radius-md)] border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            <Plus className="h-4 w-4" />
            {t("yours.create")}
          </button>
        ) : null}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{t("yours.subtitle")}</p>

      {creating ? (
        <form onSubmit={handleCreate} className="mb-8 flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border p-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor="new-collection-name" className="sr-only">
              {t("yours.namePlaceholder")}
            </label>
            <input
              id="new-collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("yours.namePlaceholder")}
              aria-invalid={Boolean(error)}
              className="h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm text-foreground"
            />
            {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-10 rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {t("yours.save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setName("");
                setError(null);
              }}
              className="h-10 rounded-[var(--radius-md)] px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {t("yours.cancel")}
            </button>
          </div>
        </form>
      ) : null}

      {collections.length === 0 ? (
        <EmptyState title={t("yours.empty")} description={t("yours.emptyDescription")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {collections.map((collection) => (
            <li key={collection.id} className="rounded-[var(--radius-lg)] border border-border p-5">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/account/collections/${collection.id}`}
                  className="text-sm font-medium text-foreground hover:text-accent"
                >
                  {collection.name}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t("yours.deleteConfirm"))) {
                      dispatch(deleteCollection(collection.id));
                    }
                  }}
                  aria-label={t("yours.delete")}
                  className="text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("yours.itemsCount", { count: collection.productIds.length })}
              </p>
              <button
                type="button"
                onClick={() =>
                  dispatch(setCollectionVisibility({ id: collection.id, isPublic: !collection.isPublic }))
                }
                className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {collection.isPublic ? (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    {t("yours.public")}
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    {t("yours.private")}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

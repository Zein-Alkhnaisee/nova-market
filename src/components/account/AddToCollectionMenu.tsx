import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderPlus, Check, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import {
  addProductToCollection,
  createCollection,
  removeProductFromCollection,
  selectUserCollections,
} from "../../features/account/userCollectionsSlice";

interface AddToCollectionMenuProps {
  productId: string;
}

export function AddToCollectionMenu({ productId }: AddToCollectionMenuProps) {
  const { t } = useTranslation("collections");
  const dispatch = useAppDispatch();
  const collections = useAppSelector(selectUserCollections);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const toggleMembership = (collectionId: string, isMember: boolean) => {
    if (isMember) {
      dispatch(removeProductFromCollection({ collectionId, productId }));
    } else {
      dispatch(addProductToCollection({ collectionId, productId }));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    dispatch(createCollection({ name, productIds: [productId] }));
    setNewName("");
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        {t("yours.addToCollection")}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("yours.cancel")}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[var(--z-index-popover)] cursor-default"
          />
          <div className="absolute start-0 top-full z-[var(--z-index-popover)] mt-2 w-64 rounded-[var(--radius-md)] border border-border bg-surface-elevated p-2 shadow-[var(--shadow-elevation-lg)]">
            {collections.length > 0 ? (
              <ul className="mb-2 flex max-h-48 flex-col overflow-y-auto">
                {collections.map((collection) => {
                  const isMember = collection.productIds.includes(productId);
                  return (
                    <li key={collection.id}>
                      <button
                        type="button"
                        onClick={() => toggleMembership(collection.id, isMember)}
                        className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-start text-sm text-foreground hover:bg-surface-hover"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isMember ? "border-accent bg-accent text-accent-foreground" : "border-border"
                          }`}
                        >
                          {isMember ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="truncate">{collection.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <form onSubmit={handleCreate} className="flex gap-1.5 border-t border-border pt-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("yours.newCollectionName")}
                className="h-9 flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-2 text-sm text-foreground"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                aria-label={t("yours.create")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-primary-foreground disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}

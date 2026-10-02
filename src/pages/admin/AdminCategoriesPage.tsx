import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { TextField } from "../../components/ui/TextField";
import {
  useCreateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useGetAdminCategoriesQuery,
  useUpdateAdminCategoryMutation,
  type AdminCategoryRow,
} from "../../services/api/adminApi";

type Panel = { key: number; category?: AdminCategoryRow };

function CategoryForm({ category, onDone, onCancel }: { category?: AdminCategoryRow; onDone: (name: string) => void; onCancel: () => void }) {
  const { t } = useTranslation("admin");
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState(category?.image ?? "");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState(false);
  const [create, { isLoading: creating }] = useCreateAdminCategoryMutation();
  const [update, { isLoading: updating }] = useUpdateAdminCategoryMutation();
  const saving = creating || updating;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(false);
    const result = category
      ? await update({ id: category.id, input: { name, image: image || null } })
      : await create({ name, slug, image: image || null });
    if ("data" in result && result.data?.ok) {
      onDone(result.data.category.name);
      return;
    }
    if ("data" in result && result.data && !result.data.ok && result.data.status !== 404) {
      const next: Partial<Record<string, string>> = {};
      for (const [field, code] of Object.entries(result.data.fields)) {
        if (code) next[field] = t(`categories.errors.${code}`);
      }
      setErrors(next);
      const first = ["name", "slug", "image"].find((f) => next[f]);
      if (first) queueMicrotask(() => document.getElementById(`category-${first}`)?.focus());
      return;
    }
    setErrors({});
    setFormError(true);
  };

  return (
    <Card className="mb-4 p-4">
      <form onSubmit={submit} noValidate>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {category ? t("categories.form.editTitle", { name: category.name }) : t("categories.form.newTitle")}
        </h2>
        {formError ? (
          <p role="alert" className="mb-3 rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-sm text-danger">
            {t("categories.actionError")}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="category-name" label={t("categories.form.name")} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
          {category ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">{t("categories.form.slug")}</span>
              <p className="flex h-11 items-center text-sm text-muted-foreground" dir="ltr">{category.slug}</p>
              <p className="text-xs text-muted-foreground">{t("categories.form.slugLocked")}</p>
            </div>
          ) : (
            <TextField id="category-slug" label={t("categories.form.slug")} hint={t("categories.form.slugHint")} value={slug} onChange={(e) => setSlug(e.target.value)} error={errors.slug} dir="ltr" />
          )}
          <div className="sm:col-span-2">
            <TextField id="category-image" type="url" label={t("categories.form.image")} hint={t("categories.form.imageHint")} value={image} onChange={(e) => setImage(e.target.value)} error={errors.image} dir="ltr" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button type="submit" loading={saving}>
            {saving ? t("categories.form.saving") : category ? t("categories.form.save") : t("categories.form.create")}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>{t("categories.form.cancel")}</Button>
        </div>
      </form>
    </Card>
  );
}

function ConfirmDelete({ category, busy, onConfirm, onCancel }: { category: AdminCategoryRow; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation("admin");
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Destructive prompt: land focus on the safe choice.
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="confirm-delete-title" aria-describedby="confirm-delete-desc" className="mb-4 rounded-[var(--radius-md)] border border-danger/40 bg-danger/5 p-4">
      <h2 id="confirm-delete-title" className="text-sm font-semibold text-foreground">{t("categories.confirm.title", { name: category.name })}</h2>
      <p id="confirm-delete-desc" className="mt-1 text-sm text-muted-foreground">{t("categories.confirm.description")}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button ref={cancelRef} type="button" variant="outline" size="sm" onClick={onCancel}>{t("categories.confirm.cancel")}</Button>
        <Button type="button" variant="outline" size="sm" className="border-danger text-danger hover:bg-danger/10" loading={busy} onClick={onConfirm}>{t("categories.confirm.confirm")}</Button>
      </div>
    </div>
  );
}

export function AdminCategoriesPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError, refetch } = useGetAdminCategoriesQuery(undefined, { refetchOnMountOrArgChange: true });
  const [removeCategory, { isLoading: deleting }] = useDeleteAdminCategoryMutation();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [confirming, setConfirming] = useState<AdminCategoryRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const done = (kind: "created" | "updated") => (name: string) => {
    setPanel(null);
    setProblem(null);
    setNotice(t(`categories.notice.${kind}`, { name }));
  };

  const confirmDelete = async () => {
    if (!confirming) return;
    const target = confirming;
    const result = await removeCategory(target.id);
    setConfirming(null);
    if ("data" in result && result.data?.ok) {
      setProblem(null);
      setNotice(t("categories.notice.deleted", { name: target.name }));
    } else if ("data" in result && result.data && !result.data.ok && result.data.status === 409) {
      setNotice(null);
      setProblem(t("categories.blocked", { name: target.name, count: result.data.productCount }));
    } else {
      setNotice(null);
      setProblem(t("categories.actionError"));
    }
  };

  return (
    <>
      <AdminPageHeader
        title={t("nav.categories")}
        description={t("categories.description")}
        actions={
          <Button size="sm" onClick={() => { setNotice(null); setProblem(null); setConfirming(null); setPanel({ key: Date.now() }); }}>
            {t("categories.new")}
          </Button>
        }
      />

      <div role="status" aria-live="polite">
        {notice ? <p className="mb-4 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-foreground">{notice}</p> : null}
      </div>
      {problem ? <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-sm text-danger">{problem}</p> : null}

      {panel ? (
        <CategoryForm
          key={panel.key}
          category={panel.category}
          onDone={done(panel.category ? "updated" : "created")}
          onCancel={() => setPanel(null)}
        />
      ) : null}
      {confirming ? (
        <ConfirmDelete category={confirming} busy={deleting} onConfirm={confirmDelete} onCancel={() => setConfirming(null)} />
      ) : null}

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-3">
          <Skeleton className="h-72" />
        </div>
      ) : null}
      {isError ? <ErrorState message={t("categories.error")} onRetry={refetch} /> : null}

      {data ? (
        data.length === 0 ? (
          <EmptyState title={t("categories.emptyTitle")} description={t("categories.emptyDescription")} />
        ) : (
          <Card className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("nav.categories")}</caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("categories.columns.category")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("categories.columns.slug")}</th>
                  <th scope="col" className="py-2 pe-4 text-end font-medium">{t("categories.columns.products")}</th>
                  <th scope="col" className="py-2 text-end font-medium">{t("categories.columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => {
                  const total = c.productCount + c.archivedProductCount;
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <th scope="row" className="py-2.5 pe-4 text-start font-normal">
                        <div className="flex items-center gap-3">
                          {c.image ? <img src={c.image} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] bg-surface-muted object-cover" /> : null}
                          <span className="font-medium text-foreground">{c.name}</span>
                        </div>
                      </th>
                      <td className="py-2.5 pe-4 text-muted-foreground" dir="ltr">{c.slug}</td>
                      <td className="py-2.5 pe-4 text-end text-foreground">
                        {c.productCount}
                        {c.archivedProductCount > 0 ? (
                          <span className="ms-1 text-xs text-muted-foreground">{t("categories.archivedSuffix", { count: c.archivedProductCount })}</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t("categories.editLabel", { name: c.name })}
                            onClick={() => { setNotice(null); setProblem(null); setConfirming(null); setPanel({ key: Date.now(), category: c }); }}
                          >
                            {t("categories.edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={total > 0}
                            aria-label={t("categories.deleteLabel", { name: c.name })}
                            aria-describedby={total > 0 ? `category-${c.id}-blocked` : undefined}
                            onClick={() => { setNotice(null); setProblem(null); setPanel(null); setConfirming(c); }}
                          >
                            {t("categories.delete")}
                          </Button>
                          {total > 0 ? (
                            <span id={`category-${c.id}-blocked`} className="sr-only">{t("categories.deleteBlocked", { count: total })}</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      ) : null}
    </>
  );
}

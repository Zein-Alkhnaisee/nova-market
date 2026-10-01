import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Button, buttonVariants } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { SelectField } from "../../components/ui/SelectField";
import { Skeleton } from "../../components/ui/Skeleton";
import { TextAreaField } from "../../components/ui/TextAreaField";
import { TextField } from "../../components/ui/TextField";
import { useGetCategoriesQuery } from "../../services/api/categoriesApi";
import {
  useCreateAdminProductMutation,
  useGetAdminProductQuery,
  useSetAdminProductArchivedMutation,
  useUpdateAdminProductMutation,
} from "../../services/api/adminApi";
import type { ProductInput, StoredProduct } from "../../services/catalog/productStore";

const BADGES = ["new", "trending", "deal", "premium"] as const;
// Field ids in visual order — used to move focus to the first invalid field.
const FIELD_ORDER = ["name", "slug", "brand", "categoryId", "price", "previousPrice", "inventory", "badge", "image", "description"];

interface FormValues {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  price: string;
  previousPrice: string;
  inventory: string;
  badge: string;
  image: string;
  description: string;
}

const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

function initialValues(product?: StoredProduct): FormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    brand: product?.brand ?? "",
    categoryId: product?.categoryId ?? "",
    price: product ? String(product.price) : "",
    previousPrice: product?.previousPrice !== undefined ? String(product.previousPrice) : "",
    inventory: product?.inventory !== undefined ? String(product.inventory) : "",
    badge: product?.badge ?? "",
    image: product?.image ?? "",
    description: product?.description ?? "",
  };
}

function ProductForm({ product }: { product?: StoredProduct }) {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [values, setValues] = useState<FormValues>(() => initialValues(product));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [createProduct, { isLoading: creating }] = useCreateAdminProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateAdminProductMutation();
  const [setArchived, { isLoading: archiving }] = useSetAdminProductArchivedMutation();
  const saving = creating || updating;
  const archived = product?.archivedAt !== undefined;

  const set = (key: keyof FormValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const err = (key: string) => errors[key];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const input: ProductInput = {
      name: values.name,
      slug: values.slug,
      brand: values.brand,
      categoryId: values.categoryId,
      price: values.price.trim() === "" ? NaN : Number(values.price),
      previousPrice: numberOrNull(values.previousPrice),
      image: values.image,
      description: values.description,
      inventory: numberOrNull(values.inventory),
      badge: (values.badge || null) as ProductInput["badge"],
    };
    const result = product
      ? await updateProduct({ id: product.id, input: input })
      : await createProduct(input);

    if ("data" in result && result.data?.ok) {
      navigate("/admin/products");
      return;
    }
    if ("data" in result && result.data && !result.data.ok && result.data.status !== 404) {
      const next: Partial<Record<string, string>> = {};
      for (const [field, code] of Object.entries(result.data.fields)) {
        if (code) next[field] = t(`products.errors.${code}`);
      }
      setErrors(next);
      const first = FIELD_ORDER.find((id) => next[id]);
      if (first) queueMicrotask(() => document.getElementById(`product-${first}`)?.focus());
      return;
    }
    setErrors({});
    setFormError(t("products.form.saveError"));
  };

  const toggleArchived = async () => {
    if (!product) return;
    const result = await setArchived({ id: product.id, archived: !archived });
    if ("data" in result && result.data?.ok) navigate("/admin/products");
    else setFormError(t("products.actionError"));
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {archived ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-foreground">
          {t("products.form.archivedBanner")}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <Card className="grid gap-4 p-4 sm:grid-cols-2">
        <TextField id="product-name" label={t("products.form.name")} value={values.name} onChange={set("name")} error={err("name")} required />
        <TextField id="product-slug" label={t("products.form.slug")} hint={t("products.form.slugHint")} value={values.slug} onChange={set("slug")} error={err("slug")} dir="ltr" />
        <TextField id="product-brand" label={t("products.form.brand")} value={values.brand} onChange={set("brand")} error={err("brand")} required />
        <SelectField id="product-categoryId" label={t("products.form.category")} value={values.categoryId} onChange={set("categoryId")} error={err("categoryId")} required>
          <option value="">{t("products.form.selectCategory")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <TextField id="product-price" type="number" step="0.01" min="0" inputMode="decimal" label={t("products.form.price")} value={values.price} onChange={set("price")} error={err("price")} required />
        <TextField id="product-previousPrice" type="number" step="0.01" min="0" inputMode="decimal" label={t("products.form.previousPrice")} hint={t("products.form.previousPriceHint")} value={values.previousPrice} onChange={set("previousPrice")} error={err("previousPrice")} />
        <TextField
          id="product-inventory"
          type="number"
          step="1"
          min="0"
          inputMode="numeric"
          label={t("products.form.inventory")}
          hint={product && product.inventory === undefined ? t("products.form.inventoryUntracked") : t("products.form.inventoryHint")}
          value={values.inventory}
          onChange={set("inventory")}
          error={err("inventory")}
        />
        <SelectField id="product-badge" label={t("products.form.badge")} value={values.badge} onChange={set("badge")} error={err("badge")}>
          <option value="">{t("products.form.badgeNone")}</option>
          {BADGES.map((b) => (
            <option key={b} value={b}>{t(`products.form.badges.${b}`)}</option>
          ))}
        </SelectField>
        <div className="sm:col-span-2">
          <TextField id="product-image" type="url" label={t("products.form.image")} hint={t("products.form.imageHint")} value={values.image} onChange={set("image")} error={err("image")} dir="ltr" required />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField id="product-description" label={t("products.form.description")} value={values.description} onChange={set("description")} error={err("description")} />
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="submit" loading={saving}>
            {saving ? t("products.form.saving") : product ? t("products.form.save") : t("products.form.create")}
          </Button>
          <Link to="/admin/products" className={buttonVariants({ variant: "ghost" })}>
            {t("products.form.cancel")}
          </Link>
        </div>
        {product ? (
          <Button type="button" variant="outline" disabled={archiving || saving} onClick={toggleArchived}>
            {archived ? t("products.restore") : t("products.archive")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function AdminProductFormPage() {
  const { t } = useTranslation("admin");
  const { id } = useParams();
  const isEdit = id !== undefined;
  const { data, isLoading, isError, error, refetch } = useGetAdminProductQuery(id ?? "", {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });
  const back = (
    <Link to="/admin/products" className={buttonVariants({ variant: "outline", size: "sm" })}>
      {t("products.form.back")}
    </Link>
  );

  if (!isEdit) {
    return (
      <>
        <AdminPageHeader title={t("products.form.newTitle")} description={t("products.form.newDescription")} actions={back} />
        <ProductForm />
      </>
    );
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
        <Skeleton className="h-10 max-w-xs" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (isError) {
    const notFound = (error as { status?: number } | undefined)?.status === 404;
    return (
      <>
        <AdminPageHeader title={t(notFound ? "products.form.notFoundTitle" : "nav.products")} actions={back} />
        {notFound ? (
          <EmptyState title={t("products.form.notFoundTitle")} description={t("products.form.notFoundDescription")} />
        ) : (
          <ErrorState message={t("products.form.loadError")} onRetry={refetch} />
        )}
      </>
    );
  }
  if (!data) return null;

  return (
    <>
      <AdminPageHeader title={data.name} description={t("products.form.editDescription")} actions={back} />
      {/* Keyed by id so the form re-initialises on a different product (remount over reset-in-effect, HANDOFF §8 #12). */}
      <ProductForm key={data.id} product={data} />
    </>
  );
}

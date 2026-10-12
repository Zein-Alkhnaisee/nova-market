import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { TextField } from "../../components/ui/TextField";
import {
  useCreateAdminCouponMutation,
  useDeleteAdminCouponMutation,
  useGetAdminCouponsQuery,
  useUpdateAdminCouponMutation,
  type AdminCouponRow,
} from "../../services/api/adminApi";

type Panel = { key: number; coupon?: AdminCouponRow };

function CouponForm({ coupon, onDone, onCancel }: { coupon?: AdminCouponRow; onDone: (code: string) => void; onCancel: () => void }) {
  const { t } = useTranslation("admin");
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(coupon ? String(coupon.percentOff) : "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [active, setActive] = useState(coupon?.active ?? true);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState(false);
  const [create, { isLoading: creating }] = useCreateAdminCouponMutation();
  const [update, { isLoading: updating }] = useUpdateAdminCouponMutation();
  const saving = creating || updating;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(false);
    const percentOff = percent.trim() === "" ? NaN : Number(percent);
    const result = coupon
      ? await update({ id: coupon.id, input: { percentOff, description, active } })
      : await create({ code, percentOff, description, active });
    if ("data" in result && result.data?.ok) {
      onDone(result.data.coupon.code);
      return;
    }
    if ("data" in result && result.data && !result.data.ok && result.data.status !== 404) {
      const next: Partial<Record<string, string>> = {};
      for (const [field, err] of Object.entries(result.data.fields)) {
        if (err) next[field] = t(`coupons.errors.${err}`);
      }
      setErrors(next);
      const first = ["code", "percentOff", "description"].find((f) => next[f]);
      if (first) queueMicrotask(() => document.getElementById(`coupon-${first}`)?.focus());
      return;
    }
    setErrors({});
    setFormError(true);
  };

  return (
    <Card className="mb-4 p-4">
      <form onSubmit={submit} noValidate>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {coupon ? t("coupons.form.editTitle", { code: coupon.code }) : t("coupons.form.newTitle")}
        </h2>
        {formError ? (
          <p role="alert" className="mb-3 rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-sm text-danger">
            {t("coupons.actionError")}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {coupon ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">{t("coupons.form.code")}</span>
              <p className="flex h-11 items-center text-sm font-medium text-foreground" dir="ltr">{coupon.code}</p>
              <p className="text-xs text-muted-foreground">{t("coupons.form.codeLocked")}</p>
            </div>
          ) : (
            <TextField id="coupon-code" label={t("coupons.form.code")} hint={t("coupons.form.codeHint")} value={code} onChange={(e) => setCode(e.target.value)} error={errors.code} dir="ltr" required />
          )}
          <TextField id="coupon-percentOff" type="number" step="1" min="1" max="100" inputMode="numeric" label={t("coupons.form.percentOff")} value={percent} onChange={(e) => setPercent(e.target.value)} error={errors.percentOff} required />
          <div className="sm:col-span-2">
            <TextField id="coupon-description" label={t("coupons.form.description")} hint={t("coupons.form.descriptionHint")} value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} />
          </div>
          <label className="flex items-center gap-3 text-sm text-foreground sm:col-span-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--nova-accent)]" />
            <span>
              {t("coupons.form.active")}
              <span className="block text-xs text-muted-foreground">{t("coupons.form.activeHint")}</span>
            </span>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button type="submit" loading={saving}>
            {saving ? t("coupons.form.saving") : coupon ? t("coupons.form.save") : t("coupons.form.create")}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>{t("coupons.form.cancel")}</Button>
        </div>
      </form>
    </Card>
  );
}

function ConfirmDelete({ coupon, busy, onConfirm, onCancel }: { coupon: AdminCouponRow; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation("admin");
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Destructive prompt: land focus on the safe choice.
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="confirm-coupon-title" aria-describedby="confirm-coupon-desc" className="mb-4 rounded-[var(--radius-md)] border border-danger/40 bg-danger/5 p-4">
      <h2 id="confirm-coupon-title" className="text-sm font-semibold text-foreground">{t("coupons.confirm.title", { code: coupon.code })}</h2>
      <p id="confirm-coupon-desc" className="mt-1 text-sm text-muted-foreground">{t("coupons.confirm.description")}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button ref={cancelRef} type="button" variant="outline" size="sm" onClick={onCancel}>{t("coupons.confirm.cancel")}</Button>
        <Button type="button" variant="outline" size="sm" className="border-danger text-danger hover:bg-danger/10" loading={busy} onClick={onConfirm}>{t("coupons.confirm.confirm")}</Button>
      </div>
    </div>
  );
}

export function AdminCouponsPage() {
  const { t, i18n } = useTranslation("admin");
  const { data, isLoading, isError, refetch } = useGetAdminCouponsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [removeCoupon, { isLoading: deleting }] = useDeleteAdminCouponMutation();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [confirming, setConfirming] = useState<AdminCouponRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const percent = (n: number) => new Intl.NumberFormat(i18n.language, { style: "percent", maximumFractionDigits: 0 }).format(n / 100);

  const resetMessages = () => {
    setNotice(null);
    setProblem(null);
  };

  const done = (kind: "created" | "updated") => (code: string) => {
    setPanel(null);
    setProblem(null);
    setNotice(t(`coupons.notice.${kind}`, { code }));
  };

  const confirmDelete = async () => {
    if (!confirming) return;
    const target = confirming;
    const result = await removeCoupon(target.id);
    setConfirming(null);
    if ("data" in result && result.data?.ok) {
      setProblem(null);
      setNotice(t("coupons.notice.deleted", { code: target.code }));
    } else if ("data" in result && result.data && !result.data.ok && result.data.status === 409) {
      setNotice(null);
      setProblem(t("coupons.blocked", { code: target.code, count: result.data.orderCount }));
    } else {
      setNotice(null);
      setProblem(t("coupons.actionError"));
    }
  };

  return (
    <>
      <AdminPageHeader
        title={t("nav.coupons")}
        description={t("coupons.description")}
        actions={
          <Button size="sm" onClick={() => { resetMessages(); setConfirming(null); setPanel({ key: Date.now() }); }}>
            {t("coupons.new")}
          </Button>
        }
      />

      <div role="status" aria-live="polite">
        {notice ? <p className="mb-4 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-foreground">{notice}</p> : null}
      </div>
      {problem ? <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-sm text-danger">{problem}</p> : null}

      {panel ? (
        <CouponForm key={panel.key} coupon={panel.coupon} onDone={done(panel.coupon ? "updated" : "created")} onCancel={() => setPanel(null)} />
      ) : null}
      {confirming ? <ConfirmDelete coupon={confirming} busy={deleting} onConfirm={confirmDelete} onCancel={() => setConfirming(null)} /> : null}

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-3">
          <Skeleton className="h-48" />
        </div>
      ) : null}
      {isError ? <ErrorState message={t("coupons.error")} onRetry={refetch} /> : null}

      {data ? (
        data.length === 0 ? (
          <EmptyState title={t("coupons.emptyTitle")} description={t("coupons.emptyDescription")} />
        ) : (
          <Card className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("nav.coupons")}</caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("coupons.columns.code")}</th>
                  <th scope="col" className="py-2 pe-4 text-end font-medium">{t("coupons.columns.discount")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("coupons.columns.status")}</th>
                  <th scope="col" className="py-2 pe-4 text-end font-medium">{t("coupons.columns.used")}</th>
                  <th scope="col" className="py-2 pe-4 text-start font-medium">{t("coupons.columns.note")}</th>
                  <th scope="col" className="py-2 text-end font-medium">{t("coupons.columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2.5 pe-4 text-start font-medium text-foreground" dir="ltr">{c.code}</th>
                    <td className="py-2.5 pe-4 text-end text-foreground">{percent(c.percentOff)}</td>
                    <td className="py-2.5 pe-4">
                      <Badge tone={c.active ? "success" : "neutral"}>{t(c.active ? "coupons.status.active" : "coupons.status.inactive")}</Badge>
                    </td>
                    <td className="py-2.5 pe-4 text-end text-foreground">{new Intl.NumberFormat(i18n.language).format(c.orderCount)}</td>
                    <td className="py-2.5 pe-4 text-muted-foreground">{c.description || "—"}</td>
                    <td className="py-2.5 text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" aria-label={t("coupons.editLabel", { code: c.code })} onClick={() => { resetMessages(); setConfirming(null); setPanel({ key: Date.now(), coupon: c }); }}>
                          {t("coupons.edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={c.orderCount > 0}
                          aria-label={t("coupons.deleteLabel", { code: c.code })}
                          aria-describedby={c.orderCount > 0 ? `coupon-${c.id}-blocked` : undefined}
                          onClick={() => { resetMessages(); setPanel(null); setConfirming(c); }}
                        >
                          {t("coupons.delete")}
                        </Button>
                        {c.orderCount > 0 ? (
                          <span id={`coupon-${c.id}-blocked`} className="sr-only">{t("coupons.deleteBlocked", { count: c.orderCount })}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : null}
    </>
  );
}

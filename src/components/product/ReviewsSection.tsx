import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Star } from "lucide-react";
import { useGetReviewsQuery, useSubmitReviewMutation } from "../../services/api/reviewsApi";
import { Skeleton } from "../ui/Skeleton";
import { ErrorState } from "../common/ErrorState";
import { EmptyState } from "../common/EmptyState";
import { cn } from "../../lib/cn";

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(dimension, star <= Math.round(rating) ? "fill-warning text-warning" : "text-border-strong")}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: number; count: number; total: number }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-3 text-muted-foreground">{label}</span>
      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-warning" style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-8 text-end text-muted-foreground">{count}</span>
    </div>
  );
}

interface ReviewFormState {
  rating: number;
  author: string;
  title: string;
  body: string;
}

const EMPTY_FORM: ReviewFormState = { rating: 0, author: "", title: "", body: "" };

export function ReviewsSection({ productId }: { productId: string }) {
  const { t } = useTranslation("product");
  const { data, isLoading, isError, refetch } = useGetReviewsQuery(productId);
  const [submitReview, { isLoading: isSubmitting }] = useSubmitReviewMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ReviewFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating < 1) {
      setFormError(t("reviewsSection.ratingRequired"));
      return;
    }
    if (!form.title.trim() || !form.body.trim()) {
      setFormError(t("reviewsSection.fieldsRequired"));
      return;
    }
    setFormError(null);
    await submitReview({
      productId,
      author: form.author.trim() || t("reviewsSection.anonymous"),
      rating: form.rating,
      title: form.title.trim(),
      body: form.body.trim(),
    });
    setForm(EMPTY_FORM);
    setFormOpen(false);
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="border-t border-border pt-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t("reviewsSection.title")}</h2>
          {isLoading ? (
            <Skeleton className="mt-3 h-16 w-48" />
          ) : data ? (
            <div className="mt-3 flex items-center gap-4">
              <div>
                <p className="text-3xl font-semibold text-foreground">{data.breakdown.average.toFixed(1)}</p>
                <StarRow rating={data.breakdown.average} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("reviewsSection.basedOn", { count: data.breakdown.total })}
              </p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          className="h-10 shrink-0 rounded-[var(--radius-md)] border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover"
          aria-expanded={formOpen}
        >
          {t("reviewsSection.writeReview")}
        </button>
      </div>

      {!isLoading && data ? (
        <div className="mt-6 flex max-w-sm flex-col gap-2">
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <RatingBar key={star} label={star} count={data.breakdown.counts[star]} total={data.breakdown.total} />
          ))}
        </div>
      ) : null}

      {formOpen ? (
        <form onSubmit={onSubmit} className="mt-8 flex max-w-lg flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">{t("reviewsSection.yourRating")}</legend>
            <div role="radiogroup" aria-label={t("reviewsSection.yourRating")} className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={form.rating === star}
                  aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                  onClick={() => setForm((f) => ({ ...f, rating: star }))}
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      star <= form.rating ? "fill-warning text-warning" : "text-border-strong"
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">{t("reviewsSection.nameLabel")}</span>
            <input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              placeholder={t("reviewsSection.namePlaceholder")}
              className="h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-foreground"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">{t("reviewsSection.titleLabel")}</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className="h-10 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-foreground"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">{t("reviewsSection.bodyLabel")}</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
              rows={4}
              className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isSubmitting ? t("reviewsSection.submitting") : t("reviewsSection.submit")}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-10 rounded-[var(--radius-md)] px-5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("reviewsSection.cancel")}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-8 flex flex-col divide-y divide-border">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 py-5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          : data && data.reviews.length > 0
          ? data.reviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-2 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StarRow rating={review.rating} />
                    {review.verified ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {t("reviewsSection.verified")}
                      </span>
                    ) : null}
                  </div>
                  <time className="text-xs text-muted-foreground" dateTime={review.date}>
                    {new Date(review.date).toLocaleDateString()}
                  </time>
                </div>
                <p className="text-sm font-medium text-foreground">{review.title}</p>
                <p className="text-sm text-muted-foreground">{review.body}</p>
                <p className="text-xs text-muted-foreground">
                  {review.author} · {t("reviewsSection.helpfulCount", { count: review.helpfulCount })}
                </p>
              </div>
            ))
          : !isLoading && <EmptyState title={t("reviewsSection.empty")} />}
      </div>
    </div>
  );
}

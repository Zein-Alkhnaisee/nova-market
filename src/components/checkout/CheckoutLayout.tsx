import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { cn } from "../../lib/cn";

const STEPS = [
  { path: "/checkout/shipping", key: "shipping" },
  { path: "/checkout/delivery", key: "delivery" },
  { path: "/checkout/payment", key: "payment" },
  { path: "/checkout/review", key: "review" },
];

export function CheckoutLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation("checkout");
  const location = useLocation();
  const currentIndex = STEPS.findIndex((step) => location.pathname.startsWith(step.path));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">
            NOVA
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            {t("secureCheckout")}
          </div>
        </div>
        {currentIndex >= 0 ? (
          <nav aria-label={t("stepIndicatorLabel")} className="mx-auto max-w-3xl px-4 pb-5 sm:px-6">
            <ol className="flex items-center gap-2">
              {STEPS.map((step, index) => {
                const isComplete = index < currentIndex;
                const isCurrent = index === currentIndex;
                return (
                  <li key={step.key} className="flex flex-1 items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                          ? "bg-success text-white"
                          : "bg-surface-muted text-muted-foreground"
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={cn(
                        "hidden text-sm sm:inline",
                        isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {t(`steps.${step.key}`)}
                    </span>
                    {index < STEPS.length - 1 ? (
                      <div className={cn("h-px flex-1", isComplete ? "bg-success" : "bg-border")} />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</div>
      </main>
    </div>
  );
}

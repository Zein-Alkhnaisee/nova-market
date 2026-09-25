import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../app/store/hooks";
import { selectUser } from "../../features/auth/authSlice";
import { cn } from "../../lib/cn";

const NAV_ITEMS = [
  { key: "overview", to: "/account", end: true },
  { key: "orders", to: "/account/orders", end: false },
  { key: "wishlist", to: "/account/wishlist", end: false },
  { key: "collections", to: "/account/collections", end: false },
  { key: "addresses", to: "/account/addresses", end: false },
  { key: "paymentMethods", to: "/account/payment-methods", end: false },
  { key: "profile", to: "/account/profile", end: false },
  { key: "settings", to: "/account/settings", end: false },
];

export function AccountLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation("account");
  const user = useAppSelector(selectUser);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
        {user ? (
          <p className="mt-1 text-sm text-muted-foreground">{t("greeting", { name: user.fullName })}</p>
        ) : null}
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <nav aria-label={t("title")} className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.key} className="shrink-0">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "block whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-surface-hover font-medium text-foreground"
                        : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    )
                  }
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

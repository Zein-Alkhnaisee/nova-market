import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { useTheme } from "../../app/providers/ThemeProvider";
import { clearSession, selectUser } from "../../features/auth/authSlice";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { cn } from "../../lib/cn";
import { Badge } from "../ui/Badge";
import { AdminForbidden } from "./AdminForbidden";

const ADMIN_NAV_ITEMS = [
  { key: "dashboard", to: "/admin", end: true },
  { key: "products", to: "/admin/products", end: false },
  { key: "categories", to: "/admin/categories", end: false },
  { key: "orders", to: "/admin/orders", end: false },
  { key: "customers", to: "/admin/customers", end: false },
  { key: "coupons", to: "/admin/coupons", end: false },
  { key: "analytics", to: "/admin/analytics", end: false },
] as const;

/**
 * Admin shell: same tokens and primitives as the storefront, denser layout
 * (DESIGN_SYSTEM §37, §57), and deliberately without the public header/footer.
 * Access is checked by `useAuthGuard({ role: "admin" })` — UX only.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation("admin");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { resolvedTheme, setTheme } = useTheme();
  const allowed = useAuthGuard({ role: "admin" });

  // Signed out: the guard is already redirecting to login.
  if (!user) return null;
  if (!allowed) return <AdminForbidden />;

  const signOut = () => {
    dispatch(clearSession());
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[var(--z-index-modal)] focus:rounded-[var(--radius-md)] focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t("shell.skipToContent")}
      </a>

      <header className="sticky top-0 z-[var(--z-index-sticky)] border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-base font-semibold tracking-tight text-foreground">
              NOVA
            </Link>
            <Badge tone="accent">{t("shell.badge")}</Badge>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="hidden rounded-[var(--radius-md)] px-3 py-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground sm:block"
            >
              {t("shell.viewStore")}
            </Link>
            <button
              type="button"
              onClick={() => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")}
              className="h-9 rounded-[var(--radius-md)] px-2 font-medium text-muted-foreground hover:bg-surface-hover"
              aria-label={t("shell.switchLanguage")}
            >
              {i18n.language === "ar" ? "EN" : "عربي"}
            </button>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-[var(--radius-md)] text-muted-foreground hover:bg-surface-hover"
              aria-label={resolvedTheme === "dark" ? t("shell.switchToLight") : t("shell.switchToDark")}
            >
              {resolvedTheme === "dark" ? "☀" : "🌙"}
            </button>
            <span className="ms-2 hidden max-w-[10rem] truncate text-muted-foreground md:block">
              {user.fullName}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-[var(--radius-md)] px-3 py-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            >
              {t("shell.signOut")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 lg:flex-row lg:gap-8 lg:px-6">
        <nav aria-label={t("shell.navLabel")} className="lg:w-48 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {ADMIN_NAV_ITEMS.map((item) => (
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
        <main id="admin-main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

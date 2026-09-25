import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Menu, Search, ShoppingBag, Sparkles, User } from "lucide-react";
import { useAppSelector } from "../../app/store/hooks";
import { selectCartCount } from "../../features/cart/cartSlice";
import { selectWishlistIds } from "../../features/wishlist/wishlistSlice";
import { selectIsAuthenticated } from "../../features/auth/authSlice";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { SearchOverlay } from "../navigation/SearchOverlay";
import { CommandPalette } from "../navigation/CommandPalette";

const CATEGORY_LINKS = [
  { key: "shop", href: "/shop" },
  { key: "deals", href: "/deals" },
  { key: "newArrivals", href: "/new-arrivals" },
  { key: "trending", href: "/trending" },
  { key: "collections", href: "/collections" },
  { key: "compare", href: "/compare" },
];

export function Header() {
  const { t, i18n } = useTranslation(["navigation", "common"]);
  const { resolvedTheme, setTheme } = useTheme();
  const cartCount = useAppSelector(selectCartCount);
  const wishlistCount = useAppSelector(selectWishlistIds).length;
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const productComparisonEnabled = useFeatureFlag("productComparison");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && ["INPUT", "TEXTAREA"].includes(target.tagName);
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-[var(--z-index-sticky)] border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">
            NOVA
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {CATEGORY_LINKS.filter((link) => link.key !== "compare" || productComparisonEnabled).map((link) => (
              <Link
                key={link.key}
                to={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(`links.${link.key}`)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden max-w-md flex-1 items-center lg:flex">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 w-full items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-muted-foreground hover:border-border-strong"
          >
            <Search className="h-4 w-4" />
            {t("search")}
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-foreground hover:bg-surface-hover lg:hidden"
            aria-label={t("search")}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/assistant"
            className="hidden items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/15 sm:flex"
          >
            <Sparkles className="h-4 w-4" />
            {t("assistant")}
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="hidden h-10 items-center rounded-[var(--radius-md)] px-2 text-sm font-medium text-muted-foreground hover:bg-surface-hover sm:flex"
            aria-label={t("common:language.english")}
          >
            {i18n.language === "ar" ? "EN" : "عربي"}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground hover:bg-surface-hover sm:flex"
            aria-label={t("common:theme.dark")}
          >
            {resolvedTheme === "dark" ? "☀" : "🌙"}
          </button>
          <Link
            to="/account/wishlist"
            className="relative hidden h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-foreground hover:bg-surface-hover sm:flex"
            aria-label={t("wishlist")}
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 ? (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {wishlistCount}
              </span>
            ) : null}
          </Link>
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-foreground hover:bg-surface-hover"
            aria-label={t("cart")}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link
            to={isAuthenticated ? "/account" : "/auth/login"}
            className="hidden h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-foreground hover:bg-surface-hover sm:flex"
            aria-label={t("account")}
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-foreground hover:bg-surface-hover lg:hidden"
            aria-label={t("menu")}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
          {CATEGORY_LINKS.filter((link) => link.key !== "compare" || productComparisonEnabled).map((link) => (
            <Link
              key={link.key}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
            >
              {t(`links.${link.key}`)}
            </Link>
          ))}
        </nav>
      ) : null}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CommandPalette onOpenSearch={() => setSearchOpen(true)} />
    </header>
  );
}

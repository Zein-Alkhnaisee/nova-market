import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../../lib/format";

interface FooterLink {
  key: string;
  /** Only set for destinations that exist. The rest render as plain text until their pages are built. */
  href?: string;
}

const FOOTER_COLUMNS: { key: string; links: FooterLink[] }[] = [
  {
    key: "shop",
    links: [
      { key: "newArrivals", href: "/new-arrivals" },
      { key: "trending", href: "/trending" },
      { key: "deals", href: "/deals" },
      { key: "collections", href: "/collections" },
    ],
  },
  { key: "help", links: [{ key: "shipping" }, { key: "returns" }, { key: "trackOrder" }, { key: "contact" }] },
  { key: "company", links: [{ key: "about" }, { key: "careers" }, { key: "press" }, { key: "sustainability" }] },
];

export function Footer() {
  const { t } = useTranslation("home");
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <p className="text-lg font-semibold text-foreground">NOVA</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {t("newsletter.title")}
            </p>
            <form className="mt-4 flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                aria-label={t("footer.emailLabel")}
                placeholder={t("newsletter.placeholder")}
                className="h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                {t("newsletter.cta")}
              </button>
            </form>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.key}>
              <p className="text-sm font-medium text-foreground">{t(`footer.columns.${col.key}`)}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.key}>
                    {link.href ? (
                      <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                        {t(`footer.links.${link.key}`)}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t(`footer.links.${link.key}`)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="pt-6 text-xs text-muted-foreground">
          {t("footer.rights", { year: formatNumber(new Date().getFullYear(), { useGrouping: false }) })}
        </p>
      </div>
    </footer>
  );
}

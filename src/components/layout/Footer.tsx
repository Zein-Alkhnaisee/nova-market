import { useTranslation } from "react-i18next";

const FOOTER_COLUMNS = [
  { titleKey: "shop", links: ["New arrivals", "Trending", "Deals", "Collections"] },
  { titleKey: "help", links: ["Shipping", "Returns", "Track order", "Contact"] },
  { titleKey: "company", links: ["About", "Careers", "Press", "Sustainability"] },
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
                placeholder={t("newsletter.placeholder")}
                className="h-11 flex-1 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="h-11 rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                {t("newsletter.cta")}
              </button>
            </form>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <p className="text-sm font-medium text-foreground capitalize">{col.titleKey}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted-foreground">{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} NOVA Market. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

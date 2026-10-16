import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Search } from "lucide-react";
import { buttonVariants } from "../components/ui/Button";
import { cn } from "../lib/cn";

/** Rendered inside the storefront shell (see router), so header, footer and search stay available. */
export function NotFoundPage() {
  const { t } = useTranslation("errors");
  const navigate = useNavigate();
  // With no history entry to return to (a pasted link), "Back" would do nothing, so it goes home instead.
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-10">
      <p
        aria-hidden="true"
        dir="ltr"
        className="select-none text-8xl font-semibold tracking-tighter text-border-strong sm:text-9xl"
      >
        {t("notFoundPage.code")}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{t("notFoundPage.title")}</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">{t("notFoundPage.description")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={goBack} className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t("notFoundPage.goBack")}
        </button>
        <Link to="/" className={buttonVariants({ variant: "primary" })}>
          {t("notFoundPage.backHome")}
        </Link>
        <Link to="/search" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <Search className="h-4 w-4" aria-hidden="true" />
          {t("notFoundPage.search")}
        </Link>
      </div>
    </div>
  );
}

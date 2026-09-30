import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { TextField } from "../../components/ui/TextField";
import { useGetAdminCustomersQuery } from "../../services/api/adminApi";

export function AdminCustomersPage() {
  const { t, i18n } = useTranslation("admin");
  const locale = i18n.language;
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { data, isLoading, isError, refetch } = useGetAdminCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const setQuery = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const needle = query.trim().toLowerCase();
  const rows = (data?.customers ?? []).filter(
    (c) => !needle || c.fullName.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)
  );
  const money = (value: number, currency: string) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

  return (
    <>
      <AdminPageHeader title={t("nav.customers")} description={t("customers.description")} />

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-3">
          <Skeleton className="h-11 max-w-sm" />
          <Skeleton className="h-64" />
        </div>
      ) : null}
      {isError ? <ErrorState message={t("customers.error")} onRetry={refetch} /> : null}

      {data ? (
        data.customers.length === 0 ? (
          <EmptyState title={t("customers.emptyTitle")} description={t("customers.emptyDescription")} />
        ) : (
          <>
            <div className="mb-4 max-w-sm">
              <TextField
                id="admin-customer-search"
                type="search"
                label={t("customers.search")}
                placeholder={t("customers.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {data.unlinkedOrderCount > 0 ? (
              <p className="mb-4 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
                {t("customers.unlinkedNote", { count: data.unlinkedOrderCount })}
              </p>
            ) : null}

            {rows.length === 0 ? (
              <EmptyState title={t("customers.noMatchTitle")} description={t("customers.noMatchDescription")} />
            ) : (
              <Card className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <caption className="sr-only">{t("nav.customers")}</caption>
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th scope="col" className="py-2 pe-4 text-start font-medium">{t("customers.name")}</th>
                      <th scope="col" className="py-2 pe-4 text-start font-medium">{t("customers.email")}</th>
                      <th scope="col" className="py-2 pe-4 text-end font-medium">{t("customers.orders")}</th>
                      <th scope="col" className="py-2 pe-4 text-end font-medium">{t("customers.lifetimeSpend")}</th>
                      <th scope="col" className="py-2 text-end font-medium">{t("customers.lastOrder")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <th scope="row" className="py-2.5 pe-4 text-start font-medium">
                          <Link to={`/admin/customers/${c.id}`} className="text-foreground hover:text-accent hover:underline">
                            {c.fullName}
                          </Link>
                        </th>
                        <td className="py-2.5 pe-4 text-muted-foreground">{c.email}</td>
                        <td className="py-2.5 pe-4 text-end">{new Intl.NumberFormat(locale).format(c.orderCount)}</td>
                        <td className="py-2.5 pe-4 text-end font-medium text-foreground">{money(c.lifetimeSpend, c.currency)}</td>
                        <td className="py-2.5 text-end text-muted-foreground">
                          {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString(locale) : t("customers.never")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )
      ) : null}
    </>
  );
}

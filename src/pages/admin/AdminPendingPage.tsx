import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { EmptyState } from "../../components/common/EmptyState";

/**
 * Honest stand-in for /admin sections whose build-out is still pending
 * (see PROGRESS.md, Phase 12). Each section replaces this with its real page.
 */
export function AdminPendingPage({ section }: { section: string }) {
  const { t } = useTranslation("admin");
  return (
    <>
      <AdminPageHeader title={t(`nav.${section}`)} />
      <EmptyState title={t("pending.title")} description={t("pending.description")} />
    </>
  );
}

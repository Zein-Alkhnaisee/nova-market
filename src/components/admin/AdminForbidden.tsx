import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../../app/store/hooks";
import { clearSession } from "../../features/auth/authSlice";
import { Button, buttonVariants } from "../ui/Button";

/**
 * Shown to a signed-in user who lacks the admin role. UX only — the backend
 * must independently refuse admin data to non-admins (MASTER_SPEC §97).
 */
export function AdminForbidden() {
  const { t } = useTranslation("admin");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const switchAccount = () => {
    dispatch(clearSession());
    navigate("/auth/login?redirect=%2Fadmin", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("forbidden.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("forbidden.description")}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link to="/account" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("forbidden.backToAccount")}
        </Link>
        <Button size="sm" onClick={switchAccount}>
          {t("forbidden.switchAccount")}
        </Button>
      </div>
    </div>
  );
}

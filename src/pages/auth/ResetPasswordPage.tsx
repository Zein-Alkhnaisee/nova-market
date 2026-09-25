import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { useResetPasswordMutation } from "../../services/api/authApi";

export function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [done, setDone] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = t("register.errors.passwordTooShort");
    if (password !== confirmPassword) next.confirmPassword = t("register.errors.passwordMismatch");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await resetPassword({ token, newPassword: password });
    setDone(true);
  };

  return (
    <AuthLayout title={t("resetPassword.title")}>
      {done ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 rounded-[var(--radius-md)] border border-success/30 bg-success/10 p-3 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <p>{t("resetPassword.success")}</p>
          </div>
          <Link
            to="/auth/login"
            className="flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground"
          >
            {t("resetPassword.goToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <TextField
            id="password"
            type="password"
            autoComplete="new-password"
            label={t("resetPassword.newPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <TextField
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            label={t("resetPassword.confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isLoading ? t("resetPassword.submitting") : t("resetPassword.submit")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

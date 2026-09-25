import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Info } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { useForgotPasswordMutation } from "../../services/api/authApi";

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPassword({ email });
    setSent(true);
  };

  return (
    <AuthLayout
      title={t("forgotPassword.title")}
      subtitle={sent ? undefined : t("forgotPassword.subtitle")}
      footer={
        <Link to="/auth/login" className="font-medium text-accent hover:underline">
          {t("forgotPassword.backToLogin")}
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 rounded-[var(--radius-md)] border border-success/30 bg-success/10 p-3 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <p>{t("forgotPassword.success")}</p>
          </div>
          <div className="flex gap-2 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            <p>{t("forgotPassword.demoNote")}</p>
          </div>
          <Link
            to="/auth/reset-password?token=demo"
            className="flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-border text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t("forgotPassword.demoContinue")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <TextField
            id="email"
            type="email"
            autoComplete="email"
            label={t("forgotPassword.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="h-12 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isLoading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

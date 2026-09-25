import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { useLoginMutation } from "../../services/api/authApi";
import { useAppDispatch } from "../../app/store/hooks";
import { setSession } from "../../features/auth/authSlice";
import { isBlank } from "../../lib/validation";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (isBlank(email)) nextErrors.email = t("login.errors.emailRequired");
    if (isBlank(password)) nextErrors.password = t("login.errors.passwordRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await login({ email, password });
    if ("data" in result && result.data) {
      dispatch(setSession(result.data));
      navigate(redirectTo, { replace: true });
    } else {
      setErrors({ form: t("login.errors.invalidCredentials") });
    }
  };

  return (
    <AuthLayout
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link to="/auth/register" className="font-medium text-accent hover:underline">
            {t("login.createAccount")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          id="email"
          type="email"
          autoComplete="email"
          label={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <TextField
          id="password"
          type="password"
          autoComplete="current-password"
          label={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        {errors.form ? (
          <p role="alert" className="rounded-[var(--radius-sm)] bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.form}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Link to="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
            {t("login.forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isLoading ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </AuthLayout>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { useRegisterMutation } from "../../services/api/authApi";
import { useAppDispatch } from "../../app/store/hooks";
import { setSession } from "../../features/auth/authSlice";
import { isBlank } from "../../lib/validation";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "form", string>>>({});
  const [register, { isLoading }] = useRegisterMutation();

  const setField = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (isBlank(form.fullName)) next.fullName = t("register.errors.fullNameRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = t("register.errors.emailInvalid");
    }
    if (form.password.length < 8) next.password = t("register.errors.passwordTooShort");
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = t("register.errors.passwordMismatch");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = await register({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    if ("data" in result && result.data) {
      dispatch(setSession(result.data));
      navigate("/account", { replace: true });
    } else {
      setErrors({ form: t("register.errors.emailTaken") });
    }
  };

  return (
    <AuthLayout
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      footer={
        <>
          {t("register.haveAccount")}{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            {t("register.logIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          id="fullName"
          autoComplete="name"
          label={t("register.fullName")}
          value={form.fullName}
          onChange={(e) => setField("fullName")(e.target.value)}
          error={errors.fullName}
        />
        <TextField
          id="email"
          type="email"
          autoComplete="email"
          label={t("register.email")}
          value={form.email}
          onChange={(e) => setField("email")(e.target.value)}
          error={errors.email}
        />
        <TextField
          id="password"
          type="password"
          autoComplete="new-password"
          label={t("register.password")}
          value={form.password}
          onChange={(e) => setField("password")(e.target.value)}
          error={errors.password}
        />
        <TextField
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          label={t("register.confirmPassword")}
          value={form.confirmPassword}
          onChange={(e) => setField("confirmPassword")(e.target.value)}
          error={errors.confirmPassword}
        />

        {errors.form ? (
          <p role="alert" className="rounded-[var(--radius-sm)] bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.form}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-12 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isLoading ? t("register.submitting") : t("register.submit")}
        </button>
      </form>
    </AuthLayout>
  );
}

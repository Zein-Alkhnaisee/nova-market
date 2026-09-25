import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { selectUser, updateProfile } from "../../features/auth/authSlice";
import { TextField } from "../../components/ui/TextField";
import { isBlank } from "../../lib/validation";

export function ProfilePage() {
  const isAuthenticated = useAuthGuard();
  const { t } = useTranslation("account");
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [saved, setSaved] = useState(false);

  if (!isAuthenticated || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (isBlank(fullName)) next.fullName = t("profile.errors.fullNameRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t("profile.errors.emailInvalid");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    dispatch(updateProfile({ fullName: fullName.trim(), email: email.trim() }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-foreground">{t("profile.title")}</h2>
      <form onSubmit={handleSubmit} noValidate className="flex max-w-md flex-col gap-4">
        <TextField
          id="fullName"
          label={t("profile.fullName")}
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
        />
        <TextField
          id="email"
          type="email"
          label={t("profile.email")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        {saved ? (
          <p role="status" className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t("profile.saved")}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-2 h-12 self-start rounded-[var(--radius-md)] bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          {t("profile.save")}
        </button>
      </form>
    </div>
  );
}

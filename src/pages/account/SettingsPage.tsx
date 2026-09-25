import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { clearSession } from "../../features/auth/authSlice";
import { selectFeatureFlags, setFeatureFlag } from "../../features/settings/featureFlagsSlice";
import { featureFlagKeys } from "../../config/features";
import { useTheme, type ThemeMode } from "../../app/providers/ThemeProvider";
import { supportedLanguages } from "../../i18n/config";

const THEME_OPTIONS: ThemeMode[] = ["light", "dark", "system"];

export function SettingsPage() {
  const isAuthenticated = useAuthGuard();
  const { t, i18n } = useTranslation(["account", "common", "auth"]);
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const featureFlags = useAppSelector(selectFeatureFlags);

  // Notification preferences are local-only in this demo — there is no
  // backend to persist them to, so they are deliberately not written to
  // Redux/localStorage rather than pretending they were saved somewhere.
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  if (!isAuthenticated) return null;

  const handleSignOut = () => {
    dispatch(clearSession());
    navigate("/", { replace: true });
  };

  return (
    <div className="flex max-w-lg flex-col gap-10">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("account:settings.title")}</h2>

        <h3 className="mb-3 text-sm font-medium text-foreground">{t("account:settings.appearance")}</h3>
        <fieldset className="mb-6">
          <legend className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            {t("account:settings.theme")}
          </legend>
          <div role="radiogroup" aria-label={t("account:settings.theme")} className="flex gap-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={theme === option}
                onClick={() => setTheme(option)}
                className={`h-10 rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-colors ${
                  theme === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                {t(`common:theme.${option}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            {t("account:settings.language")}
          </legend>
          <div role="radiogroup" aria-label={t("account:settings.language")} className="flex gap-2">
            {supportedLanguages.map((lng) => (
              <button
                key={lng}
                type="button"
                role="radio"
                aria-checked={i18n.language === lng}
                onClick={() => i18n.changeLanguage(lng)}
                className={`h-10 rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-colors ${
                  i18n.language === lng
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                {lng === "ar" ? t("common:language.arabic") : t("common:language.english")}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">{t("account:settings.notifications")}</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={orderUpdates}
              onChange={(e) => setOrderUpdates(e.target.checked)}
              className="h-4 w-4 accent-[var(--nova-accent)]"
            />
            {t("account:settings.orderUpdates")}
          </label>
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={promotions}
              onChange={(e) => setPromotions(e.target.checked)}
              className="h-4 w-4 accent-[var(--nova-accent)]"
            />
            {t("account:settings.promotions")}
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-medium text-foreground">{t("account:settings.experimentalFeatures")}</h3>
        <p className="mb-3 text-xs text-muted-foreground">{t("account:settings.experimentalFeaturesHint")}</p>
        <div className="flex flex-col gap-3">
          {featureFlagKeys.map((key) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm text-foreground">
              <span>{t(`account:settings.featureFlags.${key}`)}</span>
              <input
                type="checkbox"
                checked={featureFlags[key]}
                onChange={(e) => dispatch(setFeatureFlag({ key, enabled: e.target.checked }))}
                className="h-4 w-4 accent-[var(--nova-accent)]"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-danger/30 p-5">
        <h3 className="text-sm font-medium text-foreground">{t("account:settings.dangerZone")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("account:settings.signOutDescription")}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 h-11 rounded-[var(--radius-md)] border border-danger px-5 text-sm font-medium text-danger hover:bg-danger/5"
        >
          {t("account:settings.signOut")}
        </button>
      </section>
    </div>
  );
}
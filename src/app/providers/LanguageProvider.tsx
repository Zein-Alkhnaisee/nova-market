import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { supportedLanguages, type SupportedLanguage } from "../../i18n/config";

const RTL_LANGUAGES: SupportedLanguage[] = ["ar"];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const applyDirection = (lng: string) => {
      const isRtl = RTL_LANGUAGES.includes(lng as SupportedLanguage);
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = supportedLanguages.includes(lng as SupportedLanguage)
        ? lng
        : "en";
    };

    applyDirection(i18n.language);
    i18n.on("languageChanged", applyDirection);
    return () => {
      i18n.off("languageChanged", applyDirection);
    };
  }, [i18n]);

  return <>{children}</>;
}

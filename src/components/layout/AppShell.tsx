import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CompareBar } from "./CompareBar";
import { FloatingAssistant } from "./FloatingAssistant";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[var(--z-index-toast)] focus:rounded-[var(--radius-md)] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <CompareBar />
      <FloatingAssistant />
    </div>
  );
}

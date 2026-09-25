import { useTranslation } from "react-i18next";
import { ConversationView } from "../../components/assistant/ConversationView";

export function AssistantPage() {
  const { t } = useTranslation("assistant");

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <header className="border-b border-border py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <div className="min-h-0 flex-1">
        <ConversationView />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Trash2 } from "lucide-react";
import { useAssistantConversation } from "../../hooks/useAssistantConversation";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ErrorState } from "../common/ErrorState";

interface ConversationViewProps {
  /** Compact mode is used by the floating panel; full mode by the dedicated page. */
  compact?: boolean;
}

export function ConversationView({ compact = false }: ConversationViewProps) {
  const { t } = useTranslation("assistant");
  const { messages, send, retry, clear, isLoading, error } = useAssistantConversation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node && typeof node.scrollTo === "function") {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    send(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className={`flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "px-4 py-6 sm:px-0"}`}>
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={(prompt) => send(prompt)} />
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((message) => (
              <AssistantMessageBubble key={message.id} message={message} />
            ))}
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-accent" />
                {t("thinking")}
              </div>
            ) : null}
            {error ? <ErrorState message={t(error)} onRetry={retry} /> : null}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            aria-label={t("clearConversation")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
        <label htmlFor="assistant-input" className="sr-only">
          {t("inputPlaceholder")}
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          disabled={isLoading}
          className="h-10 flex-1 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label={t("send")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

import { useTranslation } from "react-i18next";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { t } = useTranslation("assistant");
  const prompts = [
    t("suggestedPrompts.prompt1"),
    t("suggestedPrompts.prompt2"),
    t("suggestedPrompts.prompt3"),
    t("suggestedPrompts.prompt4"),
  ];

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("suggestedPrompts.title")}
      </p>
      <div className="flex flex-col gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-start text-sm text-foreground hover:border-border-strong hover:bg-surface-hover"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

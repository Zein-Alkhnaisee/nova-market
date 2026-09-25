import { Sparkles } from "lucide-react";
import { AssistantProductCard } from "./AssistantProductCard";
import { AssistantActionButtons } from "./AssistantActionButtons";
import { cn } from "../../lib/cn";
import type { AssistantMessage } from "../../types/assistant";

export function AssistantMessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      ) : null}
      <div className={cn("flex max-w-[85%] flex-col gap-3", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-[var(--radius-lg)] px-4 py-2.5 text-sm",
            isUser ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground"
          )}
        >
          {message.content}
        </div>
        {message.products && message.products.length > 0 ? (
          <div className="flex w-full gap-3 overflow-x-auto pb-1">
            {message.products.map((product) => (
              <AssistantProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
        {message.actions && message.actions.length > 0 ? (
          <AssistantActionButtons actions={message.actions} />
        ) : null}
      </div>
    </div>
  );
}

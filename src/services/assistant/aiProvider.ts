import type { AssistantMessage } from "../../types/assistant";

/**
 * The only contract the rest of the app depends on for "ask the assistant
 * something." A real integration (OpenAI, Anthropic, a proprietary backend,
 * whatever) implements this same interface and gets swapped in for
 * `mockAIProvider` in `assistantApi.ts` — nothing else in the app changes.
 */
export interface AIProvider {
  sendMessage(history: AssistantMessage[], userMessage: string): Promise<AssistantMessage>;
}

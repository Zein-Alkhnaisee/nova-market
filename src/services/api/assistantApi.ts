import { baseApi } from "./baseApi";
import { delay } from "../../lib/delay";
import { mockAIProvider } from "../assistant/mockAIProvider";
import type { AssistantMessage } from "../../types/assistant";

export interface SendAssistantMessageInput {
  history: AssistantMessage[];
  message: string;
}

export const assistantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Corresponds to MASTER_SPEC's `POST /assistant/messages`. The provider
    // is injected here, not hardcoded into the component layer, so a real
    // AI backend is a one-line swap (`mockAIProvider` → a real `AIProvider`).
    sendAssistantMessage: builder.mutation<AssistantMessage, SendAssistantMessageInput>({
      queryFn: async ({ history, message }) => {
        const response = await mockAIProvider.sendMessage(history, message);
        return { data: await delay(response, 400) };
      },
    }),
  }),
});

export const { useSendAssistantMessageMutation } = assistantApi;

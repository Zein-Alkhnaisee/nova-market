import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/store/hooks";
import { addMessage, clearConversation, selectAssistantMessages } from "../features/assistant/assistantSlice";
import { useSendAssistantMessageMutation } from "../services/api/assistantApi";
import { generateId } from "../lib/id";
import type { AssistantMessage } from "../types/assistant";

export function useAssistantConversation() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectAssistantMessages);
  const [sendAssistantMessage, { isLoading }] = useSendAssistantMessageMutation();
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);

    const userMessage: AssistantMessage = {
      id: generateId("msg"),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    dispatch(addMessage(userMessage));

    const result = await sendAssistantMessage({ history: [...messages, userMessage], message: trimmed });
    if ("data" in result && result.data) {
      dispatch(addMessage(result.data));
      setLastFailedMessage(null);
    } else {
      setError("errorMessage");
      setLastFailedMessage(trimmed);
    }
  };

  const retry = () => {
    if (lastFailedMessage) send(lastFailedMessage);
  };

  const clear = () => {
    dispatch(clearConversation());
    setError(null);
    setLastFailedMessage(null);
  };

  return { messages, send, retry, clear, isLoading, error };
}

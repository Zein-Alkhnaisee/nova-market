import { describe, expect, it } from "vitest";
import assistantReducer, {
  addMessage,
  clearConversation,
  selectAssistantMessages,
} from "../../features/assistant/assistantSlice";
import type { AssistantMessage } from "../../types/assistant";

const userMessage: AssistantMessage = {
  id: "m1",
  role: "user",
  content: "hello",
  createdAt: new Date().toISOString(),
};

describe("assistantSlice", () => {
  it("starts with an empty conversation", () => {
    const state = assistantReducer(undefined, { type: "@@init" });
    expect(selectAssistantMessages({ assistant: state })).toEqual([]);
  });

  it("appends messages in order", () => {
    let state = assistantReducer(undefined, addMessage(userMessage));
    state = assistantReducer(state, addMessage({ ...userMessage, id: "m2", role: "assistant" }));
    const messages = selectAssistantMessages({ assistant: state });
    expect(messages.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("clears the whole conversation", () => {
    let state = assistantReducer(undefined, addMessage(userMessage));
    state = assistantReducer(state, clearConversation());
    expect(selectAssistantMessages({ assistant: state })).toEqual([]);
  });
});

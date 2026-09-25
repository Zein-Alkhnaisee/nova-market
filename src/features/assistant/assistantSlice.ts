import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadPersisted } from "../../lib/persist";
import type { AssistantMessage } from "../../types/assistant";

interface AssistantState {
  messages: AssistantMessage[];
}

const initialState: AssistantState = {
  messages: loadPersisted<AssistantMessage[]>("assistantConversation", []),
};

const assistantSlice = createSlice({
  name: "assistant",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<AssistantMessage>) => {
      state.messages.push(action.payload);
    },
    clearConversation: (state) => {
      state.messages = [];
    },
  },
});

export const { addMessage, clearConversation } = assistantSlice.actions;
export default assistantSlice.reducer;

export const selectAssistantMessages = (state: { assistant: AssistantState }) => state.assistant.messages;

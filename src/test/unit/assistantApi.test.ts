import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import { assistantApi } from "../../services/api/assistantApi";

function createTestStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

describe("assistantApi", () => {
  it("returns an assistant message for a user query", async () => {
    const store = createTestStore();
    const result = await store.dispatch(
      assistantApi.endpoints.sendAssistantMessage.initiate({ history: [], message: "hello" })
    );
    expect("data" in result).toBe(true);
    expect((result as { data: { role: string } }).data.role).toBe("assistant");
  });

  it("passes conversation history through to the provider without mutating it", async () => {
    const store = createTestStore();
    const history = [
      { id: "m1", role: "user" as const, content: "hi", createdAt: new Date().toISOString() },
    ];
    const historyBefore = JSON.stringify(history);
    await store.dispatch(
      assistantApi.endpoints.sendAssistantMessage.initiate({ history, message: "laptop under $1000" })
    );
    expect(JSON.stringify(history)).toBe(historyBefore);
  });
});

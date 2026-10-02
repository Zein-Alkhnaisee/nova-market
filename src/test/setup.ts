import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { resetStore } from "../services/catalog/productStore";
import { resetStore as resetCategoryStore } from "../services/catalog/categoryStore";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  // The product catalog caches in memory; clearing storage alone would leak admin edits between tests.
  resetStore();
  resetCategoryStore();
});

// jsdom doesn't implement matchMedia — ThemeProvider relies on it.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

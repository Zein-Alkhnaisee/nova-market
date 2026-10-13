import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { resetStore } from "../services/catalog/productStore";
import { resetStore as resetCategoryStore } from "../services/catalog/categoryStore";
import { resetStore as resetCouponStore } from "../services/catalog/couponStore";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetStore();
  resetCategoryStore();
  resetCouponStore();
});

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
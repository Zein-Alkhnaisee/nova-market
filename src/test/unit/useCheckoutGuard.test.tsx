import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { createTestStore } from "../renderWithProviders";
import { useCheckoutGuard, type CheckoutStep } from "../../hooks/useCheckoutGuard";
import { addToCart, selectCartLines } from "../../features/cart/cartSlice";
import { setSession } from "../../features/auth/authSlice";
import { setDeliveryOption, setShippingAddress } from "../../features/checkout/checkoutSlice";
import type { ProductSummary } from "../../types/product";

const product: ProductSummary = {
  id: "p1",
  slug: "p1",
  name: "Widget",
  brand: "Test",
  categoryId: "electronics",
  price: 50,
  currency: "USD",
  rating: 4,
  reviewCount: 1,
  image: "img.jpg",
  inStock: true,
};

const testAddress = {
  fullName: "Jordan Lee",
  line1: "1 Market St",
  city: "SF",
  region: "CA",
  postalCode: "94105",
  country: "US",
  phone: "+14155550100",
};

const testDelivery = { id: "standard", label: "Standard", etaDays: "5-7 days", price: 6 };

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

function LoginProbe() {
  const location = useLocation();
  return <div data-testid="login">{location.pathname + location.search}</div>;
}

// Checkout requires a signed-in customer; the prerequisite tests below are about the steps, so they sign in first.
function createSignedInStore() {
  const store = createTestStore();
  store.dispatch(setSession({ id: "user-test", fullName: "Jordan Lee", email: "jordan@example.com", role: "customer" }));
  return store;
}

function GuardedPage({ step }: { step: CheckoutStep }) {
  useCheckoutGuard(step);
  return <LocationProbe />;
}

function renderGuard(step: CheckoutStep, store: ReturnType<typeof createTestStore>) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/checkout/${step}`]}>
        <Routes>
          <Route path={`/checkout/${step}`} element={<GuardedPage step={step} />} />
          <Route path="/checkout/shipping" element={<LocationProbe />} />
          <Route path="/checkout/delivery" element={<LocationProbe />} />
          <Route path="/checkout/review" element={<LocationProbe />} />
          <Route path="/cart" element={<LocationProbe />} />
          <Route path="/auth/login" element={<LoginProbe />} />
          <Route path="/checkout/payment" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("useCheckoutGuard", () => {
  it("redirects away when the cart is empty, even on the first step", () => {
    const store = createSignedInStore();
    const { getByTestId } = renderGuard("shipping", store);
    expect(getByTestId("path").textContent).toBe("/cart");
  });

  it("allows the shipping step once the cart has items", () => {
    const store = createSignedInStore();
    store.dispatch(addToCart({ product }));
    const { getByTestId } = renderGuard("shipping", store);
    expect(getByTestId("path").textContent).toBe("/checkout/shipping");
  });

  it("redirects the delivery step back to shipping if no address is saved", () => {
    const store = createSignedInStore();
    store.dispatch(addToCart({ product }));
    const { getByTestId } = renderGuard("delivery", store);
    expect(getByTestId("path").textContent).toBe("/checkout/shipping");
  });

  it("allows the delivery step once a shipping address exists", () => {
    const store = createSignedInStore();
    store.dispatch(addToCart({ product }));
    store.dispatch(setShippingAddress(testAddress));
    const { getByTestId } = renderGuard("delivery", store);
    expect(getByTestId("path").textContent).toBe("/checkout/delivery");
  });

  it("redirects the review step back to delivery if no delivery option is chosen", () => {
    const store = createSignedInStore();
    store.dispatch(addToCart({ product }));
    store.dispatch(setShippingAddress(testAddress));
    const { getByTestId } = renderGuard("review", store);
    expect(getByTestId("path").textContent).toBe("/checkout/delivery");
  });

  it("allows the review step once shipping and delivery are both set", () => {
    const store = createSignedInStore();
    store.dispatch(addToCart({ product }));
    store.dispatch(setShippingAddress(testAddress));
    store.dispatch(setDeliveryOption(testDelivery));
    const { getByTestId } = renderGuard("review", store);
    expect(getByTestId("path").textContent).toBe("/checkout/review");
  });

  it("sends a guest to login with the step as the redirect, on every step", () => {
    for (const step of ["shipping", "delivery", "payment", "review"] as const) {
      const store = createTestStore();
      store.dispatch(addToCart({ product }));
      store.dispatch(setShippingAddress(testAddress));
      store.dispatch(setDeliveryOption(testDelivery));
      const { getByTestId, unmount } = renderGuard(step, store);
      expect(getByTestId("login").textContent).toBe(
        `/auth/login?redirect=${encodeURIComponent(`/checkout/${step}`)}&reason=checkout`
      );
      unmount();
    }
  });

  it("checks sign-in before the cart: a guest with an empty cart goes to login, not /cart", () => {
    const { getByTestId } = renderGuard("shipping", createTestStore());
    expect(getByTestId("login").textContent).toContain("/auth/login?redirect=");
  });

  it("leaves the guest's cart untouched while sending them to login", () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product }));
    renderGuard("shipping", store);
    expect(selectCartLines(store.getState())).toHaveLength(1);
  });
});

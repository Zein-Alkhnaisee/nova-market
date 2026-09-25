import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { createTestStore } from "../renderWithProviders";
import { useCheckoutGuard, type CheckoutStep } from "../../hooks/useCheckoutGuard";
import { addToCart } from "../../features/cart/cartSlice";
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
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("useCheckoutGuard", () => {
  it("redirects away when the cart is empty, even on the first step", () => {
    const store = createTestStore();
    const { getByTestId } = renderGuard("shipping", store);
    expect(getByTestId("path").textContent).toBe("/cart");
  });

  it("allows the shipping step once the cart has items", () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product }));
    const { getByTestId } = renderGuard("shipping", store);
    expect(getByTestId("path").textContent).toBe("/checkout/shipping");
  });

  it("redirects the delivery step back to shipping if no address is saved", () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product }));
    const { getByTestId } = renderGuard("delivery", store);
    expect(getByTestId("path").textContent).toBe("/checkout/shipping");
  });

  it("allows the delivery step once a shipping address exists", () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product }));
    store.dispatch(setShippingAddress(testAddress));
    const { getByTestId } = renderGuard("delivery", store);
    expect(getByTestId("path").textContent).toBe("/checkout/delivery");
  });

  it("redirects the review step back to delivery if no delivery option is chosen", () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product }));
    store.dispatch(setShippingAddress(testAddress));
    const { getByTestId } = renderGuard("review", store);
    expect(getByTestId("path").textContent).toBe("/checkout/delivery");
  });

  it("allows the review step once shipping and delivery are both set", () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product }));
    store.dispatch(setShippingAddress(testAddress));
    store.dispatch(setDeliveryOption(testDelivery));
    const { getByTestId } = renderGuard("review", store);
    expect(getByTestId("path").textContent).toBe("/checkout/review");
  });
});

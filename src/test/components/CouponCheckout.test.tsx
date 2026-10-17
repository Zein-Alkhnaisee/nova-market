import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import i18n from "../../i18n/config";
import { CouponInput } from "../../components/checkout/CouponInput";
import { ReviewStepPage } from "../../pages/checkout/ReviewStepPage";
import { createTestStore, renderWithProviders } from "../renderWithProviders";
import { setSession } from "../../features/auth/authSlice";
import { addToCart } from "../../features/cart/cartSlice";
import { setDeliveryOption, setShippingAddress } from "../../features/checkout/checkoutSlice";
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from "../../services/catalog/couponStore";
import { listAllOrders } from "../../services/api/ordersApi";
import type { ProductSummary } from "../../types/product";

async function apply(code: string, onApply = vi.fn()) {
  renderWithProviders(<CouponInput appliedCode={null} discountPercent={0} onApply={onApply} onRemove={vi.fn()} />);
  await userEvent.type(screen.getByLabelText("Coupon code"), code);
  await userEvent.click(screen.getByRole("button", { name: "Apply" }));
  return onApply;
}

// Checkout had no direct coupon tests before Phase 12 made the data source
// admin-editable, so these pin the behavior that must NOT change (the two seed
// coupons, case-insensitivity, the invalid message) plus what the store adds.
describe("CouponInput reads coupons through the store", () => {
  it("still applies the seed coupons exactly as before: any case, surrounding spaces ignored", async () => {
    const onApply = await apply("  save10 ");
    expect(onApply).toHaveBeenCalledWith({ code: "SAVE10", percentOff: 10 });
  });

  it("still applies the second seed coupon", async () => {
    const onApply = await apply("WELCOME15");
    expect(onApply).toHaveBeenCalledWith({ code: "WELCOME15", percentOff: 15 });
  });

  it("still rejects an unknown code with the same message and does not apply anything", async () => {
    const onApply = await apply("NOPE");
    expect(await screen.findByText("That code isn't valid")).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("still shows the applied state and a Remove button (UI unchanged)", async () => {
    const onRemove = vi.fn();
    renderWithProviders(<CouponInput appliedCode="SAVE10" discountPercent={10} onApply={vi.fn()} onRemove={onRemove} />);
    expect(screen.getByText("Applied: SAVE10 (-10%)")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("accepts a coupon an admin just created", async () => {
    createCoupon({ code: "summer20", percentOff: 20 });
    const onApply = await apply("Summer20");
    expect(onApply).toHaveBeenCalledWith({ code: "SUMMER20", percentOff: 20 });
  });

  it("applies an admin-edited percentage", async () => {
    updateCoupon(listCoupons()[0].id, { percentOff: 40 });
    const onApply = await apply(listCoupons()[0].code);
    expect(onApply).toHaveBeenCalledWith({ code: listCoupons()[0].code, percentOff: 40 });
  });

  it("rejects a deactivated coupon", async () => {
    updateCoupon(listCoupons()[0].id, { percentOff: 10, active: false });
    const onApply = await apply(listCoupons()[0].code);
    expect(await screen.findByText("That code isn't valid")).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("rejects a deleted coupon", async () => {
    const target = listCoupons()[1];
    deleteCoupon(target.id);
    const onApply = await apply(target.code);
    expect(await screen.findByText("That code isn't valid")).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });
});

const product: ProductSummary = {
  id: "p-coupon", slug: "p-coupon", name: "Coupon Widget", brand: "B", categoryId: "electronics",
  price: 50, currency: "USD", rating: 4, reviewCount: 1, image: "https://example.com/i.jpg", inStock: true,
};

async function placeFromReview(couponToType: string | null) {
  const store = createTestStore();
  store.dispatch(setSession({ id: "user-test", fullName: "Jordan Lee", email: "jordan@example.com", role: "customer" }));
  store.dispatch(addToCart({ product, quantity: 1 }));
  store.dispatch(setShippingAddress({ fullName: "Sam", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" }));
  store.dispatch(setDeliveryOption({ id: "standard", label: "Standard", etaDays: "5 business days", price: 0 }));
  const router = createMemoryRouter(
    [
      { path: "/checkout/review", element: <ReviewStepPage /> },
      { path: "/order-success/:id", element: <div>Order placed</div> },
      { path: "/checkout/payment", element: <div>Payment page</div> },
      { path: "/cart", element: <div>Cart page</div> },
    ],
    { initialEntries: [{ pathname: "/checkout/review", state: { paymentSummary: { brand: "Visa", last4: "4242" } } }] }
  );
  const before = listAllOrders().length;
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>
  );
  if (couponToType) {
    await userEvent.type(await screen.findByLabelText("Coupon code"), couponToType);
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    await screen.findByText(/^Applied:/);
  }
  await userEvent.click(await screen.findByRole("button", { name: "Place order" }));
  await waitFor(() => expect(screen.getByText("Order placed")).toBeInTheDocument(), { timeout: 3000 });
  expect(listAllOrders().length).toBe(before + 1);
  return listAllOrders()[0];
}

describe("Checkout records the applied coupon on the order (Phase 12 enabler)", () => {
  it("applies a coupon through the real review page and stores its code and the discount on the order", async () => {
    const order = await placeFromReview("welcome15");
    expect(order.couponCode).toBe("WELCOME15");
    expect(order.discount).toBe(7.5); // 15% of the $50 subtotal — same math as before
  }, 10000);

  it("applies an admin-created coupon end to end", async () => {
    createCoupon({ code: "summer20", percentOff: 20 });
    const order = await placeFromReview("SUMMER20");
    expect(order.couponCode).toBe("SUMMER20");
    expect(order.discount).toBe(10);
  }, 10000);

  it("records no couponCode (no key at all) when no coupon was applied, and checkout still succeeds", async () => {
    const order = await placeFromReview(null);
    expect(order).not.toHaveProperty("couponCode");
    expect(order.discount).toBe(0);
  }, 10000);
});

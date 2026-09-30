import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import i18n from "../../i18n/config";
import { createTestStore } from "../renderWithProviders";
import { addToCart } from "../../features/cart/cartSlice";
import { setSession } from "../../features/auth/authSlice";
import { setDeliveryOption, setShippingAddress } from "../../features/checkout/checkoutSlice";
import { ReviewStepPage } from "../../pages/checkout/ReviewStepPage";
import { listAllOrders } from "../../services/api/ordersApi";
import type { ProductSummary } from "../../types/product";

const product: ProductSummary = {
  id: "p-link", slug: "p-link", name: "Linked Widget", brand: "B", categoryId: "electronics",
  price: 50, currency: "USD", rating: 4, reviewCount: 1, image: "https://example.com/i.jpg", inStock: true,
};

async function placeFromReview(signedInId: string | null) {
  const store = createTestStore();
  store.dispatch(addToCart({ product, quantity: 1 }));
  store.dispatch(setShippingAddress({ fullName: "Sam", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" }));
  store.dispatch(setDeliveryOption({ id: "standard", label: "Standard", etaDays: "5 business days", price: 0 }));
  if (signedInId) store.dispatch(setSession({ id: signedInId, fullName: "Sam", email: "sam@example.com", role: "customer" }));

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
  await userEvent.click(await screen.findByRole("button", { name: "Place order" }));
  await waitFor(() => expect(screen.getByText("Order placed")).toBeInTheDocument(), { timeout: 3000 });
  expect(listAllOrders().length).toBe(before + 1);
  return listAllOrders()[0];
}

describe("Checkout stamps the signed-in customer on the order", () => {
  it("records the signed-in user's id", async () => {
    const order = await placeFromReview("user-signed-in");
    expect(order.customerId).toBe("user-signed-in");
  }, 10000);

  it("records no customerId for a guest, and checkout still succeeds", async () => {
    const order = await placeFromReview(null);
    expect(order).not.toHaveProperty("customerId");
  }, 10000);
});

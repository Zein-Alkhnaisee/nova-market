import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import i18n from "../../i18n/config";
import { createTestStore } from "../renderWithProviders";
import { addToCart, selectCartLines } from "../../features/cart/cartSlice";
import { selectShippingAddress, selectDeliveryOption } from "../../features/checkout/checkoutSlice";
import { ShippingStepPage } from "../../pages/checkout/ShippingStepPage";
import { DeliveryStepPage } from "../../pages/checkout/DeliveryStepPage";
import { PaymentStepPage } from "../../pages/checkout/PaymentStepPage";
import { ReviewStepPage } from "../../pages/checkout/ReviewStepPage";
import { OrderSuccessPage } from "../../pages/checkout/OrderSuccessPage";
import type { ProductSummary } from "../../types/product";

const product: ProductSummary = {
  id: "p1",
  slug: "widget",
  name: "Widget",
  brand: "Test Brand",
  categoryId: "electronics",
  price: 50,
  currency: "USD",
  rating: 4,
  reviewCount: 1,
  image: "https://example.com/img.jpg",
  inStock: true,
};

function renderCheckout(store: ReturnType<typeof createTestStore>) {
  const router = createMemoryRouter(
    [
      { path: "/checkout/shipping", element: <ShippingStepPage /> },
      { path: "/checkout/delivery", element: <DeliveryStepPage /> },
      { path: "/checkout/payment", element: <PaymentStepPage /> },
      { path: "/checkout/review", element: <ReviewStepPage /> },
      { path: "/order-success/:id", element: <OrderSuccessPage /> },
      { path: "/cart", element: <div>Cart page</div> },
    ],
    { initialEntries: ["/checkout/shipping"] }
  );

  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>
  );
}

describe("Checkout flow", () => {
  it("completes shipping → delivery → payment → review → order success, clearing the cart and never persisting raw card data", async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    store.dispatch(addToCart({ product, quantity: 1 }));

    renderCheckout(store);

    // --- Shipping step ---
    await waitFor(() => expect(screen.getByText("Shipping address")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Full name"), "Jordan Lee");
    await user.type(screen.getByLabelText("Address line 1"), "1 Market St");
    await user.type(screen.getByLabelText("City"), "San Francisco");
    await user.type(screen.getByLabelText("State / Region"), "CA");
    await user.type(screen.getByLabelText("Postal code"), "94105");
    await user.type(screen.getByLabelText("Country"), "US");
    await user.type(screen.getByLabelText("Phone number"), "+14155550100");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(selectShippingAddress(store.getState())?.fullName).toBe("Jordan Lee"));

    // --- Delivery step ---
    await waitFor(() => expect(screen.getByText("Delivery method")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(selectDeliveryOption(store.getState())).not.toBeNull());

    // --- Payment step ---
    await waitFor(() => expect(screen.getByRole("heading", { name: "Payment" })).toBeInTheDocument());
    await user.type(screen.getByLabelText("Card number"), "4242424242424242");
    await user.type(screen.getByLabelText("Expiry (MM/YY)"), "12/30");
    await user.type(screen.getByLabelText("CVC"), "123");
    await user.type(screen.getByLabelText("Name on card"), "Jordan Lee");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // --- Review step ---
    await waitFor(() => expect(screen.getByText("Review your order")).toBeInTheDocument());
    expect(screen.getByText(/Visa •••• 4242/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Place order" }));

    // --- Order success ---
    await waitFor(
      () => expect(screen.getByText("Order confirmed")).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText(/NV-\d{6}/)).toBeInTheDocument();

    // Cart is cleared after a successful order.
    expect(selectCartLines(store.getState())).toHaveLength(0);

    // The raw card number must never have been persisted anywhere reachable from state/localStorage.
    const wholeStateSerialized = JSON.stringify(store.getState());
    expect(wholeStateSerialized).not.toMatch(/4242424242424242/);
    expect(window.localStorage.getItem("nova:orders") ?? "").not.toMatch(/4242424242424242/);
  }, 10000);

  it("redirects to /cart if checkout is reached with an empty cart", async () => {
    const store = createTestStore();
    renderCheckout(store);
    await waitFor(() => expect(screen.getByText("Cart page")).toBeInTheDocument());
  });
});

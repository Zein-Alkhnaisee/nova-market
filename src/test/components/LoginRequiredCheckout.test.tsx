import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import i18n from "../../i18n/config";
import { createTestStore } from "../renderWithProviders";
import { addToCart, selectCartLines } from "../../features/cart/cartSlice";
import { selectIsAuthenticated, setSession } from "../../features/auth/authSlice";
import { setDeliveryOption, setShippingAddress } from "../../features/checkout/checkoutSlice";
import { authApi } from "../../services/api/authApi";
import { listAllOrders } from "../../services/api/ordersApi";
import { CartPage } from "../../pages/cart/CartPage";
import { LoginPage } from "../../pages/auth/LoginPage";
import { RegisterPage } from "../../pages/auth/RegisterPage";
import { ShippingStepPage } from "../../pages/checkout/ShippingStepPage";
import { DeliveryStepPage } from "../../pages/checkout/DeliveryStepPage";
import { PaymentStepPage } from "../../pages/checkout/PaymentStepPage";
import { ReviewStepPage } from "../../pages/checkout/ReviewStepPage";
import { OrderSuccessPage } from "../../pages/checkout/OrderSuccessPage";
import { OrderDetailPage } from "../../pages/orders/OrderDetailPage";
import type { ProductSummary } from "../../types/product";

// Checkout requires a signed-in customer, so every order is linked to an account. Guests can still
// browse and fill a cart; they are sent to login when they try to check out, and come back after.

const product: ProductSummary = {
  id: "p-login", slug: "p-login", name: "Login Widget", brand: "B", categoryId: "electronics",
  price: 50, currency: "USD", rating: 4, reviewCount: 1, image: "https://example.com/i.jpg", inStock: true,
};

const address = { fullName: "Sam", line1: "1 A St", city: "SF", region: "CA", postalCode: "94105", country: "US", phone: "+14155550100" };
const delivery = { id: "standard", label: "Standard", etaDays: "5 business days", price: 0 };

function Where() {
  const location = useLocation();
  return <div data-testid="where">{location.pathname + location.search}</div>;
}

function renderApp(store: ReturnType<typeof createTestStore>, initialEntries: Array<string | { pathname: string; state?: unknown }>) {
  const router = createMemoryRouter(
    [
      { path: "/cart", element: <><Where /><CartPage /></> },
      { path: "/checkout", element: <div>checkout index</div> },
      { path: "/auth/login", element: <><Where /><LoginPage /></> },
      { path: "/auth/register", element: <><Where /><RegisterPage /></> },
      { path: "/account", element: <div>Account home</div> },
      { path: "/checkout/shipping", element: <><Where /><ShippingStepPage /></> },
      { path: "/checkout/delivery", element: <><Where /><DeliveryStepPage /></> },
      { path: "/checkout/payment", element: <><Where /><PaymentStepPage /></> },
      { path: "/checkout/review", element: <><Where /><ReviewStepPage /></> },
      { path: "/order-success/:id", element: <OrderSuccessPage /> },
      { path: "/account/orders/:id", element: <OrderDetailPage /> },
    ],
    { initialEntries }
  );
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>
  );
  return router;
}

const where = () => screen.getByTestId("where").textContent;

describe("Checkout requires sign-in", () => {
  it("a guest clicking Checkout in the cart is sent to login with a clear message", async () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product, quantity: 1 }));
    renderApp(store, ["/cart"]);

    await userEvent.click(await screen.findByRole("link", { name: "Continue to checkout" }));

    expect(await screen.findByText("Sign in to complete your order.")).toBeInTheDocument();
    expect(where()).toBe("/auth/login?redirect=%2Fcheckout%2Fshipping&reason=checkout");
  });

  it("a signed-in customer's Checkout button goes straight to checkout", async () => {
    const store = createTestStore();
    store.dispatch(setSession({ id: "u1", fullName: "Sam", email: "sam@example.com", role: "customer" }));
    store.dispatch(addToCart({ product, quantity: 1 }));
    renderApp(store, ["/cart"]);

    const link = await screen.findByRole("link", { name: "Continue to checkout" });
    expect(link).toHaveAttribute("href", "/checkout");
  });

  it("after logging in, the guest lands on shipping and the cart still has their items", async () => {
    const store = createTestStore();
    const email = `login-return-${Date.now()}@example.com`;
    await store.dispatch(authApi.endpoints.register.initiate({ fullName: "Sam", email, password: "password123" }));
    store.dispatch(addToCart({ product, quantity: 2 }));
    renderApp(store, ["/cart"]);

    await userEvent.click(await screen.findByRole("link", { name: "Continue to checkout" }));
    await userEvent.type(await screen.findByLabelText("Email"), email);
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(where()).toBe("/checkout/shipping"), { timeout: 3000 });
    expect(await screen.findByText("Shipping address")).toBeInTheDocument();
    expect(selectIsAuthenticated(store.getState())).toBe(true);
    expect(selectCartLines(store.getState())).toHaveLength(1);
    expect(selectCartLines(store.getState())[0].quantity).toBe(2);
  }, 10000);

  it("registering from the login page returns to checkout too", async () => {
    const store = createTestStore();
    store.dispatch(addToCart({ product, quantity: 1 }));
    renderApp(store, ["/auth/login?redirect=%2Fcheckout%2Fshipping&reason=checkout"]);

    await userEvent.click(await screen.findByRole("link", { name: "Create an account" }));
    expect(await screen.findByText("Create an account or sign in to complete your order.")).toBeInTheDocument();
    expect(where()).toBe("/auth/register?redirect=%2Fcheckout%2Fshipping&reason=checkout");

    await userEvent.type(screen.getByLabelText("Full name"), "Sam New");
    await userEvent.type(screen.getByLabelText("Email"), `register-return-${Date.now()}@example.com`);
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(where()).toBe("/checkout/shipping"), { timeout: 3000 });
    expect(selectCartLines(store.getState())).toHaveLength(1);
  }, 10000);

  it.each(["shipping", "delivery", "payment", "review"])(
    "a guest cannot reach /checkout/%s directly: it goes to login with that step as the redirect",
    async (step) => {
      const store = createTestStore();
      store.dispatch(addToCart({ product, quantity: 1 }));
      store.dispatch(setShippingAddress(address));
      store.dispatch(setDeliveryOption(delivery));
      const router = renderApp(store, [`/checkout/${step}`]);

      await waitFor(() => expect(router.state.location.pathname).toBe("/auth/login"));
      expect(router.state.location.search).toBe(`?redirect=${encodeURIComponent(`/checkout/${step}`)}&reason=checkout`);
      expect(await screen.findByText("Sign in to complete your order.")).toBeInTheDocument();
      expect(selectIsAuthenticated(store.getState())).toBe(false);
    }
  );

  it("a signed-in customer with an empty cart is still sent to /cart", async () => {
    const store = createTestStore();
    store.dispatch(setSession({ id: "u1", fullName: "Sam", email: "sam@example.com", role: "customer" }));
    const router = renderApp(store, ["/checkout/shipping"]);
    await waitFor(() => expect(router.state.location.pathname).toBe("/cart"));
  });

  it("a signed-in customer's order carries their id, and View order opens it", async () => {
    const store = createTestStore();
    store.dispatch(setSession({ id: "user-view-order", fullName: "Sam", email: "sam@example.com", role: "customer" }));
    store.dispatch(addToCart({ product, quantity: 1 }));
    store.dispatch(setShippingAddress(address));
    store.dispatch(setDeliveryOption(delivery));
    const before = listAllOrders().length;
    renderApp(store, [{ pathname: "/checkout/review", state: { paymentSummary: { brand: "Visa", last4: "4242" } } }]);

    await userEvent.click(await screen.findByRole("button", { name: "Place order" }));
    expect(await screen.findByText("Order confirmed", undefined, { timeout: 3000 })).toBeInTheDocument();

    const orders = listAllOrders();
    expect(orders.length).toBe(before + 1);
    expect(orders[0].customerId).toBe("user-view-order");

    await userEvent.click(screen.getByRole("link", { name: "View order" }));
    expect((await screen.findAllByText(new RegExp(orders[0].orderNumber))).length).toBeGreaterThan(0);
  }, 10000);
});

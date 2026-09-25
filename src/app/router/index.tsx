import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { CheckoutLayout } from "../../components/checkout/CheckoutLayout";
import { AccountLayout } from "../../components/account/AccountLayout";
import { PagePlaceholder } from "../../components/common/PagePlaceholder";
import { NotFoundPage } from "../../pages/NotFoundPage";

const HomePage = lazy(() => import("../../pages/home/HomePage").then((m) => ({ default: m.HomePage })));
const ShopPage = lazy(() => import("../../pages/shop/ShopPage").then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() =>
  import("../../pages/product/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage }))
);
const CartPage = lazy(() => import("../../pages/cart/CartPage").then((m) => ({ default: m.CartPage })));
const SearchPage = lazy(() =>
  import("../../pages/search/SearchPage").then((m) => ({ default: m.SearchPage }))
);
const WishlistPage = lazy(() =>
  import("../../pages/account/WishlistPage").then((m) => ({ default: m.WishlistPage }))
);
const ComparePage = lazy(() =>
  import("../../pages/compare/ComparePage").then((m) => ({ default: m.ComparePage }))
);
const CollectionsPage = lazy(() =>
  import("../../pages/collections/CollectionsPage").then((m) => ({ default: m.CollectionsPage }))
);
const CollectionDetailPage = lazy(() =>
  import("../../pages/collections/CollectionDetailPage").then((m) => ({ default: m.CollectionDetailPage }))
);
const ShippingStepPage = lazy(() =>
  import("../../pages/checkout/ShippingStepPage").then((m) => ({ default: m.ShippingStepPage }))
);
const DeliveryStepPage = lazy(() =>
  import("../../pages/checkout/DeliveryStepPage").then((m) => ({ default: m.DeliveryStepPage }))
);
const PaymentStepPage = lazy(() =>
  import("../../pages/checkout/PaymentStepPage").then((m) => ({ default: m.PaymentStepPage }))
);
const ReviewStepPage = lazy(() =>
  import("../../pages/checkout/ReviewStepPage").then((m) => ({ default: m.ReviewStepPage }))
);
const OrderSuccessPage = lazy(() =>
  import("../../pages/checkout/OrderSuccessPage").then((m) => ({ default: m.OrderSuccessPage }))
);
const LoginPage = lazy(() => import("../../pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("../../pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("../../pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("../../pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const AccountOverviewPage = lazy(() =>
  import("../../pages/account/AccountOverviewPage").then((m) => ({ default: m.AccountOverviewPage }))
);
const ProfilePage = lazy(() =>
  import("../../pages/account/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const AddressesPage = lazy(() =>
  import("../../pages/account/AddressesPage").then((m) => ({ default: m.AddressesPage }))
);
const PaymentMethodsPage = lazy(() =>
  import("../../pages/account/PaymentMethodsPage").then((m) => ({ default: m.PaymentMethodsPage }))
);
const SettingsPage = lazy(() =>
  import("../../pages/account/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const OrdersPage = lazy(() => import("../../pages/orders/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() =>
  import("../../pages/orders/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage }))
);
const AssistantPage = lazy(() =>
  import("../../pages/assistant/AssistantPage").then((m) => ({ default: m.AssistantPage }))
);
const MyCollectionsPage = lazy(() =>
  import("../../pages/account/MyCollectionsPage").then((m) => ({ default: m.MyCollectionsPage }))
);
const MyCollectionDetailPage = lazy(() =>
  import("../../pages/account/MyCollectionDetailPage").then((m) => ({ default: m.MyCollectionDetailPage }))
);
const PublicCollectionPage = lazy(() =>
  import("../../pages/collections/PublicCollectionPage").then((m) => ({ default: m.PublicCollectionPage }))
);

function withShell(node: React.ReactNode) {
  return (
    <AppShell>
      <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-muted-foreground">Loading…</div>}>
        {node}
      </Suspense>
    </AppShell>
  );
}

function withCheckoutShell(node: React.ReactNode) {
  return (
    <CheckoutLayout>
      <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-muted-foreground">Loading…</div>}>
        {node}
      </Suspense>
    </CheckoutLayout>
  );
}

function withAuthShell(node: React.ReactNode) {
  return (
    <Suspense fallback={<div className="px-4 py-24 text-center text-sm text-muted-foreground">Loading…</div>}>
      {node}
    </Suspense>
  );
}

function withAccountShell(node: React.ReactNode) {
  return (
    <AppShell>
      <AccountLayout>
        <Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>}>
          {node}
        </Suspense>
      </AccountLayout>
    </AppShell>
  );
}

function placeholder(title: string, description?: string) {
  return withShell(<PagePlaceholder title={title} description={description} />);
}

export const router = createBrowserRouter([
  { path: "/", element: withShell(<HomePage />) },
  { path: "/shop", element: withShell(<ShopPage />) },
  { path: "/shop/:category", element: withShell(<ShopPage />) },
  { path: "/product/:slug", element: withShell(<ProductDetailPage />) },
  { path: "/search", element: withShell(<SearchPage />) },
  { path: "/compare", element: withShell(<ComparePage />) },
  { path: "/collections", element: withShell(<CollectionsPage />) },
  { path: "/collections/:slug", element: withShell(<CollectionDetailPage />) },
  { path: "/c/:id", element: withShell(<PublicCollectionPage />) },
  { path: "/deals", element: withShell(<ShopPage />) },
  { path: "/new-arrivals", element: withShell(<ShopPage />) },
  { path: "/trending", element: withShell(<ShopPage />) },

  { path: "/auth", element: <Navigate to="/auth/login" replace /> },
  { path: "/auth/login", element: withAuthShell(<LoginPage />) },
  { path: "/auth/register", element: withAuthShell(<RegisterPage />) },
  { path: "/auth/forgot-password", element: withAuthShell(<ForgotPasswordPage />) },
  { path: "/auth/reset-password", element: withAuthShell(<ResetPasswordPage />) },

  { path: "/account", element: withAccountShell(<AccountOverviewPage />) },
  { path: "/account/profile", element: withAccountShell(<ProfilePage />) },
  { path: "/account/addresses", element: withAccountShell(<AddressesPage />) },
  { path: "/account/payment-methods", element: withAccountShell(<PaymentMethodsPage />) },
  { path: "/account/orders", element: withAccountShell(<OrdersPage />) },
  { path: "/account/orders/:id", element: withAccountShell(<OrderDetailPage />) },
  { path: "/account/wishlist", element: withAccountShell(<WishlistPage />) },
  { path: "/account/collections", element: withAccountShell(<MyCollectionsPage />) },
  { path: "/account/collections/:id", element: withAccountShell(<MyCollectionDetailPage />) },
  { path: "/account/settings", element: withAccountShell(<SettingsPage />) },

  { path: "/cart", element: withShell(<CartPage />) },
  { path: "/checkout", element: <Navigate to="/checkout/shipping" replace /> },
  { path: "/checkout/shipping", element: withCheckoutShell(<ShippingStepPage />) },
  { path: "/checkout/delivery", element: withCheckoutShell(<DeliveryStepPage />) },
  { path: "/checkout/payment", element: withCheckoutShell(<PaymentStepPage />) },
  { path: "/checkout/review", element: withCheckoutShell(<ReviewStepPage />) },
  { path: "/order-success/:id", element: withCheckoutShell(<OrderSuccessPage />) },

  { path: "/assistant", element: withShell(<AssistantPage />) },

  { path: "/admin", element: placeholder("Admin dashboard", "Phase 12.") },
  { path: "/admin/products", element: placeholder("Admin · Products") },
  { path: "/admin/products/new", element: placeholder("Admin · New product") },
  { path: "/admin/products/:id", element: placeholder("Admin · Edit product") },
  { path: "/admin/orders", element: placeholder("Admin · Orders") },
  { path: "/admin/customers", element: placeholder("Admin · Customers") },
  { path: "/admin/categories", element: placeholder("Admin · Categories") },
  { path: "/admin/coupons", element: placeholder("Admin · Coupons") },
  { path: "/admin/analytics", element: placeholder("Admin · Analytics") },

  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

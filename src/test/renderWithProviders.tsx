import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";
import { ThemeProvider } from "../app/providers/ThemeProvider";
import { baseApi } from "../services/api/baseApi";
import cartReducer from "../features/cart/cartSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";
import compareReducer from "../features/compare/compareSlice";
import recentSearchesReducer from "../features/search/recentSearchesSlice";
import recentlyViewedReducer from "../features/products/recentlyViewedSlice";
import checkoutReducer from "../features/checkout/checkoutSlice";
import authReducer from "../features/auth/authSlice";
import addressesReducer from "../features/account/addressesSlice";
import paymentMethodsReducer from "../features/account/paymentMethodsSlice";
import userCollectionsReducer from "../features/account/userCollectionsSlice";
import featureFlagsReducer from "../features/settings/featureFlagsSlice";
import assistantReducer from "../features/assistant/assistantSlice";
import "../services/api/productsApi";
import "../services/api/categoriesApi";
import "../services/api/searchApi";
import "../services/api/collectionsApi";
import "../services/api/reviewsApi";
import "../services/api/recommendationsApi";
import "../services/api/ordersApi";
import "../services/api/authApi";
import "../services/api/assistantApi";

export function createTestStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      compare: compareReducer,
      recentSearches: recentSearchesReducer,
      recentlyViewed: recentlyViewedReducer,
      checkout: checkoutReducer,
      auth: authReducer,
      addresses: addressesReducer,
      paymentMethods: paymentMethodsReducer,
      userCollections: userCollectionsReducer,
      featureFlags: featureFlagsReducer,
      assistant: assistantReducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = "/",
    path = "*",
    store = createTestStore(),
  }: { route?: string; path?: string; store?: ReturnType<typeof createTestStore> } = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ThemeProvider>
        </I18nextProvider>
      </Provider>
    );
  }
  return {
    store,
    ...render(<Routes><Route path={path} element={ui} /></Routes>, { wrapper: Wrapper }),
  };
}

import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../services/api/baseApi";
import cartReducer from "../../features/cart/cartSlice";
import wishlistReducer from "../../features/wishlist/wishlistSlice";
import compareReducer from "../../features/compare/compareSlice";
import recentSearchesReducer from "../../features/search/recentSearchesSlice";
import recentlyViewedReducer from "../../features/products/recentlyViewedSlice";
import checkoutReducer from "../../features/checkout/checkoutSlice";
import authReducer from "../../features/auth/authSlice";
import addressesReducer from "../../features/account/addressesSlice";
import paymentMethodsReducer from "../../features/account/paymentMethodsSlice";
import userCollectionsReducer from "../../features/account/userCollectionsSlice";
import featureFlagsReducer from "../../features/settings/featureFlagsSlice";
import assistantReducer from "../../features/assistant/assistantSlice";
import { savePersisted } from "../../lib/persist";

// Ensure injected endpoints (products, categories, search, ...) are registered
// on the base API reducer before the store is created.
import "../../services/api/productsApi";
import "../../services/api/categoriesApi";
import "../../services/api/searchApi";
import "../../services/api/collectionsApi";
import "../../services/api/reviewsApi";
import "../../services/api/recommendationsApi";
import "../../services/api/ordersApi";
import "../../services/api/authApi";
import "../../services/api/assistantApi";

export const store = configureStore({
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
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Lightweight persistence: mirror the slices that should survive a reload
// into localStorage whenever they change. Kept intentionally simple (no
// external dependency) — each slice is small, so writing on every change is
// cheap and avoids stale-data bugs a debounce could introduce.
let previous = store.getState();
store.subscribe(() => {
  const current = store.getState();
  if (current.cart !== previous.cart) {
    savePersisted("cart", current.cart.lines);
  }
  if (current.wishlist !== previous.wishlist) {
    savePersisted("wishlist", current.wishlist.productIds);
  }
  if (current.recentSearches !== previous.recentSearches) {
    savePersisted("recentSearches", current.recentSearches.terms);
  }
  if (current.recentlyViewed !== previous.recentlyViewed) {
    savePersisted("recentlyViewed", current.recentlyViewed.productIds);
  }
  if (current.checkout !== previous.checkout) {
    savePersisted("checkoutDraft", current.checkout);
  }
  if (current.auth !== previous.auth) {
    savePersisted("session", current.auth.user);
  }
  if (current.addresses !== previous.addresses) {
    savePersisted("addresses", current.addresses.items);
  }
  if (current.paymentMethods !== previous.paymentMethods) {
    savePersisted("paymentMethods", current.paymentMethods.items);
  }
  if (current.userCollections !== previous.userCollections) {
    savePersisted("userCollections", current.userCollections.items);
  }
  if (current.featureFlags !== previous.featureFlags) {
    savePersisted("featureFlagOverrides", current.featureFlags.overrides);
  }
  if (current.assistant !== previous.assistant) {
    savePersisted("assistantConversation", current.assistant.messages);
  }
  previous = current;
});

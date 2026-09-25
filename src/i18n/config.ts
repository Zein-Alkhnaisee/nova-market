import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enHome from "./locales/en/home.json";
import enProduct from "./locales/en/product.json";
import enCart from "./locales/en/cart.json";
import enErrors from "./locales/en/errors.json";
import enSearch from "./locales/en/search.json";
import enShop from "./locales/en/shop.json";
import enCompare from "./locales/en/compare.json";
import enCollections from "./locales/en/collections.json";
import enCheckout from "./locales/en/checkout.json";
import enAssistant from "./locales/en/assistant.json";
import enAuth from "./locales/en/auth.json";
import enAccount from "./locales/en/account.json";
import enOrders from "./locales/en/orders.json";

import arCommon from "./locales/ar/common.json";
import arNavigation from "./locales/ar/navigation.json";
import arHome from "./locales/ar/home.json";
import arProduct from "./locales/ar/product.json";
import arCart from "./locales/ar/cart.json";
import arErrors from "./locales/ar/errors.json";
import arSearch from "./locales/ar/search.json";
import arShop from "./locales/ar/shop.json";
import arCompare from "./locales/ar/compare.json";
import arCollections from "./locales/ar/collections.json";
import arCheckout from "./locales/ar/checkout.json";
import arAssistant from "./locales/ar/assistant.json";
import arAuth from "./locales/ar/auth.json";
import arAccount from "./locales/ar/account.json";
import arOrders from "./locales/ar/orders.json";

export const supportedLanguages = ["en", "ar"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const namespaces = [
  "common",
  "navigation",
  "home",
  "shop",
  "product",
  "cart",
  "checkout",
  "account",
  "orders",
  "search",
  "compare",
  "wishlist",
  "collections",
  "assistant",
  "auth",
  "errors",
  "validation",
  "admin",
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        navigation: enNavigation,
        home: enHome,
        product: enProduct,
        cart: enCart,
        errors: enErrors,
        search: enSearch,
        shop: enShop,
        compare: enCompare,
        collections: enCollections,
        checkout: enCheckout,
        assistant: enAssistant,
        auth: enAuth,
        account: enAccount,
        orders: enOrders,
      },
      ar: {
        common: arCommon,
        navigation: arNavigation,
        home: arHome,
        product: arProduct,
        cart: arCart,
        errors: arErrors,
        search: arSearch,
        shop: arShop,
        compare: arCompare,
        collections: arCollections,
        checkout: arCheckout,
        assistant: arAssistant,
        auth: arAuth,
        account: arAccount,
        orders: arOrders,
      },
    },
    fallbackLng: "en",
    supportedLngs: supportedLanguages as unknown as string[],
    defaultNS: "common",
    ns: namespaces as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "nova-language",
    },
  });

export default i18n;

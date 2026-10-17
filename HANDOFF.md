# HANDOFF.md — NOVA Market

**Last updated:** 2026-10-17, after Phase 13 (Polish) was completed as scoped by the owner and **verified by the owner**: `tsc -b` clean, lint 0 errors / 4 warnings, **547 tests across 73 files passing**, build succeeds. **All thirteen phases are complete.** Verification means those four automated checks; **no real-browser review across RTL / mobile / dark has been done** — a documented deferral (§11).

This document is written for a **new AI agent or a different AI tool** picking this project up
cold. It reflects the actual state of the repository at export time, not a plan or an aspiration.

---

## 0. READ THIS FIRST — do not restart or recreate work

This is a large, multi-session project. All thirteen of the spec's phases are implemented,
tested, and verified (what was deliberately deferred is listed in §11). **Do not**:

- re-scaffold the project, re-run `npm create vite`, or recreate the folder structure
- rewrite the design-token system, theming, i18n, routing, or the Redux/RTK Query architecture
- rebuild Home, Shop, Product Detail, Search, Cart, Checkout, Compare, editorial Collections,
  Auth, Account, Orders, user-created Collections, recommendation reasons, smart filters, the
  product configurator, smart cart suggestions, the command palette, feature flags, or the AI
  Shopping Assistant (floating panel, dedicated page, mock AI service) — these exist and work
- build a second assistant UI, a second conversation state machine, or a second AI-provider
  abstraction — there is exactly one (`useAssistantConversation` → `assistantApi` →
  `AIProvider`), shared by the floating panel and the dedicated `/assistant` page
- conflate editorial collections (`/collections`, curated merchandising) with user-created
  collections (`/account/collections`, owned by a signed-in person) — they are deliberately
  separate features that happen to share a name
- introduce a second state-management approach, a second styling approach, or a parallel
  component library alongside what's here
- "fix" the mock API layer by replacing it with something else — it is intentionally
  structured to be swapped for a real backend later (see §8)
- treat feature flags as decorative — at least `productComparison` genuinely hides UI when off
  (see §8), and any new flag added later should do the same, not just exist in a list

**Do**: read `MASTER_SPEC.md` and `DESIGN_SYSTEM.md` as the source of truth, read `PROGRESS.md`
for phase-by-phase status, read `IMPLEMENTATION_LOG.md` for *why* things are built the way they
are, inspect the repository, then continue from the deferrals in §11 (there is no unimplemented phase).

---

## 1. What NOVA Market is

A premium, editorial-feeling e-commerce storefront — a demo/portfolio-grade frontend
implementation of a full marketplace. It is **frontend-only**: all data comes from an in-repo
mock layer. The product bar is explicitly "not a generic Tailwind e-commerce template":
distinctive visual design, real loading/empty/error states everywhere, full Arabic/English with
RTL, light/dark/system theming, accessibility, and real tests.

---

## 2. Technology stack

| Concern | Choice |
|---|---|
| Build | Vite (rolldown-vite) |
| Framework | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4, semantic CSS custom properties (design tokens) |
| Client state | Redux Toolkit slices |
| Server state | RTK Query (`baseApi` + `injectEndpoints` per feature) |
| Routing | React Router v7 (`createBrowserRouter`, route-level `React.lazy`) |
| i18n | i18next + react-i18next + browser language detector |
| Icons | lucide-react |
| Variants | class-variance-authority |
| Tests | Vitest + @testing-library/react + user-event + jsdom |
| Lint | oxlint |

Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm test` (`vitest run`),
`npm run test:watch`, `npx tsc -b`.

---

## 3. Project architecture

```
src/
  app/
    store/          Redux store + typed hooks; also wires localStorage persistence
    router/         All routes; shell helpers (withShell / withCheckoutShell /
                    withAccountShell / withAuthShell)
    providers/      ThemeProvider, LanguageProvider
  config/           features.ts — feature flag definitions/defaults (MASTER_SPEC §81/§82)
  features/         Redux slices grouped by domain (cart, wishlist, compare, search,
                    products, checkout, auth, account — includes addressesSlice,
                    paymentMethodsSlice, and userCollectionsSlice — settings, which
                    holds featureFlagsSlice — and assistant, which holds assistantSlice)
  services/api/     RTK Query: baseApi + productsApi, categoriesApi, searchApi,
                    collectionsApi, reviewsApi, recommendationsApi (returns
                    RecommendedProduct[] — product + reason — for related/
                    personalized/cart-suggestion queries), ordersApi, authApi,
                    assistantApi (POST /assistant/messages equivalent)
  services/catalog/ productStore.ts + categoryStore.ts + couponStore.ts — THE product, category
                    and coupon catalogs (single stores; see §8 #16/#17). The static mocks/data/*.ts
                    files are seed data only and are each imported by nothing but their store.
                    All three persist through lib/versionedStore.ts.
  services/assistant/ aiProvider.ts (the AIProvider interface — the AI API abstraction) +
                    mockAIProvider.ts (the mock AI service implementation). This is a
                    sibling of services/api/, not nested inside it, since it's not an
                    RTK Query module itself — assistantApi.ts wraps it.
  components/       ui/ (primitives), common/ (includes ErrorBoundary, CrashPage, RouteBoundary,
                    RouteFallback), layout/ (includes FloatingAssistant),
                    product/ (includes ProductConfigurator, FilterDrawer, FilterPanel with smart facet
                    counts), checkout/, account/, auth/, navigation/ (includes
                    CommandPalette), assistant/ (ConversationView — shared by the floating
                    panel and the dedicated page — AssistantMessageBubble,
                    AssistantProductCard, AssistantActionButtons, SuggestedPrompts)
  pages/            One folder per route area, including pages/assistant/AssistantPage.tsx.
                    Note: pages/collections/ holds the *editorial* Collections feature;
                    user-created collections live in pages/account/ (MyCollectionsPage,
                    MyCollectionDetailPage) — deliberately separate.
  hooks/            useDebouncedValue, useCheckoutGuard, useAuthGuard, useFeatureFlag,
                    useAssistantConversation (shared by both assistant UIs), useDialogBehavior
  lib/              cn, delay, persist, pricing, validation, id, format (locale-aware
                    currency/number/date formatting — see §8 #19)
  types/            product (includes RecommendedProduct, ConfiguratorGroup references),
                    cart, review, collection (editorial), userCollection, order, address,
                    user, configurator, assistant (AssistantMessage, AssistantAction)
  i18n/             config.ts + locales/en/*.json + locales/ar/*.json
  mocks/data/       All seed data (2 of 9 products carry configuratorGroups: the Kite
                    laptop and the Nova Forge Custom PC)
  test/             setup.ts, renderWithProviders.tsx (wraps Redux + Router + i18n +
                    ThemeProvider), unit/, components/
```

**State placement rules actually followed here** (keep following them):
- **Server/async data** → RTK Query. **Global client state** → Redux slice.
  **Shareable UI state (search query, filters, sort)** → URL via `useSearchParams`.
  **Ephemeral UI state** → local `useState`.
- Filters/sort live in the URL, not Redux — `/search` and `/shop` both do this.

---

## 4. Design requirements

`DESIGN_SYSTEM.md` is authoritative. Non-negotiables in practice:

- **Never hardcode colors.** Use semantic tokens (`bg-background`, `text-foreground`,
  `border-border`, `text-muted-foreground`, `bg-surface`, `text-accent`, `text-danger`,
  `text-success`, `text-warning`). Radii via `rounded-[var(--radius-md)]` etc.
- **Dark theme is independently designed**, not an inversion of light.
- **RTL is first-class.** Use logical properties (`ms-`/`me-`, `start-`/`end-`, `ps-`/`pe-`),
  and mirror directional icons with `rtl:rotate-180`.
- **Every feature needs loading, empty, and error states.** Skeletons over spinners.
  Errors are human-readable with a retry affordance — never raw API errors.
- **Accessibility**: WCAG 2.2 AA intent. Real labels, `aria-invalid` + `aria-describedby` on
  form errors, `role="radiogroup"`/`radio` for custom pickers, `role="dialog"`/`aria-modal`
  for overlays, ARIA 1.2 combobox pattern for search, visible focus rings, skip link.
- **Mobile-first and responsive.** Filter drawers on mobile, scrollable nav on mobile.

---

## 5. Source-of-truth files (all in project root)

| File | Purpose |
|---|---|
| `MASTER_SPEC.md` | The full product/technical specification. Phase numbering comes from §107. |
| `DESIGN_SYSTEM.md` | Visual/UX system. Authoritative for all UI decisions. |
| `PROGRESS.md` | Phase-by-phase status, feature tables, known issues. |
| `IMPLEMENTATION_LOG.md` | Dated narrative of what was built each session and why. Read for rationale. |
| `HANDOFF.md` | This file. |

---

## 6. What has been completed

Phase numbers are `MASTER_SPEC.md`'s (§107). See `PROGRESS.md` for full feature tables.

- **Phase 1 — Foundation**: DONE. Vite/React/TS, design tokens, light/dark/system theme,
  en/ar i18n + RTL, AppShell/Header/Footer, UI primitives, all spec routes registered.
- **Phase 2 — Home & Discovery**: DONE. Hero, category rail, trending/deals/new/premium rails,
  personalized recommendations, recently viewed, footer.
- **Phase 3 — Categories & Shop**: DONE. Shop + category pages, filters, sorting, URL-synced state.
- **Phase 4 — Product Experience**: DONE. Gallery, variants, specs, reviews (with working
  write-a-review), quick view, related products, quantity/cart/wishlist/compare actions.
- **Phase 5 — Search**: DONE. Search overlay (accessible combobox, keyboard nav, `/` shortcut),
  autocomplete, recent + trending searches, results page with filters/sort, URL-synced.
- **Phase 6 — Cart & Wishlist**: DONE. Cart with full price breakdown + coupons, wishlist page,
  recently viewed. All persisted to localStorage.
- **Phase 7 — Checkout**: DONE. Shipping → Delivery → Payment → Review → Order Success, step
  guard, coupons, order creation. See §9 for the payment boundary.
- **Phase 8 — Account & Orders**: DONE. Login, register, forgot/reset password,
  logout, auth guard, account shell + overview, profile, addresses, payment methods, settings,
  orders list, order detail with timeline and buy-again/cancel actions.
- **Phase 9 — Comparison & Collections**: DONE. Compare page + comparison table +
  global CompareBar; editorial collections list/detail; user-created wishlist collections
  (`userCollectionsSlice`, create/rename/delete, add/remove items via `AddToCollectionMenu` on
  the Wishlist page); public/private visibility with a privacy-safe public share view at `/c/:id`.
- **Phase 10 — Smart Features**: DONE. All 7 items from MASTER_SPEC §10:
  personalized recommendations (built on Phase 2/4's existing rails), recommendation reasons
  (`RecommendedProduct` type, differentiated reason text, `ProductRail`'s `showReasons`),
  smart filters (`FilterPanel`'s `facetBaseProducts` — live result counts, zero-result options
  disabled), product configurator (`ProductConfigurator`, 2 mock products with real
  `configuratorGroups`), smart cart suggestions (`getCartSuggestions`, a "Complete your order"
  rail on Cart), command/quick actions (`CommandPalette`, Ctrl/Cmd+K), and feature flags
  (`featureFlagsSlice`, 5 flags, with `productComparison` actually gating Compare's UI —
  see §8 for why that specific flag was chosen to prove the mechanism works).
- **Phase 11 — AI Shopping Assistant**: DONE. All 9 items from MASTER_SPEC §11:
  a shared `ConversationView` used identically by the floating panel (`FloatingAssistant`,
  hidden on checkout/auth/the assistant page itself) and the dedicated `/assistant` page;
  message bubbles, suggested prompts, compact product recommendation cards; comparison actions
  that reuse the existing `compareSlice`; `mockAIProvider` (rule-based intent matching: greeting,
  budget+category, compare, specs, gift, keyword fallback); and the `AIProvider` interface as
  the required AI-provider abstraction, with `assistantApi` (`POST /assistant/messages`) the
  only thing that knows which implementation is currently wired in.

- **Phase 12 — Admin**: DONE. All seven items from MASTER_SPEC §107 Phase 12, in nine checkpoints: admin auth + shell, Dashboard, Customers, Products, Categories, Orders, Coupons, Analytics. Role-guarded `/admin/*` (UX only — see §9/§11), a shared design system (same tokens and primitives as the storefront, denser layout), three admin-managed catalog stores behind `lib/versionedStore.ts` (products, categories, coupons — §8 #16/#17), and an admin-only API module (`services/api/adminApi.ts`). Details per checkpoint: `PROGRESS.md` and `IMPLEMENTATION_LOG.md`.

---

## 7. Current phase and what remains

**Phase 13 is DONE and verified. All phases complete.** Verified by the owner on 2026-10-17: `tsc -b` clean, lint 0 errors / 4 warnings (baseline), 547/547 tests across 73 files, build OK (510 tests across 67 files before Phase 13, plus 37 in 6 new files). Verification here means those four automated checks; it does **not** include a real-browser review (§11). Phase 12 (Admin) and Bug C were verified earlier.

**Phase 12 checkpoint order (revised by the owner):** auth → shell → dashboard → customers → products → categories → orders → coupons → analytics. **All nine done.**

**Phase 12 deliverables:**
- **Admin auth**: `User.role?`, a seeded mock admin in `authApi.ts` (`admin@nova.demo` / `admin-demo-123` — mock only, plain text, says so in a comment), and `useAuthGuard({ role })`. A wrong role is *not* redirected; the hook returns false and the layout renders `AdminForbidden`. UX only — the backend must enforce roles when one exists (MASTER_SPEC §97).
- **Admin shell**: `components/admin/AdminLayout.tsx` (+ `AdminPageHeader`, `AdminForbidden`), the `admin` i18n namespace (en/ar), and all nine `/admin/*` routes rendering inside the shell.

- **Dashboard** (`/admin`, `AdminDashboardPage`): KPI cards, 14-day revenue `BarChart` (reusable token-based SVG in `components/admin/charts/`), top products, recent orders; skeleton/empty/error states. Figures come from the pure `lib/adminStats.ts` behind `services/api/adminApi.ts` (admin-only module; additive accessors `listAllOrders()` in `ordersApi.ts` and `listMockCustomers()` in `authApi.ts`). **Its Conversion KPI is intentionally "Not available"** — see below.

- **Customers** (`/admin/customers`, `/admin/customers/:id`): list with search/ranking/unlinked-orders note, detail with KPIs and order history, designed empty state for customers with no linked orders. Backed by `lib/adminCustomers.ts` + `adminApi` (`getAdminCustomers`, `getAdminCustomer`).
- **Order→customer link (Phase 12 enabler touching Phase 7/8 code):** optional `Order.customerId`, set in `ReviewStepPage` from the signed-in session and stored by `placeOrder` only when present. Old and guest orders have none and must keep working — never make this field required or fail a load on it.

- **Products + the shared catalog store**: `services/catalog/productStore.ts` is now the single source of truth for products; the four storefront readers (`productsApi`, `recommendationsApi`, `searchApi`, `mockAIProvider`) read through it; admin CRUD at `/admin/products`, `/admin/products/new`, `/admin/products/:id` writes to it; delete is archive (restorable). Admin product mutations invalidate the storefront's cache tags so edits show up. The dashboard's product count now reads the store. See §8 #16 and §11.

- **Categories + the shared category store**: `services/catalog/categoryStore.ts` (same pattern as products) with admin CRUD at `/admin/categories`. Five files read it (`categoriesApi`, `searchApi`, `recommendationsApi`, `mockAIProvider`, `productStore` validation). Slugs are fixed at creation (`id === slug` — see §8 #17); delete is blocked with a 409 while any product, archived included, belongs to the category.

- **Orders** (`/admin/orders`, `/admin/orders/:id`): list with search/status filter, detail with items, customer, address, masked payment, totals, timeline, and status changes. The lifecycle lives in `lib/orderTransitions.ts` and is enforced by `updateOrderStatus` in `ordersApi.ts` (illegal → 409; see §8 #18). Admin changes invalidate the order tags so customer order pages update.

- **Coupons + the shared versioned-store helper**: `services/catalog/couponStore.ts` (same pattern as products/categories; key `nova:coupons:v1`; seeded with the two codes checkout always accepted, `SAVE10` and `WELCOME15`, both active) with admin CRUD at `/admin/coupons`. **Checkout now reads coupons through the store**: `CouponInput` calls `findActiveCoupon(code)` instead of searching the static array — a data-source swap only (same case-insensitive match, same discount math, same UI, same invalid message). `checkoutSlice` was **not** touched. Codes are stored upper-case, unique case-insensitively and **immutable** once created (orders record them); percent is a whole number 1–100; coupons have an `active` flag so a used coupon can be retired instead of deleted. **Deleting a coupon that any order used is blocked with a 409 + count** (see below for the limit of that guarantee). `createVersionedStore` was extracted into `lib/versionedStore.ts` and `productStore`/`categoryStore` refactored onto it (§8 #17).
- **Order → coupon link (Phase 12 enabler touching Phase 7/8 code, third after `customerId` and `updateOrderStatus`)**: optional `Order.couponCode`, passed by `ReviewStepPage` (one added line) and stored by `placeOrder` only when present (same conditional-spread pattern as `customerId`). It exists because orders previously recorded only the discount, not which coupon produced it, so "block deleting a coupon any order used" was otherwise unenforceable. Orders placed before this field, and orders without a coupon, have none — **so the 409 only protects against orders that recorded a code; usage in older orders is unknowable.** Also added: the `"Coupon"` cache tag in `baseApi`.

- **Analytics** (`/admin/analytics`, `AdminAnalyticsPage`): four views over a selectable period (7 / 30 / 90 days, kept in the URL as `?range=`, an invalid value falls back to 30) — revenue over time (reuses `BarChart`; the drawing is `aria-hidden` and the same data is a visually hidden table), orders by status, top products, and sales by category. The last three use a new `components/admin/charts/HorizontalBarList` because they are categorical comparisons with long labels, which a vertical chart (it labels only its first and last bar) doesn't fit; every row is real text, so the data is natively accessible. No new dependency and no charting library. Arithmetic lives in the pure, unit-tested `lib/adminAnalytics.ts` behind `adminApi.getAnalytics`. Metric semantics are stated on the page: revenue = order totals excluding cancelled/refunded; the status view counts EVERY order in the period; top-products and category sales are **line-item sales before discounts, shipping and tax**, so they will not sum to revenue; average order excludes cancelled/refunded; **Conversion is "Not available"** (no visit data) exactly as on the dashboard. Category attribution uses the CURRENT catalog (archived products still resolve; a product or category that no longer exists falls in an "Unknown category" row). `AdminPendingPage` (the temporary placeholder) was deleted — Analytics was its last user.

**Phase 12's footprint on Phases 1–11 code** (everything outside the admin area that Phase 12 changed, 16 source files + the shared test setup; all additive or a data-source swap, each owner-approved and recorded in `IMPLEMENTATION_LOG.md`): *Phase 7/8 enablers* — `types/order.ts` + `ordersApi.ts` (optional `customerId`, optional `couponCode`, `updateOrderStatus`, the `listAllOrders` accessor), `ReviewStepPage.tsx` (two added lines passing them), `authApi.ts` + `types/user.ts` + `hooks/useAuthGuard.ts` (role, seeded mock admin, `listMockCustomers`, role-aware guard), `CouponInput.tsx` (reads coupons through `couponStore`). *Catalog read-through* — `productsApi`, `recommendationsApi`, `searchApi`, `categoriesApi`, `mockAIProvider` (read products/categories through the stores). *Foundation* — `router/index.tsx` (admin routes), `i18n/config.ts` (`admin` namespace), `baseApi.ts` (`Coupon` tag), `types/product.ts` (optional `inventory`). The only modified test file is `test/setup.ts` (resets the three stores after each test); no pre-existing test was modified. `checkoutSlice` was never touched.

**Phase 13 — Polish (done as scoped; see `PROGRESS.md` for the row-by-row status).** Delivered: a React error boundary per route area plus an app-level one and a router `errorElement` (§8 #20); `formatDate`/`formatDateTime` so dates follow the UI language (§8 #19); `/deals`, `/new-arrivals`, `/trending` filtering by badge; a shared accessible `FilterDrawer` and `useDialogBehavior` (§8 #21); a contrast pass on the accent/status tokens, computed against WCAG 4.5:1; RTL and mobile fixes found by a static audit; removal of hardcoded English (footer, skip link, aria-labels, 404). **Not delivered, by design of the owner's scope:** a real-browser pass (this is still the biggest open risk — a manual checklist is at the end of the Phase 13 entry in `IMPLEMENTATION_LOG.md`), per-page SEO titles, animations, a performance pass. **Provenance:** most Phase 13 code was found uncommitted in the working tree and adopted; it is a separate commit (`eb810d9`) (see §11 and `IMPLEMENTATION_LOG.md`).

**Remaining after Phase 13:** nothing is outstanding against MASTER_SPEC §107 as scoped by the owner. What was deferred on purpose, with reasons, is in §11: a real-browser review across RTL / mobile / dark (the largest open risk), native-speaker review of the Arabic strings, per-page SEO titles, animations, a performance pass, a mobile layout for the admin area, a mobile bottom navigation bar, translated mock AI replies, and Playwright/MSW (intentionally not installed).

---

## 8. Important architectural decisions

1. **The mock backend is a deliberate boundary, not a shortcut.** Every API module uses RTK
   Query `queryFn` against in-repo data with artificial latency, preserving the exact public
   surface (hooks, cache tags, invalidation, loading/error states) a real `fetchBaseQuery`
   would have. Swapping in a real backend should touch only `services/api/*`, not components.
2. **Theme and language live in React context + localStorage, not Redux** — keeps theme
   resolution synchronous and avoids a flash of wrong theme on first paint.
3. **URL is the source of truth for search/filter/sort**, so those states are shareable and
   back/forward works. No Redux duplication of them.
4. **Guards (`useCheckoutGuard`, `useAuthGuard`) check once per page landing**, depending only
   on `[step]` / `[]` — not reactively on every store change. This is intentional and was a
   bug fix: a reactive guard misfires when a page's own action (placing an order clears the
   cart; signing out clears the session) changes the very state being guarded, racing the
   intended navigation. Keep this pattern for any future guard.
5. **Pricing math exists once**, in `lib/pricing.ts`, shared by Cart, Review, Order Success,
   and Order Detail so totals can never drift between screens.
6. **IDs come from `lib/id.ts` (`generateId`)**, never `Date.now()` alone — plain timestamps
   collided for records created in the same millisecond and corrupted set-default/remove
   behavior. Use `generateId` for any new entity.
7. **Persistence is a single store subscription** in `app/store/index.ts` mirroring specific
   slices to localStorage under a `nova:` prefix. Add new persisted slices there.
8. **Components are reused across features rather than duplicated** — e.g. checkout's
   `AddressForm` is reused by the account Addresses page; `OrderSummary` by Cart, Review,
   Order Success, and Order Detail.
9. **Editorial collections and user-created collections are intentionally separate features**
   that happen to share the word "collections" and part of one i18n namespace file (organized
   under distinct top-level vs. `yours.*` keys to avoid two near-duplicate translation files).
   They share no components, no Redux state, and no routes. Do not merge them.
10. **A public share link must never distinguish "doesn't exist" from "exists but private."**
    `/c/:id` renders the identical not-found state for both, asserted by a test. Apply the same
    principle to any future shareable-by-link resource.
11. **Cart lines are keyed on `(productId, configurationSummary)`, not `productId` alone.**
    A product with configurator options can be added to the cart at more than one price/config;
    treating it as a single cart line per product (the pre-Phase-10 assumption) silently merges
    or cross-affects differently-configured items. Any future feature that lets one product be
    "the same item at a different price/spec" (e.g. a future subscription tier) should follow
    this same composite-key pattern rather than assuming `productId` uniquely identifies a line.
12. **A guard reset pattern applies beyond guards: prefer remount-over-reset-in-effect for any
    component whose internal state must reinitialize on a re-open/re-landing event.**
    `ProductDetailPage` (key by product id) and `CommandPalette` (key by an incrementing
    `instanceKey` on open) both do this instead of resetting state inside a `useEffect` —
    avoids the `set-state-in-effect` lint warning and, more importantly, avoids the class of
    race condition documented in the Phase 7 log entry (a reactive effect firing on stale state
    during a transition). Reach for this before reaching for a reset effect.
13. **Feature flags must gate something real to prove the mechanism works**, not just exist as
    a list. `productComparison` was deliberately chosen to gate a pre-existing, well-tested
    feature (Compare, from Phase 9) rather than only gating brand-new Phase 10 code, precisely
    so "off" is independently distinguishable from "not built yet." Follow this when adding
    flags for future phases. (Phase 11 followed through on the specific example given here:
    `aiAssistant` now genuinely hides `FloatingAssistant` and gates the command palette's
    assistant action, not just a config entry.)
14. **Any integration with an external service (AI, payments, a future real backend) goes
    behind a narrow, swappable interface** — one method, one clear contract — with a mock
    implementation behind it, not logic embedded directly in components or Redux slices.
    `services/assistant/aiProvider.ts`'s single-method `AIProvider` interface is the reference
    example: `assistantApi.ts` and every UI component depend on the interface, and
    `mockAIProvider` is the only file that would change for a real integration. Apply the same
    shape to any future external integration (e.g. a real payment gateway, if Checkout is ever
    connected to one).
15. **One shared UI for one shared concept, even when it appears in two surfaces.** The
    assistant's `ConversationView` (message list, suggested prompts, input) is used identically
    by both the floating panel and the dedicated `/assistant` page via a `compact` prop —
    there is no second, parallel chat implementation. When a feature needs both an "embedded"
    and a "full page" presentation, build one component with a display-mode prop, not two.

16. **The product catalog is a single store module behind a narrow interface; storefront
    readers and admin views share it; the static mock is seed data only.**
    `services/catalog/productStore.ts` (`listProducts`, `getProductById`, `createProduct`,
    `updateProduct`, `archiveProduct`, `restoreProduct`, `resetStore`) is the only thing that
    reads `mocks/data/products.ts`. Everything else — storefront API modules, the assistant,
    admin — calls the store. Rules that follow from it: (a) it is a plain module, **not Redux**;
    storefront reactivity comes from RTK Query tag invalidation (admin writes invalidate
    `Products`, `Product`, `Recommendation`, `Search/SUGGESTIONS` on success only); (b) call
    `listProducts()` at use time inside functions, never at module load, or edits won't be seen;
    (c) the archive filter lives in `listProducts()` and nowhere else — never re-filter archived
    products in a reader; only admin passes `includeArchived`; (d) persistence is the versioned
    key `nova:products:v1` with a `{ version, items }` envelope and a seed fallback on any
    empty/corrupt/mismatched data — **bump the version when `ProductSummary` changes shape**;
    (e) validation and constraints are enforced in the store, with error *codes* translated in
    the UI; (f) any test that mutates the store is protected by `resetStore()` in
    `test/setup.ts` — if you add another in-memory store, reset it there too. A new storefront
    query that needs products must read through the store; importing the static mock directly
    would silently ignore admin edits. Use this same shape for categories, coupons, and any
    future admin-managed catalog data.

17. **A category's `id` always equals its `slug`.** The storefront resolves `/shop/:category`
    by slug and `productsApi` compares that value against `product.categoryId` (an id). This is
    load-bearing, not a style choice: `categoryStore` assigns `id = slug` at creation, never
    lets the slug change afterwards, and rejects stored data that breaks it. Do not make slugs
    editable, and do not give categories ids unrelated to their slugs, without first changing
    `ShopPage`/`productsApi` to resolve slug → id. `categoryStore` and `productStore` import each
    other, but only call each other inside functions at call time — never call the other store
    at module top level in either file.
    **Shared persistence helper — extracted at the third store, as planned.** `categoryStore` is a
    separate module from `productStore` (and `couponStore` from both): each owns its types,
    validation and constraints. The load / validate-envelope / commit / `resetStore` plumbing that
    all three share lives in `lib/versionedStore.ts` (`createVersionedStore({ key, version, seed,
    isValid })` → `read` / `write` / `reset`). It was deliberately NOT extracted at two stores
    (MASTER_SPEC §106: no abstraction without a real purpose) and WAS extracted at the third, when
    the pattern would otherwise have been copied a third time. The refactor changed no behavior: all
    397 pre-existing tests passed unchanged against it before any coupon code was written. **A fourth
    admin-managed store should use `createVersionedStore` too.** Note the validator is the store's
    own: products/categories reject an empty list (they never remove items, so empty means corrupt),
    but coupons accept one (an admin may delete every coupon, and that must not resurrect the seed).

18. **Order status changes go through `updateOrderStatus` and the lifecycle table in
    `lib/orderTransitions.ts` — never by writing a status directly.** The table is forward-only
    (cancel only before shipment, refund only after delivery, cancelled/refunded terminal) and is
    enforced in the API layer: illegal moves are 409, unknown ids 404, a rejected change alters
    nothing. The customer-facing `cancelOrder` (Phase 8) keeps its own cancellable list; a test
    (`orderTransitions.test.ts`) pins that it agrees with the table at every reachable status —
    if you change either, that test tells you. (`updateOrderStatus` was added to `ordersApi.ts` in Phase 12 as an additive, owner-approved enabler touching Phase 7/8 code; `cancelOrder` is untouched.) Any new feature that changes an order's status must
    use `updateOrderStatus`, append a timeline entry, and invalidate the `Order` id and `LIST`
    tags so customer pages refresh.

19. **Prices and numbers are formatted through `src/lib/format.ts`, never with `Intl.NumberFormat(undefined, …)`.**
    `undefined` as the locale means "the OS/runtime locale", which silently overrides the app's own
    language: with an Arabic OS locale and the UI in English, prices rendered as `‏١٬٤٩٩ US$` instead of
    `$1,499` (**Bug C**; it showed up as two failing `ProductConfigurator` tests on an Arabic-locale
    Windows machine — the tests were right and the app was wrong). The shared helpers —
    `formatCurrency(amount, currency, options?)`, `formatNumber(value, options?)`, `getFormatLocale()` —
    read the current i18next language at call time (`resolvedLanguage || language`, canonicalised,
    `"en"` on a missing or malformed tag so formatting can never crash a page). New code must use them.
    A component re-renders into the new locale on a language switch because it re-renders on
    `languageChanged` (anything using `useTranslation`), so call the helpers during render, not at module
    load. The admin pages predate the helper and pass `i18n.language` to `Intl.NumberFormat` directly —
    equivalent, left as-is, and fine to migrate when touched. **Still open (same root cause, not part of
    Bug C):** none — dates follow the same rule through `formatDate` / `formatDateTime`, which return `""` for an invalid date instead of throwing, and signed price differences use `signDisplay` rather than prepending `+`/`-` to a formatted string (RTL-safe). Never call `toLocaleDateString()` / `toLocaleString()` / `Intl.*Format(undefined, …)` directly.

20. **Render errors are caught per route area, inside the shell, and at the router root.**
    `RouteBoundary` (an `ErrorBoundary` keyed by pathname) wraps each area's page content inside its
    shell, so a crashing page leaves the header/footer/sidebar usable and recovers when the person
    navigates. An app-level `ErrorBoundary` wraps the providers, and the router has a root
    `errorElement` — **both are needed**: React Router catches render errors itself, so a boundary
    outside `RouterProvider` never sees a route crash. `CrashPage` is deliberately free of router,
    Redux and anything else that could be the thing that broke ("Go home" is a plain `<a href="/">`,
    "Reload" is `location.reload()`) and never shows the raw error (MASTER_SPEC §46). Boundaries do not
    catch event-handler or async errors; those stay handled where they happen (RTK Query states, form
    validation). Wrap any new route area with `area(...)` in `app/router/index.tsx`.

21. **Hand-built dialogs use `useDialogBehavior`; small touch targets are extended, not enlarged.**
    The hook moves focus into the dialog, closes on Escape, and returns focus to the opener, reading
    `onClose` through a ref so a parent re-render never steals focus from a field mid-typing (a test pins
    that). `QuickViewModal` and `FilterDrawer` use it; a new overlay should too. Icon buttons that are
    visually small get an `after:absolute after:-inset-*` pseudo-element for a 44px-ish hit area (the
    button needs `relative`, or already be positioned). Hover-only reveals are gated behind
    `[@media(hover:hover)]` so touch screens always see them. Values that must read left-to-right inside
    RTL text (phone, postal code, card number, email, the 404 code) are `dir="ltr"` islands or `<bdi>`.

---

## 9. Security and data rules — these are hard requirements

- **Payment boundary.** Raw card data (number, CVC, expiry as entered) must live **only** in
  local component state. It must never be dispatched to Redux, never persisted to localStorage,
  never included in an order record, and never logged. Only a masked `{brand, last4}` (plus
  `expiry` for saved cards) may travel forward. The card fields are cleared the moment the
  masked summary is derived. This is enforced by tests that search serialized Redux state,
  serialized order records, and localStorage for the literal test card number. **Any new
  payment-adjacent feature must preserve this and be covered by an equivalent assertion.**
- **Never imply production security.** `MASTER_SPEC.md` §29 forbids faking payment or
  authentication in a way that suggests it's real. `services/api/authApi.ts` stores mock
  passwords in plain text and says so loudly in a header comment; that file is the boundary to
  replace. Don't quietly make it look more secure than it is, and don't make it worse.
- **No account enumeration.** `forgotPassword` succeeds identically whether or not the email
  exists. Preserve this.
- **Backend-enforced constraints belong in the API layer, not just the UI.** Example:
  `cancelOrder` rejects orders past `processing` with a 409 even though the UI already hides
  the button. Follow this pattern rather than trusting the UI alone.

---

## 10. Testing and verification requirements

**Before declaring any phase complete, all four must pass:**

```bash
npx tsc -b        # must be clean
npm run lint      # must be 0 errors
npm test          # must be all-passing
npm run build     # must succeed
```

Current state: **547 tests across 73 files, all passing** (verified by the owner after Phase 13; 510 across 67 files before it, plus 37 in 6 new files). (The full suite takes ~100 s normally but can exceed a 300 s limit on a single-core machine; running it in chunks — `src/test/unit`, then the component files in two halves — is a valid way to verify. One pre-existing test, `ProductConfigurator` "adds the configured price…", failed once under load and passed on every rerun; it is believed to be a timing flake from RTL's 1000 ms `waitFor` default.) `tsc -b` clean. `oxlint` 0 errors **Flake policy (owner directive): if `ProductConfigurator` "adds the configured price…" fails again in any checkpoint, treat it as a real flake and bump its `waitFor` timeout deliberately (it uses the 1000 ms default) rather than letting it flake indefinitely.** It has not failed in the last four chunked runs.
with 4 advisory `only-export-components` / `set-state-in-effect` warnings that are the
long-standing accepted baseline — **do not let this number grow**; if a change adds a warning,
fix the cause rather than suppressing it.

Test conventions:
- `src/test/renderWithProviders.tsx` is the shared harness (Redux + Router + i18n). It accepts
  `{ route, path, store }`; pass `path` when the page uses `useParams`. **When you add a new
  Redux slice or API module, register it there too** — forgetting this is the most common cause
  of confusing test failures in this repo.
- Prefer testing real behavior over implementation: reducer logic, API query/filter correctness,
  and end-to-end page flows driven through actual routing with `user-event`.
- Two end-to-end flows exist and are worth extending rather than duplicating: `CheckoutFlow`
  and `AuthPages`.

---

## 11. Known limitations and intentional gaps

- **No real backend.** All data is mock; orders/reviews/users persist only to localStorage
  (reviews only for the session). This is by design.
- **MSW is not installed.** `queryFn` reads mock data directly. Behaviorally identical for the
  UI, but requests don't appear in the browser Network tab.
- **`/account/collections` is now a real page** (Phase 9) — no longer a gap. "Public" sharing
  is browser-local only (no backend to serve shared data to a different device/browser); see
  `PROGRESS.md`'s Phase 9 section for the full explanation. This is the same mock-backend
  boundary every other feature has, not unique to collections.
- **Settings notification toggles are local-only** and deliberately not persisted, rather than
  pretending they saved to a server.
- **Billing-address-different-from-shipping** is a checkbox on the checkout Payment step that
  doesn't yet reveal a second address form.
- **Search has no fuzzy/typo tolerance and no natural-language parsing** (e.g. "waterproof
  jacket under $100"). Matching is substring-based on name/brand/category. The spec lists NL
  search as a distinct sub-item.
- **Some i18n namespaces are registered but empty** (e.g. `validation`, `admin`) — fill them as
  their phases are built.
- **Archived products inside lists that hold product ids (decision: silently dropped).**
  Wishlists, user collections (owner and public share view), editorial collections and the
  recently-viewed rail resolve stored ids against the storefront catalog, which excludes archived
  products — so an archived product just disappears from them; a list of only archived products
  shows the normal empty state, not an error. The alternative (a "no longer available"
  placeholder) was rejected because it needs edits to each of those Phase 8/9 pages. **Known
  cost:** counts computed from stored ids can exceed what is visible after an archive — the
  header wishlist badge, the account overview counter, "N items" on user and public collections,
  and editorial collection counts. Fix path if it matters: derive those counts from the resolved
  products instead of `ids.length`. Restoring the product makes it reappear everywhere.
- **Provenance of the Orders checkpoint (recorded for honesty).** Commit `bf7f48e` was found in
  the repository without a record of who made it in the session that discovered it; the owner
  concluded it came from the previous session (cut off before its final response) and decided to
  adopt it. It was verified (tsc / lint / build / 392 tests / diff footprint) and then reviewed
  for quality rather than assumed correct, and a follow-up commit fixed what the review found
  (see IMPLEMENTATION_LOG, checkpoint 7). The provenance cannot be confirmed from the repo alone.
  Its Phase 7/8 footprint is `updateOrderStatus` in `ordersApi.ts` (additive, owner-approved);
  `cancelOrder` is untouched.
- **Analytics:** per-browser data only (like everything else); one period at a time with no
  comparison to the previous period; revenue is bucketed daily for every range (90 bars at the
  widest); top products is capped at 8; category and product sales are line-item sales (unit price ×
  quantity, before discounts, shipping and tax) while revenue is order totals, so the views don't
  sum to each other (stated on the page); a category is attributed from the CURRENT catalog, so
  moving a product to another category re-attributes its past sales; Conversion is "Not available"
  (no visit data).
- **Coupons:** the code can't be changed after creation (orders record it; create a new coupon
  instead); percent is a whole number 1–100; no expiry dates, usage limits, minimum spend or
  per-customer rules — a coupon is just code + percent + active. **The delete-409 only protects
  against orders that RECORDED the code** (`Order.couponCode`, new in Phase 12); orders placed
  before that field existed, or without a coupon, carry none, so their usage can't be detected —
  a coupon first used in such an order can be deleted. Deactivating (`active: false`) is the safe
  retirement path and is enforced at checkout. **Checkout does not re-validate an already-applied
  coupon at order placement** (pre-existing behavior): a coupon applied in the cart, then
  deactivated or deleted by an admin before the customer places the order, still goes through,
  because the applied code and percent live in the persisted checkout draft. Edits are per-browser
  (`nova:coupons:v1`).
- **Admin orders list is not paginated** and sorts newest-first only; unlinked orders are marked
  "No account" (guest checkout, or placed before orders were linked to accounts).
- **Orders (admin) are status-only, and don't touch inventory.** A refund moves no money; there
  are no tracking numbers, notes, bulk updates, date-range filter or customer notifications. Placing
  an order does **not** decrement a product's `inventory`, and cancel/refund doesn't restock it —
  the catalog store and the order store are independent, so the quantities set at Admin → Products
  are never consumed by orders. `placeOrder` creates orders as "confirmed" (timeline
  pending → confirmed), so "pending" is never an at-rest status in this mock.
- **Order detail links to archived products land on "not found".** `OrderDetailPage` links each
  line to `/product/<snapshot slug>`; once that product is archived the storefront no longer
  serves it. (Inferred from `getProductBySlug` returning nothing for archived products, which is
  tested; not tested at page level.) Order data itself is unaffected.
- **Categories:** slugs are fixed at creation; no parent/sub-categories (a nested category would
  show up as a top-level item in the flat storefront rail); hard delete, possible only when no
  product — archived included — belongs to the category; edits are per-browser
  (`nova:categories:v1`); category images are stored but the storefront doesn't display them.
- **Carts are not revalidated against the catalog.** Cart lines carry their own name/price
  snapshot, so an archived (or repriced, or out-of-stock) product already in a cart can still be
  checked out. Pre-existing for price/stock; archiving extends it. Orders likewise snapshot
  name/image/price, so order history is unaffected by catalog edits.
- **Catalog edits are per-browser** (`nova:products:v1`), like every other store here. Product
  rating/review count aren't editable (new products start at 0); changing a product's main image
  drops its gallery; the admin form has no image upload (URL only), bulk actions, or
  variant/configurator editing.
- **Admin area is a demo boundary.** The seeded admin's credentials are public in the repo and stored in plain text in the mock store; the role check (`useAuthGuard({ role })`) is a client-side UX guard that anyone can bypass. Real admin provisioning, hashing and role enforcement are backend work. Every admin section (shell, Dashboard, Customers, Products, Categories, Orders, Coupons, Analytics) is built (see §7). Guest orders and orders placed before `Order.customerId` existed can't be attributed to an account (surfaced, not hidden). The Dashboard's Conversion KPI is unavailable by design (no visit/session tracking, so no honest denominator), and the admin only sees orders/accounts stored in the current browser.
- **Never checked in a real browser** across RTL / mobile / dark. Phase 13 did a static audit
  (physical-direction CSS, hardcoded colours, directional icons, fixed widths, table overflow,
  contrast computed from the tokens) and fixed what it found; correctness otherwise rests on logical
  properties, semantic tokens and responsive classes. This is the largest open risk. Checklist:
  `IMPLEMENTATION_LOG.md`, end of the Phase 13 entry.
- **Phase 13 code arrived from an unattributed source (commit `eb810d9`).** Phase 13 code arrived from an unattributed source and was adopted after static review + local test verification. Static review missed one `tsc` error (see the `ShopPage.tsx` correction); the local compile caught it. Static review is not a substitute for compilation.
- **`ShopPage.tsx` type fix (found by `tsc -b`, not by review).** `src/pages/shop/ShopPage.tsx`, `CategoryNav`: the `categories` prop is typed explicitly as `Category[] | undefined` (`Category` imported from `types/product`). It was originally `ReturnType<typeof useGetCategoriesQuery>["data"]`, which TypeScript could not resolve to a usable element type (`Parameter 'c' implicitly has an 'any' type` where the list is mapped). Keep the explicit type if this file is touched again. A derived `ReturnType<…>["data"]` is fine for a local variable, not for a prop a child maps over. The fix is committed in `089b749` (parent `8c99400`; `8c99400` alone does not pass `tsc -b`). A fresh clone of `089b749` compiles cleanly. If you find the old `ReturnType<…>` type in the file, the fix has been lost and `tsc -b` will fail.
- **Arabic translations are functional but unreviewed by a native speaker.** They live in
  `src/i18n/locales/ar/` (one file per namespace, kept in key-parity with `en/` apart from Arabic's
  extra plural forms). Have a native speaker review them before any real launch; wording, register and
  plural phrasing are the likeliest places for mistakes.
- **Playwright and MSW (MASTER_SPEC §105) are intentionally not installed.** MSW: `queryFn` reads the
  in-repo mock layer directly, which behaves identically for the UI (loading, error, caching, tags,
  invalidation) and keeps the swap-to-a-real-backend surface in `services/api/*` (§8 #1); the only
  loss is that requests don't show in the Network tab. Playwright: behaviour is covered by Vitest +
  Testing Library driving real routing; a browser suite is worth adding together with the first
  real-browser review, since that is the gap it would close — it needs a browser binary and a dev
  server that the build sandboxes used so far did not have.
- **The mock AI's replies are English-only** (`mockAIProvider`, including a literal `$` in its budget
  wording). Everything around them is translated and locale-formatted. A real provider behind
  `AIProvider` would reply in the user's language.
- **Phase 13 left out:** per-page SEO titles and product metadata (only static `index.html` meta
  exists); Framer Motion animations; a performance pass; a mobile bottom navigation bar (§67, a new
  feature); a mobile layout for the admin area (its tables scroll horizontally on a phone — usable,
  not designed for it).
- **Smart filter facet counts cover rating and in-stock only**, not price range — the numeric
  min/max inputs don't map cleanly onto discrete per-option counts the way rating buckets do.
- **Only 2 of 9 mock products have configurator groups** (the Kite laptop, the Nova Forge
  Custom PC) — intentional; MASTER_SPEC's configurator examples are specifically laptop/PC, not
  every category, and every configurable product needs real, sensible option data, not a
  generic scaffold applied everywhere.
- **Feature flags are per-browser localStorage only** — no remote/server-side config source,
  same mock-backend boundary as everything else in this project.
- **The command palette's action list is fixed** (search/cart/wishlist/theme/language/
  assistant) rather than fuzzy-searching site content (products, orders, pages). A reasonable
  v1 scope for "quick actions," not exhaustive command-driven navigation — worth revisiting
  now that Phase 11's assistant exists, since the two features have overlapping "find things
  fast" goals that could reasonably share infrastructure.
- **The mock AI matches by category id, not fine-grained product type.** "Find me a laptop
  under $1000" can surface a mechanical keyboard, since both are `computers` category and the
  keyboard is the only in-budget match — the mock has no separate "laptop vs. peripheral"
  distinction. Documented, not silently accepted: a real NLU/LLM backend behind the same
  `AIProvider` interface (see §8, decision 14) wouldn't have this limitation; fixing it in the
  mock would mean adding a product-type taxonomy the rest of the catalog doesn't otherwise need.
- **The assistant's conversation history persists per-browser only** (localStorage, same
  boundary as every other slice) and is not sent to any real analytics/support system — clearing
  browser storage clears the conversation, same as clearing the cart or wishlist would.
- **The floating assistant and the dedicated page share UI but not "session continuity" beyond
  the shared Redux state** — there's no separate "resume where the panel left off" concept
  needed, since both read the same `assistantSlice`, but worth knowing there's only one
  conversation thread total, not one per surface.

---

## 12. Definition of done for a phase

`MASTER_SPEC.md` §108 is explicit that a phase is **not** complete when the UI merely renders.
It is complete when: UI works + responsive + RTL/LTR + dark/light + loading states + error
states + empty states + accessibility + TypeScript + tests where appropriate + no obvious
console errors. Hold new work to that bar, and update `PROGRESS.md` and `IMPLEMENTATION_LOG.md`
as part of finishing a phase — not as an afterthought.

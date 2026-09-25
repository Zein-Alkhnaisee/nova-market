# HANDOFF.md — NOVA Market

**Last updated:** 2026-09-20, immediately after Phase 11 (AI Shopping Assistant) was completed and verified.

This document is written for a **new AI agent or a different AI tool** picking this project up
cold. It reflects the actual state of the repository at export time, not a plan or an aspiration.

---

## 0. READ THIS FIRST — do not restart or recreate work

This is a large, multi-session project. Eleven of the spec's thirteen phases are already
implemented, tested, and verified. **Do not**:

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
are, inspect the repository, then continue from the next unimplemented phase.

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
  services/assistant/ aiProvider.ts (the AIProvider interface — the AI API abstraction) +
                    mockAIProvider.ts (the mock AI service implementation). This is a
                    sibling of services/api/, not nested inside it, since it's not an
                    RTK Query module itself — assistantApi.ts wraps it.
  components/       ui/ (primitives), common/, layout/ (includes FloatingAssistant),
                    product/ (includes ProductConfigurator, FilterPanel with smart facet
                    counts), checkout/, account/, auth/, navigation/ (includes
                    CommandPalette), assistant/ (ConversationView — shared by the floating
                    panel and the dedicated page — AssistantMessageBubble,
                    AssistantProductCard, AssistantActionButtons, SuggestedPrompts)
  pages/            One folder per route area, including pages/assistant/AssistantPage.tsx.
                    Note: pages/collections/ holds the *editorial* Collections feature;
                    user-created collections live in pages/account/ (MyCollectionsPage,
                    MyCollectionDetailPage) — deliberately separate.
  hooks/            useDebouncedValue, useCheckoutGuard, useAuthGuard, useFeatureFlag,
                    useAssistantConversation (shared by both assistant UIs)
  lib/              cn, delay, persist, pricing, validation, id
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
- **Phase 11 — AI Shopping Assistant**: DONE (most recent). All 9 items from MASTER_SPEC §11:
  a shared `ConversationView` used identically by the floating panel (`FloatingAssistant`,
  hidden on checkout/auth/the assistant page itself) and the dedicated `/assistant` page;
  message bubbles, suggested prompts, compact product recommendation cards; comparison actions
  that reuse the existing `compareSlice`; `mockAIProvider` (rule-based intent matching: greeting,
  budget+category, compare, specs, gift, keyword fallback); and the `AIProvider` interface as
  the required AI-provider abstraction, with `assistantApi` (`POST /assistant/messages`) the
  only thing that knows which implementation is currently wired in.

---

## 7. Current phase and what remains

**Current phase: Phase 11 is complete and verified.** Nothing is mid-flight — the working tree
is in a clean, fully passing state.

**Exact next step:** implement **Phase 12 — Admin**. Read `MASTER_SPEC.md`'s Phase 12 section
for the exact checklist before starting — do not assume anything from earlier phases (e.g.
`OrdersPage`/`OrderDetailPage` from Phase 8, `addressesSlice`, `userCollectionsSlice`) already
constitutes an admin surface; Admin is a distinct, typically staff-facing area of the app (its
own route namespace is already reserved at `/admin/*` as placeholders — check the router). Likely
needs its own auth concept (an admin role, not just "is logged in") — read §9 of this document
(security/data rules) before inventing one, and extend `useAuthGuard`'s pattern rather than
building a parallel guard if a role check is genuinely needed.

**Remaining after that:** Phase 13 (Polish).

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

Current state: **219 tests across 42 files, all passing.** `tsc -b` clean. `oxlint` 0 errors
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
- **`/deals`, `/new-arrivals`, `/trending`** reuse `ShopPage` without route-level badge filtering.
- **No React error boundary component** — a Phase 1 gap carried forward; RTK Query error states
  cover realistic failure paths today.
- **Some i18n namespaces are registered but empty** (e.g. `validation`, `admin`) — fill them as
  their phases are built.
- **Not visually QA'd in a real browser** across RTL/mobile/dark combinations; correctness there
  rests on logical properties, semantic tokens, and responsive classes rather than manual review.
- **Arabic translations are functional but unreviewed by a native speaker.**
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

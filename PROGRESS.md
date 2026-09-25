# PROGRESS.md — NOVA Market

Status legend: `TODO` · `IN_PROGRESS` · `DONE` · `BLOCKED`

Note on phase numbering: earlier sessions used "Phase 1"/"Phase 2" loosely to mean
"the foundation pass" and "the discovery/search/wishlist pass." This file now uses
MASTER_SPEC.md's actual phase numbers (§107) so status is unambiguous. Historical
work has been re-mapped below — nothing was rebuilt, only re-labeled correctly.

## PHASE 1 — FOUNDATION — DONE
Vite + React 19 + TypeScript (strict) + Tailwind v4 design tokens, Redux Toolkit + RTK
Query, i18n (en/ar) + RTL/LTR, light/dark/system theme, AppShell/Header/Footer, mobile
navigation, Not Found page, base UI primitives (Button, Badge, Card, Skeleton,
EmptyState, ErrorState). `tsc -b` clean, `oxlint` 0 errors, `vite build` succeeds.
**Known gap**: no dedicated error boundary component yet (React error boundaries are
class-based — worth adding in a later polish pass; currently RTK Query error states
cover the realistic failure paths).

## PHASE 2 — HOME & DISCOVERY — DONE
| Feature | Status | Notes |
|---|---|---|
| Hero | DONE | |
| Search (entry point) | DONE | Header search trigger + `/` shortcut open the search overlay |
| Trending | DONE | Badge-filtered rail |
| Categories | DONE | Horizontal category rail |
| Recommendations | DONE | "Picked for you" — `getPersonalizedProducts`, derived from wishlist + recently-viewed categories, falls back to trending for new visitors |
| Deals | DONE | Badge-filtered rail |
| Collections | DONE | Curated collections live at `/collections`, linked from nav |
| New arrivals | DONE | Badge-filtered rail |
| Premium picks | DONE | Badge-filtered rail |
| Recently viewed | DONE | `recentlyViewedSlice` (persisted), rail hidden until the person has actually viewed something |
| Footer | DONE | |

## PHASE 7 — CHECKOUT — DONE (this session)
| Feature | Status | Notes |
|---|---|---|
| Shipping step | DONE | `AddressForm` (shared with billing) — inline validation (required fields, postal code format, phone format), `role`/`aria-invalid`/`aria-describedby` wired for errors |
| Delivery step | DONE | 3 options (Standard/Express/Next-day), live per-option shipping price honoring the free-shipping threshold, radiogroup pattern |
| Payment step | DONE | Card number/expiry/CVC/name validation, brand detection (Visa/Mastercard/Amex), **payment boundary enforced**: card data lives only in local component state, is never dispatched to Redux, never persisted to localStorage, and is discarded the instant a masked `{brand, last4}` summary is derived and passed forward via router navigation state — see IMPLEMENTATION_LOG for the full rationale and the test that asserts this |
| Review step | DONE | Line items, editable shipping/delivery/payment summaries (each with an "Edit" link back to that step), coupon input, full price breakdown, "Place order" with loading/error+retry states |
| Order Success page | DONE | Order number, estimated delivery date, price breakdown, "Continue shopping" and "View order" (the latter currently lands on the Phase 8 placeholder — see below) |
| Checkout routing | DONE | `/checkout` redirects to `/checkout/shipping`; all 4 steps + `/order-success/:id` wired to real pages under a dedicated `CheckoutLayout` (logo, step indicator, no full nav/footer — distraction-free per spec) |
| Checkout step-order guard | DONE | `useCheckoutGuard` redirects if the cart is empty or a prior step's prerequisite is missing — checked once per page landing (see IMPLEMENTATION_LOG for why it isn't reactive to every store change) |
| Cart page — pricing breakdown | DONE | Subtotal/discount/shipping-pending-note/tax/total via the shared `OrderSummary` component, coupon input, free-shipping progress messaging |
| Order data + mock backend | DONE | `types/order.ts`, `ordersApi` (`placeOrder`/`getOrders`/`getOrderById`), persisted to localStorage the same way cart/wishlist are |
| Shared pricing logic | DONE | `lib/pricing.ts` — single source of truth used by Cart, Review, and Order Success so the numbers can never drift between screens |

**Known gaps carried into Phase 8**: "View order" on the success page links to `/account/orders/:id`, which is still the Phase 1 placeholder — a real order-detail page is Phase 8 (Account & Orders) work. Billing-address-different-from-shipping is collected as a checkbox but doesn't yet reveal a second address form (documented simplification, not a hidden bug).

## PHASE 3 — CATEGORIES & SHOP — DONE
Shop (`/shop`), category pages (`/shop/:category`), product grid, filters (price,
rating, in-stock), sorting (5 modes), URL-synced filter/sort state, loading skeletons,
empty states with a "clear filters" action.

## PHASE 4 — PRODUCT EXPERIENCE — DONE
| Feature | Status | Notes |
|---|---|---|
| Product detail | DONE | Full rewrite — was a minimal Phase 1 stub |
| Gallery | DONE | `ImageGallery` — main image + accessible thumbnail tablist (`role="tablist"`/`"tab"`), keyboard-operable |
| Variants | DONE | `VariantSelector` — color/size groups, `radiogroup` pattern, per-product mock data (e.g. watch has case + band size, shirt has color + size) |
| Specifications | DONE | Data-driven from `product.specs`, no hardcoded rows |
| Reviews | DONE | `ReviewsSection` — rating breakdown bars, review list, and a working "write a review" form (mock-submitted via `reviewsApi.submitReview`, appears immediately, session-persisted not device-persisted) |
| Quick view | DONE | `QuickViewModal`, opened from the eye icon on any `ProductCard` without navigating away — variant selection, quantity, add to cart |
| Recommendations (related products) | DONE | "You may also like" rail on PDP — `getRelatedProducts`, same-category first, backfilled with other products so the rail is never sparse |
| Product actions | DONE | Quantity stepper, add to cart (respects quantity + selected variant), wishlist toggle, compare toggle |
| Recently viewed recording | DONE | PDP dispatches `recordProductView` on mount (side effect only — local UI state like quantity/variant selection resets via `key={product.id}` remount, not via effect-triggered `setState`, to avoid the cascading-render lint warning) |

## PHASE 5 — SEARCH — DONE
Search page (`/search`), search overlay (accessible combobox pattern, full keyboard
nav), autocomplete (debounced), recent searches (persisted, deduped, capped at 8),
trending searches, URL-synced search/filter/sort state. **Not yet implemented**:
natural-language search architecture (e.g. "waterproof jacket under $100") — current
matching is substring-based on name/brand/category, no query parsing/intent layer.

## PHASE 6 — CART & WISHLIST — DONE
Cart (add/remove/quantity, persisted to localStorage), wishlist (persisted), recently
viewed (persisted, Phase 2 dependency, built this session). **Partially done**: "smart
cart recommendations" — the Home page's personalized rail and the PDP's related-products
rail both exist and are influenced by browsing history, but there isn't yet a
recommendation rail rendered *inside the cart page itself* ("customers who bought X also
bought Y" at checkout time). Worth adding alongside Phase 7 (Checkout).

## PHASE 9 — COMPARISON & COLLECTIONS — DONE (this session)
| Feature | Status | Notes |
|---|---|---|
| Compare | DONE (prior session) | `/compare`, side-by-side spec table, capped at 4, global `CompareBar` |
| Editorial collections | DONE (prior session) | `/collections` + `/collections/:slug` — curated merchandising, unrelated to the feature below |
| Wishlist collections | DONE | `userCollectionsSlice` (persisted) — create, rename, delete; add/remove any product to/from a named collection via `AddToCollectionMenu` on the Wishlist page; membership toggles are idempotent (no duplicate product ids) |
| My Collections (list) | DONE | `/account/collections` — real page, replaced the placeholder. Create form, per-collection item count, visibility toggle, delete with confirmation, empty state |
| Collection detail (owner) | DONE | `/account/collections/:id` — inline rename, remove individual items, delete collection, visibility toggle, copy-to-clipboard share link when public |
| Public/private visibility | DONE | Every collection has an `isPublic` flag, private by default. Toggled from either the list or detail page |
| Public share view | DONE | `/c/:id` — no auth required, read-only, no edit controls. A collection that doesn't exist and a collection that exists but is private render the **identical** not-found state, so the link never reveals whether a private collection exists behind it |

**Kept distinct as required**: `/collections` (editorial, curated by the store) and `/account/collections` (user-created, owned by a signed-in person) share no components, no Redux state, and no i18n keys beyond the parent `collections` namespace being reused for organization — verified there is no code path where one page can render the other's data.

**Known limitation, stated plainly**: this is a frontend-only demo with no backend, so "public" only means "accessible via a link to anyone using this same browser" — the collection data lives in this browser's localStorage, not on a server. A real public-sharing feature needs the collection data to live somewhere reachable by other browsers/devices. The visibility flag, the distinct public route, and the privacy-safe not-found behavior are all implemented exactly as specified; only the "reachable from a different device" part requires a real backend, which is out of scope for every feature in this project, not unique to this one.

## PHASE 8 — ACCOUNT & ORDERS — DONE
| Feature | Status | Notes |
|---|---|---|
| Login | DONE | `/auth/login`, validation, error alert, `?redirect=` support so a guarded page returns you where you were going |
| Register | DONE | `/auth/register`, name/email/password/confirm validation, duplicate-email error from the API |
| Forgot password | DONE | `/auth/forgot-password`, deliberately succeeds regardless of whether the account exists (no account enumeration), with an explicit demo note + link onward since no email is actually sent |
| Reset password | DONE | `/auth/reset-password?token=`, password + confirm validation, success state |
| Logout | DONE | From Settings → Danger zone; clears the persisted session |
| Auth guard | DONE | `useAuthGuard` redirects unauthenticated visitors to login with a redirect param; applied to every `/account/*` page |
| Account shell | DONE | `AccountLayout` — sidebar nav on desktop, horizontal scroll nav on mobile, `NavLink` active states, wrapped in the normal `AppShell` |
| Account overview | DONE | Recent orders (3), saved-items and saved-addresses counters, empty state with a shop CTA |
| Profile | DONE | Edit name/email with validation and a transient saved confirmation |
| Addresses | DONE | List/add/edit/remove/set-default, reuses the checkout `AddressForm`, enforces exactly one default |
| Payment methods | DONE | Add/remove/set-default. **Payment boundary upheld**: the raw card number never leaves local component state — only `{brand, last4, expiry}` is dispatched/persisted |
| Orders list | DONE | `/account/orders` — order number, date, item thumbnails, total, status badge, empty state matching the spec's copy |
| Order detail | DONE | `/account/orders/:id` — items, timeline, shipping address, delivery method, payment summary, price breakdown, and actions (Buy again → re-adds every line to the cart; Cancel order) |
| Order statuses | DONE | All 8 spec statuses typed and translated, with per-status badge tones |
| Cancel order | DONE | `cancelOrder` mutation refuses orders past `processing` — mirrors what a real fulfilment backend enforces rather than letting the UI pretend anything is cancellable |
| Settings | DONE | Theme (light/dark/system), language (en/ar), notification toggles, sign out |
| Mock auth backend | DONE | `authApi` — login/register/forgot/reset as real async mutations with error cases. Heavily commented as the single file to replace with a real auth service |

**Resolved from Phase 7**: the Order Success page's "View order" link now lands on a real order-detail page instead of a placeholder.

**Resolved this session**: `/account/collections` is no longer a placeholder — see Phase 9 above.

## PHASE 10 — SMART FEATURES — DONE (this session)
Read against MASTER_SPEC.md's exact 7-item checklist (§10) rather than assuming Phase 2/4's
existing recommendation rails already satisfied it — they didn't on their own; this phase added
the specific items the spec names.

| Feature | Status | Notes |
|---|---|---|
| Personalized recommendations | DONE (built on existing) | Phase 2's "Picked for you" and Phase 4's "You may also like" rails already existed; this phase is what made them *reasoned* (see next row) rather than just present |
| Recommendation reasons | DONE | `recommendationsApi` now returns `RecommendedProduct[]` (product + `reason: string`) instead of plain `ProductSummary[]`. Reasons are differentiated by why a product is shown — same-category match, price-based alternative, trending fallback, interest match — not a single generic caption. Surfaced via `ProductRail`'s new `showReasons` prop, gated behind the `smartRecommendations` flag |
| Smart filters | DONE | `FilterPanel` accepts an optional `facetBaseProducts` set (everything matching category/search/price, before rating/stock narrow further) and shows a live result count next to each rating bucket and the in-stock toggle; options that would return zero results are disabled rather than silently emptying the page. Wired into both Shop and Search |
| Product configurator | DONE | `ProductConfigurator` component — configurable option groups with live per-option price deltas, matching MASTER_SPEC §32's laptop/PC examples. Two mock products carry real `configuratorGroups` (the Kite laptop: memory/storage/processor; a new "Nova Forge Custom PC": CPU/GPU/RAM/storage/cooling/case). Replaces the plain variant selector on the PDP when present. Gated behind `productConfigurator` |
| Smart cart suggestions | DONE | New `getCartSuggestions` endpoint + a "Complete your order" rail on the Cart page, reasoned as "Complete your setup" when the cart holds a configurable product, "Frequently bought with this item" otherwise. Gated behind `smartRecommendations`. (The cart's existing free-shipping-progress messaging, from Phase 7, already covered that specific example in MASTER_SPEC §24 — not rebuilt) |
| Command/quick actions | DONE | `CommandPalette` — Ctrl/Cmd+K, accessible combobox+listbox pattern, filterable actions (search, cart, wishlist, theme, language, assistant), Escape to close, arrow keys + Enter to navigate/run. Gated behind `commandPalette` |
| Feature flags | DONE | `src/config/features.ts` defines 5 flags (`aiAssistant`, `productComparison`, `smartRecommendations`, `productConfigurator`, `commandPalette`) matching MASTER_SPEC §81's example set exactly. `featureFlagsSlice` persists per-browser overrides. **Flags actually gate behavior, not just exist as a list**: turning off `productComparison` hides the compare button on every `ProductCard`, the `CompareBar`, and the Compare nav link (desktop + mobile) — verified by tests, not just by the toggle existing |
| Cart line configuration handling | DONE | `CartLine` gained an optional `configurationSummary`; `addToCart`/`removeFromCart`/`setQuantity` all key on `(productId, configurationSummary)` so two differently-configured versions of the same product become genuinely separate cart lines — they don't silently merge, and editing one never touches the other |
| Experimental feature toggles (Settings) | DONE | New "Experimental features" section in Settings — a real checkbox per flag, wired to the same `featureFlagsSlice` the rest of the app reads |

## PHASE 11 — AI SHOPPING ASSISTANT — DONE (this session)
All 9 items from MASTER_SPEC §11, cross-checked against §30's fuller spec (data model,
`POST /assistant/messages`, "must not tightly couple to a specific AI provider") rather than
inferred from the phase-list bullets alone.

| Feature | Status | Notes |
|---|---|---|
| Assistant UI | DONE | Shared `ConversationView` (message list, suggested prompts, input, loading/error states) used identically by both surfaces below — one assistant UI architecture, not two |
| Floating assistant | DONE | `FloatingAssistant` — bottom-corner button + expandable compact panel, mounted in `AppShell`. Hidden on `/checkout/*`, `/auth/*`, and `/assistant` itself (no redundant floating button on the dedicated page); gated behind the `aiAssistant` flag |
| Dedicated assistant page | DONE | `/assistant` — was a placeholder, now a real page using the same `ConversationView` in full (non-compact) mode |
| Conversation UI | DONE | User/assistant message bubbles, RTL-aware (`flex-row-reverse` for user messages), auto-scroll to newest message, `aria-live="polite"` "thinking" indicator |
| Suggested prompts | DONE | 4 prompts shown when the conversation is empty, matching MASTER_SPEC's own example phrasing; clicking one sends it immediately |
| Product recommendations | DONE | Assistant responses carry a `products` array rendered as compact horizontally-scrolling cards (`AssistantProductCard`) — a new, deliberately different layout from `ProductCard` since a chat bubble is narrower, not a second product-card architecture |
| Comparison actions | DONE | A "compare X and Y" request returns a `view_comparison` action that adds both products to the **existing** `compareSlice` (via `toggleCompare`, reused verbatim) and navigates to `/compare` |
| Mock AI service | DONE | `mockAIProvider` — rule-based intent matching (greeting, compare, specs/explain, gift, budget+category, keyword fallback) over the real mock catalog, each response carrying a genuine reason/answer, not a canned string |
| AI API abstraction | DONE | `services/assistant/aiProvider.ts` defines the `AIProvider` interface; `assistantApi.ts` (the `POST /assistant/messages` equivalent) depends only on that interface. Swapping `mockAIProvider` for a real LLM integration touches one line, not the UI |
| Assistant conversation persistence | DONE | `assistantSlice`, persisted to localStorage the same way every other slice is, with a "Clear conversation" action |
| Recommendation/compare reuse | DONE | Explicitly did not build parallel recommendation or comparison logic — `AssistantActionButtons` dispatches into `cartSlice`, `compareSlice`, and `wishlistSlice` directly, the same actions Product cards and the Cart page use |

**A real bug found and fixed, not shipped**: the first version of `AssistantActionButtons` rendered "Add to cart" as immediately clickable regardless of whether the product catalog fetch had resolved yet — since `cartSlice.addToCart` needs a full `ProductSummary`, not just an id, clicking before the ~300ms mock-fetch completed silently did nothing. Fixed by disabling that specific button (only that one — `add_to_compare`/`add_to_wishlist`/`view_product`/`search` don't need the fetched list) while `productsLoading` is true, with a dedicated regression test asserting the disabled→enabled transition and that a click after enabling actually reaches the cart.

**Known, honest limitation**: the mock AI matches by category id, not fine-grained product type — asking for "a laptop under $1000" can surface a mechanical keyboard, since both share the `computers` category and the mock has no separate "laptop vs. peripheral" distinction. This is documented, not hidden; a real NLU/LLM backend behind the same `AIProvider` interface wouldn't have this limitation.

## PHASE 12 — ADMIN — TODO
## PHASE 13 — POLISH — TODO

Recommended next: **Phase 12 (Admin)**. Read `MASTER_SPEC.md`'s Phase 12 section for the exact
checklist before starting.

## Testing
Vitest + Testing Library. 219 tests across 42 files:
- Reducers: cart, wishlist, compare, recent searches, recently viewed, checkout draft, auth session, saved addresses, saved payment methods, user collections, feature flags
- Persistence helpers (`lib/persist.ts`)
- `productsApi` filter/sort logic, `reviewsApi` (breakdown computation, submit mutation),
  `recommendationsApi` (related-product category logic, personalized fallback, exclude-list handling),
  `ordersApi` (order creation/pricing embedding, localStorage persistence, retrieval, and an explicit
  assertion that raw card data is never reachable from a stored order)
- Checkout-specific: `lib/pricing.ts` (subtotal/discount/shipping/tax/total math, free-shipping
  threshold), `lib/validation.ts` (postal code/phone/card number/expiry/CVC), `useCheckoutGuard`
  (step-order enforcement across all 4 prerequisite combinations)
- Component/page tests: `ProductCard` interactions, `SearchPage` URL-sync, `ComparePage`
  states, `ProductDetailPage` (gallery/variants/quantity/recently-viewed recording, error state)
- Auth: `authApi` (register, duplicate-email rejection, login, wrong-password/unknown-email
  rejection, case-insensitive email matching, no-account-enumeration on forgot-password, and
  that the returned user object never carries a password field)
- Orders: `cancelOrder` (status transition, timeline append, persistence, unknown-id and
  already-cancelled rejections)
- `lib/id.ts` collision regression test (see IMPLEMENTATION_LOG — ids used to collide)
- `userCollectionsSlice` (create/rename/delete/visibility/membership, id-collision regression,
  independence between collections sharing a product)
- `PublicCollectionPage` (renders a public collection; identical not-found state for both a
  nonexistent id and a private collection — the privacy-preserving behavior is asserted directly)
- `MyCollectionsPage`/`MyCollectionDetailPage` end-to-end through real routing (auth-guard redirect,
  empty state, create flow, visibility toggle revealing the share link, rename)
- Phase 10: `featureFlagsSlice` (defaults, per-flag override, reset, independence between flags),
  `recommendationsApi` reasons (every related/personalized/cart-suggestion product carries a
  non-empty reason, category-match vs. fallback wording differs correctly, cart suggestions
  exclude items already in the cart and reason differently when a configurable product is present),
  cart configured-line handling (7 tests — configured price stored correctly, two different
  configurations of the same product stay as separate lines, identical configurations merge
  quantity, an unconfigured and a configured add of the same product never merge, removing/
  adjusting one configuration never touches a sibling configuration, subtotal sums mixed
  configured/unconfigured lines correctly), `FilterPanel` smart facet counts (counts computed
  correctly, zero-result options disabled, falls back to a plain uncounted panel when no facet
  base is supplied), the `ProductConfigurator` end-to-end on a real PDP (renders configurator
  groups instead of the variant selector, default price, live price update on selection, adds
  the configured price + a readable summary to the cart, a non-configurable product is
  unaffected), `CommandPalette` (open/close via Ctrl+K and Cmd+K, Escape, accessible combobox/
  listbox roles, filtering, no-results state, running an action closes the palette, arrow-key +
  Enter navigation, respects the `commandPalette` flag), Settings' experimental-feature toggles
  (listed and checked by default, unchecking updates the flag, re-checking restores it), and
  feature-flag gating end to end (`productComparison` off hides the `ProductCard` compare
  button and the `CompareBar` even with items selected)
- Phase 11: `mockAIProvider` (13 tests — every intent handler: greeting, budget+category with
  correct in-stock/price/category filtering, honest "nothing found" for an impossible budget,
  compare with 2/1/0 named products, specs lookup, gift-by-category and ungrounded-gift
  fallback, keyword fallback, last-resort search action, response shape validity),
  `assistantSlice` (append order, clear), `assistantApi` (returns a real assistant message,
  never mutates the passed-in history array), `AssistantPage` end-to-end through real routing
  (suggested prompts, sending a typed message, a recommended product's "Add to cart" actually
  reaching `cartSlice`, a comparison action populating `compareSlice` and navigating, clearing
  the conversation), `AssistantActionButtons` (2 tests including the add-to-cart loading-race
  regression described above), and `FloatingAssistant` (visible on ordinary routes, hidden on
  checkout/auth/the assistant page itself, hidden when the `aiAssistant` flag is off, opens and
  closes)
- **End-to-end**: a full `CheckoutFlow` integration test drives the real Shipping → Delivery →
  Payment → Review → Order Success flow through actual routing (not mocked), then asserts the
  cart was cleared and that the raw card number is unreachable from both Redux state and
  localStorage after the order completes; an `AuthPages` test does the same for register →
  authenticated session, validation failures, bad-credential errors, and the account auth guard

## Known issues / deliberate deferrals
- Smart filters only compute counts for rating and in-stock — price range isn't counted/disabled dynamically (the numeric inputs don't lend themselves to discrete option counts the same way).
- Only 2 of 9 mock products have configurator groups (the Kite laptop and the new Nova Forge Custom PC) — intentional, since MASTER_SPEC's configurator examples are specifically laptop/PC, not every product category.
- Feature flags persist per-browser only, same localStorage-based mock-backend boundary as every other piece of state in this project — there's no server-side remote-config system to fetch flags from.
- The command palette's action list is fixed (search/cart/wishlist/theme/language/assistant) rather than fuzzy-searching site content (products, orders, pages) — a reasonable v1 scope for "quick actions," not exhaustive command-driven navigation.
- Notification toggles in Settings are local-only (no backend to persist them to) and are deliberately not written to Redux/localStorage rather than pretending they saved.
- MSW mock service worker still not installed — `queryFn` reads mock data directly, which is behaviorally identical for the UI but won't show requests in the Network tab.
- Cart/wishlist/orders/reviews are not synced to any backend/account — persistence is local-device-only (localStorage), and submitted reviews only last the session (in-memory mock store).
- `/deals`, `/new-arrivals`, `/trending` currently reuse `ShopPage` without badge filtering wired to the route — a UI polish item.
- Search suggestions match on product name/brand and category name only — no fuzzy matching/typo tolerance, and no natural-language parsing (Phase 5 explicitly calls this out as a separate sub-item).
- No dedicated component tests yet for `SearchOverlay` (autocomplete keyboard nav), `ShopPage`, `ReviewsSection` form submission, or `QuickViewModal` — indirectly covered via API-level tests since they share the same underlying logic, but dedicated tests would still be valuable.
- No React error boundary component yet (Phase 1 gap, carried forward).

UNIVERSAL SMART MARKETPLACE
MASTER_SPEC.md — Master Product & Implementation Specification
Document Status: Final Execution Specification
Purpose: This document is the single source of truth for the entire project.
Execution Rule: The AI implementation agent must read and follow this specification before writing code. It must start implementation directly and must not replace this specification with another planning phase.

───

1. PROJECT OVERVIEW
1.1 Product Name
Universal Marketplace
Temporary working name:
NOVA Market
The name can be replaced later without changing the architecture.

───

1.2 Product Concept
Build a premium, modern, intelligent, multi-category e-commerce marketplace that feels like a real technology startup rather than a traditional online store.
The platform should allow users to:
• Discover products
• Search products
• Browse categories
• Filter products dynamically
• Compare products
• Save products
• Create collections
• Receive personalized recommendations
• Build smart carts
• Configure products
• Discover trending products
• Follow curated collections
• Ask an AI shopping assistant for help
• Complete checkout
• Track orders
• Manage their account
• Switch between Arabic and English
• Switch between RTL and LTR automatically
• Switch between Light and Dark themes
The experience must prioritize:
Discovery + Personalization + Intelligence + Comparison + Convenience + Premium UX
This must NOT feel like a generic Shopify-style store.

───

2. PRODUCT VISION
The marketplace should feel like a combination of:
• Premium e-commerce
• Product discovery platform
• Personalized recommendation engine
• Product comparison platform
• AI shopping assistant
• Modern marketplace
• Curated lifestyle platform
The goal is not simply:
"User searches for product → adds product to cart → checks out."
The goal is:
"User enters the platform → discovers interesting products → understands them → compares options → receives intelligent recommendations → builds a personalized collection/cart → purchases confidently."

───

3. TARGET USERS
3.1 Casual Shopper
Wants to discover products without knowing exactly what they want.
Needs:
• Trending products
• Curated collections
• Recommendations
• Categories
• Visual discovery

───

3.2 Intent-Based Shopper
Already knows approximately what they need.
Needs:
• Powerful search
• Filters
• Sorting
• Product comparison
• Detailed product information

───

3.3 Research-Oriented Shopper
Wants to compare several products before purchasing.
Needs:
• Compare
• Specifications
• Pros/cons
• Ratings
• Reviews
• AI comparison

───

3.4 Deal Hunter
Looks for good prices and promotions.
Needs:
• Flash deals
• Discounts
• Price comparison
• Deal collections
• Limited-time offers

───

3.5 Premium Shopper
Cares about quality, design, brand, and experience.
Needs:
• Premium products
• Curated collections
• High-quality imagery
• Detailed product pages
• Sophisticated interface

───

4. PRODUCT CATEGORIES
The marketplace must support a large category system.
Initial categories:
Electronics
• Smartphones
• Tablets
• Laptops
• Monitors
• TVs
• Cameras
• Headphones
• Speakers
• Smart Devices
• Accessories
Computers
• Laptops
• Desktops
• Gaming PCs
• Components
• GPUs
• CPUs
• RAM
• Storage
• Keyboards
• Mice
• Accessories
Gaming
• Consoles
• Games
• Controllers
• Gaming Headsets
• Gaming Chairs
• Gaming Accessories
Fashion
• Men
• Women
• Clothing
• Shoes
• Bags
• Accessories
Watches & Jewelry
• Watches
• Smart Watches
• Jewelry
• Rings
• Necklaces
• Bracelets
Beauty
• Skincare
• Haircare
• Makeup
• Fragrance
• Personal Care
Home
• Furniture
• Decor
• Lighting
• Kitchen
• Storage
• Smart Home
Sports & Fitness
• Fitness Equipment
• Running
• Outdoor
• Cycling
• Training
• Sportswear
Books & Education
• Books
• Stationery
• Educational Products
• Courses/learning accessories
Toys & Kids
• Toys
• Games
• Baby
• Kids
• Educational Toys
Automotive
• Car Accessories
• Tools
• Electronics
• Maintenance
Office
• Desks
• Chairs
• Stationery
• Office Electronics
• Accessories
Travel
• Luggage
• Backpacks
• Travel Accessories
• Outdoor Equipment
Pets
• Pet Food
• Toys
• Accessories
• Care
Lifestyle
• Gifts
• Gadgets
• Everyday Products
• Premium Picks
The category architecture must be extensible.
Do NOT hard-code category-specific UI into the entire application.

───

5. CORE UX PRINCIPLES
The entire application must follow these principles:
5.1 Discovery First
The homepage should encourage exploration.

───

5.2 Intelligence Everywhere
Where appropriate, use:
• Recommendations
• Smart search
• AI explanations
• Product comparison
• Personalized content

───

5.3 Minimal Cognitive Load
Do not overload users with information.
Use:
• Progressive disclosure
• Tabs
• Accordions
• Clear hierarchy
• Smart defaults

───

5.4 Premium Visual Hierarchy
Use:
• Large product imagery
• Strong typography
• Generous spacing
• Clean cards
• Controlled motion
• Consistent design tokens

───

5.5 Every Interaction Needs Feedback
Examples:
Add to cart:
• Button loading
• Success state
• Cart count update
• Toast/confirmation
Wishlist:
• Icon animation
• State change
• Accessible label
API failure:
• Clear error
• Retry action

───

6. VISUAL DIRECTION
The design language should be:
• Premium
• Futuristic
• Minimal
• Clean
• Editorial
• Technology-oriented
• Modern
• Confident
Avoid:
• Cheap-looking gradients everywhere
• Excessive shadows
• Excessive rounded cards
• Generic Bootstrap appearance
• Random colors
• Visual clutter
• Excessive animations

───

7. DESIGN SYSTEM
Create a centralized design system.
7.1 Typography
Use a modern sans-serif font system.
The typography must support:
• English
• Arabic
• Numbers
• Product specifications
Arabic typography must remain visually balanced with English.

───

7.2 Color System
Use semantic tokens instead of hardcoded colors.
Example:
text
background
foreground
surface
surface-muted
border
primary
primary-foreground
secondary
muted
success
warning
danger
info
accent

The exact values must live in the theme/design-token layer.
Components must never randomly define their own colors.

───

7.3 Radius
Use a controlled radius scale:
text
sm
md
lg
xl
2xl
full


───

7.4 Spacing
Use a consistent spacing scale.
Do not use arbitrary spacing values throughout components.

───

7.5 Shadows
Create semantic shadow levels:
text
none
sm
md
lg
xl


───

8. THEMING
The application must support:
• Light
• Dark
• System
Theme preference must persist.
Theme switching must not reload the page.
All components must support both themes.
Do not create components that only work visually in Light Mode.

───

9. INTERNATIONALIZATION
Languages:
• English
• Arabic
Use:
• React
• TypeScript
• i18next
• react-i18next

───

9.1 RTL/LTR
Arabic:
text
dir="rtl"

English:
text
dir="ltr"

Direction must be applied globally.
The interface must not rely on:
css
left
right

where logical properties can be used.
Prefer:
css
margin-inline
padding-inline
inset-inline
border-inline


───

9.2 Translation Structure
Use namespaces such as:
text
common
navigation
home
shop
product
cart
checkout
account
orders
search
compare
wishlist
collections
assistant
auth
errors
validation
admin

Never hard-code user-facing text inside components.

───

10. RESPONSIVE DESIGN
The platform must be:
Mobile-first.
Support:
• Mobile
• Tablet
• Laptop
• Desktop
• Large desktop
The experience must not simply shrink the desktop version.
Mobile may require different:
• Navigation
• Filter interaction
• Product layout
• Cart interaction
• Checkout layout
• Search UI

───

11. APPLICATION ROUTES
Create a clear routing architecture.
Public Routes
text
/
 /shop
 /shop/:category
 /product/:slug
 /search
 /compare
 /collections
 /collections/:slug
 /deals
 /new-arrivals
 /trending


───

Authentication
text
/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password


───

User
text
/account
/account/profile
/account/addresses
/account/payment-methods
/account/orders
/account/orders/:id
/account/wishlist
/account/collections
/account/settings


───

Checkout
text
/cart
/checkout
/checkout/shipping
/checkout/payment
/checkout/review
/order-success/:id


───

AI
text
/assistant


───

Admin
text
/admin
/admin/products
/admin/products/new
/admin/products/:id
/admin/orders
/admin/customers
/admin/categories
/admin/coupons
/admin/analytics


───

12. GLOBAL APPLICATION SHELL
Every normal public page should use:
text
AppShell
 ├── AnnouncementBar
 ├── Header
 ├── MainContent
 ├── Global overlays
 └── Footer


───

13. HEADER
The header is one of the most important components.
Desktop:
text
Logo
Categories
Search
AI Assistant
Wishlist
Cart
Account
Language
Theme

Search should be visually prominent.

───

Header behavior
When scrolling:
• Header may become sticky
• Background may become slightly translucent
• Avoid excessive animation

───

14. SEARCH EXPERIENCE
Search is a major product feature.
The search system must support:
Standard Search
Examples:
text
iphone
gaming laptop
running shoes
wireless headphones

Autocomplete
Show:
• Products
• Categories
• Brands
• Recent searches
• Trending searches

───

Natural Language Search
Support queries such as:
text
I need a laptop for programming under $1200

or:
text
Show me wireless headphones with good battery life

or:
text
I need a gift for someone who loves gaming

The frontend should convert the natural-language intent into structured search parameters.
Example:
ts
interface SearchIntent {
  query: string;
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  attributes?: Record<string, string[]>;
  sort?: string;
}

Initially this can use mocked AI responses.
The architecture must be ready for a real AI API later.

───

15. HOME PAGE
Homepage sections, in order:
15.1 Announcement Bar
Examples:
• Free shipping
• New arrivals
• Seasonal campaign

───

15.2 Hero
Large editorial hero section.
Contains:
• Headline
• Short description
• Primary CTA
• Secondary CTA
• Premium product imagery
• Optional visual interaction
Example concept:
Discover what fits your world.

───

15.3 AI Shopping Assistant
Prominent interactive section.
Example:
Not sure what to buy?
CTA:
Ask the Shopping Assistant

───

15.4 Trending Now
Horizontal/scrollable product discovery.
Show:
• Product
• Price
• Rating
• Discount
• Wishlist
• Quick add

───

15.5 Personalized For You
If logged in:
text
Recommended for you

If not logged in:
text
Popular picks


───

15.6 Category Explorer
Large visual category navigation.
Use different visual treatment from normal cards.

───

15.7 Flash Deals
Show:
• Discount
• Countdown
• Progress indicator
• Product cards
Countdown must be based on actual timestamps rather than fake intervals.

───

15.8 Curated Collections
Examples:
text
Work From Anywhere
Gaming Essentials
Minimal Home
Tech Under $100
Weekend Adventure
Gift Ideas

Collections should feel editorial.

───

15.9 New Arrivals
Product grid.

───

15.10 Premium Picks
A visually distinct premium section.

───

15.11 Recently Viewed
Only show if data exists.

───

15.12 Newsletter
Simple premium subscription section.

───

15.13 Footer
Include:
• Shop
• Categories
• Help
• Company
• Account
• Social
• Legal
• Language
• Theme

───

16. SHOP PAGE
The shop page must be highly reusable.
Layout:
text
Breadcrumb
Page title
Description
Result count
Sort
Filter button
Active filters
Product grid
Pagination / infinite loading


───

17. DYNAMIC FILTER SYSTEM
Filters must adapt to category.
Global filters:
• Price
• Rating
• Availability
• Brand
• Discount
Electronics may add:
• RAM
• Storage
• Screen size
• Processor
• Operating system
Fashion may add:
• Size
• Color
• Material
• Gender
Shoes may add:
• Size
• Color
• Sport
• Material
Home may add:
• Material
• Dimensions
• Style
• Room
The filter system must use a configuration-driven architecture.
Example:
ts
interface FilterDefinition {
  id: string;
  label: string;
  type: "checkbox" | "range" | "select" | "rating";
  options?: FilterOption[];
}


───

18. PRODUCT CARD
Create one highly reusable ProductCard.
Must support variants:
text
default
compact
horizontal
featured
wishlist
compare

Information:
• Image
• Brand
• Product name
• Rating
• Review count
• Current price
• Original price
• Discount
• Badge
• Wishlist
• Compare
• Add to cart
Do not overload the card.

───

19. PRODUCT QUICK VIEW
Quick View opens without leaving the current page.
Show:
• Product image
• Name
• Price
• Rating
• Variants
• Short description
• Availability
• Add to cart
• View details
Use modal/drawer depending on device.

───

20. PRODUCT DETAIL PAGE
The product page is a major experience.
Desktop:
text
Gallery | Product Information

Information:
• Brand
• Product title
• Rating
• Reviews
• Price
• Discount
• Financing/installment placeholder if supported
• Availability
• Variant selectors
• Quantity
• Add to cart
• Buy now
• Wishlist
• Compare

───

Product Information Tabs
text
Overview
Specifications
Features
Reviews
Shipping
Returns


───

Product Recommendations
Show:
text
You may also like
Frequently bought together
Similar products
Better alternatives


───

Product Comparison CTA
Prominent option:
Compare this product

───

21. PRODUCT COMPARISON
Users can compare multiple products.
Maximum recommended comparison:
text
4 products

Comparison table:
text
Product
Price
Rating
Brand
Specifications
Features
Availability
Pros
Cons

Highlight meaningful differences.

───

22. WISHLIST
Wishlist should not be a basic product list.
Support:
• Save product
• Remove product
• Move to cart
• Add to collection
• Compare
• Share

───

23. COLLECTIONS
Users can create collections.
Examples:
text
My Dream Setup
Gift Ideas
Future Purchases
Home Upgrade
Travel Gear

Collection model:
ts
interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  productIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}


───

24. SMART CART
The cart must provide more than line items.
Show:
• Items
• Quantity
• Price
• Savings
• Delivery estimate
• Coupon
• Subtotal
• Shipping
• Tax
• Total
Also show:
Smart Recommendations
Examples:
Complete your setup
Frequently bought with this item
You are $20 away from free shipping

───

Cart states
Must support:
• Empty
• Loading
• Populated
• Updating
• Error
• Checkout disabled
• Out of stock

───

25. CHECKOUT
Checkout should be clean and distraction-free.
Steps:
text
1. Shipping
2. Delivery
3. Payment
4. Review
5. Confirmation

Do not show unnecessary navigation.

───

26. ORDER SUCCESS
After successful checkout:
Show:
• Success state
• Order number
• Estimated delivery
• Summary
• Continue shopping
• View order

───

27. ACCOUNT
Account dashboard:
text
Overview
Orders
Wishlist
Collections
Addresses
Payment methods
Profile
Settings


───

28. ORDERS
Order list:
text
Order number
Date
Items
Total
Status

Order detail:
text
Items
Payment
Shipping
Timeline
Address
Total
Actions

Order status:
text
Pending
Confirmed
Processing
Shipped
Out for delivery
Delivered
Cancelled
Refunded


───

29. AUTHENTICATION
Support:
• Login
• Register
• Logout
• Forgot password
• Reset password
Authentication must be architected so that the mock implementation can later be replaced by a real backend.
Never fake successful payment/authentication in a way that implies production security.

───

30. AI SHOPPING ASSISTANT
This is one of the project's signature features.
The assistant should help users:
• Find products
• Compare products
• Explain specifications
• Recommend products
• Find gifts
• Build shopping lists
• Understand differences
• Refine searches
Example:
User:
I need a laptop for university and programming.
Assistant can respond with structured recommendations.

───

Assistant UI
Desktop:
• Floating assistant button
• Expandable panel
Dedicated page:
text
Conversation
Suggested prompts
Product recommendations
Comparison cards
Actions


───

Suggested prompts
text
Find me a laptop under $1000

text
Compare these headphones

text
What should I buy for a home office?

text
Find a gift for a gamer


───

AI Architecture
Frontend interface:
ts
interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  products?: Product[];
  actions?: AssistantAction[];
}

The frontend must not tightly couple itself to a specific AI provider.

───

31. RECOMMENDATION ENGINE
Create a recommendation abstraction.
Possible recommendation types:
text
personalized
trending
similar
frequently_bought
recently_viewed
best_value
premium
alternative

Frontend should consume:
ts
interface Recommendation {
  type: RecommendationType;
  products: Product[];
  reason?: string;
}


───

32. PRODUCT CONFIGURATOR
For supported products, allow configuration.
Examples:
Laptop:
text
RAM
Storage
Processor
Color

PC:
text
CPU
GPU
RAM
Storage
Cooling
Case

The architecture should allow configurable option groups.

───

33. DATA MODELS
Core Product:
ts
interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;

  brand: Brand;

  category: Category;
  subcategory?: Category;

  images: ProductImage[];

  price: number;
  compareAtPrice?: number;
  currency: string;

  rating: number;
  reviewCount: number;

  inventory: number;

  badges?: ProductBadge[];

  variants?: ProductVariant[];

  attributes: Record<
    string,
    string | number | boolean | string[]
  >;

  tags: string[];

  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;

  createdAt: string;
  updatedAt: string;
}


───

34. CART MODEL
ts
interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
}


───

35. USER MODEL
ts
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "customer" | "admin";
  preferences: UserPreferences;
}


───

36. STATE MANAGEMENT
Use:
Redux Toolkit
and:
RTK Query

───

Redux should handle client/global state such as:
• Auth session metadata
• UI state
• Theme
• Language
• Compare list
• Wishlist local state when necessary
• Assistant UI state
• Filters when globally needed
• Recently viewed
Do NOT put every piece of component state in Redux.

───

Local component state
Use React state for:
• Modal visibility
• Input state
• Temporary UI state
• Local tabs
• Dropdown state

───

Server state
Use RTK Query for:
• Products
• Categories
• Users
• Orders
• Cart
• Reviews
• Recommendations
• Search results
• Collections

───

37. RTK QUERY ARCHITECTURE
Create an API layer.
Suggested structure:
text
services/
  api/
    baseApi.ts
    productsApi.ts
    categoriesApi.ts
    cartApi.ts
    ordersApi.ts
    usersApi.ts
    reviewsApi.ts
    searchApi.ts
    recommendationsApi.ts
    collectionsApi.ts
    assistantApi.ts

Use a shared baseApi.

───

RTK Query Requirements
Use:
• Queries
• Mutations
• Tags
• Cache invalidation
• Polling only where justified
• Optimistic updates where appropriate
• Loading states
• Error states
Examples of tags:
text
Product
Products
Cart
Wishlist
Collection
Order
Review
User


───

38. MOCK BACKEND
Initial project must work without a real backend.
Use a mock API architecture.
Recommended:
MSW — Mock Service Worker
The frontend should behave as if it is communicating with a real backend.
Do not scatter fake data directly inside components.
Use:
text
mocks/
  handlers/
  data/
  fixtures/


───

39. API CONTRACTS
Design API contracts as if a real backend exists.
Examples:
text
GET /products
GET /products/:id
GET /categories
GET /categories/:id/products
GET /search
GET /recommendations
GET /cart
POST /cart/items
PATCH /cart/items/:id
DELETE /cart/items/:id
GET /wishlist
POST /wishlist
DELETE /wishlist/:productId
GET /orders
GET /orders/:id
POST /checkout
POST /assistant/messages

The exact backend technology is intentionally independent.

───

40. FEATURE-BASED ARCHITECTURE
Do NOT organize the entire project only by file type.
Use feature-based architecture.
Recommended:
text
src/
│
├── app/
│   ├── store/
│   ├── router/
│   ├── providers/
│   └── config/
│
├── features/
│   ├── auth/
│   ├── products/
│   ├── categories/
│   ├── search/
│   ├── cart/
│   ├── wishlist/
│   ├── collections/
│   ├── compare/
│   ├── checkout/
│   ├── orders/
│   ├── reviews/
│   ├── recommendations/
│   ├── assistant/
│   └── account/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── product/
│   ├── navigation/
│   └── common/
│
├── pages/
│
├── services/
│
├── hooks/
│
├── lib/
│
├── types/
│
├── constants/
│
├── i18n/
│
├── styles/
│
├── mocks/
│
└── assets/


───

41. UI COMPONENT SYSTEM
Build reusable primitives.
Required components:
text
Button
IconButton
Input
SearchInput
Select
Checkbox
Radio
Switch
Slider
Badge
Card
Dialog
Drawer
Sheet
Dropdown
Tooltip
Tabs
Accordion
Toast
Alert
Breadcrumb
Pagination
Skeleton
Spinner
Avatar
Separator
Progress


───

42. PRODUCT COMPONENTS
Create:
text
ProductCard
ProductGrid
ProductList
ProductGallery
ProductPrice
ProductRating
ProductBadge
ProductActions
ProductVariantSelector
ProductSpecifications
ProductReviews
ProductQuickView
ProductCompareCard
ProductRecommendationRow


───

43. LAYOUT COMPONENTS
Create:
text
AppShell
Header
MobileHeader
Footer
Sidebar
PageContainer
Section
Container
ResponsiveGrid


───

44. STATE DESIGN
Every important feature must have all necessary states.
Generic states
text
idle
loading
success
empty
error
disabled
offline
unauthorized

Do not build only the happy path.

───

45. LOADING UX
Use skeletons instead of blank screens.
Examples:
text
ProductCardSkeleton
ProductPageSkeleton
SearchSkeleton
OrderSkeleton
AccountSkeleton

Avoid showing large generic spinners for entire pages unless necessary.

───

46. ERROR UX
Errors must be human-readable.
Example:
text
Something went wrong.

We couldn't load these products right now.

[Try again]

Never expose raw API errors directly to users.

───

47. EMPTY STATES
Every empty feature must have a designed empty state.
Examples:
Wishlist:
Your wishlist is waiting for its first favorite.
Cart:
Your cart is empty.
Search:
No products match your search.
Collections:
Create your first collection.
Orders:
You haven't placed any orders yet.

───

48. ACCESSIBILITY
Target:
WCAG 2.2 AA principles.
Requirements:
• Keyboard navigation
• Visible focus
• Proper labels
• Semantic HTML
• ARIA only when needed
• Screen-reader friendly controls
• Sufficient contrast
• Reduced motion support
• Accessible dialogs
• Accessible dropdowns
• Accessible forms
Never rely only on color to communicate status.

───

49. ANIMATION SYSTEM
Use:
Motion / Framer Motion
Animation principles:
• Fast
• Subtle
• Purposeful
Use animation for:
• Page transitions
• Modal appearance
• Product card interactions
• Wishlist feedback
• Cart feedback
• Tabs
• Navigation
• Assistant panel
Avoid:
• Constant floating animations
• Excessive parallax
• Slow transitions
• Animation on every element
Respect:
text
prefers-reduced-motion


───

50. PERFORMANCE
The application must be performance-conscious.
Use:
• Lazy-loaded routes
• Code splitting
• Optimized images
• Responsive image sizes
• Memoization only where useful
• RTK Query caching
• Virtualization for very large lists when necessary
• Avoid unnecessary re-renders
• Avoid massive component files
• Avoid importing huge libraries unnecessarily

───

51. IMAGE STRATEGY
Product images must support:
text
thumbnail
card
gallery
zoom

Use responsive image loading.
All images require meaningful alt text.
Decorative images should use appropriate empty alt attributes.

───

52. SEO
For public pages provide:
• Page title
• Meta description
• Canonical strategy
• Open Graph metadata
• Product metadata where appropriate
Create reusable metadata utilities.

───

53. FORM SYSTEM
Use:
React Hook Form
and:
Zod
for validation.
Forms must provide:
• Validation
• Error messages
• Loading
• Success
• Disabled state
• Accessible labels

───

54. NOTIFICATIONS
Create a centralized notification/toast system.
Use for:
• Added to cart
• Removed from wishlist
• Collection created
• Order successful
• Error
• Copy success
• Authentication events
Notifications must not be the only way important information is communicated.

───

55. OFFLINE / NETWORK STATES
The frontend should gracefully handle network failures.
Display:
text
You're offline.

Some features may be unavailable until your connection returns.

Cached content should remain usable where practical.

───

56. ADMIN DASHBOARD
The project must include a basic but polished admin area.
Dashboard:
text
Revenue
Orders
Customers
Products
Conversion
Top Products
Recent Orders


───

Product management
Support:
• Product list
• Search
• Filters
• Create
• Edit
• Delete
• Inventory
• Pricing

───

Orders
Support:
• Order list
• Status
• Customer
• Total
• Date
• Details

───

57. ADMIN DESIGN
Admin should reuse the design system but may have a more information-dense layout.
Do not build an unrelated visual system.

───

58. SECURITY PRINCIPLES
Frontend must:
• Never expose secrets
• Never put API private keys in client code
• Avoid storing sensitive credentials in localStorage when secure cookies are appropriate
• Validate input
• Sanitize rendered external content
• Never trust frontend authorization alone
• Treat payment APIs as backend responsibilities

───

59. TESTING
Use:
• Vitest
• React Testing Library
• Playwright
Test important flows:
Authentication
text
Login
Register
Logout

Shopping
text
Search
Filter
Product details
Add to cart
Wishlist
Compare

Checkout
text
Cart
Shipping
Payment
Review
Success

Localization
text
English
Arabic
LTR
RTL

Theme
text
Light
Dark


───

60. CODE QUALITY
Use:
• TypeScript strict mode
• ESLint
• Prettier
Avoid:
text
any

unless there is a documented reason.
Avoid giant components.
A component should have one clear responsibility.

───

61. TYPESCRIPT RULES
Prefer strong domain types.
Avoid:
ts
const data: any

Prefer:
ts
interface Product {}
type ProductStatus = ...

Use shared types for API contracts.

───

62. COMPONENT RULES
Components must:
• Be reusable
• Be accessible
• Have clear props
• Avoid hidden global dependencies
• Avoid business logic when presentation-only
• Avoid duplicated UI
Business logic should live in:
• hooks
• services
• feature modules
• utilities

───

63. URL STATE
Search/filter state should be reflected in URL where appropriate.
Example:
text
/shop/laptops?brand=apple&ram=16gb&sort=price-asc

This allows:
• Sharing
• Refreshing
• Browser navigation
• SEO-friendly URLs where relevant

───

64. SEARCH URL
Example:
text
/search?q=gaming+laptop

Natural language search can also produce:
text
/search?q=laptop&budget=1200&purpose=programming


───

65. COMPARE URL
Example:
text
/compare?products=product-1,product-2,product-3


───

66. USER EXPERIENCE DETAILS
Use breadcrumbs on:
• Shop
• Category
• Product
• Collections
• Account
• Orders

───

67. MOBILE NAVIGATION
Mobile navigation should include:
text
Home
Shop
Search
Wishlist
Cart
Account

Use a bottom navigation bar when appropriate.
The bottom navigation must not obscure content.

───

68. MOBILE FILTERS
On mobile:
• Filters open in a bottom sheet/drawer
• Sticky filter/sort controls where useful
• Active filters visible
• Clear all action

───

69. MOBILE PRODUCT PAGE
Product page should prioritize:
1. Gallery
2. Product name
3. Rating
4. Price
5. Variants
6. Add to cart
7. Buy now
8. Details
9. Reviews
10. Recommendations
Use sticky purchase CTA when appropriate.

───

70. DESIGN CONSISTENCY
Every page must feel like part of the same product.
Do not let individual pages develop their own unrelated styles.

───

71. CONTENT STRATEGY
Use realistic mock product content.
Do NOT fill the application with:
text
Product 1
Product 2
Lorem ipsum
Test product

Use realistic:
• Names
• Prices
• Brands
• Categories
• Descriptions
• Specifications
• Ratings
• Reviews

───

72. MOCK DATA
Generate enough data to demonstrate the marketplace.
Minimum target:
text
100+ products
15+ categories
20+ brands
multiple collections
multiple reviews
multiple orders

Products should cover different category structures.

───

73. PRODUCT ATTRIBUTE SYSTEM
Use flexible attributes.
Example:
ts
attributes: {
  storage: "512GB",
  ram: "16GB",
  processor: "M-series",
  screenSize: "14-inch"
}

Different categories can define different attributes.
The UI must render attributes dynamically where possible.

───

74. BRAND SYSTEM
Brand model:
ts
interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

Brand pages can later be added without redesigning the data layer.

───

75. REVIEWS
Review model:
ts
interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

Display:
• Average rating
• Rating distribution
• Review count
• Verified purchase
• Review cards

───

76. PERSONALIZATION
Initially simulate personalization using mock data.
Examples:
text
Because you viewed...
Based on your interests...
Popular in your category...
You may also like...

Architecture must allow real recommendation services later.

───

77. RECENTLY VIEWED
Track recently viewed products.
Requirements:
• Persist locally
• Maximum reasonable number
• Remove duplicates
• Most recent first

───

78. COMPARE LIMIT
Default:
text
Maximum 4 products

When limit is reached:
Show clear feedback.

───

79. CART PERSISTENCE
For guests:
• Persist cart locally.
For authenticated users:
• Sync with backend.
Architecture should allow merging guest cart with account cart after login.

───

80. WISHLIST PERSISTENCE
Guest:
• Local persistence.
Authenticated:
• Backend persistence.

───

81. FEATURE FLAGS
Create a lightweight feature flag mechanism.
Example:
ts
features.aiAssistant
features.productComparison
features.smartRecommendations
features.productConfigurator

This allows experimental features to be enabled/disabled.

───

82. CONFIGURATION
Centralize configuration.
Example:
text
config/
  app
  api
  features
  theme

Do not scatter environment-dependent values throughout the codebase.

───

83. ERROR BOUNDARIES
Implement React Error Boundaries for major application areas.
A catastrophic component error must not necessarily destroy the entire application experience.

───

84. NOT FOUND PAGE
Create a polished 404 page.
It should include:
• Illustration/visual
• Message
• Back button
• Home CTA
• Search CTA

───

85. GLOBAL SEARCH EXPERIENCE
Search overlay should include:
text
Search input

Recent searches
Trending searches

Categories
Suggested products

View all results

Keyboard-friendly:
text
Arrow Up
Arrow Down
Enter
Escape


───

86. COMMAND/QUICK ACTION EXPERIENCE
Where useful, implement a command-style interaction.
Examples:
text
Search products
Open cart
Open wishlist
Switch theme
Switch language
Open assistant

This can be introduced after the core experience is stable.

───

87. PRODUCT DISCOVERY
Create discovery modules:
text
Trending
New arrivals
Deals
Recommended
Premium
Editor's picks
Popular
Recently viewed
Similar products

These must share reusable components.

───

88. EDITORIAL COLLECTIONS
Collections should have:
• Cover image
• Title
• Description
• Product count
• Product grid
• Curated ordering
This is important to make the platform feel more like a discovery product than a basic store.

───

89. SMART RECOMMENDATION REASONS
Whenever reasonable, recommendations can explain why.
Examples:
text
Popular with laptop shoppers

text
Matches your recent interests

text
Great alternative at a lower price

This improves trust.

───

90. PRICE PRESENTATION
Prices must be consistently formatted using locale-aware formatting.
Use Intl.NumberFormat.
Never manually concatenate currency symbols throughout the application.

───

91. DATE/TIME
Use locale-aware formatting.
Arabic should display appropriately when Arabic is active.

───

92. DESIGN TOKENS
Create tokens for:
text
colors
typography
spacing
radius
shadows
breakpoints
z-index
motion

Components should consume tokens rather than hard-coded design values.

───

93. Z-INDEX SYSTEM
Define a controlled hierarchy.
Example:
text
base
sticky
dropdown
header
overlay
modal
toast

Do not randomly use:
text
z-index: 99999


───

94. RESPONSIVE GRID
Create reusable product grid behavior.
Example concept:
text
Mobile: 2 columns
Small tablet: 2–3
Tablet: 3
Desktop: 4
Large desktop: 5

The exact number can adapt based on product card minimum width.

───

95. PRODUCT IMAGE UX
Desktop:
• Thumbnail gallery
• Main image
• Zoom
Mobile:
• Swipe gallery
• Pagination indicators
• Fullscreen viewer

───

96. CHECKOUT VALIDATION
Shipping form:
text
First name
Last name
Country
City
Address
Postal code
Phone

Use Zod validation.
Payment should be represented as a secure integration boundary.
Do not implement fake credit-card processing logic as if it were secure production payment infrastructure.

───

97. ADMIN AUTHORIZATION
Admin routes must be protected by role.
Frontend route protection is UX only.
Actual authorization must be enforced by backend when connected.

───

98. ARCHITECTURAL BOUNDARIES
Keep these boundaries clear:
text
UI
↓
Feature logic
↓
API/services
↓
Backend

Do not allow components to directly perform random fetch requests everywhere.
RTK Query is the primary server-state interface.

───

99. FETCHING RULE
Avoid:
ts
fetch(...)

inside arbitrary components.
Use the API service layer.

───

100. API ERROR NORMALIZATION
Normalize API errors into a consistent frontend shape.
Example:
ts
interface AppError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}


───

101. USER FEEDBACK
Important actions must always communicate state.
Examples:
text
Adding...
Added
Saving...
Saved
Removing...
Removed
Loading...
Retry


───

102. ACCESSIBILITY + RTL TESTING
Test:
• Keyboard navigation
• Focus order
• Screen readers
• Arabic layout
• RTL icons
• Directional controls
• Forms
• Dialogs
• Mobile
Icons that imply direction must adapt for RTL.

───

103. ICON SYSTEM
Use:
Lucide Icons
Icons should be:
• Consistent
• Accessible
• Appropriately sized
• Never used without meaning
Icon-only buttons require accessible labels.

───

104. UI LIBRARY
Use:
shadcn/ui
as a foundation for accessible primitives where appropriate.
Do not make the application look like an untouched shadcn demo.
Customize the design system significantly.

───

105. CORE TECHNOLOGY STACK
Required:
text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Redux Toolkit
RTK Query
React Router
i18next
react-i18next
Motion / Framer Motion
React Hook Form
Zod
Lucide React
MSW
Vitest
React Testing Library
Playwright


───

106. DEVELOPMENT PRINCIPLES
The implementation must be:
• Production-quality
• Modular
• Scalable
• Type-safe
• Accessible
• Responsive
• Testable
• Maintainable
Do not optimize prematurely.
Do not create abstractions that have no real purpose.

───

107. IMPLEMENTATION PHASES
The project must be implemented in this order.

───

PHASE 1 — FOUNDATION
Implement:
• Vite
• React
• TypeScript
• Tailwind
• shadcn/ui
• Routing
• Redux
• RTK Query
• i18n
• Theme
• RTL/LTR
• Design tokens
• Global styles
• AppShell
• Header
• Footer
• Mobile navigation
• Error boundary
• Not found page
• Base components
At the end of Phase 1:
The application must already have a polished shell and design system.

───

PHASE 2 — HOME & DISCOVERY
Implement:
• Hero
• Search
• Trending
• Categories
• Recommendations
• Deals
• Collections
• New arrivals
• Premium picks
• Recently viewed
• Footer

───

PHASE 3 — CATEGORIES & SHOP
Implement:
• Shop
• Category pages
• Product grid
• Filters
• Sorting
• URL filters
• Pagination/loading
• Empty states
• Skeletons

───

PHASE 4 — PRODUCT EXPERIENCE
Implement:
• Product detail
• Gallery
• Variants
• Specifications
• Reviews
• Quick view
• Recommendations
• Product actions

───

PHASE 5 — SEARCH
Implement:
• Search page
• Search overlay
• Autocomplete
• Recent searches
• Trending searches
• URL search state
• Natural-language search architecture

───

PHASE 6 — CART & WISHLIST
Implement:
• Cart
• Add/remove
• Quantity
• Persistence
• Wishlist
• Recently viewed
• Smart cart recommendations

───

PHASE 7 — CHECKOUT
Implement:
• Shipping
• Delivery
• Payment boundary
• Review
• Validation
• Order success

───

PHASE 8 — ACCOUNT & ORDERS
Implement:
• Login
• Register
• Account
• Profile
• Addresses
• Orders
• Order details
• Settings

───

PHASE 9 — COMPARISON & COLLECTIONS
Implement:
• Compare
• Comparison table
• Wishlist collections
• Public/private collections
• Collection detail pages

───

PHASE 10 — SMART FEATURES
Implement:
• Personalized recommendations
• Recommendation reasons
• Smart filters
• Product configurator
• Smart cart suggestions
• Command/quick actions
• Feature flags

───

PHASE 11 — AI SHOPPING ASSISTANT
Implement:
• Assistant UI
• Floating assistant
• Dedicated assistant page
• Conversation UI
• Suggested prompts
• Product recommendations
• Comparison actions
• Mock AI service
• AI API abstraction

───

PHASE 12 — ADMIN
Implement:
• Dashboard
• Products
• Categories
• Orders
• Customers
• Coupons
• Analytics

───

PHASE 13 — POLISH
Final pass:
• Responsive testing
• RTL testing
• Accessibility
• Dark mode
• Loading states
• Error states
• Empty states
• Animations
• Performance
• SEO metadata
• Tests
• Type checking
• Linting
• Production build

───

108. PHASE COMPLETION RULE
A phase is not considered complete when the UI merely renders.
A phase is complete when:
text
UI works
+
responsive
+
RTL/LTR
+
dark/light
+
loading states
+
error states
+
empty states
+
accessibility
+
TypeScript
+
tests where appropriate
+
no obvious console errors


───

109. PROGRESS TRACKING
Create:
text
PROGRESS.md

Track:
text
Phase
Feature
Status
Notes
Known issues

Possible statuses:
text
TODO
IN_PROGRESS
DONE
BLOCKED

The AI should update this while implementing.

───

110. IMPLEMENTATION LOG
Create:
text
IMPLEMENTATION_LOG.md

Record major architectural decisions and completed work.
Do not turn this into a planning document.
It is an execution record.

───

111. AI AGENT WORKING RULES
The AI implementation agent must follow these rules.
DO
• Read this specification.
• Treat it as the source of truth.
• Inspect the existing repository first.
• Preserve existing good work.
• Implement the current phase immediately.
• Create production-quality code.
• Reuse components.
• Follow the architecture.
• Maintain TypeScript strictness.
• Maintain RTL/LTR.
• Maintain Light/Dark.
• Maintain English/Arabic.
• Add loading/error/empty states.
• Test important behavior.
• Fix errors before continuing.
• Update progress documentation.

───

DO NOT
Do NOT:
• Create another project plan instead of implementing.
• Ask the user to define the product again.
• Replace this architecture with a generic architecture.
• Simplify the project into a basic e-commerce template.
• Remove advanced features because they are harder.
• Replace React.
• Replace TypeScript.
• Replace Redux Toolkit.
• Replace RTK Query.
• Replace Tailwind.
• Ignore RTL.
• Ignore Arabic.
• Ignore dark mode.
• Build desktop-only UI.
• Hard-code API calls inside random components.
• Scatter mock data through UI components.
• Use any everywhere.
• Create giant components.
• Stop after generating a plan.

───

112. DECISION-MAKING RULE
If a small implementation decision is not explicitly specified:
Make the best engineering decision and continue.
Do not stop to ask unnecessary questions.
Only ask the user when a decision would materially change:
• Product direction
• Core architecture
• Data architecture
• Authentication strategy
• Payment architecture
• Major UX behavior

───

113. DESIGN DECISION RULE
When choosing between:
text
simple generic implementation

and:
text
premium scalable implementation

choose the second, as long as it remains maintainable.

───

114. AI CODING STYLE
The AI should behave like:
text
Senior Frontend Engineer
+
Product Designer
+
UX Engineer
+
Design Systems Engineer

It should think about:
• UX
• architecture
• accessibility
• performance
• maintainability
• scalability
while implementing.

───

115. FIRST EXECUTION
When the AI receives this specification, it must immediately do the following:
Step 1
Inspect the repository.
Determine:
text
Is the project empty?
Is React already installed?
What dependencies exist?
What files exist?

Step 2
If the repository is empty:
Initialize the project using the specified stack.
Step 3
Create the foundational architecture.
Step 4
Implement:
text
Theme
i18n
RTL/LTR
AppShell
Header
Footer
Routing
Design system
Base UI
Redux
RTK Query

Step 5
Run:
text
typecheck
lint
tests
build

Step 6
Fix issues.
Step 7
Continue to Phase 2.
The AI should not stop after Step 1 and provide a plan.

───

116. DEFINITION OF DONE
The project is considered successful when it feels like a real modern marketplace product.
A user should be able to:
text
Open homepage
↓
Discover products
↓
Search
↓
Filter
↓
Open product
↓
Inspect details
↓
Compare
↓
Save
↓
Add to cart
↓
Checkout
↓
View order

But also:
text
Open marketplace
↓
Ask AI assistant
↓
Describe what they need
↓
Receive recommendations
↓
Compare recommendations
↓
Save products
↓
Purchase

And:
text
Switch English ↔ Arabic
Switch LTR ↔ RTL
Switch Light ↔ Dark

without breaking the experience.

───

117. FINAL PRODUCT FEEL
The final product should feel:
Premium
Not cheap.
Modern
Not outdated.
Intelligent
Not just transactional.
Fast
Not overloaded.
Unique
Not another generic online store.
Scalable
Not a one-off demo.
Real
Like a startup product that could continue into a real production system.

───

118. FINAL PRIORITY ORDER
When making implementation decisions, prioritize:
text
1. User Experience
2. Product Quality
3. Architecture
4. Accessibility
5. Responsiveness
6. Performance
7. Maintainability
8. Visual polish
9. Advanced features

Do not sacrifice fundamentals just to add flashy features.

───

119. MASTER EXECUTION DIRECTIVE
This section is the final instruction to the AI implementation agent.
THIS DOCUMENT IS THE SOURCE OF TRUTH.
Do not create a new product plan.
Do not ask what the project should contain.
Do not redesign the concept.
Do not simplify the project into a generic e-commerce website.
Do not remove major features without a technical reason.
Do not replace the specified technology stack without a critical technical reason.
Do not stop after explaining what you are going to do.
Start implementing immediately.
Inspect the repository, establish the architecture, and execute the phases defined in this document.
Every implementation must preserve:
▪ React
▪ TypeScript
▪ Tailwind CSS
▪ Redux Toolkit
▪ RTK Query
▪ React Router
▪ Arabic/English
▪ RTL/LTR
▪ Light/Dark themes
▪ Responsive design
▪ Accessibility
▪ Feature-based architecture
▪ Reusable components
▪ API abstraction
▪ Production-quality code
When something is unspecified, make a sensible engineering decision and continue.
Do not ask unnecessary questions.
Do not replace implementation with documentation.
Documentation such as PROGRESS.md and IMPLEMENTATION_LOG.md should support the implementation, not replace it.
After every meaningful implementation stage, run the appropriate checks, fix errors, and continue.
The final result must feel like a sophisticated technology startup product rather than a generic template.
Begin implementation now.

───

120. END OF MASTER SPECIFICATION
Project: NOVA Market / Universal Smart Marketplace
Architecture: Feature-based React application
State: Redux Toolkit + RTK Query
Styling: Tailwind CSS + Design Tokens
UI: shadcn/ui + custom design system
Language: English + Arabic
Direction: LTR + RTL
Theme: Light + Dark + System
AI: Assistant + intelligent discovery architecture
Backend: Mock API first, real API ready
Testing: Vitest + RTL + Playwright
Goal: Premium, intelligent, scalable marketplace
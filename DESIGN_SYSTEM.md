NOVA Market — DESIGN_SYSTEM.md
This document is a mandatory design and UI specification for the NOVA Market project. It must be treated as a source of truth together with MASTER_SPEC.md.
Do not invent a generic e-commerce design.Do not replace this visual direction with a default Tailwind/shadcn/Bootstrap-style interface. Every page and component must feel like part of the same premium product ecosystem.

───

1. Design Vision
NOVA Market is a premium intelligent marketplace, not a traditional online store.
The interface should communicate:
• Premium
• Intelligent
• Modern
• Editorial
• Trustworthy
• Fast
• Sophisticated
• Technology-oriented
• Highly curated
• Easy to navigate
The visual language should sit somewhere between:
• Premium technology products
• Modern editorial commerce
• High-end marketplace
• AI-powered product discovery
• Modern SaaS interfaces
The design must feel intentional, not template-generated.
Avoid
Do NOT create:
• Generic Bootstrap layouts
• Excessive rounded cards
• Excessive gradients
• Huge shadows
• Random glassmorphism
• Overly colorful interfaces
• Excessive badges
• Every section inside a card
• Giant text everywhere
• Cluttered dashboards
• Generic "AI generated" UI
• Repeated identical product cards without visual hierarchy

───

2. Core Design Principle
The interface should follow:
Strong hierarchy + generous whitespace + meaningful contrast + restrained decoration.
The user should immediately understand:
1. Where they are
2. What they can do
3. What is important
4. What is recommended
5. What action should be taken next
Every screen must have a clear visual focal point.

───

3. Design Personality
The design personality is:
Premium
Use whitespace, typography, alignment and subtle borders instead of excessive decoration.
Intelligent
AI features should feel integrated into the product experience, not like a chatbot pasted onto the website.
Editorial
Collections and products should sometimes be presented like curated magazine content rather than only grids.
Technical
Use precise spacing, strong typography and structured information for technical categories.
Human
Microcopy, empty states, errors and interactions should feel thoughtful and helpful.

───

4. Layout Philosophy
Use a responsive container system.
Recommended maximum content width:
text
1440px

Main content:
text
Desktop:
32px–48px horizontal padding

Tablet:
24px–32px

Mobile:
16px–20px

Do not stretch content unnecessarily across ultra-wide screens.
Content should feel centered and controlled.

───

5. Grid System
Use CSS Grid wherever appropriate.
Product grids
Desktop:
text
4–5 products

Large desktop:
text
5–6 products when appropriate

Tablet:
text
3 products

Mobile:
text
2 products

Some sections may intentionally use:
• Horizontal scrolling
• Featured large card + smaller cards
• Editorial asymmetric layouts
• Masonry-like visual compositions
• Collection banners
Do not force every section into the same grid.

───

6. Visual Rhythm
Sections should breathe.
Typical vertical spacing:
text
Small section:
48px

Normal section:
64px–80px

Major section:
96px–120px

Mobile:
text
32px–56px

Avoid putting sections immediately against each other.

───

7. Typography
Typography must create strong hierarchy.
Use a modern sans-serif font stack.
English:
text
Inter / Geist / system-ui

Arabic:
Use a modern Arabic UI font with excellent readability.
Recommended direction:
text
IBM Plex Sans Arabic
Noto Sans Arabic

Arabic and English typography must not feel like two different products.

───

8. Typography Scale
Display
text
56–72px desktop
40–48px mobile

H1
text
40–52px desktop
32–40px mobile

H2
text
30–38px

H3
text
22–28px

Body
text
15–17px

Small
text
13–14px

Micro
text
11–12px

Do not use too many font sizes.
Hierarchy is more important than decoration.

───

9. Font Weight
Use weight intentionally.
text
Regular: 400
Medium: 500
Semibold: 600
Bold: 700

Avoid excessive 700/800 text.
Most UI should live around:
text
400 / 500 / 600


───

10. Color Philosophy
Use a restrained palette.
The interface should primarily rely on:
• Background
• Surface
• Elevated surface
• Text
• Muted text
• Border
• Accent
• Success
• Warning
• Error
Do not use a different accent color for every feature.
The accent color must remain recognizable throughout the application.

───

11. Light Theme
Light mode should feel:
• Clean
• Premium
• Soft
• Spacious
Prefer slightly off-white backgrounds rather than pure white everywhere.
Example semantic tokens:
text
--background
--surface
--surface-elevated
--foreground
--muted-foreground
--border
--accent
--accent-foreground
--success
--warning
--error

Components should use semantic tokens rather than hardcoded colors.

───

12. Dark Theme
Dark mode must be designed independently.
Do NOT simply invert the light theme.
Use layered surfaces:
text
background
surface
surface-elevated
surface-hover

Borders should remain subtle.
Text should not be pure white everywhere.
The visual hierarchy should remain clear without relying on heavy shadows.

───

13. Borders
Borders should be subtle and purposeful.
Use borders primarily to:
• Separate content
• Define interactive boundaries
• Structure dense information
Avoid outlining every element.

───

14. Border Radius
Use a consistent radius system.
Suggested:
text
XS: 6px
SM: 8px
MD: 12px
LG: 16px
XL: 20px
2XL: 24px

Do not use rounded-full for everything.
Pills should be reserved for:
• Status
• Tags
• Filters
• Compact controls

───

15. Shadows
Shadows must be subtle.
Use elevation primarily for:
• Dropdowns
• Dialogs
• Floating panels
• Sticky elements
• Elevated product interactions
Do not put large shadows on every card.

───

16. Header
The header is one of the most important components.
Desktop structure:
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

The header should feel like a premium command center.
Search should be visually important.
The AI assistant should have its own recognizable but restrained identity.

───

17. Header Behavior
Desktop:
• Sticky
• Compact after scrolling
• Search remains accessible
Mobile:
Top row:
text
Logo
Search
Cart
Menu

Search should have high priority.
Avoid overcrowding the mobile header.

───

18. Search
Search is a primary product feature.
Search interaction should support:
• Autocomplete
• Recent searches
• Trending searches
• Categories
• Brands
• Products
• Suggestions
• Natural-language queries
• AI interpretation
Search overlay should feel like a focused workspace.
Example:
text
Search for products, brands, categories...

Below it:
text
Recent searches

Trending

Suggested categories

Popular products


───

19. Homepage
The homepage should NOT look like:
text
Hero
↓
Products
↓
Products
↓
Products

Instead create a dynamic discovery experience.
Recommended visual structure:
text
Hero
↓
Smart discovery / AI entry point
↓
Trending
↓
Personalized recommendations
↓
Editorial collection
↓
Categories
↓
Deals
↓
New arrivals
↓
Premium picks
↓
Recently viewed

Sections should visually vary.

───

20. Hero Section
Hero must feel premium.
Avoid generic:
"Welcome to our store"
Instead communicate:
• Discovery
• Intelligence
• Selection
• Personalization
Hero can include:
• Large typography
• Product composition
• Editorial imagery
• Interactive product highlights
• Search/AI entry point
Keep the hero visually focused.

───

21. Product Cards
Product cards are critical.
Each card should have:
• Product image
• Brand
• Product name
• Rating
• Price
• Previous price when relevant
• Discount
• Wishlist action
• Quick action
• Optional comparison action
But not every card needs every element.
Information hierarchy:
text
Image
↓
Brand
↓
Product name
↓
Rating / metadata
↓
Price

Price must be visually dominant.

───

22. Product Card Interaction
Desktop hover may reveal:
• Quick view
• Add to cart
• Compare
• Wishlist
Do not make hover interactions mandatory for accessibility.
Mobile must expose essential actions without hover.

───

23. Product Images
Product imagery should have consistent visual treatment.
Use:
text
aspect-ratio
object-fit
consistent image containers

Avoid inconsistent image heights.
The image area should usually be more visually dominant than metadata.

───

24. Product Detail Page
Product detail should feel like a premium product research workspace.
Desktop:
text
Gallery
        Product information
        Price
        Variants
        Delivery
        Actions

Below:
text
Highlights
Specifications
Reviews
Comparison
Recommendations
Related products
FAQ


───

25. Product Gallery
Support:
• Multiple images
• Thumbnail navigation
• Zoom
• Fullscreen
• Video when available
• Variant-specific imagery
Large image should receive significant visual space.

───

26. Purchase Area
The main CTA should be obvious.
Primary:
text
Add to Cart

Secondary:
text
Buy Now

Supporting information:
• Delivery
• Availability
• Returns
• Warranty
• Seller
• Payment methods
Do not overwhelm the user.

───

27. Smart Cart
Cart should feel intelligent.
Instead of only showing:
text
Product
Quantity
Price

Also support:
text
You may also need...
Complete your setup
Save with this bundle
Better alternative

But recommendations must never overpower checkout.

───

28. Checkout
Checkout must prioritize trust and clarity.
Recommended structure:
text
Contact
↓
Shipping
↓
Payment
↓
Review
↓
Confirmation

Desktop can use two-column layout:
text
Checkout information | Order summary

Mobile becomes one-column.

───

29. Filters
Filters should adapt by category.
Electronics:
text
Brand
Price
RAM
Storage
CPU
GPU
Screen
Rating

Fashion:
text
Brand
Size
Color
Material
Price
Rating

Do not show irrelevant universal filters.

───

30. Filter UX
Desktop:
Sidebar or adaptive filter panel.
Mobile:
Bottom sheet / filter drawer.
Selected filters should appear as removable chips.
Example:
text
Apple ×
16GB RAM ×
Under €1000 ×

Include:
text
Clear all


───

31. Compare Experience
Comparison should feel like a decision tool.
Allow up to 4 products.
Highlight:
• Better value
• Better performance
• Better rating
• Better battery
• Better specifications
Use visual emphasis for meaningful differences.
Avoid turning comparison into an unreadable giant table on mobile.

───

32. AI Assistant
The AI assistant is a core feature.
It should feel like:
A personal shopping expert.
Not:
A generic chatbot.
Possible UI:
text
What are you shopping for?

[ I need a laptop for university ]

[ Find me running shoes under €150 ]

[ Help me compare these phones ]

Responses should include product cards, comparisons and actionable suggestions.

───

33. AI Visual Identity
AI UI should have subtle visual distinction.
Do not use:
• Huge glowing gradients
• Robot icons everywhere
• Neon effects everywhere
• Excessive animated blobs
Use:
• Small AI indicators
• Intelligent suggestions
• Contextual chips
• Smooth transitions
• Clean conversation layout
AI should feel native to the marketplace.

───

34. Editorial Collections
Collections should break the monotony of product grids.
Examples:
text
Back to University
Work From Anywhere
Smart Home Essentials
Weekend Fitness
Minimal Desk Setup
Gifts Under €100

Use:
• Large visual blocks
• Strong typography
• Curated products
• Short descriptions

───

35. Wishlist
Wishlist should support organization.
Instead of a simple list, support:
text
Wishlist
├── Favorites
├── For Later
├── Gift Ideas
├── Work Setup
└── Custom Collections

Users can create collections.

───

36. Account Dashboard
Account should feel like a personal control center.
Include:
text
Overview
Orders
Wishlist
Collections
Addresses
Payment
Preferences
Notifications
Security

Dashboard should prioritize recent activity.

───

37. Admin UI
Admin should use a different visual density than the public marketplace.
It should be:
• Information dense
• Precise
• Functional
• Scannable
Support:
text
KPIs
Charts
Orders
Products
Customers
Inventory
Coupons
Analytics

Avoid excessive decorative elements.

───

38. Buttons
Button hierarchy:
Primary
Main action.
Secondary
Supporting action.
Tertiary / Ghost
Low-emphasis action.
Destructive
Dangerous action.
Buttons must have:
• Hover
• Active
• Focus
• Disabled
• Loading
states.

───

39. Inputs
Inputs should feel premium and predictable.
States:
text
Default
Hover
Focus
Filled
Error
Disabled
Loading

Labels should remain visible.
Do not rely only on placeholders.

───

40. Modals
Use dialogs for focused tasks.
Examples:
• Quick View
• Confirm Delete
• Login
• Product Selection
Dialogs should have:
• Clear title
• Description where necessary
• Main action
• Secondary action
• Escape support
• Proper focus management

───

41. Drawers / Sheets
Use drawers for:
• Mobile filters
• Cart
• Navigation
• AI assistant
• Secondary panels
Mobile interactions should prefer bottom sheets when appropriate.

───

42. Notifications
Use toast notifications for lightweight feedback.
Examples:
text
Added to cart
Removed from wishlist
Preferences saved
Product added to comparison

Do not use toast for critical information that must persist.

───

43. Empty States
Every major feature needs a designed empty state.
Example:
text
Your wishlist is empty.

Save products you love and come back to them later.

[Explore products]

Empty states should be helpful, not merely decorative.

───

44. Loading States
Use skeletons instead of generic spinners whenever possible.
Skeletons must resemble the final layout.
Examples:
• Product card skeleton
• Product page skeleton
• Search skeleton
• Dashboard skeleton
• Order skeleton
Avoid layout jumping.

───

45. Error States
Errors must be human-readable.
Bad:
text
Error 500

Better:
text
Something went wrong.

We couldn't load these products right now.

[Try again]

Technical details may appear only when useful.

───

46. Success States
Success should be obvious but restrained.
Examples:
text
Added to cart
Order confirmed
Payment successful
Profile updated

Use animation sparingly.

───

47. Motion
Use Framer Motion where it improves UX.
Motion should communicate:
• State change
• Hierarchy
• Continuity
• Feedback
Avoid animation for decoration alone.
Recommended duration:
text
Fast:
120–180ms

Normal:
200–300ms

Large transition:
300–450ms

Support:
text
prefers-reduced-motion


───

48. Hover
Hover should provide information or feedback.
Good:
text
Subtle elevation
Border change
Image scale
Action reveal

Bad:
text
Large movement
Huge scaling
Excessive glow
Distracting animation


───

49. Mobile UX
Mobile is not a compressed desktop.
Design mobile intentionally.
Priorities:
text
Search
Navigation
Product discovery
Quick actions
Checkout

Use:
• Bottom sheets
• Sticky actions
• Horizontal carousels
• Compact filters
• Large touch targets
Minimum touch target should generally be around:
text
44 × 44px


───

50. RTL / Arabic
RTL must be a first-class layout mode.
Do not simply mirror the interface manually.
Use CSS logical properties:
css
margin-inline
padding-inline
inset-inline
border-inline

Avoid unnecessary:
css
left
right

Icons that communicate direction should adapt appropriately.
Examples:
• Back
• Forward
• Breadcrumb arrows
• Carousels
Arabic typography must remain readable and balanced.

───

51. Responsive Breakpoints
Use a consistent breakpoint system.
Suggested:
text
sm: 640
md: 768
lg: 1024
xl: 1280
2xl: 1536

Do not create unnecessary custom breakpoints.

───

52. Accessibility
Target WCAG 2.2 AA principles.
Every interactive component must support:
• Keyboard navigation
• Focus state
• Screen reader semantics
• Proper labels
• Accessible names
• Sufficient contrast
• Reduced motion
Never remove focus indicators without replacement.

───

53. Iconography
Use one consistent icon system.
Recommended:
text
Lucide

Icons should be:
• Simple
• Consistent
• Lightweight
• Meaningful
Do not mix multiple unrelated icon libraries.

───

54. Images
Images should support the content hierarchy.
Use optimized images.
Support:
text
lazy loading
responsive sizes
proper aspect ratios
alt text

Avoid random stock imagery that does not contribute to the product story.

───

55. Cards
Cards should not all look identical.
Use different card patterns:
text
Product Card
Feature Card
Collection Card
Editorial Card
Stat Card
Review Card
Order Card

Cards should exist because they improve grouping—not because every component needs a border.

───

56. Visual Hierarchy Rules
When deciding what should be visually stronger:
Priority:
text
Primary action
↓
Important information
↓
Product / content
↓
Supporting metadata
↓
Secondary actions

Never make secondary metadata visually louder than the primary product information.

───

57. Density
Public marketplace:
text
Medium / spacious

Product detail:
text
Medium

Checkout:
text
Focused

Admin:
text
Dense

Mobile:
text
Compact but breathable


───

58. Design Consistency
Every new component must answer:
1. Does it belong to the existing visual language?
2. Does it use existing tokens?
3. Does it reuse existing primitives?
4. Does it work in dark mode?
5. Does it work in RTL?
6. Does it work on mobile?
7. Does it have loading/error/disabled states where needed?
8. Is its hierarchy clear?
Do not create one-off styles unnecessarily.

───

59. Component Reuse
Before creating a new UI component:
1. Search the existing component library.
2. Reuse an existing component if possible.
3. Extend the component if necessary.
4. Only create a new component when there is a real reusable pattern.
Avoid duplicate components such as:
text
ProductCard
ProductCardNew
ProductCardModern
ProductCardFeatured

unless their behavior is genuinely different.

───

60. Design Tokens
All reusable values should be centralized.
Include tokens for:
text
Colors
Typography
Spacing
Radius
Shadows
Z-index
Motion
Breakpoints

Components should consume semantic tokens.
Do not scatter magic values throughout the application.

───

61. Z-Index
Use a predictable layer system.
Example:
text
Base
Sticky
Dropdown
Popover
Drawer
Modal
Toast
Command Palette

Avoid arbitrary values like:
text
z-[99999]

unless there is a documented reason.

───

62. Command Palette
Implement a premium command palette where appropriate.
Possible actions:
text
Search products
Open cart
Open wishlist
Change theme
Change language
Open orders
Open AI assistant
Navigate categories

Keyboard shortcut:
text
Cmd/Ctrl + K


───

63. Microcopy
Microcopy should be:
• Short
• Clear
• Human
• Action-oriented
Avoid corporate filler.
Bad:
text
Click here to proceed with your purchase.

Better:
text
Continue to payment


───

64. Internationalization
Every visible string must be translatable.
Never hardcode user-facing English or Arabic directly inside components.
Use translation keys.
Example:
ts
t("cart.addToCart")

Arabic and English must receive equal design attention.

───

65. UX Feedback
Every meaningful user action should provide feedback.
Examples:
text
Click
→ immediate visual response

Add to cart
→ button feedback + cart update

Wishlist
→ icon state change

Save
→ confirmation

Failed request
→ recoverable error


───

66. Performance-Aware Design
Do not sacrifice performance for visual effects.
Avoid:
• Huge background videos
• Excessive blur
• Heavy animations
• Unoptimized images
• Massive client-side bundles
Visual quality must coexist with performance.

───

67. Premium Interaction Details
Use subtle details that make the application feel polished:
• Smooth image transitions
• Intelligent hover states
• Sticky product actions
• Contextual recommendations
• Smart filter persistence
• Animated cart feedback
• URL-synchronized filters
• Recently viewed products
• Personalized discovery
• Quick view
• Keyboard shortcuts
These details should feel purposeful.

───

68. Design Anti-Patterns
Never implement:
text
Everything rounded
Everything shadowed
Everything inside cards
Everything animated
Everything colorful
Everything centered
Everything uppercase
Every section with a gradient
Every product with 10 badges

Avoid visual noise.

───

69. Quality Bar
Before considering a page finished, verify:
Visual
• Strong hierarchy
• Consistent spacing
• Consistent typography
• Balanced composition
• No unnecessary decoration
UX
• Clear actions
• Clear navigation
• Useful feedback
• Good empty states
• Good loading states
• Good errors
Responsive
• Desktop
• Tablet
• Mobile
Themes
• Light
• Dark
Localization
• English
• Arabic
• RTL
• LTR
Accessibility
• Keyboard
• Focus
• Labels
• Contrast
• Screen reader semantics

───

70. Mandatory Implementation Rule
When implementing UI, follow this order:
text
Design System
      ↓
UI Primitives
      ↓
Layout Components
      ↓
Feature Components
      ↓
Pages
      ↓
Interactions
      ↓
Responsive Behavior
      ↓
Accessibility
      ↓
Polish

Do not build every page independently.
Build the design language first, then compose the application from it.

───

71. Claude Implementation Directive
Claude must follow these rules while implementing the project:
1. Read MASTER_SPEC.md.
2. Read DESIGN_SYSTEM.md.
3. Treat both documents as source of truth.
4. Inspect the existing repository before changing architecture.
5. Reuse existing components whenever possible.
6. Do not replace the selected technology stack.
7. Do not simplify the marketplace into a basic storefront.
8. Do not generate generic UI.
9. Do not introduce random visual styles.
10. Keep all UI consistent with this design system.
11. Implement light and dark themes.
12. Implement English and Arabic.
13. Implement RTL/LTR correctly.
14. Ensure responsive behavior.
15. Ensure accessibility.
16. Test all meaningful interactive states.
17. Run typecheck, lint, tests and build after major implementation milestones.
18. Fix errors instead of leaving TODO placeholders.
19. Continue implementation without asking the user to redesign the application from scratch.
20. Prefer polished working implementation over superficial mockups.

───

72. Final Visual Standard
The final product should feel like a serious modern marketplace product that could plausibly compete with premium commerce platforms.
It should NOT feel like:
"A React + Tailwind demo."
It should feel like:
A complete, intelligent, premium commerce platform designed as a real product.
The goal is not maximum visual decoration.
The goal is:
clarity + intelligence + elegance + discovery + trust + usability.
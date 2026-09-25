import type { Collection } from "../../types/collection";

export const collections: Collection[] = [
  {
    id: "c1",
    slug: "the-desk-upgrade",
    title: "The Desk Upgrade",
    description: "Everything to make your workspace feel considered, not cluttered.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    productIds: ["p2", "p3"],
  },
  {
    id: "c2",
    slug: "quiet-luxury",
    title: "Quiet Luxury",
    description: "Understated pieces built to outlast a trend cycle.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    productIds: ["p4", "p6", "p5"],
  },
  {
    id: "c3",
    slug: "weekend-mode",
    title: "Weekend Mode",
    description: "Gear for the days you actually get to yourself.",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1200",
    productIds: ["p7", "p8", "p1"],
  },
];

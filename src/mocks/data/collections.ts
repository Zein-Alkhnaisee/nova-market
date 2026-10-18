import local_photo_1518770660439_4636190af475 from "../../assets/remote-images/photo-1518770660439-4636190af475.jpg";
import local_photo_1441986300917_64674bd600d8 from "../../assets/remote-images/photo-1441986300917-64674bd600d8.jpg";
import local_photo_1485965120184_e220f721d03e from "../../assets/remote-images/photo-1485965120184-e220f721d03e.jpg";
import type { Collection } from "../../types/collection";

export const collections: Collection[] = [
  {
    id: "c1",
    slug: "the-desk-upgrade",
    title: "The Desk Upgrade",
    description: "Everything to make your workspace feel considered, not cluttered.",
    image: local_photo_1518770660439_4636190af475,
    productIds: ["p2", "p3"],
  },
  {
    id: "c2",
    slug: "quiet-luxury",
    title: "Quiet Luxury",
    description: "Understated pieces built to outlast a trend cycle.",
    image: local_photo_1441986300917_64674bd600d8,
    productIds: ["p4", "p6", "p5"],
  },
  {
    id: "c3",
    slug: "weekend-mode",
    title: "Weekend Mode",
    description: "Gear for the days you actually get to yourself.",
    image: local_photo_1485965120184_e220f721d03e,
    productIds: ["p7", "p8", "p1"],
  },
];

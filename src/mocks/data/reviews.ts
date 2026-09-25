import type { Review } from "../../types/review";

function makeReview(
  id: string,
  productId: string,
  author: string,
  rating: number,
  title: string,
  body: string,
  daysAgo: number,
  verified: boolean,
  helpfulCount: number
): Review {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    productId,
    author,
    rating,
    title,
    body,
    date: date.toISOString(),
    verified,
    helpfulCount,
  };
}

export const reviews: Review[] = [
  makeReview(
    "r1",
    "p1",
    "Dana K.",
    5,
    "Best travel headphones I've owned",
    "Wore these on a 14-hour flight and forgot they were noise-cancelling half the time — that's how natural it feels. Battery easily lasted the whole trip.",
    6,
    true,
    42
  ),
  makeReview(
    "r2",
    "p1",
    "Marcus T.",
    4,
    "Great sound, ear cups run warm",
    "Sound quality and ANC are excellent. My only gripe is the ear cups get a little warm after 2+ hours. Still my daily driver.",
    18,
    true,
    17
  ),
  makeReview(
    "r3",
    "p1",
    "Priya S.",
    5,
    "Worth the upgrade",
    "Came from a much cheaper pair and the difference in build quality alone justified the price. The case is genuinely pocketable too.",
    32,
    false,
    9
  ),
  makeReview(
    "r4",
    "p2",
    "Alex R.",
    5,
    "Finally, a laptop that doesn't weigh anything",
    "I carry this in a tote bag most days and genuinely forget it's in there. Screen is gorgeous for photo editing.",
    9,
    true,
    28
  ),
  makeReview(
    "r5",
    "p2",
    "Jordan L.",
    4,
    "Fantastic, wish it had more ports",
    "Performance is great for my workload. Just wish there was one more USB-C port so I don't need a dongle at my desk.",
    21,
    true,
    11
  ),
  makeReview(
    "r6",
    "p3",
    "Sam W.",
    5,
    "Thock for days",
    "Swapped the stock switches for some tactile ones and this board sounds incredible. Hot-swap made it a five minute job.",
    4,
    true,
    31
  ),
  makeReview(
    "r7",
    "p3",
    "Casey B.",
    4,
    "Great board, RGB software is basic",
    "Typing feel is excellent. The companion software for the lighting is a bit bare bones compared to competitors.",
    27,
    false,
    6
  ),
  makeReview(
    "r8",
    "p4",
    "Riley M.",
    4,
    "Battery life is honestly 6 days",
    "Skeptical of the marketing claim but it held up — I charge it about once a week with normal use and a couple of workouts logged.",
    12,
    true,
    22
  ),
  makeReview(
    "r9",
    "p6",
    "Noor A.",
    5,
    "Café-quality shots at home",
    "The steam wand alone is worth the price. Dialed in a proper microfoam within the first week of practice.",
    15,
    true,
    38
  ),
  makeReview(
    "r10",
    "p8",
    "Theo P.",
    5,
    "No more stick drift, ever",
    "Had three controllers before this die from drift. Hall-effect sticks are a genuine fix, not a marketing term.",
    3,
    true,
    54
  ),
];

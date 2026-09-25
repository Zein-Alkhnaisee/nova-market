import { products } from "../../mocks/data/products";
import { categories } from "../../mocks/data/categories";
import { generateId } from "../../lib/id";
import type { AIProvider } from "./aiProvider";
import type { AssistantAction, AssistantMessage } from "../../types/assistant";
import type { ProductSummary } from "../../types/product";

// Keyword → category id. Deliberately small and literal rather than a real
// NLU model — this is the mock backend's boundary, same as authApi/ordersApi.
const CATEGORY_KEYWORDS: Record<string, string> = {
  laptop: "computers",
  computer: "computers",
  pc: "computers",
  keyboard: "computers",
  headphone: "electronics",
  earphone: "electronics",
  audio: "electronics",
  watch: "watches-jewelry",
  shirt: "fashion",
  clothing: "fashion",
  apparel: "fashion",
  coffee: "home",
  espresso: "home",
  kitchen: "home",
  bike: "sports-fitness",
  cycling: "sports-fitness",
  controller: "gaming",
  gaming: "gaming",
  gamer: "gaming",
  console: "gaming",
};

function detectCategoryId(query: string): string | undefined {
  for (const [keyword, categoryId] of Object.entries(CATEGORY_KEYWORDS)) {
    if (query.includes(keyword)) return categoryId;
  }
  const directMatch = categories.find((c) => query.includes(c.name.toLowerCase()));
  return directMatch?.id;
}

function detectBudget(query: string): number | undefined {
  const match = query.match(/\$?\s?(\d{1,6})/);
  return match ? Number(match[1]) : undefined;
}

function findMentionedProducts(query: string): ProductSummary[] {
  return products.filter(
    (p) => query.includes(p.name.toLowerCase()) || query.includes(p.brand.toLowerCase())
  );
}

function actionsFor(product: ProductSummary): AssistantAction[] {
  return [
    { id: generateId("action"), type: "view_product", label: "View", payload: product.slug },
    { id: generateId("action"), type: "add_to_cart", label: "Add to cart", payload: product.id },
    { id: generateId("action"), type: "add_to_compare", label: "Compare", payload: product.id },
  ];
}

function reply(
  content: string,
  opts: { products?: ProductSummary[]; actions?: AssistantAction[] } = {}
): AssistantMessage {
  return {
    id: generateId("msg"),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
    products: opts.products,
    actions: opts.actions,
  };
}

function handleGreeting(query: string): AssistantMessage | null {
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(query)) {
    return reply(
      "Hi! I can help you find products, compare options, explain specs, or put together a shopping list. What are you looking for?"
    );
  }
  return null;
}

function handleCompare(query: string): AssistantMessage | null {
  if (!query.includes("compare") && !query.includes("difference between")) return null;
  const mentioned = findMentionedProducts(query);
  if (mentioned.length >= 2) {
    const compareAction: AssistantAction = {
      id: generateId("action"),
      type: "view_comparison",
      label: "View full comparison",
      payload: mentioned.map((p) => p.id).join(","),
    };
    return reply(
      `Here's how ${mentioned.map((p) => p.name).join(" and ")} stack up. Tap "View full comparison" for the full side-by-side.`,
      { products: mentioned, actions: [compareAction] }
    );
  }
  if (mentioned.length === 1) {
    return reply(
      `I found ${mentioned[0].name} — what would you like to compare it against? Try naming a second product.`,
      { products: mentioned }
    );
  }
  return reply("I'd love to compare products for you — tell me the names of the two you're deciding between.");
}

function handleSpecs(query: string): AssistantMessage | null {
  if (!query.includes("spec") && !query.includes("specification")) return null;
  const mentioned = findMentionedProducts(query);
  if (mentioned.length === 0) {
    return reply("Which product's specs would you like me to walk through?");
  }
  const product = mentioned[0];
  const specLines = product.specs
    ? Object.entries(product.specs)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    : "No detailed specs listed for this one.";
  return reply(`${product.name} — ${specLines}`, {
    products: [product],
    actions: actionsFor(product),
  });
}

function handleGift(query: string): AssistantMessage | null {
  if (!query.includes("gift")) return null;
  const categoryId = detectCategoryId(query);
  const pool = categoryId
    ? products.filter((p) => p.categoryId === categoryId)
    : products.filter((p) => p.badge === "premium" || p.badge === "trending");
  const picks = pool.slice(0, 3);
  if (picks.length === 0) {
    return reply("Tell me a bit about who you're shopping for and I'll suggest some gift ideas.");
  }
  return reply("Here are a few gift ideas based on what you told me:", {
    products: picks,
    actions: picks.flatMap(actionsFor),
  });
}

function handleBudgetOrCategory(query: string): AssistantMessage | null {
  const budget = detectBudget(query);
  const categoryId = detectCategoryId(query);
  if (budget == null && categoryId == null) return null;

  let matches = products.filter((p) => p.inStock);
  if (categoryId) matches = matches.filter((p) => p.categoryId === categoryId);
  if (budget != null) matches = matches.filter((p) => p.price <= budget);
  matches = [...matches].sort((a, b) => b.rating - a.rating).slice(0, 3);

  if (matches.length === 0) {
    return reply(
      budget != null
        ? `I couldn't find anything in stock under $${budget} that matches — want to try a higher budget or a different category?`
        : "I couldn't find a close match for that — could you describe it a little differently?"
    );
  }

  const intro = budget != null ? `Here's what I'd recommend under $${budget}:` : "Here's what I'd recommend:";
  return reply(intro, { products: matches, actions: matches.flatMap(actionsFor) });
}

function handleFallback(query: string): AssistantMessage {
  const tokens = query.split(/\s+/).filter((t) => t.length > 2);
  const matches = products
    .filter((p) => tokens.some((t) => p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t)))
    .slice(0, 3);

  if (matches.length > 0) {
    return reply("Here's what I found:", { products: matches, actions: matches.flatMap(actionsFor) });
  }

  return reply(
    "I couldn't find an exact match for that. Try describing what you're looking for — a category, a budget, or what it's for — and I'll search the catalog for you.",
    { actions: [{ id: generateId("action"), type: "search", label: "Search the shop", payload: query }] }
  );
}

export const mockAIProvider: AIProvider = {
  async sendMessage(_history, userMessage) {
    const query = userMessage.trim().toLowerCase();
    const handlers = [handleGreeting, handleCompare, handleSpecs, handleGift, handleBudgetOrCategory];
    for (const handler of handlers) {
      const result = handler(query);
      if (result) return result;
    }
    return handleFallback(query);
  },
};

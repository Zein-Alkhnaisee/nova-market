import { afterEach, describe, expect, it } from "vitest";
import i18n from "../../i18n/config";
import { formatCurrency } from "../../lib/format";

// ProductConfigurator shows option price differences with signDisplay "exceptZero" instead of
// gluing "+" / "-" onto a formatted string, so the sign is placed correctly for right-to-left text.
const delta = (amount: number) => formatCurrency(amount, "USD", { maximumFractionDigits: 0, signDisplay: "exceptZero" });

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("signed price differences", () => {
  it("looks the same in English as before: +$200 / -$200", () => {
    expect(delta(200)).toBe("+$200");
    expect(delta(-200)).toBe("-$200");
  });

  it("carries a sign in Arabic too, and the amount", async () => {
    await i18n.changeLanguage("ar");
    expect(delta(200)).toMatch(/\+/);
    expect(delta(-200)).toMatch(/-/);
    // Digit style (Arabic-Indic or Latin) depends on the runtime's ICU data, so accept either.
    expect(delta(200)).toMatch(/200|٢٠٠/);
  });
});

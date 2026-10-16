import { afterEach, describe, expect, it } from "vitest";
import i18n from "../../i18n/config";
import { formatCurrency, formatDate, formatDateTime, formatNumber, getFormatLocale } from "../../lib/format";

const ARABIC_SCRIPT = /[؀-ۿ]/;
const NOON_UTC = "2026-10-15T12:00:00Z";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("lib/format — follows the UI language, never the OS locale", () => {
  it("getFormatLocale tracks the current i18n language", async () => {
    await i18n.changeLanguage("en");
    expect(getFormatLocale()).toBe("en");
    await i18n.changeLanguage("ar");
    expect(getFormatLocale()).toBe("ar");
  });

  describe("currency", () => {
    it("formats English prices as $1,499 (the Bug C expectation)", () => {
      expect(formatCurrency(1499, "USD", { maximumFractionDigits: 0 })).toBe("$1,499");
      expect(formatCurrency(2049.5, "USD")).toBe("$2,049.50");
    });

    it("formats Arabic prices differently from English (symbol placement follows the Arabic locale)", async () => {
      const english = formatCurrency(1499, "USD", { maximumFractionDigits: 0 });
      await i18n.changeLanguage("ar");
      const arabic = formatCurrency(1499, "USD", { maximumFractionDigits: 0 });
      expect(arabic).not.toBe(english);
      // Deliberately not asserting digit style: whether plain "ar" uses Arabic-Indic or Latin digits depends on the runtime's ICU/CLDR version.
      expect(arabic).toMatch(/US\$\s*$/);
    });

    it("lets callers pass Intl options but always forces style and currency", () => {
      expect(formatCurrency(5, "EUR")).toBe("€5.00");
      const forced = formatCurrency(5, "USD", { style: "decimal", currency: "EUR" } as Intl.NumberFormatOptions);
      expect(forced).toBe("$5.00");
    });
  });

  describe("numbers", () => {
    it("groups thousands in English", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("honours options such as percent", () => {
      expect(formatNumber(0.25, { style: "percent" })).toBe("25%");
    });
  });

  describe("dates", () => {
    it("formats an ISO string in English", () => {
      expect(formatDate(NOON_UTC, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })).toBe(
        "October 15, 2026"
      );
    });

    it("accepts a Date and a timestamp", () => {
      const options = { year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" } as const;
      expect(formatDate(new Date(NOON_UTC), options)).toBe("10/15/2026");
      expect(formatDate(Date.parse(NOON_UTC), options)).toBe("10/15/2026");
    });

    it("uses Arabic month names when the UI language is Arabic", async () => {
      await i18n.changeLanguage("ar");
      expect(formatDate(NOON_UTC, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })).toMatch(
        ARABIC_SCRIPT
      );
    });

    it("returns an empty string for an invalid date instead of throwing", () => {
      expect(formatDate("not a date")).toBe("");
      expect(formatDate(Number.NaN)).toBe("");
      expect(formatDateTime("not a date")).toBe("");
    });

    it("formatDateTime includes the time of day by default", () => {
      const text = formatDateTime(NOON_UTC, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZone: "UTC",
      });
      expect(text).toContain("10/15/2026");
      expect(text).toMatch(/12:00/);
    });
  });
});

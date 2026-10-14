import i18n from "i18next";

/**
 * Locale-aware number and currency formatting that follows the APP's language
 * (i18next), never the operating system's locale.
 *
 * Why this exists: `new Intl.NumberFormat(undefined, …)` means "use the
 * runtime/OS default locale". On a machine whose OS locale is Arabic, an
 * English UI then rendered Arabic-Indic digits and Arabic currency placement
 * (e.g. "١٬٤٩٩ US$" instead of "$1,499"). Every price/number in the UI must go
 * through these helpers so the UI language is the single source of truth
 * (MASTER_SPEC §90: prices use Intl.NumberFormat, formatted consistently).
 *
 * The language is read at call time, so a component that re-renders on
 * language change (anything using `useTranslation`) picks up the new locale.
 */

const FALLBACK_LOCALE = "en";

/** The locale to format with: the current i18n language, or "en" if unavailable/invalid. */
export function getFormatLocale(): string {
  const language = i18n.resolvedLanguage || i18n.language;
  if (!language) return FALLBACK_LOCALE;
  try {
    // Throws RangeError for a malformed tag; never let formatting crash a page.
    return Intl.getCanonicalLocales(language)[0] ?? FALLBACK_LOCALE;
  } catch {
    return FALLBACK_LOCALE;
  }
}

/**
 * Format a monetary amount in the UI language, e.g. `formatCurrency(1499, "USD")`
 * → "$1,499" (en) with `{ maximumFractionDigits: 0 }`. Extra Intl options
 * (such as `maximumFractionDigits`) may be passed; `style` and `currency` are
 * always set by this function.
 */
export function formatCurrency(
  amount: number,
  currency: string,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">
): string {
  return new Intl.NumberFormat(getFormatLocale(), { ...options, style: "currency", currency }).format(amount);
}

/** Format a plain number (counts, quantities) in the UI language. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getFormatLocale(), options).format(value);
}

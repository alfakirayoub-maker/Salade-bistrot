import type { Locale } from "@/lib/menu/types";

/** Prices are integer MAD; Morocco uses Western digits in both languages. */
export const formatMAD = (amount: number, locale: Locale | string) =>
  locale === "ar" ? `${amount} درهم` : `${amount} MAD`;

/**
 * Signed amount ("+15 MAD"). Wrapped in a left-to-right isolate so the sign
 * stays before the number inside Arabic (RTL) text.
 */
export const formatDelta = (amount: number, locale: Locale | string) =>
  `\u2066${amount > 0 ? "+" : amount < 0 ? "−" : ""}${formatMAD(Math.abs(amount), locale)}\u2069`;

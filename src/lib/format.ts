import type { Locale } from "@/lib/menu/types";

/** Prices are integer MAD; Morocco uses Western digits in both languages. */
export const formatMAD = (amount: number, locale: Locale | string) =>
  locale === "ar" ? `${amount} درهم` : `${amount} MAD`;

export const formatDelta = (amount: number, locale: Locale | string) =>
  `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${formatMAD(Math.abs(amount), locale)}`;

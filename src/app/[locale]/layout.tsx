import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Sans_Arabic, Instrument_Serif, Noto_Naskh_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeDirection, routing } from "@/i18n/routing";
import "../globals.css";

// Latin: DM Sans (UI, optical sizes) + Instrument Serif (editorial moments).
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-dm-sans", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
// Arabic: IBM Plex Sans Arabic (UI) + Noto Naskh Arabic (display headings).
// Not preloaded: they are only fetched on /ar pages where they are used.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
});
const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
  variable: "--font-naskh",
  display: "swap",
  preload: false,
});

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export const viewport: Viewport = { themeColor: "#f7f5ef", width: "device-width", initialScale: 1, viewportFit: "cover" };

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("title"), template: `%s · Bistrot Salad Bar` },
    description: t("description"),
    icons: { icon: "/brand/logo-mark.png" },
    alternates: { languages: { fr: "/fr", ar: "/ar" } },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={localeDirection(locale)} className={`${dmSans.variable} ${instrumentSerif.variable} ${plexArabic.variable} ${naskh.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

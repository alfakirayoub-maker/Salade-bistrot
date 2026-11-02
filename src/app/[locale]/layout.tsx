import type { Metadata, Viewport } from "next";
import { Baloo_2, Baloo_Bhaijaan_2, Bebas_Neue, DM_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeDirection, routing } from "@/i18n/routing";
import "../globals.css";

// UI text: DM Sans (Latin) and IBM Plex Sans Arabic.
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-dm-sans", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
});
// Headings and formula names: Baloo 2, and its Arabic sibling Baloo Bhaijaan 2.
const baloo = Baloo_2({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], variable: "--font-baloo", display: "swap" });
const balooArabic = Baloo_Bhaijaan_2({
  subsets: ["arabic"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo-arabic",
  display: "swap",
  preload: false,
});
// Formula prices, like "59 DHS" on the printed menu.
const bebas = Bebas_Neue({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-bebas", display: "swap" });

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
    <html lang={locale} dir={localeDirection(locale)} className={`${dmSans.variable} ${plexArabic.variable} ${baloo.variable} ${balooArabic.variable} ${bebas.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

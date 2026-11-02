import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeDirection, routing } from "@/i18n/routing";
import { fontVariables } from "@/app/fonts";
import { getMenuItems } from "@/lib/menu/source";
import { MenuProvider } from "@/lib/menu/MenuProvider";
import "../globals.css";

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
  const items = await getMenuItems();

  return (
    <html lang={locale} dir={localeDirection(locale)} className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <MenuProvider items={items}>{children}</MenuProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

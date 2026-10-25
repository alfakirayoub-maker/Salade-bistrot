import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/cart/CartView";

export async function generateMetadata({ params }: PageProps<"/[locale]/panier">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title") };
}

export default async function CartPage({ params }: PageProps<"/[locale]/panier">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartView />;
}

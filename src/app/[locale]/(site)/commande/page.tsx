import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Confirmation } from "@/components/cart/Confirmation";

export async function generateMetadata({ params }: PageProps<"/[locale]/commande">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirmation" });
  return { title: t("title") };
}

export default async function ConfirmationPage({ params }: PageProps<"/[locale]/commande">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Confirmation />;
}

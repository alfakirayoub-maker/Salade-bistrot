import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComposerClient } from "./ComposerClient";

export async function generateMetadata({ params }: PageProps<"/[locale]/composer">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("composerTitle") };
}

export default async function ComposerPage({ params }: PageProps<"/[locale]/composer">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <ComposerClient />
    </Suspense>
  );
}

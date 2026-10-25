"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, start] = useTransition();
  const other = locale === "fr" ? "ar" : "fr";

  return (
    <button
      type="button"
      lang={other}
      aria-label={t("switchLanguage")}
      disabled={pending}
      onClick={() =>
        start(() => {
          const qs = search.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: other, scroll: false });
        })
      }
      className={`inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors ${
        tone === "dark" ? "bg-white/10 text-white hover:bg-white/20" : "bg-stone text-ink hover:bg-line"
      }`}
    >
      {other === "ar" ? "العربية" : "Français"}
    </button>
  );
}

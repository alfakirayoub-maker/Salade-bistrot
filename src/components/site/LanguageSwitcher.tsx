"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

/** Compact language toggle. The builder keeps its draft across the switch (see Builder). */
export function LanguageSwitcher() {
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
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[14px] font-medium text-ink transition-colors hover:bg-stone disabled:opacity-50 ${
        other === "ar" ? "font-[family-name:var(--font-plex-arabic)] text-[15px]" : ""
      }`}
    >
      {other === "ar" ? "العربية" : "FR"}
    </button>
  );
}

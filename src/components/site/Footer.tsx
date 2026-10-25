import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { INSTAGRAM_HANDLE, RESTAURANT_ADDRESS } from "@/lib/menu/data";
import type { Locale } from "@/lib/menu/types";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale() as Locale;
  return (
    <footer className="mt-20 bg-ink text-white/75 sm:mt-28 max-lg:[body:has(.has-bottom-bar)_&]:pb-24">
      <div className="mx-auto max-w-7xl px-5 pb-[calc(2.5rem+var(--safe-bottom))] pt-12 sm:px-6 sm:py-16">
        <p className="t-h2 max-w-md text-white">{t("slogan")}</p>
        <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 text-[14px] sm:grid-cols-3">
          <div>
            <p className="t-eyebrow text-white/50">{t("visit")}</p>
            <p className="mt-3 leading-relaxed">{RESTAURANT_ADDRESS[locale]}</p>
            <p className="mt-1" dir="ltr">
              {INSTAGRAM_HANDLE}
            </p>
          </div>
          <div>
            <p className="t-eyebrow text-white/50">{t("order")}</p>
            <p className="mt-3">{t("whatsapp")}</p>
            <p className="t-price mt-1 text-xl text-white" dir="ltr">
              06 91 32 24 55
            </p>
          </div>
          <div className="flex gap-5 sm:flex-col sm:gap-2">
            <Link href="/composer" className="font-medium text-leaf hover:text-white">
              {t("compose")}
            </Link>
            <Link href="/menu" className="font-medium hover:text-white">
              {t("menu")}
            </Link>
          </div>
        </div>
        <p className="mt-10 text-[12px] text-white/40">{t("prototype")}</p>
      </div>
    </footer>
  );
}

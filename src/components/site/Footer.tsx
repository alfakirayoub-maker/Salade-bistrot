import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { INSTAGRAM_HANDLE, RESTAURANT_ADDRESS } from "@/lib/menu/data";
import type { Locale } from "@/lib/menu/types";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale() as Locale;
  return (
    <footer className="mt-24 bg-ink text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold uppercase tracking-[0.12em] text-white" dir="ltr">
            Bistrot <span className="text-leaf">Salad</span> Bar
          </p>
          <p className="mt-3 max-w-xs text-sm">{t("slogan")}</p>
        </div>
        <div className="text-sm">
          <p className="font-bold text-white">{t("visit")}</p>
          <p className="mt-2">{RESTAURANT_ADDRESS[locale]}</p>
          <p className="mt-1" dir="ltr">
            {INSTAGRAM_HANDLE}
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold text-white">{t("order")}</p>
          <p className="mt-2">{t("whatsapp")}</p>
          <p className="mt-1 text-lg font-extrabold text-white" dir="ltr">
            06 91 32 24 55
          </p>
          <div className="mt-4 flex gap-4">
            <Link href="/composer" className="font-semibold text-leaf hover:text-white">
              {t("compose")}
            </Link>
            <Link href="/menu" className="font-semibold hover:text-white">
              {t("menu")}
            </Link>
          </div>
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-white/50">{t("prototype")}</p>
    </footer>
  );
}

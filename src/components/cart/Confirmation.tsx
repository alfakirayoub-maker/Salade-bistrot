"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/menu/data";
import { whatsappUrl } from "@/lib/cart/order";
import { cart } from "@/lib/cart/store";
import { formatMAD } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { LAST_ORDER_KEY } from "./CartView";

const read = () => {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
};

export function Confirmation() {
  const t = useTranslations("confirmation");
  const locale = useLocale();
  const raw = useSyncExternalStore(() => () => {}, read, () => null);
  const last = raw ? (JSON.parse(raw) as { message: string; total: number }) : null;

  return (
    <main className="mx-auto max-w-xl px-4 pt-16 text-center sm:px-6">
      <CheckCircle2 size={56} className="mx-auto text-leaf" aria-hidden />
      <h1 className="display mt-4 text-4xl">{t("title")}</h1>
      <p className="mt-3 text-ink-soft">{t("text")}</p>
      {last && (
        <>
          <p className="mt-6 text-sm text-mute">{t("total")}</p>
          <p className="text-3xl font-extrabold tabular-nums">{formatMAD(last.total, locale)}</p>
          <a href={whatsappUrl(WHATSAPP_NUMBER, last.message)} target="_blank" rel="noopener" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-white">
            <MessageCircle size={18} aria-hidden /> {t("resend")}
          </a>
        </>
      )}
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/composer" onClick={() => cart.clear()} className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 font-bold text-white">
          {t("newOrder")}
        </Link>
        <Link href="/panier" className="inline-flex h-12 items-center justify-center rounded-full bg-stone px-6 font-bold">
          {t("backToCart")}
        </Link>
      </div>
    </main>
  );
}

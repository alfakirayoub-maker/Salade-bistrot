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
    <main className="mx-auto max-w-md px-5 pt-14 text-center sm:px-6">
      <CheckCircle2 size={52} strokeWidth={1.5} className="mx-auto text-leaf-deep" aria-hidden />
      <h1 className="t-h1 mt-5">{t("title")}</h1>
      <p className="t-body mt-3 text-ink-soft">{t("text")}</p>
      {last && (
        <>
          <p className="t-small mt-8 text-mute">{t("total")}</p>
          <p className="t-price text-[32px]">{formatMAD(last.total, locale)}</p>
          <a href={whatsappUrl(WHATSAPP_NUMBER, last.message)} target="_blank" rel="noopener" className="btn mt-6 w-full bg-[#1fae55] text-white hover:bg-[#189048]">
            <MessageCircle size={18} aria-hidden /> {t("resend")}
          </a>
        </>
      )}
      <div className="mt-3 grid gap-2">
        <Link href="/composer" onClick={() => cart.clear()} className="btn btn-primary">
          {t("newOrder")}
        </Link>
        <Link href="/panier" className="btn btn-ghost">
          {t("backToCart")}
        </Link>
      </div>
    </main>
  );
}

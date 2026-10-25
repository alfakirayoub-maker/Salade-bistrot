"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Pencil, Plus, Trash2, MessageCircle, ArrowLeft } from "lucide-react";
import { FORMULAS_BY_ID, ITEMS_BY_ID, WHATSAPP_NUMBER } from "@/lib/menu/data";
import { DEFAULT_POLICY } from "@/lib/menu/policies";
import { CATEGORIES, type Locale } from "@/lib/menu/types";
import { cart, useCart } from "@/lib/cart/store";
import { buildWhatsAppMessage, priceOrder, whatsappUrl, type CustomerInfo } from "@/lib/cart/order";
import { formatMAD } from "@/lib/format";
import { Link, useRouter } from "@/i18n/navigation";
import { SaladBowl } from "@/components/bowl/SaladBowl";

export const LAST_ORDER_KEY = "bsb-last-order";

export function CartView() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const lines = useCart();
  const order = useMemo(() => priceOrder(lines, FORMULAS_BY_ID, ITEMS_BY_ID, DEFAULT_POLICY), [lines]);
  const [customer, setCustomer] = useState<CustomerInfo>({ name: "", phone: "", mode: "pickup", address: "", notes: "" });
  const [reviewing, setReviewing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customer.name.trim()) e.name = t("errors.name");
    if (customer.mode === "delivery" && !customer.address?.trim()) e.address = t("errors.address");
    if (!order.valid) e.order = t("errors.invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const message = useMemo(() => buildWhatsAppMessage(order, customer, ITEMS_BY_ID, locale), [order, customer, locale]);

  const send = () => {
    if (!validate()) return;
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ message, total: order.total, at: Date.now() }));
    } catch {
      // Confirmation page falls back to a generic message.
    }
    window.open(whatsappUrl(WHATSAPP_NUMBER, message), "_blank", "noopener");
    router.push("/commande");
  };

  if (!lines.length) {
    return (
      <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-5 text-center">
        <h1 className="t-h1">{t("emptyTitle")}</h1>
        <p className="t-body mt-3 text-ink-soft">{t("emptyText")}</p>
        <Link href="/composer" className="btn btn-leaf mt-8 min-h-14 w-full sm:w-auto">
          {t("compose")}
        </Link>
      </main>
    );
  }

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-[calc(112px+var(--safe-bottom))] pt-6 sm:px-6 sm:pt-10 lg:pb-0">
      <h1 className="t-h1">{t("title")}</h1>
      <p className="t-small mt-2 text-mute">{t("count", { count })}</p>

      <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <ul className="grid gap-3">
            {order.lines.map((l, idx) => {
              const line = lines[idx];
              return (
                <li key={line.id} className="card p-4">
                  <div className="flex gap-3.5">
                    <div className="w-[76px] shrink-0 sm:w-24">
                      <SaladBowl selection={line.selection} mode="static" density={0.6} label={t("bowlAlt")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="t-title">{l.formula?.name[locale] ?? l.formulaId}</h2>
                          {line.name && <p className="t-small mt-0.5 truncate text-leaf-deep">« {line.name} »</p>}
                        </div>
                        <p className="t-price shrink-0 text-[17px]">{formatMAD(l.lineTotal, locale)}</p>
                      </div>
                      <p className="t-small mt-1.5 line-clamp-3 text-ink-soft">
                        {CATEGORIES.flatMap((c) => line.selection[c]).map((id) => ITEMS_BY_ID[id]?.name[locale] ?? id).join(" · ")}
                      </p>
                      {!l.valid && <p className="t-small mt-2 font-medium text-red-700">{t("lineInvalid")}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
                    <div className="inline-flex items-center rounded-full bg-stone/70">
                      <button type="button" onClick={() => cart.setQuantity(line.id, line.quantity - 1)} disabled={line.quantity <= 1} className="icon-btn disabled:opacity-30" aria-label={t("decrease")}>
                        <Minus size={16} aria-hidden />
                      </button>
                      <span className="t-num w-6 text-center text-[15px] font-semibold" aria-live="polite">
                        {line.quantity}
                      </span>
                      <button type="button" onClick={() => cart.setQuantity(line.id, line.quantity + 1)} className="icon-btn" aria-label={t("increase")}>
                        <Plus size={16} aria-hidden />
                      </button>
                    </div>
                    <span className="t-small t-num ms-2 text-mute">× {formatMAD(l.unitPrice, locale)}</span>
                    <Link href={`/composer?modifier=${line.id}`} className="icon-btn ms-auto text-ink-soft" aria-label={`${t("edit")} — ${l.formula?.name[locale] ?? ""}`}>
                      <Pencil size={17} strokeWidth={1.75} aria-hidden />
                    </Link>
                    <button type="button" onClick={() => cart.remove(line.id)} className="icon-btn text-red-700 hover:bg-red-50" aria-label={`${t("remove")} — ${l.formula?.name[locale] ?? ""}`}>
                      <Trash2 size={17} strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href="/composer" className="btn btn-ghost mt-3 w-full border-dashed sm:w-auto">
            <Plus size={16} aria-hidden /> {t("addAnother")}
          </Link>
        </div>

        <section className="card p-5 lg:sticky lg:top-24" aria-labelledby="checkout">
          {!reviewing ? (
            <form
              id="checkout-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (validate()) setReviewing(true);
              }}
            >
              <h2 id="checkout" className="t-h3">
                {t("checkout")}
              </h2>
              <label className="mt-5 block">
                <span className="t-label">{t("name")} *</span>
                <input className="field" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <span className="t-small mt-1 block text-red-700">{errors.name}</span>}
              </label>
              <label className="mt-4 block">
                <span className="t-label">{t("phone")}</span>
                <input className="field" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" />
              </label>
              <fieldset className="mt-4">
                <legend className="t-label">{t("mode")}</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-2xl bg-stone/70 p-1">
                  {(["pickup", "delivery"] as const).map((m) => (
                    <label
                      key={m}
                      className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-[14px] font-medium transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-leaf-deep ${
                        customer.mode === m ? "bg-white text-ink shadow-[0_2px_8px_-4px_rgba(0,0,0,0.25)]" : "text-ink-soft"
                      }`}
                    >
                      <input type="radio" name="mode" value={m} checked={customer.mode === m} onChange={() => setCustomer({ ...customer, mode: m })} className="sr-only" />
                      {t(m)}
                    </label>
                  ))}
                </div>
                {customer.mode === "delivery" && <p className="t-small mt-2 text-mute">{t("deliveryNote")}</p>}
              </fieldset>
              {customer.mode === "delivery" && (
                <label className="mt-4 block">
                  <span className="t-label">{t("address")} *</span>
                  <input className="field" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} autoComplete="street-address" aria-invalid={!!errors.address} />
                  {errors.address && <span className="t-small mt-1 block text-red-700">{errors.address}</span>}
                </label>
              )}
              <label className="mt-4 block">
                <span className="t-label">{t("notes")}</span>
                <textarea className="field min-h-20 py-3" value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} />
              </label>
              <div className="mt-5 hidden items-baseline justify-between border-t border-line pt-4 lg:flex">
                <span className="font-medium">{t("total")}</span>
                <span className="t-price text-[26px]">{formatMAD(order.total, locale)}</span>
              </div>
              {errors.order && <p className="t-small mt-2 text-red-700">{errors.order}</p>}
              <button type="submit" className="btn btn-primary mt-4 hidden min-h-14 w-full lg:inline-flex">
                {t("review")}
              </button>
            </form>
          ) : (
            <div>
              <button type="button" onClick={() => setReviewing(false)} className="-ms-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-ink-soft hover:text-ink">
                <ArrowLeft size={16} className="flip-rtl" aria-hidden /> {t("back")}
              </button>
              <h2 id="checkout" className="t-h3 mt-2">
                {t("reviewTitle")}
              </h2>
              <p className="t-small mt-1 text-ink-soft">{t("reviewText")}</p>
              <pre className="mt-4 max-h-[46dvh] overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-4 font-sans text-[13.5px] leading-relaxed shadow-[inset_0_0_0_1px_var(--color-line)]">{message}</pre>
              <div className="mt-4 hidden items-baseline justify-between lg:flex">
                <span className="font-medium">{t("total")}</span>
                <span className="t-price text-[26px]">{formatMAD(order.total, locale)}</span>
              </div>
              <button type="button" onClick={send} className="btn mt-4 hidden min-h-14 w-full bg-[#1fae55] text-white hover:bg-[#189048] lg:inline-flex">
                <MessageCircle size={20} aria-hidden /> {t("send")}
              </button>
              <p className="t-small mt-3 text-center text-mute">{t("sendNote")}</p>
            </div>
          )}
        </section>
      </div>

      {/* Mobile: total + primary action always in the thumb zone. */}
      <div className="has-bottom-bar fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 bg-paper/88 px-4 pb-[max(12px,var(--safe-bottom))] pt-3 shadow-[0_-1px_0_var(--color-line)] backdrop-blur-xl lg:hidden">
        <div className="shrink-0">
          <p className="text-[11.5px] text-mute">{t("total")}</p>
          <p className="t-price text-[20px] leading-tight">{formatMAD(order.total, locale)}</p>
        </div>
        {!reviewing ? (
          <button type="submit" form="checkout-form" className="btn btn-primary min-h-14 flex-1">
            {t("review")}
          </button>
        ) : (
          <button type="button" onClick={send} className="btn min-h-14 flex-1 bg-[#1fae55] text-white hover:bg-[#189048]">
            <MessageCircle size={19} aria-hidden /> {t("send")}
          </button>
        )}
      </div>
    </main>
  );
}

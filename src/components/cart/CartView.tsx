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
  const tc = useTranslations("categories");
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
      <main className="mx-auto max-w-2xl px-4 pt-20 text-center sm:px-6">
        <h1 className="display text-4xl">{t("emptyTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("emptyText")}</p>
        <Link href="/composer" className="mt-8 inline-flex h-14 items-center rounded-full bg-leaf px-8 font-extrabold text-white hover:bg-leaf-deep">
          {t("compose")}
        </Link>
      </main>
    );
  }

  const field = "mt-1.5 h-12 w-full rounded-xl bg-white px-4 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-leaf";

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="display text-4xl sm:text-5xl">{t("title")}</h1>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <ul className="grid min-w-0 gap-4">
          {order.lines.map((l, idx) => {
            const line = lines[idx];
            return (
              <li key={line.id} className="flex gap-4 rounded-3xl bg-white p-4 ring-1 ring-line sm:p-5">
                <div className="w-24 shrink-0 sm:w-32">
                  <SaladBowl selection={line.selection} mode="static" density={0.6} label={t("bowlAlt")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-extrabold uppercase tracking-wide">{l.formula?.name[locale] ?? l.formulaId}</h2>
                      {line.name && <p className="text-sm font-semibold text-leaf-deep">« {line.name} »</p>}
                    </div>
                    <p className="shrink-0 text-lg font-extrabold tabular-nums">{formatMAD(l.lineTotal, locale)}</p>
                  </div>
                  <dl className="mt-2 grid gap-0.5 text-[13px] text-ink-soft">
                    {CATEGORIES.filter((c) => line.selection[c].length).map((c) => (
                      <div key={c} className="flex gap-2">
                        <dt className="shrink-0 font-bold">{tc(`${c}.plural`)}:</dt>
                        <dd className="min-w-0 truncate">{line.selection[c].map((id) => ITEMS_BY_ID[id]?.name[locale] ?? id).join(", ")}</dd>
                      </div>
                    ))}
                  </dl>
                  {!l.valid && <p className="mt-2 text-xs font-semibold text-red-700">{t("lineInvalid")}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-full bg-stone/70">
                      <button type="button" onClick={() => cart.setQuantity(line.id, line.quantity - 1)} disabled={line.quantity <= 1} className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-30" aria-label={t("decrease")}>
                        <Minus size={14} aria-hidden />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">
                        {line.quantity}
                      </span>
                      <button type="button" onClick={() => cart.setQuantity(line.id, line.quantity + 1)} className="grid h-9 w-9 place-items-center rounded-full" aria-label={t("increase")}>
                        <Plus size={14} aria-hidden />
                      </button>
                    </div>
                    <span className="text-xs text-mute">× {formatMAD(l.unitPrice, locale)}</span>
                    <Link href={`/composer?modifier=${line.id}`} className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-stone">
                      <Pencil size={14} aria-hidden /> {t("edit")}
                    </Link>
                    <button type="button" onClick={() => cart.remove(line.id)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                      <Trash2 size={14} aria-hidden /> {t("remove")}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          <li>
            <Link href="/composer" className="inline-flex items-center gap-2 text-sm font-bold text-leaf-deep">
              <Plus size={16} aria-hidden /> {t("addAnother")}
            </Link>
          </li>
        </ul>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-line lg:sticky lg:top-24" aria-labelledby="checkout">
          {!reviewing ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (validate()) setReviewing(true);
              }}
            >
              <h2 id="checkout" className="text-lg font-extrabold">
                {t("checkout")}
              </h2>
              <label className="mt-4 block text-sm font-semibold">
                {t("name")} *
                <input className={field} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <span className="mt-1 block text-xs text-red-700">{errors.name}</span>}
              </label>
              <label className="mt-3 block text-sm font-semibold">
                {t("phone")}
                <input className={field} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} type="tel" autoComplete="tel" dir="ltr" />
              </label>
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold">{t("mode")}</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(["pickup", "delivery"] as const).map((m) => (
                    <label key={m} className={`flex h-12 cursor-pointer items-center justify-center rounded-xl text-sm font-bold ring-1 transition ${customer.mode === m ? "bg-mist text-leaf-deep ring-leaf" : "bg-white ring-line"}`}>
                      <input type="radio" name="mode" value={m} checked={customer.mode === m} onChange={() => setCustomer({ ...customer, mode: m })} className="sr-only" />
                      {t(m)}
                    </label>
                  ))}
                </div>
                {customer.mode === "delivery" && <p className="mt-2 text-xs text-mute">{t("deliveryNote")}</p>}
              </fieldset>
              {customer.mode === "delivery" && (
                <label className="mt-3 block text-sm font-semibold">
                  {t("address")} *
                  <input className={field} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} autoComplete="street-address" aria-invalid={!!errors.address} />
                  {errors.address && <span className="mt-1 block text-xs text-red-700">{errors.address}</span>}
                </label>
              )}
              <label className="mt-3 block text-sm font-semibold">
                {t("notes")}
                <textarea className={`${field} h-20 py-3`} value={customer.notes} onChange={(e) => setCustomer({ ...customer, notes: e.target.value })} />
              </label>
              <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
                <span className="font-bold">{t("total")}</span>
                <span className="text-2xl font-extrabold tabular-nums">{formatMAD(order.total, locale)}</span>
              </div>
              {errors.order && <p className="mt-2 text-xs text-red-700">{errors.order}</p>}
              <button type="submit" className="mt-4 h-13 w-full rounded-full bg-ink font-extrabold text-white hover:bg-leaf-deep">
                {t("review")}
              </button>
            </form>
          ) : (
            <div>
              <button type="button" onClick={() => setReviewing(false)} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink">
                <ArrowLeft size={16} className="flip-rtl" aria-hidden /> {t("back")}
              </button>
              <h2 id="checkout" className="mt-3 text-lg font-extrabold">
                {t("reviewTitle")}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">{t("reviewText")}</p>
              <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-paper p-4 font-sans text-[13px] leading-relaxed ring-1 ring-line">{message}</pre>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-bold">{t("total")}</span>
                <span className="text-2xl font-extrabold tabular-nums">{formatMAD(order.total, locale)}</span>
              </div>
              <button type="button" onClick={send} className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] font-extrabold text-white shadow-lg hover:brightness-95">
                <MessageCircle size={20} aria-hidden /> {t("send")}
              </button>
              <p className="mt-3 text-center text-xs text-mute">{t("sendNote")}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

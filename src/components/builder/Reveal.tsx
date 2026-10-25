"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Check, Pencil, Plus, ShoppingBag } from "lucide-react";
import gsap from "gsap";
import { ITEMS_BY_ID } from "@/lib/menu/data";
import { CATEGORIES, type Formula, type Locale, type Selection } from "@/lib/menu/types";
import type { PriceBreakdown } from "@/lib/pricing/engine";
import { cart } from "@/lib/cart/store";
import { formatMAD } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { SaladBowl } from "@/components/bowl/SaladBowl";
import { PriceLines } from "./Summary";

export function Reveal({
  formula,
  selection,
  breakdown,
  name,
  onName,
  editing,
  onEdit,
  onAdded,
  onRestart,
}: {
  formula: Formula;
  selection: Selection;
  breakdown: PriceBreakdown;
  name: string;
  onName: (v: string) => void;
  editing: string | null;
  onEdit: () => void;
  onAdded: (id: string) => void;
  onRestart: () => void;
}) {
  const t = useTranslations("reveal");
  const tc = useTranslations("categories");
  const locale = useLocale() as Locale;
  const reduced = usePrefersReducedMotion();
  const [added, setAdded] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !textRef.current) return;
    const tween = gsap.from(textRef.current.children, { opacity: 0, y: 24, duration: 0.9, stagger: 0.08, ease: "expo.out", delay: 0.35 });
    return () => {
      tween.revert();
    };
  }, [reduced]);

  const add = () => {
    const line = { formulaId: formula.id, selection, name: name.trim() };
    if (editing) {
      cart.replace(editing, line);
    } else {
      onAdded(cart.add(line));
    }
    setAdded(true);
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_50%_20%,#ffffff_0%,var(--color-paper)_55%,#e9efe2_100%)]">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-16 pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-14">
        <div className="relative mx-auto w-[min(86vw,560px)]">
          <SaladBowl selection={selection} mode="static" celebrate label={t("bowlAlt")} />
        </div>

        <div ref={textRef}>
          <button type="button" onClick={onEdit} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-ink">
            <ArrowLeft size={16} className="flip-rtl" aria-hidden />
            {t("back")}
          </button>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf-deep">{formula.name[locale]}</p>
          <h1 className="display mt-2 text-4xl leading-[1.05] sm:text-5xl">{t("title")}</h1>

          <label className="mt-5 block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-mute">{t("nameLabel")}</span>
            <input
              value={name}
              maxLength={40}
              onChange={(e) => onName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="mt-1.5 h-11 w-full rounded-xl bg-white px-4 text-[15px] font-semibold outline-none ring-1 ring-line focus:ring-2 focus:ring-leaf"
            />
          </label>

          <ul className="mt-5 grid gap-2 text-sm">
            {CATEGORIES.filter((c) => selection[c].length).map((c) => (
              <li key={c} className="flex gap-3">
                <span className="w-28 shrink-0 font-bold text-ink-soft">{tc(`${c}.plural`)}</span>
                <span>{selection[c].map((id) => ITEMS_BY_ID[id]?.name[locale]).join(" · ")}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl bg-white/80 p-4 ring-1 ring-line">
            <PriceLines formula={formula} breakdown={breakdown} />
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={add}
              disabled={added}
              className={`inline-flex h-14 items-center justify-center gap-2 rounded-full text-base font-extrabold text-white shadow-[0_14px_30px_-12px_rgba(95,154,31,0.9)] transition-colors ${
                added ? "bg-leaf-deep" : "bg-leaf hover:bg-leaf-deep"
              }`}
            >
              {added ? <Check size={20} aria-hidden /> : <ShoppingBag size={20} aria-hidden />}
              {added ? (editing ? t("updated") : t("added")) : editing ? t("update") : t("addToCart")}
              <span className="ms-1 rounded-full bg-white/20 px-2.5 py-1 text-sm tabular-nums">{formatMAD(breakdown.total, locale)}</span>
            </button>
            <button type="button" onClick={onEdit} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-6 font-bold ring-1 ring-line hover:ring-ink">
              <Pencil size={16} aria-hidden />
              {t("modify")}
            </button>
          </div>

          {added && (
            <div className="rise mt-4 grid gap-2 sm:grid-cols-2" role="status">
              <Link href="/panier" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-bold text-white">
                {t("viewCart")}
              </Link>
              <button type="button" onClick={onRestart} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone font-bold hover:bg-line">
                <Plus size={16} aria-hidden />
                {t("another")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

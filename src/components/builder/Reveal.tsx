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

  const addLabel = added ? (editing ? t("updated") : t("added")) : editing ? t("update") : t("addToCart");

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_50%_18%,#ffffff_0%,var(--color-paper)_58%)] pb-[calc(96px+var(--safe-bottom))] lg:pb-16">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-2 sm:px-4">
        <button type="button" onClick={onEdit} className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-ink-soft hover:bg-stone hover:text-ink">
          <ArrowLeft size={18} strokeWidth={1.75} className="flip-rtl" aria-hidden />
          {t("back")}
        </button>
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-5 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="relative mx-auto w-[min(70vw,38dvh,560px)] py-3 lg:w-[min(46vw,560px)] lg:py-8">
          <SaladBowl selection={selection} mode="static" celebrate label={t("bowlAlt")} />
        </div>

        <div ref={textRef} className="lg:max-w-md">
          <p className="t-eyebrow text-leaf-deep">{formula.name[locale]}</p>
          <h1 className="t-h1 mt-3">{t("title")}</h1>

          <label className="mt-6 block">
            <span className="t-label text-ink-soft">{t("nameLabel")}</span>
            <input value={name} maxLength={40} onChange={(e) => onName(e.target.value)} placeholder={t("namePlaceholder")} className="field" />
          </label>

          <dl className="mt-6 divide-y divide-line border-y border-line">
            {CATEGORIES.filter((c) => selection[c].length).map((c) => (
              <div key={c} className="flex gap-4 py-3 text-[14px]">
                <dt className="w-24 shrink-0 font-medium text-mute">{tc(`${c}.plural`)}</dt>
                <dd className="min-w-0 text-ink">{selection[c].map((id) => ITEMS_BY_ID[id]?.name[locale]).join(" · ")}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <PriceLines formula={formula} breakdown={breakdown} />
          </div>

          {/* Desktop actions (mobile uses the sticky bar below). */}
          <div className="mt-6 hidden gap-2 lg:grid lg:grid-cols-[1fr_auto]">
            <AddButton added={added} label={addLabel} total={formatMAD(breakdown.total, locale)} onClick={add} />
            <button type="button" onClick={onEdit} className="btn btn-ghost min-h-14">
              <Pencil size={16} aria-hidden />
              {t("modify")}
            </button>
          </div>

          {added && (
            <div className="rise mt-4 grid gap-2 sm:grid-cols-2" role="status">
              <Link href="/panier" className="btn btn-primary">
                {t("viewCart")}
              </Link>
              <button type="button" onClick={onRestart} className="btn btn-ghost">
                <Plus size={16} aria-hidden />
                {t("another")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 bg-paper/88 px-4 pb-[max(12px,var(--safe-bottom))] pt-3 shadow-[0_-1px_0_var(--color-line)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={onEdit} aria-label={t("modify")} className="icon-btn h-14 w-14 shrink-0 bg-cream shadow-[inset_0_0_0_1px_var(--color-line)]">
          <Pencil size={18} strokeWidth={1.75} aria-hidden />
        </button>
        <AddButton added={added} label={addLabel} total={formatMAD(breakdown.total, locale)} onClick={add} />
      </div>
    </div>
  );
}

function AddButton({ added, label, total, onClick }: { added: boolean; label: string; total: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={added}
      className={`flex h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-full pe-5 ps-5 text-white transition-[transform,background-color] duration-300 active:scale-[0.985] ${
        added ? "bg-ink" : "bg-leaf-deep shadow-[0_14px_28px_-16px_rgba(61,110,16,0.95)] hover:bg-leaf-ink"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2 text-[15.5px] font-semibold">
        {added ? <Check size={19} className="shrink-0" aria-hidden /> : <ShoppingBag size={19} strokeWidth={1.75} className="shrink-0" aria-hidden />}
        <span className="truncate">{label}</span>
      </span>
      <span className="t-price shrink-0 text-[16px]">{total}</span>
    </button>
  );
}

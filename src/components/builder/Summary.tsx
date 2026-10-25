"use client";

import { Pencil, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ITEMS_BY_ID } from "@/lib/menu/data";
import { CATEGORIES, type Category, type Formula, type Locale, type Selection } from "@/lib/menu/types";
import type { PriceBreakdown } from "@/lib/pricing/engine";
import { formatMAD } from "@/lib/format";

/** Price lines grouped for display: formula, premiums, extra slots. */
export function PriceLines({ formula, breakdown }: { formula: Formula; breakdown: PriceBreakdown }) {
  const t = useTranslations("builder");
  const tc = useTranslations("categories");
  const locale = useLocale() as Locale;
  const premiums = breakdown.lines.filter((l) => l.kind === "premium");
  const extras = CATEGORIES.map((c) => {
    const lines = breakdown.lines.filter((l) => l.kind === "extraSlot" && l.category === c);
    return { c, count: lines.length, amount: lines.reduce((s, l) => s + l.amount, 0) };
  }).filter((e) => e.count > 0);

  return (
    <dl className="grid gap-1.5 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-ink-soft">{formula.name[locale]}</dt>
        <dd className="font-semibold tabular-nums">{formatMAD(formula.price, locale)}</dd>
      </div>
      {premiums.map((l) =>
        l.kind === "premium" ? (
          <div key={`p-${l.itemId}`} className="flex justify-between gap-3">
            <dt className="text-ink-soft">
              {ITEMS_BY_ID[l.itemId].name[locale]} <span className="text-mute">· {t("premium")}</span>
            </dt>
            <dd className="font-semibold tabular-nums">+{formatMAD(l.amount, locale)}</dd>
          </div>
        ) : null,
      )}
      {extras.map((e) => (
        <div key={`e-${e.c}`} className="flex justify-between gap-3">
          <dt className="text-ink-soft">{t("extraLine", { count: e.count, category: tc(`${e.c}.plural`) })}</dt>
          <dd className="font-semibold tabular-nums">+{formatMAD(e.amount, locale)}</dd>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-line pt-3">
        <dt className="font-bold">{t("total")}</dt>
        <dd className="text-xl font-extrabold tabular-nums">{formatMAD(breakdown.total, locale)}</dd>
      </div>
    </dl>
  );
}

export function Summary({
  formula,
  selection,
  breakdown,
  onRemove,
  onStep,
  onChangeFormula,
}: {
  formula: Formula;
  selection: Selection;
  breakdown: PriceBreakdown;
  onRemove: (c: Category, id: string) => void;
  onStep: (i: number) => void;
  onChangeFormula: () => void;
}) {
  const t = useTranslations("builder");
  const tc = useTranslations("categories");
  const locale = useLocale() as Locale;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">{t("summaryTitle")}</p>
          <h2 className="mt-1 text-lg font-extrabold uppercase tracking-wide">{formula.name[locale]}</h2>
        </div>
        <button type="button" onClick={onChangeFormula} className="rounded-full bg-stone px-3 py-1.5 text-xs font-bold hover:bg-line">
          {t("changeFormula")}
        </button>
      </div>

      <ol className="mt-5 grid gap-4">
        {CATEGORIES.map((c, i) => {
          const s = breakdown.categories[c];
          const blocked = s.extraSlotFee === null && s.extra > 0;
          return (
            <li key={c}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                  {tc(`${c}.plural`)}{" "}
                  <span className={`tabular-nums ${blocked ? "text-red-600" : s.extra ? "text-leaf-deep" : "text-mute"}`}>
                    {s.selected}/{s.included}
                  </span>
                </h3>
                <button type="button" onClick={() => onStep(i)} className="inline-flex items-center gap-1 text-xs font-semibold text-mute hover:text-ink" aria-label={t("editStep", { step: tc(`${c}.plural`) })}>
                  <Pencil size={12} aria-hidden /> {t("edit")}
                </button>
              </div>
              {selection[c].length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {selection[c].map((id) => {
                    const item = ITEMS_BY_ID[id];
                    if (!item) return null;
                    const extra = s.extraItemIds.includes(id);
                    return (
                      <li key={id}>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full py-1 pe-1 ps-2.5 text-xs font-semibold ${
                            extra ? (blocked ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-mist text-leaf-deep ring-1 ring-leaf/40") : "bg-stone/70 text-ink"
                          }`}
                        >
                          {item.name[locale]}
                          {item.supplement > 0 && <span className="text-mute">+{item.supplement}</span>}
                          <button
                            type="button"
                            onClick={() => onRemove(c, id)}
                            className="grid h-5 w-5 place-items-center rounded-full hover:bg-black/10"
                            aria-label={t("remove", { name: item.name[locale] })}
                          >
                            <X size={12} aria-hidden />
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-1.5 text-xs text-mute">{c === "base" ? t("baseRequiredShort") : t("nothingYet")}</p>
              )}
              {blocked && <p className="mt-1.5 text-xs font-semibold text-red-700">{t("removeToContinue", { count: s.extra })}</p>}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-2xl bg-paper p-4 ring-1 ring-line">
        <PriceLines formula={formula} breakdown={breakdown} />
      </div>
    </div>
  );
}

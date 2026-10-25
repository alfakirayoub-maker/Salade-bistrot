"use client";

import { Pencil, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ITEMS_BY_ID } from "@/lib/menu/data";
import { CATEGORIES, type Category, type Formula, type Locale, type Selection } from "@/lib/menu/types";
import type { PriceBreakdown } from "@/lib/pricing/engine";
import { formatDelta, formatMAD } from "@/lib/format";

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
    <dl className="grid gap-2 text-[14px]">
      <div className="flex justify-between gap-3">
        <dt className="text-ink-soft">{formula.name[locale]}</dt>
        <dd className="t-num font-medium">{formatMAD(formula.price, locale)}</dd>
      </div>
      {premiums.map((l) =>
        l.kind === "premium" ? (
          <div key={`p-${l.itemId}`} className="flex justify-between gap-3">
            <dt className="text-ink-soft">
              {ITEMS_BY_ID[l.itemId].name[locale]} <span className="text-mute">· {t("premium")}</span>
            </dt>
            <dd className="t-num font-medium">{formatDelta(l.amount, locale)}</dd>
          </div>
        ) : null,
      )}
      {extras.map((e) => (
        <div key={`e-${e.c}`} className="flex justify-between gap-3">
          <dt className="text-ink-soft">{t("extraLine", { count: e.count, category: tc(`${e.c}.plural`) })}</dt>
          <dd className="t-num font-medium">{formatDelta(e.amount, locale)}</dd>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-line pt-3.5">
        <dt className="font-semibold">{t("total")}</dt>
        <dd className="t-price text-[22px]">{formatMAD(breakdown.total, locale)}</dd>
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
          <p className="t-eyebrow text-mute">{t("summaryTitle")}</p>
          <h2 className="t-h3 mt-1.5">{formula.name[locale]}</h2>
        </div>
        <button type="button" onClick={onChangeFormula} className="h-10 shrink-0 rounded-full bg-stone px-4 text-[13px] font-medium hover:bg-line">
          {t("changeFormula")}
        </button>
      </div>

      <ol className="mt-5 divide-y divide-line border-y border-line">
        {CATEGORIES.map((c, i) => {
          const s = breakdown.categories[c];
          const blocked = s.extraSlotFee === null && s.extra > 0;
          return (
            <li key={c} className="py-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="t-label font-semibold text-ink">
                  {tc(`${c}.plural`)}{" "}
                  <span className={`tabular-nums ${blocked ? "text-red-600" : s.extra ? "text-leaf-deep" : "text-mute"}`}>
                    {s.selected}/{s.included}
                  </span>
                </h3>
                <button type="button" onClick={() => onStep(i)} className="-me-2 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-[13px] text-mute hover:text-ink" aria-label={t("editStep", { step: tc(`${c}.plural`) })}>
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
                          className={`inline-flex items-center gap-1 rounded-full py-1 pe-1 ps-3 text-[13px] font-medium ${
                            extra ? (blocked ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-mist text-leaf-deep ring-1 ring-leaf/40") : "bg-stone/80 text-ink"
                          }`}
                        >
                          {item.name[locale]}
                          {item.supplement > 0 && (
                            <span className="text-mute" dir="ltr">
                              +{item.supplement}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemove(c, id)}
                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/10"
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
                <p className="t-small mt-1 text-mute">{c === "base" ? t("baseRequiredShort") : t("nothingYet")}</p>
              )}
              {blocked && <p className="mt-1.5 text-xs font-semibold text-red-700">{t("removeToContinue", { count: s.extra })}</p>}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
        <PriceLines formula={formula} breakdown={breakdown} />
      </div>
    </div>
  );
}

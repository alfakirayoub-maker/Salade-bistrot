"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Formula, Locale } from "@/lib/menu/types";
import type { FormulaChangeImpact } from "@/lib/builder/formulaChange";
import { DEFAULT_POLICY } from "@/lib/menu/policies";
import { formatMAD } from "@/lib/format";

/** Explains the consequences of switching formula. Nothing is removed silently. */
export function FormulaChangeDialog({
  from,
  to,
  impact,
  onCancel,
  onConfirm,
}: {
  from: Formula;
  to: Formula;
  impact: FormulaChangeImpact;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("formulaChange");
  const tc = useTranslations("categories");
  const locale = useLocale() as Locale;
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,460px)] rounded-[var(--radius-sheet)] bg-cream p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      aria-labelledby="fc-title"
    >
      <div className="p-6">
        <h2 id="fc-title" className="t-h3">
          {t("title", { name: to.name[locale] })}
        </h2>
        <p className="t-small mt-2 text-ink-soft">{t("intro", { from: from.name[locale] })}</p>
        <ul className="mt-4 grid gap-2">
          {impact.impacts.map((i) => {
            const fee = DEFAULT_POLICY.extraSlotFee[i.category];
            return (
              <li key={i.category} className={`rounded-2xl p-3 text-sm ${i.mustRemove ? "bg-red-50 text-red-800" : "bg-mist"}`}>
                <p className="font-semibold">
                  {tc(`${i.category}.plural`)} · {t("selectedIncluded", { selected: i.selected, included: i.includedAfter })}
                </p>
                <p className="mt-0.5">
                  {i.mustRemove
                    ? t("mustRemove", { count: i.mustRemove })
                    : i.extraAfter > i.extraBefore
                      ? t("becomesExtra", { count: i.extraAfter, price: formatMAD((fee ?? 0) * i.extraAfter, locale) })
                      : t("becomesIncluded", { count: i.extraBefore - i.extraAfter })}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 flex items-baseline justify-between rounded-2xl bg-white p-3.5 text-[14px] shadow-[inset_0_0_0_1px_var(--color-line)]">
          <span className="text-ink-soft">{t("newTotal")}</span>
          <span>
            <span className="me-2 text-mute line-through tabular-nums">{formatMAD(impact.priceBefore, locale)}</span>
            <span className="t-price text-[19px]">{formatMAD(impact.priceAfter, locale)}</span>
          </span>
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            {t("keep", { name: from.name[locale] })}
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-primary">
            {impact.requiresResolution ? t("switchAndAdjust") : t("switch")}
          </button>
        </div>
      </div>
    </dialog>
  );
}

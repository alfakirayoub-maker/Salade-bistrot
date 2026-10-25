"use client";

import { memo, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale, MenuItem } from "@/lib/menu/types";
import { formatMAD } from "@/lib/format";
import { IngredientThumb } from "./IngredientThumb";

interface Props {
  item: MenuItem;
  locale: Locale;
  selected: boolean;
  /** This selection is beyond the formula allowance (paid extra slot). */
  extra: boolean;
  onToggle: (item: MenuItem, el: HTMLElement | null) => void;
}

export const IngredientChip = memo(function IngredientChip({ item, locale, selected, extra, onToggle }: Props) {
  const t = useTranslations("builder");
  const thumbRef = useRef<HTMLSpanElement>(null);
  const name = item.name[locale];
  const disabled = !item.available;

  const status = [
    item.supplement > 0 ? t("premiumAria", { price: formatMAD(item.supplement, locale) }) : null,
    disabled ? t("unavailable") : null,
    extra ? t("extraAria") : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={status ? `${name}, ${status}` : name}
      disabled={disabled}
      onClick={() => onToggle(item, thumbRef.current)}
      className="group relative flex flex-col items-center gap-1.5 rounded-2xl px-1 pb-1.5 pt-1 text-center transition-transform duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        ref={thumbRef}
        className={`relative grid aspect-square w-full max-w-[84px] place-items-center rounded-full p-1.5 transition-all duration-300 ${
          selected
            ? "bg-mist shadow-[0_0_0_2px_var(--color-leaf),0_8px_20px_-8px_rgba(95,154,31,0.55)]"
            : "bg-stone/70 group-hover:bg-stone group-hover:shadow-[0_6px_16px_-10px_rgba(0,0,0,0.4)]"
        }`}
      >
        <span className={`block h-full w-full transition-transform duration-300 ${selected ? "scale-[1.04]" : "group-hover:scale-[1.06]"}`}>
          <IngredientThumb id={item.id} />
        </span>
        {selected && (
          <>
            <span className="absolute -end-0.5 -top-0.5 grid h-6 w-6 place-items-center rounded-full bg-leaf text-white shadow-md ring-2 ring-paper">
              <Check size={14} strokeWidth={3} aria-hidden />
            </span>
            <span className="absolute -start-0.5 -top-0.5 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-white opacity-0 shadow-md ring-2 ring-paper transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-lg:opacity-100">
              <Minus size={14} strokeWidth={3} aria-hidden />
            </span>
          </>
        )}
        {item.supplement > 0 && (
          <span className="absolute -bottom-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow">
            +{item.supplement}
          </span>
        )}
      </span>
      <span className={`line-clamp-2 text-[11.5px] font-semibold leading-tight sm:text-xs ${selected ? "text-ink" : "text-ink-soft"}`}>
        {name}
      </span>
      {extra && <span className="text-[10px] font-bold leading-none text-leaf-deep">{t("extraBadge")}</span>}
      {disabled && <span className="text-[10px] font-medium leading-none text-mute">{t("unavailable")}</span>}
    </button>
  );
});

"use client";

import { memo, useRef } from "react";
import { Check } from "lucide-react";
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

/** Tap to add, tap again to remove. Thumbnail uses the same asset as the bowl. */
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
      className="group relative flex min-h-[44px] flex-col items-center gap-2 rounded-2xl px-0.5 pb-1 text-center outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        ref={thumbRef}
        className={`relative grid aspect-square w-full max-w-[82px] place-items-center rounded-full p-[7px] transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out-soft)] group-active:scale-[0.93] ${
          selected
            ? "bg-mist shadow-[inset_0_0_0_2px_var(--color-leaf-deep)]"
            : "bg-white shadow-[inset_0_0_0_1px_var(--color-line),0_6px_14px_-12px_rgba(29,33,30,0.5)] group-hover:shadow-[inset_0_0_0_1px_var(--color-ink-soft),0_8px_18px_-12px_rgba(29,33,30,0.55)]"
        }`}
      >
        <span className={`block h-full w-full transition-transform duration-500 ease-[var(--ease-out-soft)] ${selected ? "scale-[0.92]" : "group-hover:scale-[1.05]"}`}>
          <IngredientThumb id={item.id} />
        </span>
        <span
          className={`absolute -end-0.5 -top-0.5 grid h-[22px] w-[22px] place-items-center rounded-full bg-leaf-deep text-white ring-[2.5px] ring-cream transition-[transform,opacity] duration-300 ease-[var(--ease-out-soft)] ${
            selected ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          aria-hidden
        >
          <Check size={13} strokeWidth={3} />
        </span>
        {item.supplement > 0 && (
          <span dir="ltr" className="t-num absolute -bottom-1.5 rounded-full bg-ink px-1.5 py-[3px] text-[10.5px] font-semibold leading-none text-white ring-2 ring-cream">
            +{item.supplement}
          </span>
        )}
      </span>
      <span className={`line-clamp-2 text-[13px] leading-[1.2] rtl:text-[13.5px] rtl:leading-[1.5] ${selected ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>{name}</span>
      {extra && <span className="-mt-1 text-[10.5px] font-semibold leading-none text-leaf-deep">{t("extraBadge")}</span>}
      {disabled && <span className="-mt-1 text-[10.5px] leading-none text-mute">{t("unavailable")}</span>}
    </button>
  );
});

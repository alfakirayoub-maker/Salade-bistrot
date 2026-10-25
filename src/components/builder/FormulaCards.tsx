"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FORMULAS } from "@/lib/menu/data";
import { DEFAULT_POLICY } from "@/lib/menu/policies";
import { CATEGORIES, emptySelection, type Category, type Formula, type Locale, type Selection } from "@/lib/menu/types";
import { resolveAllowance } from "@/lib/pricing/engine";
import { formatMAD } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { SaladBowl } from "@/components/bowl/SaladBowl";

/** Illustrative compositions for the cards (not menu items, just imagery). */
export const SHOWCASE: Record<string, Selection> = {
  equilibree: {
    ...emptySelection(),
    base: ["laitue"],
    ingredient: ["concombre", "tomates-cerises", "carottes", "mais", "olives"],
    topping: ["poulet", "feta"],
    petitPlus: ["croutons-ail"],
    sauce: ["sauce-cesar"],
  },
  merveille: {
    ...emptySelection(),
    base: ["quinoa"],
    ingredient: ["avocat", "concombre", "tomates-cerises", "chou-rouge", "mais", "oignons"],
    topping: ["crevettes", "mangue", "feta"],
    petitPlus: ["chia"],
    sauce: ["sauce-asiatique"],
  },
  prestige: {
    ...emptySelection(),
    base: ["roquette"],
    ingredient: ["tomates-confites", "artichaut", "champignons", "noix", "figues", "courgettes-grillees", "coeur-de-palmier", "betterave"],
    topping: ["saumon-fume", "oeufs-caille", "chevre", "grenade"],
    petitPlus: ["plantes-aromatiques"],
    sauce: ["miel-moutarde"],
  },
  regale: {
    ...emptySelection(),
    base: ["laitue", "riz-blanc", "quinoa"],
    ingredient: ["concombre", "tomates-cerises", "avocat", "mais", "carottes", "chou-rouge", "betterave", "champignons", "olives", "noix", "poivron", "haricots-verts"],
    topping: ["crevettes", "poulet", "oeufs-fermiers", "feta", "mozzarella-cerises", "mangue", "grenade"],
    petitPlus: ["croutons-ail", "pois-chiches"],
    sauce: ["sauce-yaourt", "pesto", "sauce-balsamique"],
  },
};

const LABEL_KEY: Record<Category, string> = {
  base: "base",
  ingredient: "ingredient",
  topping: "topping",
  petitPlus: "petitPlus",
  sauce: "sauce",
};

export function FormulaIncludes({ formula, locale, compact = false }: { formula: Formula; locale: Locale; compact?: boolean }) {
  const t = useTranslations("formula");
  return (
    <ul className={`grid ${compact ? "gap-1" : "gap-1.5"}`}>
      {CATEGORIES.map((c) => {
        const { included, provisional } = resolveAllowance(formula, c, DEFAULT_POLICY);
        return (
          <li key={c} className="flex items-baseline gap-2 text-sm text-ink-soft">
            <span className="w-6 text-end text-base font-extrabold tabular-nums text-ink">{included}</span>
            <span>
              {t(LABEL_KEY[c], { count: included })}
              {provisional && (
                <span className="ms-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800" title={t("toConfirmHint")}>
                  {t("toConfirm")}
                </span>
              )}
            </span>
          </li>
        );
      })}
      <li className="sr-only">{formatMAD(formula.price, locale)}</li>
    </ul>
  );
}

export function FormulaCards({ onPick, activeId }: { onPick?: (id: string) => void; activeId?: string | null }) {
  const t = useTranslations("formula");
  const locale = useLocale() as Locale;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {FORMULAS.map((f, i) => {
        const active = activeId === f.id;
        const body = (
          <>
            <div className="relative -mx-2 -mt-2 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_50%_45%,#ffffff,#eef1ea)] px-6 pb-3 pt-6">
              <span
                className="absolute start-4 top-4 h-2.5 w-2.5 rounded-full ring-4 ring-white"
                style={{ backgroundColor: f.accent }}
                aria-hidden
              />
              <div className="mx-auto w-[78%] transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:rotate-6 group-hover:scale-[1.04]">
                <SaladBowl selection={SHOWCASE[f.id]} mode="static" density={0.65} label={t("previewAlt", { name: f.name[locale] })} />
              </div>
            </div>
            <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-extrabold uppercase leading-tight tracking-wide">{f.name[locale]}</h3>
                <p className="shrink-0 text-end">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-mute">{t("from")}</span>
                  <span className="text-2xl font-extrabold tabular-nums transition-colors group-hover:text-leaf-deep">{formatMAD(f.price, locale)}</span>
                </p>
              </div>
              <div className="mt-3 flex-1">
                <FormulaIncludes formula={f} locale={locale} />
              </div>
              <span
                className={`mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-all ${
                  active ? "bg-leaf text-white" : "bg-ink text-white group-hover:bg-leaf-deep"
                }`}
              >
                {active ? t("current") : t("choose")}
                <ArrowRight size={16} className="flip-rtl" aria-hidden />
              </span>
            </div>
          </>
        );
        const cls = `group rise relative flex flex-col rounded-[28px] border bg-white p-4 text-start shadow-[0_1px_0_rgba(0,0,0,0.02),0_20px_40px_-28px_rgba(32,36,33,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(32,36,33,0.45)] ${
          active ? "border-leaf ring-2 ring-leaf/40" : "border-line"
        }`;
        const style = { animationDelay: `${i * 90}ms` };
        return onPick ? (
          <button key={f.id} type="button" className={cls} style={style} onClick={() => onPick(f.id)} aria-pressed={active}>
            {body}
          </button>
        ) : (
          <Link key={f.id} href={`/composer?formule=${f.id}`} className={cls} style={style}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}

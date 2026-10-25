"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
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

/** Included quantities as a compact, scannable line of figures. */
export function FormulaIncludes({ formula, layout = "inline" }: { formula: Formula; locale?: Locale; layout?: "inline" | "list" }) {
  const t = useTranslations("formula");
  if (layout === "list") {
    return (
      <ul className="grid gap-1.5">
        {CATEGORIES.map((c) => {
          const { included, provisional } = resolveAllowance(formula, c, DEFAULT_POLICY);
          return (
            <li key={c} className="flex items-baseline gap-2.5 text-[14px] text-ink-soft">
              <span className="t-num w-5 text-end font-semibold text-ink">{included}</span>
              <span>
                {t(LABEL_KEY[c], { count: included })}
                {provisional && <ProvisionalMark />}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-snug text-ink-soft">
      {CATEGORIES.map((c) => {
        const { included, provisional } = resolveAllowance(formula, c, DEFAULT_POLICY);
        return (
          <li key={c} className="whitespace-nowrap">
            <span className="t-num font-semibold text-ink">{included}</span> {t(LABEL_KEY[c], { count: included })}
            {provisional && <ProvisionalMark />}
          </li>
        );
      })}
    </ul>
  );
}

function ProvisionalMark() {
  const t = useTranslations("formula");
  return (
    <abbr title={t("toConfirmHint")} className="ms-0.5 cursor-help text-amber-700 no-underline" aria-label={t("toConfirm")}>
      *
    </abbr>
  );
}

export function FormulaCards({ onPick, activeId }: { onPick?: (id: string) => void; activeId?: string | null }) {
  const t = useTranslations("formula");
  const locale = useLocale() as Locale;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        {FORMULAS.map((f, i) => {
          const active = activeId === f.id;
          // "Melina Prestige" → small "Melina" eyebrow + serif "Prestige".
          const [brand, ...rest] = f.name[locale].split(" ");
          const body = (
            <>
              {/* Bowl preview: small on phones, hero-sized on wide cards. */}
              <span className="relative grid w-[30%] max-w-[132px] shrink-0 place-items-center self-center xl:w-full xl:max-w-none xl:rounded-[20px] xl:bg-[radial-gradient(circle_at_50%_45%,#fff,var(--color-stone))] xl:p-6">
                <span className="block w-full transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:rotate-6 xl:w-[78%]">
                  <SaladBowl selection={SHOWCASE[f.id]} mode="static" density={0.6} label={t("previewAlt", { name: f.name[locale] })} />
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col xl:mt-4">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="t-eyebrow flex items-center gap-1.5 text-mute">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.accent }} aria-hidden />
                      {brand}
                    </span>
                    <span className="t-h3 mt-1 block">{rest.join(" ")}</span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="block text-[11px] text-mute">{t("from")}</span>
                    <span className="t-price block text-[22px] leading-tight text-ink">{formatMAD(f.price, locale)}</span>
                  </span>
                </span>
                <span className="mt-2.5 block">
                  <FormulaIncludes formula={f} />
                </span>
                <span
                  className={`mt-4 hidden h-11 items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition-colors xl:inline-flex ${
                    active ? "bg-leaf-deep text-white" : "bg-ink text-white group-hover:bg-black"
                  }`}
                >
                  {active ? t("current") : t("choose")}
                  <ArrowRight size={16} className="flip-rtl" aria-hidden />
                </span>
              </span>
              <ChevronRight size={18} className="flip-rtl ms-1 shrink-0 self-center text-mute transition-transform group-hover:translate-x-0.5 xl:hidden" aria-hidden />
            </>
          );
          const cls = `group rise relative flex items-stretch gap-4 rounded-[var(--radius-card)] bg-cream p-3 pe-3.5 text-start transition-[transform,box-shadow] duration-300 active:scale-[0.985] xl:flex-col xl:gap-0 xl:p-4 ${
            active
              ? "shadow-[inset_0_0_0_2px_var(--color-leaf-deep),var(--shadow-soft)]"
              : "shadow-[inset_0_0_0_1px_var(--color-line),var(--shadow-soft)] hover:shadow-[inset_0_0_0_1px_var(--color-ink-soft),var(--shadow-lift)]"
          }`;
          const style = { animationDelay: `${i * 70}ms` };
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
      <p className="mt-3 text-[12px] text-mute">
        <span className="text-amber-700">*</span> {t("toConfirmHint")}
      </p>
    </div>
  );
}

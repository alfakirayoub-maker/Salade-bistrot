import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FORMULAS, MENU_ITEMS, OFFICIAL_EXTRA_SLOT_FEES, TOPPING_GROUPS } from "@/lib/menu/data";
import { CATEGORIES, type Locale, type MenuItem } from "@/lib/menu/types";
import { formatDelta, formatMAD } from "@/lib/format";
import { FormulaIncludes } from "@/components/builder/FormulaCards";

export async function generateMetadata({ params }: PageProps<"/[locale]/menu">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menuPage" });
  return { title: t("title") };
}

function ItemList({ items, locale }: { items: MenuItem[]; locale: Locale }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
      {items.map((i) => (
        <li key={i.id} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 text-[15px]">
          <span>{i.name[locale]}</span>
          {i.supplement > 0 && <span className="t-num shrink-0 text-[14px] font-medium text-leaf-deep">{formatDelta(i.supplement, locale)}</span>}
        </li>
      ))}
    </ul>
  );
}

export default async function MenuPage({ params }: PageProps<"/[locale]/menu">) {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as Locale;
  const t = await getTranslations("menuPage");
  const tb = await getTranslations("builder");

  return (
    <main className="mx-auto max-w-5xl px-5 pt-8 sm:px-6 sm:pt-12">
      <p className="t-eyebrow text-leaf-deep">{t("eyebrow")}</p>
      <h1 className="t-h1 mt-3">{t("title")}</h1>
      <p className="t-body mt-3 max-w-xl text-ink-soft">{t("subtitle")}</p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("formulas")}>
        {FORMULAS.map((f) => (
          <Link key={f.id} href={`/composer?formule=${f.id}`} className="card p-5 transition-transform hover:-translate-y-0.5 active:scale-[0.985]">
            <span className="block h-1.5 w-10 rounded-full" style={{ backgroundColor: f.accent }} aria-hidden />
            <h2 className="t-h3 mt-3">{f.name[locale]}</h2>
            <p className="t-price mt-1 text-[24px]">{formatMAD(f.price, locale)}</p>
            <div className="mt-3">
              <FormulaIncludes formula={f} layout="list" />
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap gap-2 text-sm" aria-label={t("supplements")}>
        {(["base", "ingredient", "topping"] as const).map((k) => (
          <span key={k} className="rounded-full bg-mist px-4 py-2 font-medium text-leaf-ink">
            {t(`supplement.${k}`, { price: formatMAD(OFFICIAL_EXTRA_SLOT_FEES[k], locale) })}
          </span>
        ))}
      </section>

      {CATEGORIES.map((c, i) => {
        const items = MENU_ITEMS.filter((m) => m.category === c);
        return (
          <section key={c} className="mt-14" aria-labelledby={`menu-${c}`}>
            <p className="t-eyebrow t-num text-mute">{tb("stepOf", { step: i + 1, total: CATEGORIES.length })}</p>
            <h2 id={`menu-${c}`} className="t-h2 mt-2">
              {tb(`steps.${c}`)}
            </h2>
            <div className="mt-4">
              {c === "topping" ? (
                TOPPING_GROUPS.map((g) => (
                  <div key={g.id} className="mb-6">
                    <h3 className="t-eyebrow mb-2 text-leaf-deep">
                      {g.name[locale]}
                      {g.id === "fruits" && <span className="ms-1 font-semibold normal-case tracking-normal text-mute">· {tb("seasonal")}</span>}
                    </h3>
                    <ItemList items={items.filter((m) => m.group === g.id)} locale={locale} />
                  </div>
                ))
              ) : (
                <ItemList items={items} locale={locale} />
              )}
            </div>
          </section>
        );
      })}

      <div className="mt-14 rounded-[var(--radius-sheet)] bg-ink p-7 text-white sm:p-10">
        <p className="t-h2">{t("ctaTitle")}</p>
        <Link href="/composer" className="btn btn-leaf mt-6">
          {t("cta")}
        </Link>
      </div>
    </main>
  );
}

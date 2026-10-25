import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FORMULAS, MENU_ITEMS, OFFICIAL_EXTRA_SLOT_FEES, TOPPING_GROUPS } from "@/lib/menu/data";
import { CATEGORIES, type Locale, type MenuItem } from "@/lib/menu/types";
import { formatMAD } from "@/lib/format";
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
        <li key={i.id} className="flex items-baseline justify-between gap-3 border-b border-dashed border-line py-1.5 text-[15px]">
          <span>{i.name[locale]}</span>
          {i.supplement > 0 && <span className="shrink-0 text-sm font-bold text-leaf-deep">+{formatMAD(i.supplement, locale)}</span>}
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
    <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-leaf-deep">{t("eyebrow")}</p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-3 max-w-xl text-ink-soft">{t("subtitle")}</p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("formulas")}>
        {FORMULAS.map((f) => (
          <Link key={f.id} href={`/composer?formule=${f.id}`} className="rounded-3xl bg-white p-5 ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-leaf">
            <span className="block h-1.5 w-10 rounded-full" style={{ backgroundColor: f.accent }} aria-hidden />
            <h2 className="mt-3 font-extrabold uppercase tracking-wide">{f.name[locale]}</h2>
            <p className="mt-1 text-2xl font-extrabold">{formatMAD(f.price, locale)}</p>
            <div className="mt-3">
              <FormulaIncludes formula={f} locale={locale} compact />
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap gap-2 text-sm" aria-label={t("supplements")}>
        {(["base", "ingredient", "topping"] as const).map((k) => (
          <span key={k} className="rounded-full bg-mist px-4 py-2 font-semibold text-leaf-deep">
            {t(`supplement.${k}`, { price: formatMAD(OFFICIAL_EXTRA_SLOT_FEES[k], locale) })}
          </span>
        ))}
      </section>

      {CATEGORIES.map((c, i) => {
        const items = MENU_ITEMS.filter((m) => m.category === c);
        return (
          <section key={c} className="mt-14" aria-labelledby={`menu-${c}`}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mute">{tb("stepOf", { step: i + 1, total: CATEGORIES.length })}</p>
            <h2 id={`menu-${c}`} className="mt-1 text-2xl font-extrabold">
              {tb(`steps.${c}`)}
            </h2>
            <div className="mt-4">
              {c === "topping" ? (
                TOPPING_GROUPS.map((g) => (
                  <div key={g.id} className="mb-6">
                    <h3 className="mb-1 text-sm font-bold uppercase tracking-[0.12em] text-leaf-deep">
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

      <div className="mt-14 rounded-3xl bg-ink p-8 text-white">
        <p className="display text-3xl">{t("ctaTitle")}</p>
        <Link href="/composer" className="mt-5 inline-flex h-12 items-center rounded-full bg-leaf px-6 font-bold">
          {t("cta")}
        </Link>
      </div>
    </main>
  );
}

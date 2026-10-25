import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { FormulaCards } from "@/components/builder/FormulaCards";
import { FloatingIngredients } from "@/components/site/FloatingIngredients";
import { CATEGORIES } from "@/lib/menu/types";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");
  const tb = useTranslations("builder");

  return (
    <main>
      {/* Hero: headline → promise → action → the bowl. */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-2 px-5 pt-7 sm:px-6 md:grid-cols-[1fr_1fr] md:gap-10 md:pb-16 md:pt-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="rise t-eyebrow text-leaf-deep">{t("eyebrow")}</p>
            <h1 className="rise mt-4" style={{ animationDelay: "60ms" }}>
              <span className="t-display block">{t("titleA")}</span>
              <span className="t-display-sans mt-1 block text-leaf-deep">{t("titleB")}</span>
            </h1>
            <p className="rise t-body mt-5 max-w-[30ch] text-ink-soft sm:max-w-md" style={{ animationDelay: "120ms" }}>
              {t("subtitle")}
            </p>
            <div className="rise mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:flex-col md:items-stretch lg:flex-row lg:items-center" style={{ animationDelay: "180ms" }}>
              <Link href="/composer" className="btn btn-leaf group min-h-14 text-[16px] shadow-[0_14px_30px_-16px_rgba(79,138,23,0.9)]">
                {t("cta")}
                <ArrowRight size={18} className="flip-rtl transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="/#formules" className="btn min-h-12 text-ink-soft hover:text-ink sm:bg-cream sm:shadow-[inset_0_0_0_1px_var(--color-line)]">
                {t("secondary")}
              </Link>
            </div>
            <p className="rise t-small mt-3 text-mute max-sm:text-center" style={{ animationDelay: "220ms" }}>
              {t("priceHint")}
            </p>
          </div>

          <div className="relative mx-auto mt-4 w-full max-w-[min(92vw,560px)] md:mt-0">
            <div className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle,var(--color-mist),transparent_70%)]" aria-hidden />
            <Image
              src="/brand/bowl-official.webp"
              alt={t("heroAlt")}
              width={494}
              height={494}
              priority
              sizes="(min-width: 768px) 560px, 92vw"
              className="rise relative mx-auto w-[84%] drop-shadow-[0_34px_34px_rgba(29,33,30,0.26)]"
              style={{ animationDelay: "140ms" }}
            />
            <FloatingIngredients />
          </div>
        </div>
      </section>

      {/* How it works: an editorial numbered list. */}
      <section className="mx-auto mt-14 max-w-7xl px-5 sm:px-6 md:mt-6" aria-labelledby="how">
        <h2 id="how" className="t-h2 max-w-[16ch]">
          {t("howTitle")}
        </h2>
        <ol className="mt-6 border-t border-line md:mt-8 md:grid md:grid-cols-5 md:gap-6 md:border-t-0">
          {CATEGORIES.map((c, i) => (
            <li key={c} className="flex gap-4 border-b border-line py-4 md:block md:border-b-0 md:border-t md:pt-5">
              <span className="t-num w-7 shrink-0 pt-0.5 text-[13px] font-semibold text-leaf-deep">{String(i + 1).padStart(2, "0")}</span>
              <span className="md:mt-3 md:block">
                <span className="t-title block">{tb(`steps.${c}`)}</span>
                <span className="t-small mt-1 block text-ink-soft">{t(`how.${c}`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Formulas */}
      <section id="formules" className="mx-auto max-w-7xl scroll-mt-16 px-5 pt-16 sm:px-6 md:pt-24" aria-labelledby="formulas-title">
        <p className="t-eyebrow text-leaf-deep">{t("formulasEyebrow")}</p>
        <h2 id="formulas-title" className="t-h2 mt-3">
          {t("formulasTitle")}
        </h2>
        <p className="t-body mt-3 max-w-xl text-ink-soft">{t("formulasSubtitle")}</p>
        <div className="mt-7">
          <FormulaCards />
        </div>
        <p className="t-small mt-1 text-mute">{t("previewNote")}</p>
      </section>

      {/* Brand band */}
      <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-6 md:mt-24">
        <div className="relative overflow-hidden rounded-[var(--radius-sheet)]">
          <Image src="/brand/salad-bar.webp" alt={t("barAlt")} width={1600} height={900} sizes="(min-width: 1280px) 1240px, 100vw" className="h-[380px] w-full object-cover sm:h-[440px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
            <p className="t-h1 max-w-[14ch]">{t("slogan")}</p>
            <Link href="/composer" className="btn mt-6 bg-white text-ink hover:bg-mist">
              {t("cta")}
              <ArrowRight size={16} className="flip-rtl" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-12 pt-6 sm:px-6 md:grid-cols-[1fr_1.05fr] md:pb-20 md:pt-14">
          <div className="order-2 md:order-1">
            <p className="rise text-sm font-bold uppercase tracking-[0.2em] text-leaf-deep">{t("eyebrow")}</p>
            <h1 className="display rise mt-3 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              {t("titleA")}
              <br />
              <em className="text-leaf-deep">{t("titleB")}</em>
            </h1>
            <p className="rise mt-5 max-w-md text-lg text-ink-soft" style={{ animationDelay: "160ms" }}>
              {t("subtitle")}
            </p>
            <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
              <Link
                href="/composer"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-leaf px-7 text-base font-extrabold text-white shadow-[0_16px_34px_-14px_rgba(95,154,31,0.95)] transition hover:bg-leaf-deep"
              >
                {t("cta")}
                <ArrowRight size={18} className="flip-rtl transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="/#formules" className="inline-flex h-14 items-center justify-center rounded-full bg-white px-7 font-bold ring-1 ring-line transition hover:ring-ink">
                {t("secondary")}
              </Link>
            </div>
            <p className="rise mt-6 text-sm text-mute" style={{ animationDelay: "320ms" }}>
              {t("priceHint")}
            </p>
          </div>
          <div className="relative order-1 mx-auto w-full max-w-[560px] md:order-2">
            <div className="absolute inset-[8%] rounded-full bg-mist" aria-hidden />
            <Image
              src="/brand/bowl-official.webp"
              alt={t("heroAlt")}
              width={494}
              height={494}
              priority
              sizes="(min-width: 768px) 560px, 90vw"
              className="rise relative mx-auto w-[88%] drop-shadow-[0_40px_40px_rgba(32,36,33,0.28)]"
            />
            <FloatingIngredients />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="how">
        <div className="rounded-[32px] bg-white p-6 ring-1 ring-line sm:p-10">
          <h2 id="how" className="display text-3xl sm:text-4xl">
            {t("howTitle")}
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((c, i) => (
              <li key={c} className="rise" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-mist text-sm font-extrabold text-leaf-deep">{i + 1}</span>
                <h3 className="mt-3 font-extrabold">{tb(`steps.${c}`)}</h3>
                <p className="mt-1 text-sm text-ink-soft">{t(`how.${c}`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Formulas */}
      <section id="formules" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-20 sm:px-6" aria-labelledby="formulas-title">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-leaf-deep">{t("formulasEyebrow")}</p>
        <h2 id="formulas-title" className="display mt-2 text-3xl sm:text-5xl">
          {t("formulasTitle")}
        </h2>
        <p className="mt-3 max-w-xl text-ink-soft">{t("formulasSubtitle")}</p>
        <div className="mt-8">
          <FormulaCards />
        </div>
        <p className="mt-4 text-xs text-mute">{t("previewNote")}</p>
      </section>

      {/* Brand band */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px]">
          <Image src="/brand/salad-bar.webp" alt={t("barAlt")} width={1600} height={900} sizes="(min-width: 1280px) 1240px, 100vw" className="h-[340px] w-full object-cover sm:h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
            <p className="display text-3xl sm:text-5xl">{t("slogan")}</p>
            <Link href="/composer" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-ink hover:bg-mist">
              {t("cta")}
              <ArrowRight size={16} className="flip-rtl" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

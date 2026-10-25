"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ChevronDown, Search, X } from "lucide-react";
import { FORMULAS_BY_ID, ITEMS_BY_ID, MENU_ITEMS, TOPPING_GROUPS } from "@/lib/menu/data";
import { DEFAULT_POLICY } from "@/lib/menu/policies";
import { CATEGORIES, emptySelection, type Category, type Locale, type MenuItem, type Selection } from "@/lib/menu/types";
import { previewAdd, priceSalad } from "@/lib/pricing/engine";
import { analyzeFormulaChange, type FormulaChangeImpact } from "@/lib/builder/formulaChange";
import { cart } from "@/lib/cart/store";
import { formatDelta, formatMAD } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { SaladBowl } from "@/components/bowl/SaladBowl";
import { setDropOrigin } from "@/components/bowl/dropOrigin";
import { CartButton, Logo } from "@/components/site/Header";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { FormulaCards } from "./FormulaCards";
import { IngredientChip } from "./IngredientChip";
import { Summary } from "./Summary";
import { FormulaChangeDialog } from "./FormulaChangeDialog";
import { Reveal } from "./Reveal";

type Stage = "formula" | "build" | "reveal";

interface Notice {
  key: number;
  text: string;
  tone: "info" | "warn";
  action?: { label: string; run: () => void };
}

const ITEMS_BY_CATEGORY: Record<Category, MenuItem[]> = Object.fromEntries(
  CATEGORIES.map((c) => [c, MENU_ITEMS.filter((i) => i.category === c).sort((a, b) => a.order - b.order)]),
) as Record<Category, MenuItem[]>;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function Builder({ initialFormulaId, editId }: { initialFormulaId?: string | null; editId?: string | null }) {
  const t = useTranslations("builder");
  const tc = useTranslations("categories");
  const locale = useLocale() as Locale;

  // Editing a salad from the cart restores its exact composition.
  // (The composer renders client-side only, behind useSearchParams.)
  const [editLine] = useState(() => {
    const line = editId ? cart.get().find((l) => l.id === editId) : undefined;
    return line && FORMULAS_BY_ID[line.formulaId] ? line : null;
  });
  const validInitial = editLine?.formulaId ?? (initialFormulaId && FORMULAS_BY_ID[initialFormulaId] ? initialFormulaId : null);
  const [formulaId, setFormulaId] = useState<string | null>(validInitial);
  const [stage, setStage] = useState<Stage>(validInitial ? "build" : "formula");
  const [selection, setSelection] = useState<Selection>(() => editLine?.selection ?? emptySelection());
  const [step, setStep] = useState(0);
  const [name, setName] = useState(editLine?.name ?? "");
  const [editing, setEditing] = useState<string | null>(editLine?.id ?? null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingChange, setPendingChange] = useState<{ to: string; impact: FormulaChangeImpact } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [lastDelta, setLastDelta] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const prevTotal = useRef<number | null>(null);

  const formula = formulaId ? FORMULAS_BY_ID[formulaId] : null;
  const category = CATEGORIES[step];
  const breakdown = useMemo(
    () => (formula ? priceSalad(formula, selection, ITEMS_BY_ID, DEFAULT_POLICY) : null),
    [formula, selection],
  );

  // Price "+delta" pill, like the reference configurator.
  useEffect(() => {
    if (!breakdown) return;
    const prev = prevTotal.current;
    prevTotal.current = breakdown.total;
    if (prev !== null && prev !== breakdown.total) {
      setLastDelta(breakdown.total - prev);
      setFlashKey((k) => k + 1);
    }
  }, [breakdown]);

  const say = useCallback((text: string, tone: Notice["tone"] = "info", action?: Notice["action"]) => {
    setNotice({ key: Date.now(), text, tone, action });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), notice.action ? 6000 : 3800);
    return () => window.clearTimeout(id);
  }, [notice]);

  const toggle = useCallback(
    (item: MenuItem, el: HTMLElement | null) => {
      if (!formula) return;
      const c = item.category;
      const current = selection[c];
      if (current.includes(item.id)) {
        setSelection({ ...selection, [c]: current.filter((id) => id !== item.id) });
        return;
      }
      const preview = previewAdd(formula, selection, c, item.id, ITEMS_BY_ID, DEFAULT_POLICY);
      const allowance = breakdown?.categories[c].included ?? 0;
      const itemName = item.name[locale];

      // With a single included slot, tapping another option swaps it.
      const swapInsteadOfExtra = allowance === 1 && current.length === 1 && (c === "base" || !preview.allowed);
      if (swapInsteadOfExtra) {
        const replaced = current[0];
        setDropOrigin(item.id, el);
        setSelection({ ...selection, [c]: [item.id] });
        const fee = DEFAULT_POLICY.extraSlotFee[c];
        say(
          t("swapped", { name: itemName, previous: ITEMS_BY_ID[replaced].name[locale] }),
          "info",
          preview.allowed && fee !== null
            ? {
                label: t("keepBoth", { price: formatMAD(fee, locale) }),
                run: () => setSelection((s) => ({ ...s, [c]: [replaced, item.id] })),
              }
            : undefined,
        );
        return;
      }
      if (!preview.allowed) {
        say(t("limitBlocked", { count: allowance, category: tc(`${c}.plural`) }), "warn");
        return;
      }
      setDropOrigin(item.id, el);
      setSelection({ ...selection, [c]: [...current, item.id] });
      if (preview.isExtra) {
        say(t("extraAdded", { name: itemName, price: formatDelta(preview.delta, locale) }));
      }
    },
    [formula, selection, breakdown, locale, say, t, tc],
  );

  const removeItem = useCallback((c: Category, id: string) => {
    setSelection((s) => ({ ...s, [c]: s[c].filter((x) => x !== id) }));
  }, []);

  const pickFormula = (id: string) => {
    if (!formula) {
      setFormulaId(id);
      setStage("build");
      setStep(0);
      return;
    }
    if (id === formula.id) {
      setStage("build");
      return;
    }
    const impact = analyzeFormulaChange(formula, FORMULAS_BY_ID[id], selection, ITEMS_BY_ID, DEFAULT_POLICY);
    if (impact.silent) {
      setFormulaId(id);
      setStage("build");
      say(t("formulaChanged", { name: FORMULAS_BY_ID[id].name[locale] }));
      return;
    }
    setPendingChange({ to: id, impact });
  };

  const confirmChange = () => {
    if (!pendingChange) return;
    setFormulaId(pendingChange.to);
    setStage("build");
    const blocked = pendingChange.impact.impacts.find((i) => i.mustRemove > 0);
    if (blocked) setStep(CATEGORIES.indexOf(blocked.category));
    setPendingChange(null);
  };

  const scrollListTop = () => listRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  const goToStep = (i: number) => {
    setStep(i);
    setQuery("");
    scrollListTop();
  };

  const firstIssueStep = useMemo(() => {
    if (!breakdown) return -1;
    const issue = breakdown.issues[0];
    return issue ? CATEGORIES.indexOf(issue.category) : -1;
  }, [breakdown]);

  const next = () => {
    if (step < CATEGORIES.length - 1) {
      goToStep(step + 1);
      return;
    }
    if (breakdown && !breakdown.valid) {
      const issue = breakdown.issues[0];
      say(issue.code === "belowMinimum" ? t("baseRequired") : t("resolveLimits"), "warn");
      goToStep(firstIssueStep);
      return;
    }
    setStage("reveal");
  };

  const items = useMemo(() => {
    const all = ITEMS_BY_CATEGORY[category];
    const q = normalize(query.trim());
    if (!q) return all;
    return all.filter((i) => normalize(i.name.fr).includes(q) || i.name.ar.includes(query.trim()));
  }, [category, query]);

  const extraIds = useMemo(() => new Set(breakdown?.categories[category].extraItemIds ?? []), [breakdown, category]);

  // ------------------------------------------------------------------------
  // Formula stage
  // ------------------------------------------------------------------------

  if (stage === "formula" || !formula || !breakdown) {
    return (
      <div className="min-h-dvh">
        <BuilderTopBar />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf-deep">{t("formulaEyebrow")}</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">{t("formulaTitle")}</h1>
          <p className="mt-3 max-w-xl text-ink-soft">{t("formulaSubtitle")}</p>
          <div className="mt-8">
            <FormulaCards onPick={pickFormula} activeId={formulaId} />
          </div>
          {formula && (
            <button type="button" onClick={() => setStage("build")} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-ink">
              <ArrowLeft size={16} className="flip-rtl" aria-hidden />
              {t("backToBuilder")}
            </button>
          )}
        </main>
        {pendingChange && formula && (
          <FormulaChangeDialog
            from={formula}
            to={FORMULAS_BY_ID[pendingChange.to]}
            impact={pendingChange.impact}
            onCancel={() => setPendingChange(null)}
            onConfirm={confirmChange}
          />
        )}
      </div>
    );
  }

  if (stage === "reveal") {
    return (
      <Reveal
        formula={formula}
        selection={selection}
        breakdown={breakdown}
        name={name}
        onName={setName}
        editing={editing}
        onEdit={() => setStage("build")}
        onAdded={(id) => setEditing(id)}
        onRestart={() => {
          setSelection(emptySelection());
          setName("");
          setEditing(null);
          setStep(0);
          setStage("formula");
          prevTotal.current = null;
        }}
      />
    );
  }

  // ------------------------------------------------------------------------
  // Build stage
  // ------------------------------------------------------------------------

  const summary = breakdown.categories[category];
  const counterTone = summary.extra > 0 ? "text-leaf-deep" : summary.selected === summary.included ? "text-ink" : "text-ink-soft";
  const isLast = step === CATEGORIES.length - 1;
  const nextLabel = isLast ? t("finish") : tc(`${CATEGORIES[step + 1]}.plural`);
  const nextCaption = isLast ? t("lastStep") : t("next");

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper lg:grid lg:grid-cols-[minmax(360px,440px)_1fr_minmax(300px,360px)] lg:grid-rows-[auto_1fr]">
      <BuilderTopBar
        className="lg:col-span-3"
        formulaName={formula.name[locale]}
        onFormula={() => setStage("formula")}
      />

      {/* Bowl: always visible (sticky region on mobile, centre stage on desktop) */}
      <section
        aria-label={t("bowlRegion")}
        className="relative flex shrink-0 items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#ffffff_0%,var(--color-paper)_60%,#eef1ea_100%)] px-4 py-3 lg:order-2 lg:py-8"
      >
        <div className="w-[min(72vw,31dvh)] sm:w-[min(60vw,38dvh)] lg:w-[min(46vw,68vh,640px)]">
          <SaladBowl selection={selection} emptyLabel={t("emptyBowl")} label={t("bowlAlt")} />
        </div>
        <ProgressDots step={step} breakdown={breakdown} onStep={goToStep} className="absolute bottom-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 lg:bottom-6" />
        <p className="pointer-events-none absolute end-3 top-2 hidden rounded-full sm:block bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-mute ring-1 ring-line lg:end-6 lg:top-6" title={t("prototypeHint")}>
          {t("prototypeBadge")}
        </p>
      </section>

      {/* Selection panel */}
      <section className="flex min-h-0 flex-1 flex-col border-line bg-white lg:order-1 lg:border-e" aria-labelledby="step-title">
        <StepTabs step={step} breakdown={breakdown} onStep={goToStep} />
        <div className="flex items-end justify-between gap-3 px-4 pb-2 pt-3 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">{t("stepOf", { step: step + 1, total: CATEGORIES.length })}</p>
            <h2 id="step-title" className="text-xl font-extrabold leading-tight">
              {t(`steps.${category}`)}
            </h2>
          </div>
          <p className={`shrink-0 text-end text-sm font-bold tabular-nums ${counterTone}`} aria-live="polite">
            {t("counter", { selected: summary.selected, included: summary.included, category: tc(`${category}.plural`) })}
            {summary.provisional && <span className="block text-[10px] font-semibold text-amber-700">{t("provisional")}</span>}
          </p>
        </div>
        <p className="px-4 text-xs text-mute sm:px-5">
          {summary.extraSlotFee !== null
            ? t("extraRule", { price: formatMAD(summary.extraSlotFee, locale), included: summary.included })
            : t("blockedRule", { included: summary.included })}
        </p>

        {(category === "ingredient" || category === "topping") && (
          <div className="px-4 pt-3 sm:px-5">
            <label className="relative block">
              <span className="sr-only">{t("search")}</span>
              <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-mute" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-10 w-full rounded-full bg-stone/70 pe-9 ps-9 text-sm outline-none ring-leaf transition focus:bg-white focus:ring-2"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute end-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-mute hover:bg-line" aria-label={t("clearSearch")}>
                  <X size={14} aria-hidden />
                </button>
              )}
            </label>
          </div>
        )}

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-28 pt-3 sm:px-4 lg:pb-6">
          {category === "topping" && !query ? (
            TOPPING_GROUPS.map((g) => {
              const groupItems = items.filter((i) => i.group === g.id);
              return (
                <div key={g.id} className="mb-4">
                  <h3 className="sticky top-0 z-10 -mx-1 mb-1 bg-white/95 px-2 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-mute backdrop-blur">
                    {g.name[locale]}
                    {g.id === "fruits" && <span className="ms-1 font-semibold normal-case tracking-normal">· {t("seasonal")}</span>}
                  </h3>
                  <ChipGrid items={groupItems} locale={locale} selection={selection} extraIds={extraIds} onToggle={toggle} />
                </div>
              );
            })
          ) : items.length ? (
            <ChipGrid items={items} locale={locale} selection={selection} extraIds={extraIds} onToggle={toggle} />
          ) : (
            <p className="py-10 text-center text-sm text-mute">{t("noResults")}</p>
          )}
        </div>
      </section>

      {/* Desktop summary */}
      <aside className="hidden min-h-0 flex-col border-s border-line bg-white lg:order-3 lg:flex" aria-label={t("summaryTitle")}>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <Summary formula={formula} selection={selection} breakdown={breakdown} onRemove={removeItem} onStep={goToStep} onChangeFormula={() => setStage("formula")} />
        </div>
        <div className="border-t border-line p-5">
          <PriceAndCta total={breakdown.total} label={nextLabel} caption={nextCaption} onNext={next} flashKey={flashKey} delta={lastDelta} onBack={step > 0 ? () => goToStep(step - 1) : undefined} />
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setSummaryOpen(true)} className="mb-2 flex w-full items-center justify-between text-xs font-semibold text-ink-soft" aria-haspopup="dialog">
          <span className="truncate">
            {formula.name[locale]} · {t("itemsCount", { count: Object.values(selection).flat().length })}
          </span>
          <span className="inline-flex items-center gap-1 text-ink">
            {t("details")} <ChevronDown size={14} className="rotate-180" aria-hidden />
          </span>
        </button>
        <PriceAndCta total={breakdown.total} label={nextLabel} caption={nextCaption} onNext={next} flashKey={flashKey} delta={lastDelta} onBack={step > 0 ? () => goToStep(step - 1) : undefined} />
      </div>

      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label={t("summaryTitle")} onClick={() => setSummaryOpen(false)}>
          <div className="rise max-h-[80dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="mx-auto h-1.5 w-10 rounded-full bg-line" aria-hidden />
            </div>
            <Summary
              formula={formula}
              selection={selection}
              breakdown={breakdown}
              onRemove={removeItem}
              onStep={(i) => {
                setSummaryOpen(false);
                goToStep(i);
              }}
              onChangeFormula={() => {
                setSummaryOpen(false);
                setStage("formula");
              }}
            />
            <button type="button" onClick={() => setSummaryOpen(false)} className="mt-6 h-12 w-full rounded-full bg-stone font-bold">
              {t("close")}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div
          key={notice.key}
          role="status"
          className={`rise fixed inset-x-4 bottom-[150px] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl lg:bottom-8 ${
            notice.tone === "warn" ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line"
          }`}
        >
          <span className="flex-1">{notice.text}</span>
          {notice.action && (
            <button
              type="button"
              className="shrink-0 rounded-full bg-leaf px-3 py-1.5 text-xs font-bold text-white"
              onClick={() => {
                notice.action?.run();
                setNotice(null);
              }}
            >
              {notice.action.label}
            </button>
          )}
          <button type="button" onClick={() => setNotice(null)} aria-label={t("close")} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------

function ChipGrid({
  items,
  locale,
  selection,
  extraIds,
  onToggle,
}: {
  items: MenuItem[];
  locale: Locale;
  selection: Selection;
  extraIds: Set<string>;
  onToggle: (item: MenuItem, el: HTMLElement | null) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-x-1 gap-y-3 sm:grid-cols-5 lg:grid-cols-4">
      {items.map((item) => (
        <IngredientChip
          key={item.id}
          item={item}
          locale={locale}
          selected={selection[item.category].includes(item.id)}
          extra={extraIds.has(item.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function StepTabs({ step, breakdown, onStep }: { step: number; breakdown: ReturnType<typeof priceSalad>; onStep: (i: number) => void }) {
  const tc = useTranslations("categories");
  const t = useTranslations("builder");
  return (
    <nav
      aria-label={t("stepsNav")}
      className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-b border-line px-3 py-2.5 [mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-24px),transparent)] sm:px-4"
    >
      {CATEGORIES.map((c, i) => {
        const s = breakdown.categories[c];
        const active = i === step;
        const done = s.selected > 0;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onStep(i)}
            aria-current={active ? "step" : undefined}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors ${
              active ? "bg-ink text-white" : done ? "bg-mist text-leaf-deep" : "bg-stone/70 text-ink-soft hover:bg-stone"
            }`}
          >
            {tc(`${c}.short`)}
            <span className={`tabular-nums ${active ? "text-white/70" : "opacity-70"}`}>
              {s.selected}/{s.included}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function ProgressDots({ step, breakdown, onStep, className }: { step: number; breakdown: ReturnType<typeof priceSalad>; onStep: (i: number) => void; className?: string }) {
  const tc = useTranslations("categories");
  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`} aria-hidden>
      {CATEGORIES.map((c, i) => (
        <button
          key={c}
          type="button"
          tabIndex={-1}
          title={tc(`${c}.short`)}
          onClick={() => onStep(i)}
          className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? "w-7 bg-ink" : breakdown.categories[c].selected ? "w-3 bg-leaf" : "w-3 bg-ink/15"}`}
        />
      ))}
    </div>
  );
}

function PriceAndCta({
  total,
  label,
  caption,
  onNext,
  onBack,
  flashKey,
  delta,
}: {
  total: number;
  label: string;
  caption: string;
  onNext: () => void;
  onBack?: () => void;
  flashKey: number;
  delta: number;
}) {
  const t = useTranslations("builder");
  const locale = useLocale();
  return (
    <div className="flex items-center gap-2">
      {onBack && (
        <button type="button" onClick={onBack} aria-label={t("previous")} className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-stone text-ink transition hover:bg-line">
          <ArrowLeft size={18} className="flip-rtl" aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="group relative flex h-13 min-w-0 flex-1 items-center justify-between gap-3 rounded-full bg-leaf pe-2 ps-5 text-white shadow-[0_12px_28px_-12px_rgba(95,154,31,0.9)] transition hover:bg-leaf-deep active:scale-[0.99]"
      >
        <span className="min-w-0 text-start leading-tight">
          <span className="block text-[11px] font-semibold opacity-80">{caption}</span>
          <span className="block truncate text-[15px] font-extrabold">{label}</span>
        </span>
        <span className="relative flex items-center gap-2">
          {flashKey > 0 && delta !== 0 && (
            <span key={flashKey} className="pop-delta absolute -top-8 end-0 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white" aria-hidden>
              {formatDelta(delta, locale)}
            </span>
          )}
          <span className="whitespace-nowrap rounded-full bg-white/20 px-3 py-2 text-[15px] font-extrabold tabular-nums" aria-live="polite">
            {formatMAD(total, locale)}
          </span>
          <ArrowRight size={18} className="flip-rtl me-1 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </button>
    </div>
  );
}

function BuilderTopBar({ className, formulaName, onFormula }: { className?: string; formulaName?: string; onFormula?: () => void }) {
  const t = useTranslations("builder");
  return (
    <header className={`z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line bg-paper/90 px-3 backdrop-blur sm:px-5 ${className ?? ""}`}>
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/" aria-label={t("exit")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-stone">
          <ArrowLeft size={18} className="flip-rtl" aria-hidden />
        </Link>
        <span className="hidden sm:block">
          <Logo />
        </span>
      </div>
      {formulaName && onFormula && (
        <button
          type="button"
          onClick={onFormula}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold shadow-sm ring-1 ring-line hover:ring-leaf"
          aria-label={t("changeFormulaAria", { name: formulaName })}
        >
          <span className="truncate">{formulaName}</span>
          <ChevronDown size={14} aria-hidden />
        </button>
      )}
      <div className="flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <CartButton />
      </div>
    </header>
  );
}

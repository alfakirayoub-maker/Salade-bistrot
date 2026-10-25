"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ChevronDown, Search, X } from "lucide-react";
import type { ToppingGroup } from "@/lib/menu/types";
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
import { CartButton } from "@/components/site/Header";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { FormulaCards } from "./FormulaCards";
import { IngredientChip } from "./IngredientChip";
import { Summary } from "./Summary";
import { FormulaChangeDialog } from "./FormulaChangeDialog";
import { Reveal } from "./Reveal";
import { AnimatedPrice } from "./AnimatedPrice";

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

  // Initial state, in priority order:
  // 1. the session draft (survives a language switch, which remounts the page),
  // 2. a cart line being edited (?modifier=…),
  // 3. the formula picked on the home page (?formule=…).
  const [init] = useState<Draft | null>(() => {
    const draft = readDraft();
    if (editId) {
      if (draft?.editing === editId) return draft;
      const line = cart.get().find((l) => l.id === editId);
      return line && FORMULAS_BY_ID[line.formulaId]
        ? { formulaId: line.formulaId, selection: line.selection, name: line.name, editing: line.id, step: 0, stage: "build" }
        : null;
    }
    if (draft && !draft.editing && (!initialFormulaId || draft.formulaId === initialFormulaId)) return draft;
    return null;
  });
  const validInitial = init?.formulaId ?? (initialFormulaId && FORMULAS_BY_ID[initialFormulaId] ? initialFormulaId : null);
  const [formulaId, setFormulaId] = useState<string | null>(validInitial);
  const [stage, setStage] = useState<Stage>(init?.stage ?? (validInitial ? "build" : "formula"));
  const [selection, setSelection] = useState<Selection>(() => init?.selection ?? emptySelection());
  const [step, setStep] = useState(init?.step ?? 0);
  const [name, setName] = useState(init?.name ?? "");
  const [editing, setEditing] = useState<string | null>(init?.editing ?? null);
  const [savedToCart, setSavedToCart] = useState(false);
  const [compact, setCompact] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [group, setGroup] = useState<ToppingGroup | "all">("all");
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

  useEffect(() => {
    if (savedToCart || !formulaId) {
      clearDraft();
      return;
    }
    writeDraft({ formulaId, selection, step, stage, name, editing });
  }, [formulaId, selection, step, stage, name, editing, savedToCart]);
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

  const goToStep = (i: number) => {
    setStep(i);
    setQuery("");
    setSearchOpen(false);
    setGroup("all");
    listRef.current?.scrollTo({ top: 0 });
    setCompact(false);
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
    if (!q) return group === "all" ? all : all.filter((i) => i.group === group);
    return all.filter((i) => normalize(i.name.fr).includes(q) || i.name.ar.includes(query.trim()));
  }, [category, query, group]);

  const extraIds = useMemo(() => new Set(breakdown?.categories[category].extraItemIds ?? []), [breakdown, category]);

  // ------------------------------------------------------------------------
  // Formula stage
  // ------------------------------------------------------------------------

  if (stage === "formula" || !formula || !breakdown) {
    return (
      <div className="min-h-dvh">
        <BuilderTopBar />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
          <p className="t-eyebrow text-leaf-deep">{t("formulaEyebrow")}</p>
          <h1 className="t-h1 mt-3">{t("formulaTitle")}</h1>
          <p className="t-body mt-3 max-w-xl text-ink-soft">{t("formulaSubtitle")}</p>
          <div className="mt-6 sm:mt-8">
            <FormulaCards onPick={pickFormula} activeId={formulaId} />
          </div>
          {formula && (
            <button type="button" onClick={() => setStage("build")} className="btn btn-ghost mt-6">
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
        onEdit={() => {
          setSavedToCart(false);
          setStage("build");
        }}
        onAdded={(id) => {
          setEditing(id);
          setSavedToCart(true);
        }}
        onRestart={() => {
          setSavedToCart(false);
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
  const isLast = step === CATEGORIES.length - 1;
  const ctaLabel = isLast ? t("finish") : t("continue");
  const ctaCaption = isLast ? t("lastStep") : t("nextIs", { step: tc(`${CATEGORIES[step + 1]}.plural`) });
  const searchable = category === "ingredient" || category === "topping";
  const itemCount = Object.values(selection).flat().length;
  const cta = (
    <PriceAndCta
      total={breakdown.total}
      label={ctaLabel}
      caption={ctaCaption}
      onNext={next}
      flashKey={flashKey}
      delta={lastDelta}
      onBack={step > 0 ? () => goToStep(step - 1) : undefined}
    />
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper lg:grid lg:grid-cols-[minmax(380px,440px)_1fr_minmax(320px,380px)] lg:grid-rows-[auto_1fr]">
      <BuilderTopBar
        className="lg:col-span-3"
        formulaName={formula.name[locale]}
        onFormula={() => (window.matchMedia("(min-width: 1024px)").matches ? setStage("formula") : setSummaryOpen(true))}
        step={step}
        breakdown={breakdown}
        onStep={goToStep}
      />

      {/* Stage: the bowl stays the hero; it compacts while the list scrolls. */}
      <section
        aria-label={t("bowlRegion")}
        className="relative flex shrink-0 items-center justify-center bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,var(--color-paper)_62%)] px-4 pb-6 pt-3 lg:order-2 lg:pb-10 lg:pt-8 [@media(max-height:700px)]:pb-5 [@media(max-height:700px)]:pt-1"
      >
        <div
          className={`transition-[width] duration-500 ease-[var(--ease-out-soft)] lg:w-[min(46vw,68vh,640px)] ${
            compact ? "w-[min(40vw,19dvh)]" : "w-[min(78vw,37dvh)] sm:w-[min(60vw,40dvh)] [@media(max-height:700px)]:w-[min(60vw,27dvh)]"
          }`}
        >
          <SaladBowl selection={selection} emptyLabel={t("emptyBowl")} label={t("bowlAlt")} />
        </div>
        <p
          className="pointer-events-none absolute end-4 top-3 hidden rounded-full bg-cream/90 px-2.5 py-1 text-[10.5px] font-medium text-mute shadow-[inset_0_0_0_1px_var(--color-line)] sm:block lg:end-6 lg:top-6"
          title={t("prototypeHint")}
        >
          {t("prototypeBadge")}
        </p>
      </section>

      {/* Picker sheet */}
      <section
        className="relative z-10 -mt-4 flex min-h-0 flex-1 flex-col rounded-t-[var(--radius-sheet)] bg-cream shadow-[0_-1px_0_var(--color-line),0_-18px_40px_-30px_rgba(29,33,30,0.45)] lg:order-1 lg:mt-0 lg:rounded-none lg:shadow-[1px_0_0_var(--color-line)]"
        aria-labelledby="step-title"
      >
        <div className="px-5 pb-3 pt-4 lg:px-6 lg:pt-6 [@media(max-height:700px)]:pb-2 [@media(max-height:700px)]:pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="t-eyebrow t-num text-mute" dir="ltr">
              <span className="text-ink">{String(step + 1).padStart(2, "0")}</span> / {String(CATEGORIES.length).padStart(2, "0")}
            </p>
            <Counter selected={summary.selected} included={summary.included} extra={summary.extra} blocked={summary.extraSlotFee === null} provisional={summary.provisional} />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <h2 id="step-title" key={category} className="t-h3 rise min-w-0">
              {t(`steps.${category}`)}
            </h2>
            {searchable && (
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((o) => !o);
                  setQuery("");
                }}
                aria-expanded={searchOpen}
                aria-label={t("search")}
                className={`icon-btn shrink-0 ${searchOpen ? "bg-ink text-white hover:bg-ink" : "bg-stone/70"}`}
              >
                {searchOpen ? <X size={18} aria-hidden /> : <Search size={18} aria-hidden />}
              </button>
            )}
          </div>
          <p className="t-small mt-1 text-mute">
            {summary.extraSlotFee !== null
              ? t("extraRule", { price: formatMAD(summary.extraSlotFee, locale), included: summary.included })
              : t("blockedRule", { included: summary.included })}
            {summary.provisional && <span className="text-amber-700"> · {t("provisional")}</span>}
          </p>
          {searchable && searchOpen && (
            <label className="rise relative mt-3 block">
              <span className="sr-only">{t("search")}</span>
              <Search size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden />
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="field mt-0 min-h-12 ps-11"
              />
            </label>
          )}
          {category === "topping" && !query && (
            <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 lg:-mx-6 lg:px-6" role="group" aria-label={t("groupsNav")}>
              {(["all", ...TOPPING_GROUPS.map((g) => g.id)] as const).map((g) => {
                const label = g === "all" ? t("groupAll") : TOPPING_GROUPS.find((x) => x.id === g)!.name[locale];
                return (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={group === g}
                    onClick={() => {
                      setGroup(g);
                      listRef.current?.scrollTo({ top: 0 });
                    }}
                    className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                      group === g ? "bg-ink text-white" : "bg-stone/70 text-ink-soft hover:bg-stone"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          ref={listRef}
          onScroll={(e) => setCompact(e.currentTarget.scrollTop > 24)}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line/70 px-3 pb-[calc(112px+var(--safe-bottom))] pt-4 [@media(max-height:700px)]:pb-[calc(84px+var(--safe-bottom))] sm:px-4 lg:px-5 lg:pb-8"
        >
          {category === "topping" && !query && group === "all" ? (
            TOPPING_GROUPS.map((g) => (
              <div key={g.id} className="mb-5">
                <h3 className="t-eyebrow mb-2 px-2 text-mute">
                  {g.name[locale]}
                  {g.id === "fruits" && <span className="ms-1 normal-case tracking-normal">· {t("seasonal")}</span>}
                </h3>
                <ChipGrid items={items.filter((i) => i.group === g.id)} locale={locale} selection={selection} extraIds={extraIds} onToggle={toggle} />
              </div>
            ))
          ) : items.length ? (
            <ChipGrid items={items} locale={locale} selection={selection} extraIds={extraIds} onToggle={toggle} />
          ) : (
            <p className="t-body py-12 text-center text-mute">{t("noResults")}</p>
          )}
        </div>
      </section>

      {/* Desktop summary column */}
      <aside className="hidden min-h-0 flex-col bg-cream shadow-[-1px_0_0_var(--color-line)] lg:order-3 lg:flex" aria-label={t("summaryTitle")}>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <Summary formula={formula} selection={selection} breakdown={breakdown} onRemove={removeItem} onStep={goToStep} onChangeFormula={() => setStage("formula")} />
        </div>
        <div className="border-t border-line p-5">{cta}</div>
      </aside>

      {/* Mobile action bar (thumb zone) */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-paper/88 px-4 pb-[max(12px,var(--safe-bottom))] pt-3 shadow-[0_-1px_0_var(--color-line)] backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen(true)}
          className="t-small mb-2 flex w-full items-center justify-between gap-3 px-1 text-ink-soft [@media(max-height:700px)]:hidden"
          aria-haspopup="dialog"
        >
          <span className="truncate">{t("itemsCount", { count: itemCount })}</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-ink">
            {t("details")} <ChevronDown size={14} className="rotate-180" aria-hidden />
          </span>
        </button>
        {cta}
      </div>

      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/35 backdrop-blur-[2px] lg:hidden" role="dialog" aria-modal="true" aria-label={t("summaryTitle")} onClick={() => setSummaryOpen(false)}>
          <div
            className="sheet-in max-h-[86dvh] w-full overflow-y-auto rounded-t-[var(--radius-sheet)] bg-cream px-5 pb-[calc(20px+var(--safe-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line" aria-hidden />
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
            <button type="button" onClick={() => setSummaryOpen(false)} className="btn btn-ghost mt-5 w-full">
              {t("close")}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div
          key={notice.key}
          role="status"
          className={`rise fixed inset-x-4 bottom-[calc(132px+var(--safe-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-medium shadow-[var(--shadow-lift)] lg:bottom-8 ${
            notice.tone === "warn" ? "bg-ink text-white" : "bg-cream text-ink ring-1 ring-line"
          }`}
        >
          <span className="flex-1">{notice.text}</span>
          {notice.action && (
            <button
              type="button"
              className="shrink-0 rounded-full bg-leaf-deep px-3 py-2 text-[12.5px] font-semibold text-white"
              onClick={() => {
                notice.action?.run();
                setNotice(null);
              }}
            >
              {notice.action.label}
            </button>
          )}
          <button type="button" onClick={() => setNotice(null)} aria-label={t("close")} className="grid h-8 w-8 shrink-0 place-items-center opacity-60 hover:opacity-100">
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
    <div className="grid grid-cols-4 gap-x-1.5 gap-y-4 max-[359px]:grid-cols-3 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-4">
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

function Counter({
  selected,
  included,
  extra,
  blocked,
  provisional,
}: {
  selected: number;
  included: number;
  extra: number;
  blocked: boolean;
  provisional: boolean;
}) {
  const t = useTranslations("builder");
  const full = selected >= included && included > 0;
  return (
    <p
      aria-live="polite"
      className={`t-label t-num inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 transition-colors duration-300 ${
        extra > 0 && blocked ? "bg-red-50 text-red-700" : full ? "bg-mist text-leaf-ink" : "bg-stone/70 text-ink-soft"
      }`}
    >
      <span className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: Math.min(included, 12) }, (_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${i < selected ? "bg-leaf-deep" : "bg-ink/15"}`} />
        ))}
      </span>
      <span>
        {t("counterShort", { selected, included })}
        {provisional && <span className="text-amber-700">*</span>}
        {extra > 0 && !blocked && <span className="font-semibold"> · {t("counterExtra", { count: extra })}</span>}
      </span>
    </p>
  );
}

function StepProgress({ step, breakdown, onStep }: { step: number; breakdown: ReturnType<typeof priceSalad>; onStep: (i: number) => void }) {
  const tc = useTranslations("categories");
  const t = useTranslations("builder");
  return (
    <nav aria-label={t("stepsNav")} className="flex gap-1 px-3 pb-1.5 sm:px-5">
      {CATEGORIES.map((c, i) => {
        const active = i === step;
        const done = breakdown.categories[c].selected > 0;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onStep(i)}
            aria-current={active ? "step" : undefined}
            aria-label={t("stepAria", { n: i + 1, name: tc(`${c}.plural`) })}
            className="group flex h-6 flex-1 flex-col justify-center"
          >
            <span
              className={`block h-[3px] w-full rounded-full transition-colors duration-500 ${
                active ? "bg-ink" : done ? "bg-leaf-deep/70" : "bg-ink/12 group-hover:bg-ink/25"
              }`}
            />
            <span className={`mt-1 hidden truncate text-[11px] font-medium lg:block ${active ? "text-ink" : "text-mute"}`}>{tc(`${c}.short`)}</span>
          </button>
        );
      })}
    </nav>
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
        <button type="button" onClick={onBack} aria-label={t("previous")} className="icon-btn h-14 w-14 shrink-0 bg-cream shadow-[inset_0_0_0_1px_var(--color-line)] max-[359px]:w-12">
          <ArrowLeft size={20} strokeWidth={1.75} className="flip-rtl" aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="group relative flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-leaf-deep pe-4 ps-5 max-[359px]:gap-2 max-[359px]:pe-3 max-[359px]:ps-4 text-white shadow-[0_14px_28px_-16px_rgba(61,110,16,0.95)] transition-[transform,background-color] duration-200 hover:bg-leaf-ink active:scale-[0.985]"
      >
        <span className="relative shrink-0 text-start">
          {flashKey > 0 && delta !== 0 && (
            <span key={flashKey} className="pop-delta t-num absolute -top-9 start-0 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[12px] font-semibold text-white" aria-hidden>
              {formatDelta(delta, locale)}
            </span>
          )}
          <AnimatedPrice value={total} className="t-price block text-[17px] leading-none" />
        </span>
        <span className="h-7 w-px shrink-0 bg-white/25" aria-hidden />
        <span className="min-w-0 flex-1 text-start leading-tight">
          <span className="block truncate text-[15.5px] font-semibold">{label}</span>
          <span className="block truncate text-[11.5px] font-medium text-white/70 max-[359px]:hidden">{caption}</span>
        </span>
        <ArrowRight size={20} className="flip-rtl shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </button>
    </div>
  );
}

function BuilderTopBar({
  className,
  formulaName,
  onFormula,
  step,
  breakdown,
  onStep,
}: {
  className?: string;
  formulaName?: string;
  onFormula?: () => void;
  step?: number;
  breakdown?: ReturnType<typeof priceSalad>;
  onStep?: (i: number) => void;
}) {
  const t = useTranslations("builder");
  return (
    <header className={`z-20 shrink-0 bg-paper/90 backdrop-blur-xl ${className ?? ""}`}>
      <div className="flex h-14 items-center justify-between gap-1 px-2 sm:px-4">
        <Link href="/" aria-label={t("exit")} className="icon-btn shrink-0">
          <ArrowLeft size={20} strokeWidth={1.75} className="flip-rtl" aria-hidden />
        </Link>
        {formulaName && onFormula ? (
          <button
            type="button"
            onClick={onFormula}
            className="inline-flex h-11 min-w-0 items-center gap-1 rounded-full px-3 transition-colors hover:bg-stone"
            aria-label={t("changeFormulaAria", { name: formulaName })}
          >
            <span className="t-title truncate text-[15px]">
              {/* Narrow phones: only the distinctive word ("Prestige"). */}
              <span className="max-[379px]:hidden">{formulaName.split(" ")[0]} </span>
              {formulaName.split(" ").slice(1).join(" ")}
            </span>
            <ChevronDown size={16} className="shrink-0 text-mute" aria-hidden />
          </button>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center">
          <LanguageSwitcher />
          <CartButton />
        </div>
      </div>
      {breakdown && step !== undefined && onStep ? <StepProgress step={step} breakdown={breakdown} onStep={onStep} /> : <div className="h-px bg-line" />}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Session draft: keeps the composition across a language switch or reload.

const DRAFT_KEY = "bsb-builder-draft";
const DRAFT_TTL = 6 * 60 * 60 * 1000;

interface Draft {
  formulaId: string;
  selection: Selection;
  step: number;
  stage: Stage;
  name: string;
  editing: string | null;
}

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft & { at: number };
    if (!d || Date.now() - d.at > DRAFT_TTL || !FORMULAS_BY_ID[d.formulaId]) return null;
    const selection = emptySelection();
    for (const c of CATEGORIES) {
      const ids = d.selection?.[c];
      if (Array.isArray(ids)) selection[c] = ids.filter((id) => ITEMS_BY_ID[id]?.category === c);
    }
    const stage: Stage = d.stage === "reveal" || d.stage === "formula" ? d.stage : "build";
    return {
      formulaId: d.formulaId,
      selection,
      step: Math.min(CATEGORIES.length - 1, Math.max(0, Math.floor(d.step) || 0)),
      stage,
      name: typeof d.name === "string" ? d.name.slice(0, 40) : "",
      editing: typeof d.editing === "string" ? d.editing : null,
    };
  } catch {
    return null;
  }
}

function writeDraft(d: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, at: Date.now() }));
  } catch {
    // Private mode: the builder still works, it just won't survive a reload.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

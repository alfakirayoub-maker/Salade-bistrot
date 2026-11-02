"use client";

import { useMemo, useState, useTransition } from "react";
import { ExternalLink, LogOut, Plus, Search, X } from "lucide-react";
import Image from "next/image";
import { CATEGORIES, type Category, type MenuItem } from "@/lib/menu/types";
import { MenuProvider } from "@/lib/menu/MenuProvider";
import { CATEGORY_NAMES, TOPPING_GROUPS } from "@/lib/menu/data";
import { IngredientThumb } from "@/components/builder/IngredientThumb";
import { setAvailability, signOut } from "@/app/admin/actions";
import { ItemSheet } from "./ItemSheet";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function AdminMenu({ initialItems, email }: { initialItems: MenuItem[]; email: string }) {
  const [items, setItems] = useState(initialItems);
  const [category, setCategory] = useState<Category>("ingredient");
  const [query, setQuery] = useState("");
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const notify = (text: string, tone: "ok" | "error" = "ok") => {
    setToast({ text, tone });
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 3500);
  };

  const upsert = (item: MenuItem) =>
    setItems((list) => (list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item]));

  const toggle = (item: MenuItem) => {
    const next = !item.available;
    // Optimistic: the switch moves at once, and rolls back if the save fails.
    upsert({ ...item, available: next });
    setPendingIds((s) => new Set(s).add(item.id));
    startTransition(async () => {
      const res = await setAvailability(item.id, next);
      setPendingIds((s) => {
        const copy = new Set(s);
        copy.delete(item.id);
        return copy;
      });
      if (res.ok) {
        upsert(res.item);
        notify(`${item.name.fr} : ${next ? "disponible" : "indisponible"}`);
      } else {
        upsert(item);
        notify(res.error, "error");
      }
    });
  };

  const counts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((c) => {
          const list = items.filter((i) => i.category === c);
          return [c, { total: list.length, off: list.filter((i) => !i.available).length }];
        }),
      ) as Record<Category, { total: number; off: number }>,
    [items],
  );

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return items
      .filter((i) => (q ? normalize(i.name.fr).includes(q) || i.name.ar.includes(query.trim()) : i.category === category))
      .filter((i) => !onlyUnavailable || !i.available)
      .sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.order - b.order);
  }, [items, category, query, onlyUnavailable]);

  const groups =
    !query && category === "topping"
      ? TOPPING_GROUPS.map((g) => ({ key: g.id, title: g.name.fr, list: visible.filter((i) => i.group === g.id) }))
      : [{ key: "all", title: "", list: visible }];

  return (
    <MenuProvider items={items}>
      <div className="min-h-dvh pb-[calc(96px+var(--safe-bottom))]">
        <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Image src="/brand/logo-mark.png" alt="" width={372} height={450} className="h-8 w-auto" />
              <div className="min-w-0 leading-tight">
                <p className="t-title text-[15px]">Admin · Menu</p>
                <p className="truncate text-[11.5px] text-mute">{email}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <a href="/fr" target="_blank" rel="noopener" className="icon-btn text-ink-soft" aria-label="Voir le site">
                <ExternalLink size={19} strokeWidth={1.75} aria-hidden />
              </a>
              <form action={signOut}>
                <button className="icon-btn text-ink-soft" aria-label="Se déconnecter">
                  <LogOut size={19} strokeWidth={1.75} aria-hidden />
                </button>
              </form>
            </div>
          </div>

          <nav className="no-scrollbar mx-auto flex max-w-3xl gap-1.5 overflow-x-auto px-4 pb-2.5" aria-label="Catégories">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={!query && c === category}
                onClick={() => {
                  setCategory(c);
                  setQuery("");
                }}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-colors ${
                  !query && c === category ? "bg-ink text-white" : "bg-stone/70 text-ink-soft hover:bg-stone"
                }`}
              >
                {CATEGORY_NAMES[c].fr}
                <span className="t-num text-[12px] opacity-70">{counts[c].total}</span>
                {counts[c].off > 0 && (
                  <span className="t-num rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800" title="Indisponibles">
                    {counts[c].off}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="h-px bg-line" />
        </header>

        <main className="mx-auto max-w-3xl px-4 pt-4">
          <div className="flex items-center gap-2">
            <label className="relative block flex-1">
              <span className="sr-only">Rechercher un article</span>
              <Search size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans tout le menu…" className="field mt-0 min-h-12 ps-11" />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute end-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-mute hover:bg-stone" aria-label="Effacer">
                  <X size={16} aria-hidden />
                </button>
              )}
            </label>
          </div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[14px] text-ink-soft">
            <input type="checkbox" checked={onlyUnavailable} onChange={(e) => setOnlyUnavailable(e.target.checked)} className="h-5 w-5 accent-[var(--color-leaf-deep)]" />
            Seulement les articles indisponibles
          </label>

          {groups.map((g) =>
            g.list.length ? (
              <section key={g.key} className="mt-5" aria-label={g.title || CATEGORY_NAMES[category].fr}>
                {g.title && <h2 className="t-eyebrow mb-2 text-mute">{g.title}</h2>}
                <ul className="card divide-y divide-line overflow-hidden">
                  {g.list.map((item) => (
                    <li key={item.id} className={`flex items-center gap-3 px-3 py-2.5 ${item.available ? "" : "bg-stone/40"}`}>
                      <button type="button" onClick={() => setEditing(item)} className="flex min-w-0 flex-1 items-center gap-3 text-start" aria-label={`Modifier ${item.name.fr}`}>
                        <span className={`h-12 w-12 shrink-0 rounded-full bg-white p-1 shadow-[inset_0_0_0_1px_var(--color-line)] ${item.available ? "" : "opacity-40 grayscale"}`}>
                          <IngredientThumb id={item.id} label={item.name.fr} />
                        </span>
                        <span className="min-w-0">
                          <span className={`block truncate text-[15px] font-semibold ${item.available ? "text-ink" : "text-mute line-through"}`}>{item.name.fr}</span>
                          <span className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-mute">
                            <span dir="rtl" lang="ar" className="font-[family-name:var(--font-plex-arabic)]">
                              {item.name.ar}
                            </span>
                            {query && <span>· {CATEGORY_NAMES[item.category].fr}</span>}
                            {item.supplement > 0 && <span className="t-num font-semibold text-leaf-deep">+{item.supplement} MAD</span>}
                            {item.seasonal && <span>· selon dispo.</span>}
                          </span>
                        </span>
                      </button>
                      <Switch checked={item.available} busy={pendingIds.has(item.id)} label={`${item.name.fr} disponible`} onChange={() => toggle(item)} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
          {!visible.length && <p className="t-body py-12 text-center text-mute">Aucun article.</p>}
          <p className="t-small mt-6 text-mute">
            Les changements apparaissent sur le site en quelques secondes. Un article indisponible reste visible, grisé, et ne peut pas être choisi.
          </p>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 bg-paper/88 px-4 pb-[max(12px,var(--safe-bottom))] pt-3 shadow-[0_-1px_0_var(--color-line)] backdrop-blur-xl">
          <div className="mx-auto max-w-3xl">
            <button type="button" onClick={() => setEditing("new")} className="btn btn-leaf min-h-14 w-full">
              <Plus size={19} aria-hidden /> Ajouter dans « {CATEGORY_NAMES[category].fr} »
            </button>
          </div>
        </div>

        {editing && (
          <ItemSheet
            item={editing === "new" ? null : editing}
            defaultCategory={category}
            onClose={() => setEditing(null)}
            onSaved={(item, created) => {
              upsert(item);
              setEditing(null);
              if (created) {
                setCategory(item.category);
                setQuery("");
              }
              notify(created ? `${item.name.fr} ajouté` : `${item.name.fr} enregistré`);
            }}
            onDeleted={(id, name) => {
              setItems((list) => list.filter((i) => i.id !== id));
              setEditing(null);
              notify(`${name} supprimé`);
            }}
          />
        )}

        {toast && (
          <div
            role="status"
            className={`rise fixed inset-x-4 bottom-[calc(92px+var(--safe-bottom))] z-50 mx-auto max-w-md rounded-2xl px-4 py-3 text-[14px] font-medium shadow-[var(--shadow-lift)] ${
              toast.tone === "error" ? "bg-red-700 text-white" : "bg-ink text-white"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </MenuProvider>
  );
}

function Switch({ checked, busy, label, onChange }: { checked: boolean; busy: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy}
      onClick={onChange}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-leaf-deep" : "bg-ink/20"} ${busy ? "opacity-70" : ""}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[inset-inline-start] duration-200 ${checked ? "start-[24px]" : "start-1"}`}
        aria-hidden
      />
    </button>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { CATEGORIES, type Category, type MenuItem } from "@/lib/menu/types";
import { CATEGORY_NAMES, TOPPING_GROUPS } from "@/lib/menu/data";
import { useMenu } from "@/lib/menu/MenuProvider";
import { validateItemInput, type ItemInput } from "@/lib/menu/rows";
import { getAsset, visualKeys } from "@/lib/visual/assets";
import { IngredientThumb } from "@/components/builder/IngredientThumb";
import { deleteItem, saveItem } from "@/app/admin/actions";

type Errors = Partial<Record<keyof ItemInput, string>>;

const kindOf = (c: Category) => (c === "base" ? "base" : c === "sauce" ? "sauce" : "pieces");

/** Bottom sheet to create, edit or delete one menu item. */
export function ItemSheet({
  item,
  defaultCategory,
  onClose,
  onSaved,
  onDeleted,
}: {
  item: MenuItem | null;
  defaultCategory: Category;
  onClose: () => void;
  onSaved: (item: MenuItem, created: boolean) => void;
  onDeleted: (id: string, name: string) => void;
}) {
  const { itemsById } = useMenu();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [category, setCategory] = useState<Category>(item?.category ?? defaultCategory);
  const [visual, setVisual] = useState(item?.visual ?? "");

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  // Items without their own drawing borrow one of the same kind.
  const hasOwnVisual = !!item && !item.visual && !!getAsset(item.id);
  const visualOptions = useMemo(
    () =>
      visualKeys(kindOf(category))
        .map((key) => ({ key, label: itemsById[key]?.name.fr ?? key }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [category, itemsById],
  );

  const submit = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries());
    raw.available = fd.get("available") ? "on" : "";
    raw.seasonal = fd.get("seasonal") ? "on" : "";
    // Same rules as the server: instant feedback, no round trip.
    const local = validateItemInput(raw);
    if (!local.ok) {
      setErrors(local.errors);
      setFormError("Vérifiez les champs en rouge.");
      return;
    }
    setErrors({});
    setFormError(null);
    start(async () => {
      const res = await saveItem(item?.id ?? null, raw);
      if (res.ok) {
        onSaved(res.item, !item);
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
      }
    });
  };

  const remove = () => {
    if (!item) return;
    start(async () => {
      const res = await deleteItem(item.id);
      if (res.ok) onDeleted(item.id, item.name.fr);
      else setFormError(res.error);
    });
  };

  const field = (name: keyof ItemInput) => (errors[name] ? "shadow-[inset_0_0_0_2px_#b91c1c]" : "");
  const err = (name: keyof ItemInput) =>
    errors[name] ? (
      <span className="t-small mt-1 block text-red-700" id={`err-${name}`}>
        {errors[name]}
      </span>
    ) : null;

  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      aria-labelledby="sheet-title"
      className="mx-auto mb-0 mt-auto max-h-[92dvh] w-full max-w-2xl rounded-t-[var(--radius-sheet)] bg-cream p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] sm:mb-auto sm:rounded-[var(--radius-sheet)]"
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
        className="sheet-in flex max-h-[92dvh] flex-col"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <span className="h-11 w-11 shrink-0 rounded-full bg-white p-1 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <IngredientThumb id={item?.id ?? (visual || "__new__")} label={item?.name.fr ?? "+"} />
          </span>
          <h2 id="sheet-title" className="t-h3 min-w-0 flex-1 truncate">
            {item ? item.name.fr : "Nouvel article"}
          </h2>
          <button type="button" onClick={onClose} disabled={pending} className="icon-btn shrink-0" aria-label="Fermer">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="t-label">Nom en français *</span>
              <input name="name_fr" defaultValue={item?.name.fr} maxLength={60} required className={`field ${field("name_fr")}`} aria-invalid={!!errors.name_fr} aria-describedby={errors.name_fr ? "err-name_fr" : undefined} />
              {err("name_fr")}
            </label>
            <label className="block">
              <span className="t-label">Nom en arabe *</span>
              <input
                name="name_ar"
                defaultValue={item?.name.ar}
                maxLength={60}
                required
                dir="rtl"
                lang="ar"
                className={`field font-[family-name:var(--font-plex-arabic)] ${field("name_ar")}`}
                aria-invalid={!!errors.name_ar}
                aria-describedby={errors.name_ar ? "err-name_ar" : undefined}
              />
              {err("name_ar")}
            </label>

            <label className="block">
              <span className="t-label">Catégorie</span>
              <select name="category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className="field">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_NAMES[c].fr}
                  </option>
                ))}
              </select>
            </label>
            {category === "topping" ? (
              <label className="block">
                <span className="t-label">Groupe *</span>
                <select name="group_id" defaultValue={item?.group ?? ""} className={`field ${field("group_id")}`} aria-invalid={!!errors.group_id}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {TOPPING_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name.fr}
                    </option>
                  ))}
                </select>
                {err("group_id")}
              </label>
            ) : (
              <span className="hidden sm:block" />
            )}

            <label className="block">
              <span className="t-label">Supplément (MAD)</span>
              <input name="supplement" type="number" inputMode="numeric" min={0} max={500} step={1} defaultValue={item?.supplement ?? 0} className={`field t-num ${field("supplement")}`} aria-invalid={!!errors.supplement} />
              <span className="t-small mt-1 block text-mute">0 = inclus sans supplément.</span>
              {err("supplement")}
            </label>
            <label className="block">
              <span className="t-label">Ordre d&apos;affichage</span>
              <input name="sort_order" type="number" inputMode="numeric" min={0} step={10} defaultValue={item?.order ?? ""} placeholder="À la fin" className={`field t-num ${field("sort_order")}`} />
              <span className="t-small mt-1 block text-mute">Plus petit = plus haut dans la liste.</span>
              {err("sort_order")}
            </label>
          </div>

          <div className="mt-5 grid gap-2">
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white px-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
              <span className="text-[15px] font-medium">Disponible aujourd&apos;hui</span>
              <input type="checkbox" name="available" defaultChecked={item?.available ?? true} className="h-6 w-6 accent-[var(--color-leaf-deep)]" />
            </label>
            <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white px-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
              <span className="text-[15px] font-medium">« Selon disponibilité »</span>
              <input type="checkbox" name="seasonal" defaultChecked={item?.seasonal ?? false} className="h-6 w-6 accent-[var(--color-leaf-deep)]" />
            </label>
          </div>

          {!hasOwnVisual && (
            <label className="mt-5 block">
              <span className="t-label">Visuel dans le bol</span>
              <select name="visual" value={visual} onChange={(e) => setVisual(e.target.value)} className="field">
                <option value="">Aucun (initiale)</option>
                {visualOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    Comme « {o.label} »
                  </option>
                ))}
              </select>
              <span className="t-small mt-1 block text-mute">Un nouvel article emprunte le dessin d&apos;un article proche, en attendant sa photo.</span>
            </label>
          )}
          {hasOwnVisual && <input type="hidden" name="visual" value="" />}

          {formError && (
            <p role="alert" className="t-small mt-4 rounded-xl bg-red-50 p-3 text-red-800">
              {formError}
            </p>
          )}

          {item && (
            <div className="mt-6 border-t border-line pt-4">
              {!confirmDelete ? (
                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-red-700 hover:bg-red-50">
                  <Trash2 size={17} aria-hidden /> Supprimer cet article
                </button>
              ) : (
                <div className="rounded-2xl bg-red-50 p-4 text-red-900" role="alert">
                  <p className="text-[14px] font-semibold">Supprimer « {item.name.fr} » définitivement ?</p>
                  <p className="t-small mt-1">
                    Pour une absence temporaire, préférez « Indisponible ». Les paniers des clients qui contiennent cet article devront être ajustés.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-ghost min-h-11 flex-1">
                      Annuler
                    </button>
                    <button type="button" onClick={remove} disabled={pending} className="btn min-h-11 flex-1 bg-red-700 text-white hover:bg-red-800">
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-line px-5 pb-[max(12px,var(--safe-bottom))] pt-3">
          <button type="button" onClick={onClose} disabled={pending} className="btn btn-ghost min-h-13 flex-1">
            Annuler
          </button>
          <button type="submit" disabled={pending} className="btn btn-leaf min-h-13 flex-[2] disabled:opacity-60">
            {pending ? "Enregistrement…" : item ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

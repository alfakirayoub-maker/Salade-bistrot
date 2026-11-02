/**
 * Mapping and validation between database rows (public.menu_items) and the
 * MenuItem shape the site uses. Pure functions, shared by the public site,
 * the admin page and its server actions.
 */
import { CATEGORIES, type Category, type MenuItem, type ToppingGroup } from "./types";

export const TOPPING_GROUP_IDS: ToppingGroup[] = ["viandes", "poissons", "volailles", "fromages", "fruits"];

export interface MenuItemRow {
  id: string;
  category: Category;
  group_id: ToppingGroup | null;
  name_fr: string;
  name_ar: string;
  supplement: number;
  available: boolean;
  seasonal: boolean;
  sort_order: number;
  visual: string | null;
}

export const rowToItem = (r: MenuItemRow): MenuItem => ({
  id: r.id,
  category: r.category,
  group: r.group_id ?? undefined,
  name: { fr: r.name_fr, ar: r.name_ar },
  supplement: r.supplement,
  available: r.available,
  seasonal: r.seasonal,
  order: r.sort_order,
  visual: r.visual ?? undefined,
});

/** Rows the site can trust: drops anything malformed rather than crashing. */
export const rowsToItems = (rows: unknown): MenuItem[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(
      (r): r is MenuItemRow =>
        !!r &&
        typeof r.id === "string" &&
        (CATEGORIES as readonly string[]).includes(r.category) &&
        typeof r.name_fr === "string" &&
        typeof r.name_ar === "string" &&
        Number.isInteger(r.supplement) &&
        typeof r.available === "boolean",
    )
    .map(rowToItem)
    .sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.order - b.order);
};

/** Fields an admin can edit. */
export interface ItemInput {
  category: Category;
  group_id: ToppingGroup | null;
  name_fr: string;
  name_ar: string;
  supplement: number;
  available: boolean;
  seasonal: boolean;
  sort_order: number;
  visual: string | null;
}

export type ValidationResult = { ok: true; value: ItemInput } | { ok: false; errors: Partial<Record<keyof ItemInput, string>> };

const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

/** Validates admin input; mirrors the database constraints with French messages. */
export const validateItemInput = (raw: Record<string, unknown>): ValidationResult => {
  const errors: Partial<Record<keyof ItemInput, string>> = {};
  const category = raw.category as Category;
  if (!(CATEGORIES as readonly string[]).includes(category)) errors.category = "Catégorie inconnue.";

  const name_fr = clean(raw.name_fr);
  const name_ar = clean(raw.name_ar);
  if (!name_fr) errors.name_fr = "Le nom en français est obligatoire.";
  else if (name_fr.length > 60) errors.name_fr = "60 caractères maximum.";
  if (!name_ar) errors.name_ar = "Le nom en arabe est obligatoire.";
  else if (name_ar.length > 60) errors.name_ar = "60 caractères maximum.";

  const supplement = Number(raw.supplement ?? 0);
  if (!Number.isInteger(supplement) || supplement < 0 || supplement > 500) errors.supplement = "Un nombre entier de 0 à 500 MAD.";

  const sort_order = Number(raw.sort_order ?? 0);
  if (!Number.isInteger(sort_order) || sort_order < 0 || sort_order > 100000) errors.sort_order = "Ordre invalide.";

  let group_id = (raw.group_id ? String(raw.group_id) : null) as ToppingGroup | null;
  if (category === "topping") {
    if (!group_id || !TOPPING_GROUP_IDS.includes(group_id)) errors.group_id = "Choisissez un groupe pour ce topping.";
  } else {
    group_id = null;
  }

  const visualRaw = clean(raw.visual);
  const visual = visualRaw || null;
  if (visual && !/^[a-z0-9-]+$/.test(visual)) errors.visual = "Visuel invalide.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      category,
      group_id,
      name_fr,
      name_ar,
      supplement,
      available: raw.available === true || raw.available === "true" || raw.available === "on",
      seasonal: raw.seasonal === true || raw.seasonal === "true" || raw.seasonal === "on",
      sort_order,
      visual,
    },
  };
};

/** URL-safe id from a French name: "Pêche de vigne" → "peche-de-vigne". */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");

/** First free id: "fraise", then "fraise-2", "fraise-3"… */
export const uniqueId = (base: string, taken: Set<string>) => {
  const root = base || "article";
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
};

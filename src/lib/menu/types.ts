export type Locale = "fr" | "ar";

/** A string available in every supported language. */
export type Localized = Record<Locale, string>;

/** The five steps of the official menu, in order. */
export const CATEGORIES = [
  "base",
  "ingredient",
  "topping",
  "petitPlus",
  "sauce",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Sub-groups used to organise toppings (Étape 3 of the menu). */
export type ToppingGroup = "viandes" | "poissons" | "volailles" | "fromages" | "fruits";

export interface MenuItem {
  id: string;
  category: Category;
  group?: ToppingGroup;
  name: Localized;
  /**
   * Premium supplement in whole MAD printed next to the item on the menu
   * (e.g. "Roquette + 15 dhs"). 0 when the menu prints none.
   */
  supplement: number;
  available: boolean;
  /** Fruits are marked "selon saison" on the menu. */
  seasonal?: boolean;
  /** Display order inside its category / group. */
  order: number;
}

/**
 * How many items of each category a formula includes.
 * `null` means the official menu does not state a quantity (see policies.ts).
 */
export type Allowances = Record<Category, number | null>;

export interface Formula {
  id: string;
  name: Localized;
  /** Starting price in whole MAD. */
  price: number;
  allowances: Allowances;
  /** Accent colour taken from the printed menu. */
  accent: string;
  order: number;
}

/** Ordered item ids per category. Order = order of selection. */
export type Selection = Record<Category, string[]>;

export const emptySelection = (): Selection => ({
  base: [],
  ingredient: [],
  topping: [],
  petitPlus: [],
  sauce: [],
});

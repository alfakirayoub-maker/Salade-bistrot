/**
 * Pricing engine. Pure functions only: the same code runs in the browser for
 * live feedback and on the server to re-validate orders (never trust client
 * prices). All amounts are integer MAD.
 *
 * Two independent concepts are priced separately:
 *  - premium supplement: printed next to an item ("Roquette + 15 dhs")
 *  - extra-slot fee: charged per item beyond the formula allowance
 *    ("Supplément ingrédient 05 dhs")
 * Whether they stack is governed by PricingPolicy.stackPremiumOnExtraSlot.
 */
import {
  CATEGORIES,
  type Category,
  type Formula,
  type MenuItem,
  type Selection,
} from "@/lib/menu/types";
import type { PricingPolicy } from "@/lib/menu/policies";

export interface ResolvedAllowance {
  included: number;
  /** True when the value comes from a provisional policy, not the menu. */
  provisional: boolean;
}

export const resolveAllowance = (
  formula: Formula,
  category: Category,
  policy: PricingPolicy,
): ResolvedAllowance => {
  const value = formula.allowances[category];
  if (value !== null) return { included: value, provisional: false };
  return { included: policy.provisionalAllowance[category] ?? 0, provisional: true };
};

export type PriceLine =
  | { kind: "formula"; formulaId: string; amount: number }
  | { kind: "premium"; category: Category; itemId: string; amount: number }
  | {
      kind: "extraSlot";
      category: Category;
      itemId: string;
      /** Fee actually charged for the slot after the stacking policy. */
      amount: number;
    };

export type PricingIssue =
  | { code: "unknownItem"; category: Category; itemId: string }
  | { code: "wrongCategory"; category: Category; itemId: string }
  | { code: "unavailable"; category: Category; itemId: string }
  | { code: "duplicate"; category: Category; itemId: string }
  | { code: "overLimitBlocked"; category: Category; selected: number; included: number }
  | { code: "belowMinimum"; category: Category; selected: number; minimum: number };

export interface CategorySummary {
  category: Category;
  selected: number;
  included: number;
  provisional: boolean;
  extra: number;
  /** null when going over the allowance is not allowed. */
  extraSlotFee: number | null;
  /** Item ids treated as extra slots (only differs from "last N" when not stacking). */
  extraItemIds: string[];
}

export interface PriceBreakdown {
  formulaPrice: number;
  lines: PriceLine[];
  categories: Record<Category, CategorySummary>;
  premiumTotal: number;
  extraTotal: number;
  total: number;
  issues: PricingIssue[];
  /** True when the selection can be ordered as-is. */
  valid: boolean;
}

/**
 * Decide which selected items occupy the extra (paid) slots.
 *
 * Stacking: every item pays its premium anyway, so the choice does not change
 * the total; the most recently selected items are treated as extras.
 * Not stacking: an extra item costs max(fee, premium) instead of premium, so
 * the customer-favourable assignment puts the highest premiums in the extra
 * slots (ties broken by most recent selection).
 */
const pickExtraItems = (
  ids: string[],
  extra: number,
  items: Record<string, MenuItem>,
  stack: boolean,
): string[] => {
  if (extra <= 0) return [];
  if (stack) return ids.slice(ids.length - extra);
  const ranked = ids
    .map((id, index) => ({ id, index, premium: items[id]?.supplement ?? 0 }))
    .sort((a, b) => b.premium - a.premium || b.index - a.index);
  const chosen = new Set(ranked.slice(0, extra).map((r) => r.id));
  return ids.filter((id) => chosen.has(id));
};

export const priceSalad = (
  formula: Formula,
  selection: Selection,
  items: Record<string, MenuItem>,
  policy: PricingPolicy,
): PriceBreakdown => {
  const lines: PriceLine[] = [{ kind: "formula", formulaId: formula.id, amount: formula.price }];
  const issues: PricingIssue[] = [];
  const categories = {} as Record<Category, CategorySummary>;
  let premiumTotal = 0;
  let extraTotal = 0;

  for (const category of CATEGORIES) {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const id of selection[category] ?? []) {
      const item = items[id];
      if (seen.has(id)) {
        issues.push({ code: "duplicate", category, itemId: id });
        continue;
      }
      seen.add(id);
      if (!item) {
        issues.push({ code: "unknownItem", category, itemId: id });
        continue;
      }
      if (item.category !== category) {
        issues.push({ code: "wrongCategory", category, itemId: id });
        continue;
      }
      if (!item.available) issues.push({ code: "unavailable", category, itemId: id });
      ids.push(id);
    }

    const { included, provisional } = resolveAllowance(formula, category, policy);
    const fee = policy.extraSlotFee[category];
    const extra = Math.max(0, ids.length - included);
    const extraItemIds = pickExtraItems(ids, extra, items, policy.stackPremiumOnExtraSlot);
    const extraSet = new Set(extraItemIds);

    if (extra > 0 && fee === null) {
      issues.push({ code: "overLimitBlocked", category, selected: ids.length, included });
    }
    const minimum = policy.minimum[category] ?? 0;
    if (ids.length < minimum) {
      issues.push({ code: "belowMinimum", category, selected: ids.length, minimum });
    }

    for (const id of ids) {
      const premium = items[id].supplement;
      const isExtra = extraSet.has(id) && fee !== null;
      if (!isExtra) {
        if (premium > 0) {
          lines.push({ kind: "premium", category, itemId: id, amount: premium });
          premiumTotal += premium;
        }
        continue;
      }
      if (policy.stackPremiumOnExtraSlot) {
        if (premium > 0) {
          lines.push({ kind: "premium", category, itemId: id, amount: premium });
          premiumTotal += premium;
        }
        lines.push({ kind: "extraSlot", category, itemId: id, amount: fee });
        extraTotal += fee;
      } else if (premium >= fee) {
        lines.push({ kind: "premium", category, itemId: id, amount: premium });
        premiumTotal += premium;
      } else {
        lines.push({ kind: "extraSlot", category, itemId: id, amount: fee });
        extraTotal += fee;
      }
    }

    categories[category] = {
      category,
      selected: ids.length,
      included,
      provisional,
      extra,
      extraSlotFee: fee,
      extraItemIds,
    };
  }

  const total = formula.price + premiumTotal + extraTotal;
  return {
    formulaPrice: formula.price,
    lines,
    categories,
    premiumTotal,
    extraTotal,
    total,
    issues,
    valid: issues.length === 0,
  };
};

/** What would happen to the price if `itemId` were added to `category`. */
export const previewAdd = (
  formula: Formula,
  selection: Selection,
  category: Category,
  itemId: string,
  items: Record<string, MenuItem>,
  policy: PricingPolicy,
): { allowed: boolean; delta: number; isExtra: boolean } => {
  const before = priceSalad(formula, selection, items, policy);
  const next = { ...selection, [category]: [...selection[category], itemId] };
  const after = priceSalad(formula, next, items, policy);
  const blocked = after.issues.some(
    (i) => i.code === "overLimitBlocked" && i.category === category,
  );
  return {
    allowed: !blocked,
    delta: after.total - before.total,
    isExtra: after.categories[category].extra > before.categories[category].extra,
  };
};

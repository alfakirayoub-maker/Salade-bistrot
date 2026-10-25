import { CATEGORIES, type Category, type Formula, type MenuItem, type Selection } from "@/lib/menu/types";
import type { PricingPolicy } from "@/lib/menu/policies";
import { priceSalad } from "@/lib/pricing/engine";

export interface CategoryImpact {
  category: Category;
  selected: number;
  includedBefore: number;
  includedAfter: number;
  /** Items that become (or stop being) paid extras. */
  extraBefore: number;
  extraAfter: number;
  /** Items the customer must remove because extras are not allowed. */
  mustRemove: number;
}

export interface FormulaChangeImpact {
  priceBefore: number;
  priceAfter: number;
  impacts: CategoryImpact[];
  /** True when switching changes nothing but the formula price. */
  silent: boolean;
  requiresResolution: boolean;
}

/**
 * Explains what switching formula does to an existing composition.
 * Nothing is ever removed automatically: the UI shows this to the customer.
 */
export const analyzeFormulaChange = (
  from: Formula,
  to: Formula,
  selection: Selection,
  items: Record<string, MenuItem>,
  policy: PricingPolicy,
): FormulaChangeImpact => {
  const before = priceSalad(from, selection, items, policy);
  const after = priceSalad(to, selection, items, policy);
  const impacts: CategoryImpact[] = [];

  for (const category of CATEGORIES) {
    const b = before.categories[category];
    const a = after.categories[category];
    const mustRemove = a.extraSlotFee === null ? a.extra : 0;
    if (b.extra !== a.extra || mustRemove > 0) {
      impacts.push({
        category,
        selected: a.selected,
        includedBefore: b.included,
        includedAfter: a.included,
        extraBefore: b.extra,
        extraAfter: a.extraSlotFee === null ? 0 : a.extra,
        mustRemove,
      });
    }
  }

  return {
    priceBefore: before.total,
    priceAfter: after.total,
    impacts,
    silent: impacts.length === 0,
    requiresResolution: impacts.some((i) => i.mustRemove > 0),
  };
};

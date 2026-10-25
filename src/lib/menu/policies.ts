/**
 * Business rules that the printed menu does NOT state explicitly.
 *
 * Every value here is a provisional default awaiting confirmation by the
 * restaurant (see docs/OPEN_QUESTIONS.md). They are isolated from the menu
 * data so the admin dashboard can edit them without touching official prices.
 */
import type { Category } from "./types";
import { OFFICIAL_EXTRA_SLOT_FEES } from "./data";

export interface PricingPolicy {
  /**
   * Fee per item selected beyond a formula's allowance.
   * `null` = the menu prints no fee, so going over the allowance is blocked.
   */
  extraSlotFee: Record<Category, number | null>;
  /**
   * When a premium item (e.g. Roquette +15) occupies an extra slot:
   * - true  → charge both the premium supplement AND the extra-slot fee
   * - false → charge only the higher of the two
   * Q-02: needs confirmation.
   */
  stackPremiumOnExtraSlot: boolean;
  /**
   * Allowance used when a formula's allowance is `null` (menu prints "SAUCES"
   * without a quantity for Équilibrée, Merveille and Prestige).
   * Q-01: needs confirmation. Marked as provisional in the UI.
   */
  provisionalAllowance: Partial<Record<Category, number>>;
  /** Minimum number of items required before the salad can be ordered. */
  minimum: Partial<Record<Category, number>>;
}

export const DEFAULT_POLICY: PricingPolicy = {
  extraSlotFee: {
    base: OFFICIAL_EXTRA_SLOT_FEES.base,
    ingredient: OFFICIAL_EXTRA_SLOT_FEES.ingredient,
    topping: OFFICIAL_EXTRA_SLOT_FEES.topping,
    petitPlus: null, // Q-03: no fee printed for an extra petit plus
    sauce: null, // Q-04: no fee printed for an extra sauce
  },
  stackPremiumOnExtraSlot: true,
  provisionalAllowance: { sauce: 1 },
  minimum: { base: 1 },
};

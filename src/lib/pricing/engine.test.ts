import { describe, expect, it } from "vitest";
import { FORMULAS_BY_ID, ITEMS_BY_ID, MENU_ITEMS } from "@/lib/menu/data";
import { DEFAULT_POLICY, type PricingPolicy } from "@/lib/menu/policies";
import { emptySelection, type Selection } from "@/lib/menu/types";
import { previewAdd, priceSalad, resolveAllowance } from "./engine";
import { analyzeFormulaChange } from "@/lib/builder/formulaChange";

const equilibree = FORMULAS_BY_ID.equilibree;
const prestige = FORMULAS_BY_ID.prestige;
const regale = FORMULAS_BY_ID.regale;

const sel = (partial: Partial<Selection>): Selection => ({ ...emptySelection(), ...partial });
const noStack: PricingPolicy = { ...DEFAULT_POLICY, stackPremiumOnExtraSlot: false };

describe("official menu data", () => {
  it("has the four formulas at the printed prices", () => {
    expect([49, 59, 69, 119]).toEqual(
      ["equilibree", "merveille", "prestige", "regale"].map((id) => FORMULAS_BY_ID[id].price),
    );
  });

  it("has every printed item with a French and Arabic name", () => {
    const counts = { base: 8, ingredient: 31, topping: 32, petitPlus: 8, sauce: 10 };
    for (const [category, n] of Object.entries(counts)) {
      expect(MENU_ITEMS.filter((i) => i.category === category)).toHaveLength(n);
    }
    for (const item of MENU_ITEMS) {
      expect(item.name.fr.length).toBeGreaterThan(0);
      expect(item.name.ar).toMatch(/[؀-ۿ]/);
    }
  });

  it("only charges the printed premium supplements", () => {
    const premiums = Object.fromEntries(
      MENU_ITEMS.filter((i) => i.supplement > 0).map((i) => [i.id, i.supplement]),
    );
    expect(premiums).toEqual({
      roquette: 15,
      quinoa: 10,
      "pates-completes": 10,
      "riz-brun": 10,
      "boeuf-roti": 10,
      "saumon-fume": 15,
      parmesan: 10,
      "sauce-healthy": 5,
      "sauce-yaourt": 5,
    });
  });
});

describe("priceSalad", () => {
  it("returns the formula price for an included-only salad", () => {
    const r = priceSalad(
      equilibree,
      sel({ base: ["laitue"], ingredient: ["concombre", "carottes"], topping: ["thon"] }),
      ITEMS_BY_ID,
      DEFAULT_POLICY,
    );
    expect(r.total).toBe(49);
    expect(r.valid).toBe(true);
    expect(r.lines).toHaveLength(1);
  });

  it("adds a premium supplement even inside the allowance", () => {
    const r = priceSalad(equilibree, sel({ base: ["roquette"] }), ITEMS_BY_ID, DEFAULT_POLICY);
    expect(r.total).toBe(49 + 15);
    expect(r.premiumTotal).toBe(15);
    expect(r.extraTotal).toBe(0);
  });

  it("charges 5 MAD per extra ingredient beyond the allowance", () => {
    const ingredient = ["concombre", "carottes", "oignons", "betterave", "poivron", "mais", "avocat"];
    const r = priceSalad(equilibree, sel({ base: ["laitue"], ingredient }), ITEMS_BY_ID, DEFAULT_POLICY);
    expect(r.categories.ingredient.extra).toBe(2);
    expect(r.extraTotal).toBe(10);
    expect(r.total).toBe(59);
  });

  it("charges 5 MAD per extra base and 10 MAD per extra topping", () => {
    const r = priceSalad(
      equilibree,
      sel({ base: ["laitue", "riz-blanc"], topping: ["thon", "feta", "surimi"] }),
      ITEMS_BY_ID,
      DEFAULT_POLICY,
    );
    expect(r.extraTotal).toBe(5 + 10);
    expect(r.total).toBe(64);
  });

  it("stacks premium and extra-slot fee by default", () => {
    // Équilibrée includes 1 base. Laitue (free) + Roquette (+15) → 1 extra base.
    const r = priceSalad(equilibree, sel({ base: ["laitue", "roquette"] }), ITEMS_BY_ID, DEFAULT_POLICY);
    expect(r.total).toBe(49 + 15 + 5);
  });

  it("charges only the higher amount when stacking is disabled", () => {
    const r = priceSalad(equilibree, sel({ base: ["laitue", "roquette"] }), ITEMS_BY_ID, noStack);
    // Roquette occupies the extra slot: max(5, 15) = 15. Laitue is included.
    expect(r.total).toBe(49 + 15);
    expect(r.categories.base.extraItemIds).toEqual(["roquette"]);
  });

  it("is independent of selection order when not stacking", () => {
    const a = priceSalad(equilibree, sel({ base: ["roquette", "laitue"] }), ITEMS_BY_ID, noStack);
    const b = priceSalad(equilibree, sel({ base: ["laitue", "roquette"] }), ITEMS_BY_ID, noStack);
    expect(a.total).toBe(b.total);
  });

  it("never double-charges a premium item inside the allowance", () => {
    const r = priceSalad(regale, sel({ base: ["roquette", "quinoa", "riz-brun"] }), ITEMS_BY_ID, DEFAULT_POLICY);
    expect(r.total).toBe(119 + 15 + 10 + 10);
    expect(r.extraTotal).toBe(0);
  });

  it("charges premium sauces", () => {
    const r = priceSalad(
      regale,
      sel({ base: ["laitue"], sauce: ["sauce-healthy", "sauce-yaourt", "pesto"] }),
      ITEMS_BY_ID,
      DEFAULT_POLICY,
    );
    expect(r.total).toBe(129);
    expect(r.valid).toBe(true);
  });

  it("blocks extra sauces and petits plus because the menu prints no fee", () => {
    const r = priceSalad(
      prestige,
      sel({ base: ["laitue"], sauce: ["pesto", "vinaigrette"], petitPlus: ["chia", "radis"] }),
      ITEMS_BY_ID,
      DEFAULT_POLICY,
    );
    expect(r.valid).toBe(false);
    expect(r.issues.filter((i) => i.code === "overLimitBlocked").map((i) => i.category).sort()).toEqual([
      "petitPlus",
      "sauce",
    ]);
    // Blocked extras add nothing to the price.
    expect(r.total).toBe(69);
  });

  it("flags provisional sauce allowances but uses the menu value for Régale", () => {
    expect(resolveAllowance(prestige, "sauce", DEFAULT_POLICY)).toEqual({ included: 1, provisional: true });
    expect(resolveAllowance(regale, "sauce", DEFAULT_POLICY)).toEqual({ included: 3, provisional: false });
  });

  it("requires at least one base", () => {
    const r = priceSalad(equilibree, sel({ ingredient: ["concombre"] }), ITEMS_BY_ID, DEFAULT_POLICY);
    expect(r.valid).toBe(false);
    expect(r.issues[0]).toMatchObject({ code: "belowMinimum", category: "base" });
  });

  it("rejects tampered selections", () => {
    const r = priceSalad(
      equilibree,
      sel({ base: ["laitue", "laitue"], ingredient: ["thon", "caviar"] }),
      ITEMS_BY_ID,
      DEFAULT_POLICY,
    );
    expect(r.issues.map((i) => i.code).sort()).toEqual(["duplicate", "unknownItem", "wrongCategory"]);
    expect(r.total).toBe(49);
  });

  it("flags unavailable items", () => {
    const items = { ...ITEMS_BY_ID, mangue: { ...ITEMS_BY_ID.mangue, available: false } };
    const r = priceSalad(equilibree, sel({ base: ["laitue"], topping: ["mangue"] }), items, DEFAULT_POLICY);
    expect(r.issues).toContainEqual({ code: "unavailable", category: "topping", itemId: "mangue" });
  });
});

describe("previewAdd", () => {
  it("reports the price delta of the next item", () => {
    const s = sel({ base: ["laitue"], topping: ["thon", "feta"] });
    expect(previewAdd(equilibree, s, "topping", "saumon-fume", ITEMS_BY_ID, DEFAULT_POLICY)).toEqual({
      allowed: true,
      delta: 15 + 10,
      isExtra: true,
    });
    expect(previewAdd(equilibree, s, "sauce", "pesto", ITEMS_BY_ID, DEFAULT_POLICY).allowed).toBe(true);
  });

  it("refuses an extra sauce", () => {
    const s = sel({ base: ["laitue"], sauce: ["pesto"] });
    expect(previewAdd(equilibree, s, "sauce", "vinaigrette", ITEMS_BY_ID, DEFAULT_POLICY).allowed).toBe(false);
  });
});

describe("analyzeFormulaChange", () => {
  const ingredient = ["concombre", "carottes", "oignons", "betterave", "poivron", "mais", "avocat", "noix"];

  it("explains that a smaller formula turns items into paid extras", () => {
    const s = sel({ base: ["laitue"], ingredient });
    const r = analyzeFormulaChange(prestige, equilibree, s, ITEMS_BY_ID, DEFAULT_POLICY);
    expect(r.impacts).toEqual([
      expect.objectContaining({ category: "ingredient", extraBefore: 0, extraAfter: 3, mustRemove: 0 }),
    ]);
    expect(r.priceAfter).toBe(49 + 15);
    expect(r.requiresResolution).toBe(false);
  });

  it("asks the customer to remove sauces that a smaller formula cannot hold", () => {
    const s = sel({ base: ["laitue"], sauce: ["pesto", "vinaigrette", "sauce-cesar"] });
    const r = analyzeFormulaChange(regale, prestige, s, ITEMS_BY_ID, DEFAULT_POLICY);
    expect(r.requiresResolution).toBe(true);
    expect(r.impacts).toContainEqual(expect.objectContaining({ category: "sauce", mustRemove: 2 }));
  });

  it("is silent when nothing but the formula price changes", () => {
    const s = sel({ base: ["laitue"], ingredient: ["concombre"] });
    expect(analyzeFormulaChange(equilibree, prestige, s, ITEMS_BY_ID, DEFAULT_POLICY).silent).toBe(true);
  });
});

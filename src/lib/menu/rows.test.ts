import { describe, expect, it } from "vitest";
import { MENU_ITEMS } from "./data";
import { rowsToItems, slugify, uniqueId, validateItemInput, type MenuItemRow } from "./rows";

const toRow = (i: (typeof MENU_ITEMS)[number]): MenuItemRow => ({
  id: i.id,
  category: i.category,
  group_id: i.group ?? null,
  name_fr: i.name.fr,
  name_ar: i.name.ar,
  supplement: i.supplement,
  available: i.available,
  seasonal: !!i.seasonal,
  sort_order: i.order,
  visual: null,
});

describe("rowsToItems", () => {
  it("round-trips the official menu", () => {
    const items = rowsToItems(MENU_ITEMS.map(toRow));
    expect(items).toHaveLength(MENU_ITEMS.length);
    const avocat = items.find((i) => i.id === "avocat")!;
    expect(avocat).toMatchObject({ category: "topping", group: "fruits", supplement: 5, seasonal: true, name: { fr: "Avocat" } });
  });

  it("drops malformed rows instead of crashing", () => {
    expect(rowsToItems([{ id: 1 }, null, { ...toRow(MENU_ITEMS[0]), category: "dessert" }])).toEqual([]);
    expect(rowsToItems("oops")).toEqual([]);
  });

  it("orders by category then display order", () => {
    const rows = [toRow(MENU_ITEMS.find((i) => i.id === "pesto")!), { ...toRow(MENU_ITEMS[1]), sort_order: 5 }, { ...toRow(MENU_ITEMS[0]), sort_order: 9 }];
    expect(rowsToItems(rows).map((i) => i.id)).toEqual(["laitue", "ble-souffle", "pesto"]);
  });
});

describe("validateItemInput", () => {
  const ok = { category: "topping", group_id: "fruits", name_fr: "  Fraise   des bois ", name_ar: "فراولة", supplement: "5", sort_order: "250", available: "on" };

  it("cleans and accepts valid input", () => {
    const r = validateItemInput(ok);
    expect(r).toEqual({
      ok: true,
      value: { category: "topping", group_id: "fruits", name_fr: "Fraise des bois", name_ar: "فراولة", supplement: 5, available: true, seasonal: false, sort_order: 250, visual: null },
    });
  });

  it("requires both names and a whole supplement", () => {
    const r = validateItemInput({ ...ok, name_fr: " ", name_ar: "", supplement: "2.5" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["name_ar", "name_fr", "supplement"]);
  });

  it("requires a group for toppings and drops it elsewhere", () => {
    const r = validateItemInput({ ...ok, group_id: "" });
    expect(r.ok).toBe(false);
    const base = validateItemInput({ ...ok, category: "base" });
    expect(base.ok && base.value.group_id).toBe(null);
  });

  it("rejects unknown categories and out-of-range supplements", () => {
    expect(validateItemInput({ ...ok, category: "dessert" }).ok).toBe(false);
    expect(validateItemInput({ ...ok, supplement: 900 }).ok).toBe(false);
    expect(validateItemInput({ ...ok, supplement: -5 }).ok).toBe(false);
  });
});

describe("ids", () => {
  it("slugifies French names", () => {
    expect(slugify("Pêche de vigne")).toBe("peche-de-vigne");
    expect(slugify("Œufs brouillés !")).toBe("oeufs-brouilles");
    expect(slugify("سلطة")).toBe("");
  });

  it("finds the first free id", () => {
    expect(uniqueId("fraise", new Set(["fraise", "fraise-2"]))).toBe("fraise-3");
    expect(uniqueId("", new Set())).toBe("article");
  });
});

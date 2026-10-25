import { describe, expect, it } from "vitest";
import { FORMULAS_BY_ID, ITEMS_BY_ID, WHATSAPP_NUMBER } from "@/lib/menu/data";
import { DEFAULT_POLICY } from "@/lib/menu/policies";
import { emptySelection } from "@/lib/menu/types";
import { buildWhatsAppMessage, priceOrder, whatsappUrl } from "./order";

const lines = [
  {
    formulaId: "equilibree",
    name: "Mon bowl",
    quantity: 2,
    selection: { ...emptySelection(), base: ["roquette"], ingredient: ["concombre", "avocat"], topping: ["crevettes"], sauce: ["sauce-yaourt"] },
  },
  {
    formulaId: "regale",
    name: "",
    quantity: 1,
    selection: { ...emptySelection(), base: ["laitue", "quinoa", "riz-blanc"], topping: ["saumon-fume"] },
  },
];

describe("priceOrder", () => {
  it("multiplies unit prices by quantity and sums lines", () => {
    const o = priceOrder(lines, FORMULAS_BY_ID, ITEMS_BY_ID, DEFAULT_POLICY);
    expect(o.lines[0].unitPrice).toBe(49 + 15 + 5);
    expect(o.lines[0].lineTotal).toBe(138);
    expect(o.lines[1].unitPrice).toBe(119 + 10 + 15);
    expect(o.total).toBe(138 + 144);
    expect(o.valid).toBe(true);
  });

  it("is invalid for an unknown formula", () => {
    const o = priceOrder([{ ...lines[0], formulaId: "nope" }], FORMULAS_BY_ID, ITEMS_BY_ID, DEFAULT_POLICY);
    expect(o.valid).toBe(false);
  });
});

describe("WhatsApp message", () => {
  const order = priceOrder(lines, FORMULAS_BY_ID, ITEMS_BY_ID, DEFAULT_POLICY);

  it("contains the customer, every selection and the same total as the cart", () => {
    const msg = buildWhatsAppMessage(order, { name: "Salma", mode: "pickup" }, ITEMS_BY_ID, "fr");
    expect(msg).toContain("Client: Salma");
    expect(msg).toContain("À emporter");
    expect(msg).toContain("Melina Équilibrée");
    expect(msg).toContain("Roquette (+15)");
    expect(msg).toContain("Quantité: 2 × 69 MAD = 138 MAD");
    expect(msg).toContain(`TOTAL: ${order.total} MAD`);
  });

  it("is localised in Arabic", () => {
    const msg = buildWhatsAppMessage(order, { name: "سلمى", mode: "delivery", address: "حمرية" }, ITEMS_BY_ID, "ar");
    expect(msg).toContain("توصيل");
    expect(msg).toContain("جرجير");
    expect(msg).toContain(`المجموع: ${order.total} درهم`);
  });

  it("builds a wa.me link for the configured number", () => {
    expect(whatsappUrl(WHATSAPP_NUMBER, "a b")).toBe("https://wa.me/212691322455?text=a%20b");
  });
});

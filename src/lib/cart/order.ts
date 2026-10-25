/**
 * Order totals and the WhatsApp message. Pure, so the same function can run
 * server-side when orders are persisted (Phase 5).
 */
import { CATEGORIES, type Category, type Formula, type Locale, type MenuItem, type Selection } from "@/lib/menu/types";
import type { PricingPolicy } from "@/lib/menu/policies";
import { priceSalad, type PriceBreakdown } from "@/lib/pricing/engine";
import { formatMAD } from "@/lib/format";

export interface OrderLineInput {
  formulaId: string;
  selection: Selection;
  name: string;
  quantity: number;
}

export interface PricedLine extends OrderLineInput {
  formula: Formula | undefined;
  breakdown: PriceBreakdown | null;
  unitPrice: number;
  lineTotal: number;
  valid: boolean;
}

export const priceOrder = (
  lines: OrderLineInput[],
  formulas: Record<string, Formula>,
  items: Record<string, MenuItem>,
  policy: PricingPolicy,
) => {
  const priced: PricedLine[] = lines.map((l) => {
    const formula = formulas[l.formulaId];
    const breakdown = formula ? priceSalad(formula, l.selection, items, policy) : null;
    const unitPrice = breakdown?.total ?? 0;
    return { ...l, formula, breakdown, unitPrice, lineTotal: unitPrice * l.quantity, valid: !!breakdown?.valid };
  });
  return {
    lines: priced,
    total: priced.reduce((s, l) => s + l.lineTotal, 0),
    valid: priced.length > 0 && priced.every((l) => l.valid),
  };
};

export interface CustomerInfo {
  name: string;
  phone?: string;
  mode: "pickup" | "delivery";
  address?: string;
  notes?: string;
}

const LABELS: Record<Locale, Record<Category | "title" | "customer" | "phone" | "mode" | "pickup" | "delivery" | "address" | "notes" | "total" | "qty" | "salad" | "extra", string>> = {
  fr: {
    title: "Nouvelle commande — Bistrot Salad Bar",
    customer: "Client",
    phone: "Téléphone",
    mode: "Mode",
    pickup: "À emporter",
    delivery: "Livraison",
    address: "Adresse",
    notes: "Remarques",
    total: "TOTAL",
    qty: "Quantité",
    salad: "Salade",
    extra: "en supplément",
    base: "Base",
    ingredient: "Ingrédients",
    topping: "Toppings",
    petitPlus: "Petits plus",
    sauce: "Sauces",
  },
  ar: {
    title: "طلب جديد — بيسترو سالاد بار",
    customer: "الزبون",
    phone: "الهاتف",
    mode: "طريقة الاستلام",
    pickup: "استلام من المطعم",
    delivery: "توصيل",
    address: "العنوان",
    notes: "ملاحظات",
    total: "المجموع",
    qty: "الكمية",
    salad: "سلطة",
    extra: "إضافية",
    base: "القاعدة",
    ingredient: "المكونات",
    topping: "الإضافات الرئيسية",
    petitPlus: "اللمسات الإضافية",
    sauce: "الصلصات",
  },
};

/** Builds the WhatsApp text. Its total is the same priceOrder() total shown in the cart. */
export const buildWhatsAppMessage = (
  order: ReturnType<typeof priceOrder>,
  customer: CustomerInfo,
  items: Record<string, MenuItem>,
  locale: Locale,
): string => {
  const L = LABELS[locale];
  const out: string[] = [`*${L.title}*`, ""];
  out.push(`${L.customer}: ${customer.name.trim()}`);
  if (customer.phone?.trim()) out.push(`${L.phone}: ${customer.phone.trim()}`);
  out.push(`${L.mode}: ${customer.mode === "pickup" ? L.pickup : L.delivery}`);
  if (customer.mode === "delivery" && customer.address?.trim()) out.push(`${L.address}: ${customer.address.trim()}`);
  out.push("");

  order.lines.forEach((line, i) => {
    const title = line.name.trim() ? ` « ${line.name.trim()} »` : "";
    out.push(`*${i + 1}. ${line.formula?.name[locale] ?? line.formulaId}*${title}`);
    for (const c of CATEGORIES) {
      const ids = line.selection[c];
      if (!ids.length) continue;
      const names = ids.map((id) => {
        const item = items[id];
        if (!item) return id;
        return item.supplement > 0 ? `${item.name[locale]} (+${item.supplement})` : item.name[locale];
      });
      const extra = line.breakdown?.categories[c].extra ?? 0;
      const extraNote = extra > 0 ? ` (${extra} ${L.extra})` : "";
      out.push(`• ${L[c]}: ${names.join(", ")}${extraNote}`);
    }
    out.push(`${L.qty}: ${line.quantity} × ${formatMAD(line.unitPrice, locale)} = ${formatMAD(line.lineTotal, locale)}`);
    out.push("");
  });

  if (customer.notes?.trim()) {
    out.push(`${L.notes}: ${customer.notes.trim()}`, "");
  }
  out.push(`*${L.total}: ${formatMAD(order.total, locale)}*`);
  return out.join("\n");
};

export const whatsappUrl = (number: string, message: string) =>
  `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;

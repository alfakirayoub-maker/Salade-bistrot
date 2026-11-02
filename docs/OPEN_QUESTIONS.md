# Restaurant rules to confirm

Everything below is **not stated** on the official menu ("compo new", Nov 2026 update; previous: NEW MENU COMPO, Jan 2025).
Each item has a provisional default in `src/lib/menu/policies.ts` (or noted
location) so the prototype works. None of them is presented as an official rule:
the UI marks any provisional allowance with an "à confirmer" badge (none left since Q-01 was answered).

| # | Question | Provisional behaviour | Where |
|---|----------|----------------------|-------|
| Q-01 | ~~Sauces included in Équilibrée, Merveille, Prestige?~~ Resolved (Nov 2026): **1 sauce**. | — | `data.ts` |
| Q-02 | When a premium item (Roquette +15, Quinoa +10, Saumon fumé +15, Parmesan +10…) is chosen **beyond** the allowance, does the customer pay the premium **and** the extra-slot fee (e.g. 15 + 5), or only one? | Both stack (15 + 5). A "no stacking" mode exists and is unit-tested (charges the higher of the two, assigned in the customer's favour). | `policies.stackPremiumOnExtraSlot` |
| Q-03 | Can a customer add an extra **petit plus**? At what price? | Not allowed (no fee printed). With 1 included, tapping another swaps it. | `policies.extraSlotFee.petitPlus` |
| Q-04 | Can a customer add an extra **sauce**? At what price? | Not allowed (no fee printed). With 1 included, tapping another swaps it. | `policies.extraSlotFee.sauce` |
| Q-05 | Is a base mandatory? Can a customer take fewer items than included (no discount assumed)? | At least 1 base is required; fewer items is allowed at the same price. | `policies.minimum` |
| Q-06 | Does a premium base count as the included base (Roquette instead of Laitue = +15 only)? | Yes: premium applies, no extra-slot fee inside the allowance. | engine |
| Q-07 | "Olives vertes / noires", "Poulet / Poulet grillé": one choice, or must the customer specify which? | Treated as one item each. | `data.ts` |
| Q-08 | ~~"Acajou" = cashew?~~ Resolved: the new menu prints "Noix de cajou". | — | `data.ts` |
| Q-09 | Which "selon disponibilité" items (fruits + haricots verts, artichaut, brocolis, tomates cerises, fenouil) are available today? | Grouped under "Selon disponibilité"; staff toggle availability daily from `/admin` (see docs/ADMIN.md). | `MenuItem.available` |
| Q-10 | Delivery: zones, fees, minimum order, hours? | Customer can state a preference; message says fees are confirmed on WhatsApp. No fee is computed. | cart |
| Q-11 | Payment methods? | Not mentioned anywhere; the restaurant confirms on WhatsApp. | cart |
| Q-12 | WhatsApp message language: always French for the staff, or the customer's language? | Customer's language. | `lib/cart/order.ts` |
| Q-13 | Arabic: Modern Standard Arabic (current) or Moroccan Darija (e.g. "سلطتك واجدة!", "اختار قاعدة السلطة ديالك")? | MSA. | `src/messages/ar.json` |
| Q-14 | Arabic formula names: translate (current: المتوازنة / الرائعة / بريستيج / ريغال) or keep French brand names? | Translated. | `data.ts` |
| Q-15 | Rights for the photos embedded in the PDF menu (shrimp bowl, salad bar). They may be stock images. | Used in the prototype hero/banner only. | `public/brand/` |
| Q-16 | Official vector logo file. | Logo rasterised from the PDF at 600 dpi. | `public/brand/logo*.png` |
| Q-17 | Opening hours, to show and to refuse orders when closed. | Not shown. | — |
| Q-18 | ~~Régale "(2 personnes)"?~~ Resolved: keep as is, shown as "Pour 2 personnes". | — | `Formula.servings` |
| Q-19 | ~~Does "Mélange sauces" count as an included sauce?~~ Resolved: yes, one sauce slot, +5 MAD. Which sauces can be mixed is told to staff in the order notes. | — | `data.ts` |

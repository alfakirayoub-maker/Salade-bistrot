# Phase 1: reference analysis, architecture and plan

## 1. Reference video (pizza configurator, 15 s, iPhone portrait)

What it does well, and what we kept:

| Observation | Applied to Bistrot Salad Bar |
|---|---|
| The product (pizza) is the hero: large, centred, top-down, always visible. | Bowl always visible: centre column on desktop, fixed top region on mobile. |
| Circular ingredient chips in a grid; a selected chip gets a ✓ badge and a "−" badge. | Same chip language (`IngredientChip`), chip thumbnail drawn with the same asset as the bowl. |
| Pieces fly out of the tapped chip in a staggered arc (~6 pieces, ~70 ms apart), scale up at the apex, land and settle. | `PieceGroup` timeline: launch from the chip rect, apex, land, small `back.out` settle, 55 ms stagger. |
| Existing toppings never move when something is added. | Placement seeded per ingredient id; the bowl never re-shuffles. |
| CTA pill shows the price, with a transient "+$1.80" delta. | Green CTA with price + `pop-delta` badge on each price change. |
| Final "bake" moment: glow, zoom, then a green "Added to order" state. | Reveal screen: glow, zoom, slow sway; add-to-cart button turns into a ✓ confirmation. |
| Dark, warm UI. | Deliberately different: clean warm-white editorial UI (brand), the dark bowl provides the contrast. |

Not copied: the dark theme, the S/M/L size toggle (no sizes on our menu), fire effects.

## 2. Official menu (source of truth)

Transcribed into `src/lib/menu/data.ts`: 4 formulas (49 / 59 / 69 / 119 MAD),
8 bases, 31 ingredients, 32 toppings in 5 groups, 8 petits plus, 10 sauces,
9 premium supplements, 3 extra-slot fees (base 5, ingredient 5, topping 10),
WhatsApp 0691322455, Label'Gallery address, Instagram. Unit-tested against the PDF
(counts, prices, supplements). Unclear rules → `docs/OPEN_QUESTIONS.md`.

## 3. Composition technique (decision)

**2.5D layered DOM + GSAP**, no Three.js, no PixiJS:

- Bowl: one pre-drawn image (SVG, no filters).
- Bases: canvas-painted texture per base, shown in CSS `clip-path` wedges (1–3 bases → a buddha-bowl split that animates between counts).
- Pieces: small pre-rasterised bitmaps, absolutely positioned and animated with GPU transforms only. Baked contact shadows, top-left light.
- Sauce: SVG drizzle drawn with `stroke-dashoffset` (the pour), shadow + highlight strokes, flecks.
- Depth: a rim-shade overlay above the food plus a "mound" light on the base, pointer parallax tilt on desktop.

Why: real photography will slot in as plain images; transforms stay on the compositor; no WebGL
cost on low-end phones; everything works without animation (reduced motion = fades only).

## 4. Architecture

```
src/
  app/[locale]/            /fr and /ar (next-intl, proxy.ts), all pages statically generated
    (site)/                home, menu, panier (cart), commande (confirmation)
    composer/              the builder (client)
  components/bowl/         SaladBowl engine
  components/builder/      Builder, chips, summary, formula cards, change dialog, reveal
  components/cart/         cart + WhatsApp checkout, confirmation
  lib/menu/                official data, types, provisional policies
  lib/pricing/engine.ts    pure pricing engine (+ tests)
  lib/builder/             formula-change analysis
  lib/cart/                localStorage store, order pricing, WhatsApp message (+ tests)
  lib/visual/              asset registry, sprites, base textures, placement, drizzle, bowl
  messages/fr.json, ar.json
supabase/migrations/       draft schema + RLS (not wired yet)
```

Prices are integer MAD. The pricing engine is pure and is designed to run again
server-side when orders are persisted (never trust client totals).

## 5. Phased plan

| Phase | Scope | Status |
|---|---|---|
| 1 | Reference analysis, menu extraction, open questions, architecture | **Done** |
| 2 | Bilingual landing, formula selection, responsive builder, temporary assets | **Done** |
| 3 | Visualization engine: layering, drop/remove, sauces, mobile | **Prototype done**; needs real photography + polish pass |
| 4 | All items, allowances, pricing, counters, summary, cart, WhatsApp | **Done (client-side)** |
| 5 | Supabase: tables from the draft migration, admin auth (Supabase Auth + RLS), menu/pricing/availability/branding admin, WhatsApp number setting, optional order persistence with server-side re-pricing via a Route Handler | Next |
| 6 | QA: device matrix, a11y audit (axe), Lighthouse, RTL review by a native speaker, pricing sign-off by the restaurant | After 5 |

Recommended immediate next steps:
1. Restaurant answers `OPEN_QUESTIONS.md` (Q-01, Q-02, Q-03/04 change prices).
2. Photo shoot per `ASSETS.md` (biggest visual win).
3. Phase 5 backend + admin.
4. Pre-render sprites/textures at build time for faster first paint on mobile.

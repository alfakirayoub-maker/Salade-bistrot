# Visual assets

## Status

| Asset | Status |
|-------|--------|
| Ingredient visuals (76 items) | **PROTOTYPE**: procedural SVG sprites (`src/lib/visual/sprites.ts`), rasterised to PNG in the browser. Distinct per item, but illustrations, not photography. |
| Base textures (8) | **PROTOTYPE**: procedural canvas paintings (`src/lib/visual/baseTextures.ts`). |
| Sauces (10) | **PROTOTYPE**: SVG drizzle per sauce colour (`src/lib/visual/drizzle.ts`). |
| Bowl | Procedural charcoal stoneware (`src/lib/visual/bowl.ts`), echoing the official menu's dark bowl. Can stay or be replaced by a photo. |
| Logo | Rasterised from the PDF. Official vector needed. |
| Hero bowl photo, salad bar photo | Extracted from the PDF menu. Rights to confirm (Q-15). |

The UI labels the builder "Visuels provisoires" and the footer says so too.

## Replacing a prototype with real photography

The bowl engine only reads `src/lib/visual/assets.ts`. For each item:

```ts
concombre: pieces({ count: 7, size: 0.13, layer: veg, src: [
  "/ingredients/concombre-1.webp",
  "/ingredients/concombre-2.webp",
  "/ingredients/concombre-3.webp",
] }),
laitue: { kind: "base", src: "/ingredients/base-laitue.webp" },
```

Nothing else changes: placement, layering, drop/remove animations, thumbnails.

### Photo brief (per piece item)

- Shot **straight top-down**, soft daylight from the **top-left** (matches the bowl and shadows).
- One isolated piece per file (one cucumber slice, one shrimp…), 3 variants.
- Transparent background WebP, ~400 px on the long side, tight crop, soft contact shadow kept or removed consistently.
- Same scale across items (a ruler card in the shot helps), so `size` stays meaningful.

### Base textures

- Top-down, square, the base filling the frame (no bowl), 1200×1200 WebP, seamless edges not required (clipped to a circle).

### Sauces

- Optional: photographed drizzle on transparent background per sauce. The SVG drizzle remains the fallback.

## Per-item parameters

`count` pieces dropped, `size` (fraction of bowl diameter), `layer` (greens 2 → garnish 6),
`distribution` (`scatter` | `cluster`), `radius`, `rotate` jitter, `thumbCount` for the chip.
Placement is seeded by item id (`placement.ts`) so adding/removing an item never
moves the others.

## Performance next step

Sprites are rasterised at runtime (~2 s for the four preview bowls on desktop).
Before production, pre-render them at build time to static WebP (or use real photos):
the `src` field already supports it.

/**
 * Ingredient asset registry: how each menu item is drawn in the bowl.
 *
 * This is the replaceable asset pipeline. Today every entry is a PROTOTYPE
 * (procedural sprite or base texture). To ship real photography, drop a
 * transparent top-down WebP per item in /public/ingredients/ and set `src`:
 * the bowl engine, placement and animations do not change.
 */
import type { Category } from "@/lib/menu/types";
import { ITEMS_BY_ID } from "@/lib/menu/data";
import { Defs, hashString, mulberry32, spriteDocument } from "./svg";
import { getSprite } from "./sprites";

export type Distribution = "scatter" | "cluster";

export interface PieceAsset {
  kind: "pieces";
  /** Real transparent image (one per variant). Undefined = prototype sprite. */
  src?: string[];
  /** Number of distinct procedural variants. */
  variants: number;
  /** Pieces dropped into the bowl. */
  count: number;
  /** Piece width as a fraction of the bowl diameter. */
  size: number;
  sizeJitter: number;
  /** Stacking order: higher layers render above lower ones. */
  layer: number;
  distribution: Distribution;
  /** Max distance from the bowl centre, as a fraction of the diameter. */
  radius: number;
  /** Rotation jitter in degrees (sprites already carry their own rotation). */
  rotate: number;
  /** Pieces shown in the selection chip. */
  thumbCount: number;
}

export interface BaseAsset {
  kind: "base";
  src?: string;
}

export interface SauceAsset {
  kind: "sauce";
  color: string;
  highlight: string;
  /** 0–1: creamy sauces are opaque, vinaigrettes are translucent. */
  opacity: number;
  /** Optional flecks (herbs, seeds, pepper). */
  flecks?: string;
  width: number;
}

export type IngredientAsset = PieceAsset | BaseAsset | SauceAsset;

/** Rendering layers inside the bowl, bottom to top. */
export const LAYERS = { greens: 2, veg: 3, protein: 4, cheese: 5, garnish: 6 } as const;

const pieces = (p: Partial<PieceAsset> & Pick<PieceAsset, "count" | "size" | "layer">): PieceAsset => ({
  kind: "pieces",
  variants: 3,
  sizeJitter: 0.12,
  distribution: "scatter",
  radius: 0.33,
  rotate: 360,
  thumbCount: 1,
  ...p,
});

const sauce = (color: string, highlight: string, opacity = 0.95, flecks?: string, width = 1.9): SauceAsset => ({
  kind: "sauce",
  color,
  highlight,
  opacity,
  flecks,
  width,
});

const { greens, veg, protein, cheese, garnish } = LAYERS;

export const ASSETS: Record<string, IngredientAsset> = {
  // Bases
  "ble-souffle": { kind: "base" },
  laitue: { kind: "base" },
  "pates-blanches": { kind: "base" },
  "riz-blanc": { kind: "base" },
  roquette: { kind: "base" },
  quinoa: { kind: "base" },
  "pates-completes": { kind: "base" },
  "riz-brun": { kind: "base" },

  // Ingredients
  concombre: pieces({ count: 7, size: 0.13, layer: veg }),
  "haricots-verts": pieces({ count: 4, size: 0.2, layer: greens }),
  carottes: pieces({ count: 8, size: 0.105, layer: veg }),
  oignons: pieces({ count: 5, size: 0.14, layer: veg }),
  "pomme-de-terre": pieces({ count: 7, size: 0.115, layer: veg }),
  betterave: pieces({ count: 7, size: 0.11, layer: veg }),
  poivron: pieces({ count: 6, size: 0.15, layer: veg }),
  artichaut: pieces({ count: 4, size: 0.15, layer: veg, distribution: "cluster" }),
  fenouil: pieces({ count: 5, size: 0.14, layer: greens }),
  brocolis: pieces({ count: 5, size: 0.15, layer: veg }),
  tomates: pieces({ count: 5, size: 0.15, layer: veg }),
  "tomates-cerises": pieces({ count: 7, size: 0.1, layer: veg, thumbCount: 2 }),
  "tomates-confites": pieces({ count: 6, size: 0.1, layer: veg }),
  "tomates-sechees": pieces({ count: 6, size: 0.12, layer: veg }),
  "aubergines-grillees": pieces({ count: 5, size: 0.14, layer: veg }),
  "courgettes-grillees": pieces({ count: 6, size: 0.13, layer: veg }),
  "chou-rouge": pieces({ count: 6, size: 0.17, layer: greens }),
  "chou-blanc": pieces({ count: 6, size: 0.17, layer: greens }),
  champignons: pieces({ count: 6, size: 0.13, layer: veg }),
  avocat: pieces({ count: 5, size: 0.17, layer: veg, distribution: "cluster" }),
  mais: pieces({ count: 7, size: 0.1, layer: garnish }),
  "coeur-de-palmier": pieces({ count: 7, size: 0.09, layer: veg }),
  noix: pieces({ count: 6, size: 0.1, layer: garnish }),
  cajou: pieces({ count: 7, size: 0.085, layer: garnish, thumbCount: 2 }),
  cacahuetes: pieces({ count: 6, size: 0.1, layer: garnish }),
  dattes: pieces({ count: 5, size: 0.11, layer: garnish }),
  figues: pieces({ count: 4, size: 0.13, layer: veg }),
  "raisins-secs": pieces({ count: 6, size: 0.09, layer: garnish }),
  "oignons-crispy": pieces({ count: 6, size: 0.12, layer: garnish }),
  cornichons: pieces({ count: 7, size: 0.085, layer: veg, thumbCount: 2 }),
  olives: pieces({ count: 9, size: 0.085, layer: garnish, variants: 4, thumbCount: 3 }),

  // Toppings
  "boeuf-roti": pieces({ count: 4, size: 0.19, layer: protein, distribution: "cluster" }),
  "charcuterie-boeuf": pieces({ count: 4, size: 0.16, layer: protein, distribution: "cluster" }),
  "saumon-fume": pieces({ count: 4, size: 0.2, layer: protein, distribution: "cluster" }),
  thon: pieces({ count: 4, size: 0.15, layer: protein, distribution: "cluster" }),
  calamars: pieces({ count: 7, size: 0.1, layer: protein }),
  anchois: pieces({ count: 5, size: 0.15, layer: protein }),
  crevettes: pieces({ count: 6, size: 0.15, layer: protein }),
  surimi: pieces({ count: 5, size: 0.15, layer: protein }),
  poulet: pieces({ count: 6, size: 0.15, layer: protein, distribution: "cluster" }),
  "charcuterie-poulet": pieces({ count: 4, size: 0.15, layer: protein, distribution: "cluster" }),
  "charcuterie-poulet-poivre": pieces({ count: 4, size: 0.15, layer: protein, distribution: "cluster" }),
  "oeufs-caille": pieces({ count: 6, size: 0.09, layer: protein, thumbCount: 2 }),
  "oeufs-fermiers": pieces({ count: 4, size: 0.15, layer: protein, distribution: "cluster" }),
  edam: pieces({ count: 7, size: 0.09, layer: cheese, thumbCount: 3 }),
  gouda: pieces({ count: 7, size: 0.09, layer: cheese, thumbCount: 3 }),
  "mozzarella-cerises": pieces({ count: 7, size: 0.075, layer: cheese, thumbCount: 3 }),
  feta: pieces({ count: 8, size: 0.085, layer: cheese, thumbCount: 3 }),
  parmesan: pieces({ count: 6, size: 0.12, layer: garnish }),
  chevre: pieces({ count: 7, size: 0.08, layer: cheese, thumbCount: 3 }),
  brie: pieces({ count: 4, size: 0.12, layer: cheese }),
  "fromage-bleu": pieces({ count: 7, size: 0.08, layer: cheese, thumbCount: 3 }),
  emmental: pieces({ count: 7, size: 0.09, layer: cheese, thumbCount: 3 }),
  mangue: pieces({ count: 7, size: 0.1, layer: veg, thumbCount: 3 }),
  ananas: pieces({ count: 7, size: 0.1, layer: veg, thumbCount: 3 }),
  poire: pieces({ count: 5, size: 0.13, layer: veg }),
  pomme: pieces({ count: 5, size: 0.13, layer: veg }),
  peche: pieces({ count: 5, size: 0.13, layer: veg }),
  framboise: pieces({ count: 7, size: 0.075, layer: garnish, thumbCount: 3 }),
  melon: pieces({ count: 7, size: 0.1, layer: veg, thumbCount: 3 }),
  grenade: pieces({ count: 6, size: 0.09, layer: garnish }),
  orange: pieces({ count: 5, size: 0.13, layer: veg }),
  "kiwi-kaki": pieces({ count: 5, size: 0.12, layer: veg }),

  // Petits plus
  "plantes-aromatiques": pieces({ count: 6, size: 0.1, layer: garnish }),
  lentilles: pieces({ count: 6, size: 0.09, layer: garnish }),
  "pois-chiches": pieces({ count: 6, size: 0.1, layer: garnish }),
  radis: pieces({ count: 7, size: 0.085, layer: veg, thumbCount: 2 }),
  chia: pieces({ count: 6, size: 0.1, layer: garnish }),
  "croutons-ail": pieces({ count: 7, size: 0.09, layer: garnish, thumbCount: 3 }),
  multigraines: pieces({ count: 6, size: 0.1, layer: garnish }),
  "baguettes-chips": pieces({ count: 5, size: 0.13, layer: garnish }),

  // Sauces
  "sauce-healthy": sauce("#c9d48a", "#eef3c8", 0.9, "#5c7a2a"),
  pesto: sauce("#4f7a22", "#8fb84a", 0.95, "#c8b46a", 2),
  "sauce-asiatique": sauce("#7a3e16", "#c27a3e", 0.85, "#f2e2b0", 1.6),
  vinaigrette: sauce("#d9a832", "#f8de8a", 0.62, "#3e5a1e", 1.75),
  "sauce-cesar": sauce("#f1e6c8", "#ffffff", 0.96, "#6a5a3a", 2),
  "sauce-yaourt": sauce("#f7f5ec", "#ffffff", 0.96, "#5e8a32", 2),
  "sauce-cocktail": sauce("#ee8a6a", "#ffc2a8", 0.95, undefined, 2),
  "miel-moutarde": sauce("#e2a826", "#ffe08a", 0.9, "#9a6a1a", 1.9),
  "sauce-balsamique": sauce("#3a1a14", "#8a4a3a", 0.88, undefined, 1.6),
  "salsa-verde": sauce("#3f7a2a", "#7cb84a", 0.85, "#d8e8a0", 1.9),
};

export const getAsset = (id: string): IngredientAsset | undefined => ASSETS[id];

export const isPrototypeAsset = (id: string) => {
  const a = ASSETS[id];
  if (!a) return true;
  if (a.kind === "pieces") return !a.src;
  if (a.kind === "base") return !a.src;
  return true;
};

export const categoryOf = (id: string): Category | undefined => ITEMS_BY_ID[id]?.category;

// ---------------------------------------------------------------------------
// Sprite rasterisation (browser only)
// ---------------------------------------------------------------------------

const spriteCache = new Map<string, Promise<string | null>>();

/** Renders the SVG sprite to a small PNG once; animations then move bitmaps. */
const rasterise = (svg: string, size: number): Promise<string | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, size, size);
      // Crop to the visible pixels so `size` means the visible piece width.
      const { data } = ctx.getImageData(0, 0, size, size);
      let x0 = size, y0 = size, x1 = 0, y1 = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (data[(y * size + x) * 4 + 3] > 10) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 <= x0 || y1 <= y0) return resolve(null);
      // Square crop centred on the piece keeps rotation pivots natural.
      const side = Math.min(size, Math.max(x1 - x0, y1 - y0) + 4);
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const out = document.createElement("canvas");
      out.width = side;
      out.height = side;
      out.getContext("2d")?.drawImage(canvas, cx - side / 2, cy - side / 2, side, side, 0, 0, side, side);
      out.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

export const spriteSvg = (id: string, variant: number, size = 192): string | null => {
  const gen = getSprite(id);
  if (!gen) return null;
  const seed = hashString(`${id}#${variant}`);
  const defs = new Defs();
  const content = gen(mulberry32(seed), defs, seed % 1000);
  return spriteDocument(content, defs, size);
};

export const getSpriteUrl = (id: string, variant: number, size = 192): Promise<string | null> => {
  const asset = ASSETS[id];
  if (asset?.kind === "pieces" && asset.src?.length) {
    return Promise.resolve(asset.src[variant % asset.src.length]);
  }
  if (typeof document === "undefined") return Promise.resolve(null);
  const key = `${id}#${variant}@${size}`;
  let p = spriteCache.get(key);
  if (!p) {
    const svg = spriteSvg(id, variant, size);
    p = svg ? rasterise(svg, size) : Promise.resolve(null);
    spriteCache.set(key, p);
  }
  return p;
};

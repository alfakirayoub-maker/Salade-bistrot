/**
 * Piece placement in the bowl.
 *
 * The bowl surface is covered by a fixed field of evenly spread "slots"
 * (a sunflower spiral reaching the rim). Each ingredient claims slots in the
 * least crowded places, spread apart from its own pieces, so the salad looks
 * tossed and even instead of piling up in the middle. Claims are kept in a
 * registry: adding or removing an ingredient never moves the others.
 */
import { hashString, mulberry32, rand } from "./svg";
import type { PieceAsset } from "./assets";

export interface Piece {
  key: string;
  ingredientId: string;
  variant: number;
  /** Centre position, 0–1 across the bowl. */
  x: number;
  y: number;
  /** Width as a fraction of the bowl. */
  size: number;
  rotation: number;
  flip: boolean;
  /** Paint order (layer first, then a stable random order). */
  z: number;
}

/** Outermost slot radius (food area radius is 0.42 of the bowl). */
const FIELD_RADIUS = 0.37;
const FIELD_SIZE = 140;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Evenly spread points over the whole food area, edge included. */
export const SLOTS: { x: number; y: number }[] = (() => {
  const r = mulberry32(20261102);
  return Array.from({ length: FIELD_SIZE }, (_, i) => {
    const d = FIELD_RADIUS * Math.sqrt((i + 0.5) / FIELD_SIZE);
    const a = i * GOLDEN_ANGLE;
    // A little jitter so the field never reads as a pattern.
    return { x: 0.5 + Math.cos(a) * d + rand(r, -0.008, 0.008), y: 0.5 + Math.sin(a) * d + rand(r, -0.008, 0.008) };
  });
})();

/** Pieces per ingredient: enough to read, few enough for a 12-ingredient bowl. */
export const pieceCount = (asset: PieceAsset, density = 1) => {
  const cap = asset.layer >= 4 && asset.size >= 0.14 ? 4 : 6;
  return Math.max(2, Math.round(Math.min(asset.count, cap) * density));
};

/** Which slots each ingredient occupies. One registry per bowl. */
export class SlotRegistry {
  private claims = new Map<string, number[]>();
  private load = new Array<number>(FIELD_SIZE).fill(0);

  /** Returns the slots of `id`, claiming them on first call. */
  claim(id: string, count: number): number[] {
    const existing = this.claims.get(id);
    if (existing && existing.length === count) return existing;
    if (existing) this.release(id);

    const r = mulberry32(hashString(`slots:${id}`));
    const chosen: number[] = [];
    for (let k = 0; k < count; k++) {
      let best = -1;
      let bestScore = -Infinity;
      for (let s = 0; s < FIELD_SIZE; s++) {
        if (chosen.includes(s)) continue;
        // Least crowded first, then apart from this ingredient's other pieces.
        // Beyond a comfortable gap distance stops mattering, so the centre fills too.
        const nearest = chosen.reduce((m, c) => Math.min(m, Math.hypot(SLOTS[s].x - SLOTS[c].x, SLOTS[s].y - SLOTS[c].y)), 1);
        const score = -this.load[s] * 10 + Math.min(nearest, 0.2) * 5 + r() * 0.6;
        if (score > bestScore) {
          bestScore = score;
          best = s;
        }
      }
      chosen.push(best);
      this.load[best]++;
    }
    this.claims.set(id, chosen);
    return chosen;
  }

  release(id: string) {
    const slots = this.claims.get(id);
    if (!slots) return;
    slots.forEach((s) => this.load[s]--);
    this.claims.delete(id);
  }

  ids() {
    return [...this.claims.keys()];
  }
}

export const piecesForSlots = (ingredientId: string, asset: PieceAsset, slots: number[]): Piece[] => {
  const r = mulberry32(hashString(`place:${ingredientId}`));
  return slots.map((slot, i) => {
    const p = SLOTS[slot];
    return {
      key: `${ingredientId}-${i}`,
      ingredientId,
      variant: i % asset.variants,
      x: p.x + rand(r, -0.012, 0.012),
      y: p.y + rand(r, -0.012, 0.012),
      size: asset.size * (1 + rand(r, -asset.sizeJitter, asset.sizeJitter)),
      rotation: rand(r, -asset.rotate / 2, asset.rotate / 2),
      flip: r() < 0.5,
      z: asset.layer * 1000 + Math.floor(r() * 999),
    };
  });
};

/**
 * Deterministic piece placement.
 *
 * Positions depend only on the ingredient id, never on what else is in the
 * bowl, so adding or removing one ingredient never reshuffles the others.
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

const disc = (r: () => number, radius: number, cx = 0.5, cy = 0.5) => {
  const a = r() * Math.PI * 2;
  const d = Math.sqrt(r()) * radius;
  return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d };
};

export const layoutPieces = (ingredientId: string, asset: PieceAsset, density = 1): Piece[] => {
  const r = mulberry32(hashString(`place:${ingredientId}`));
  const count = Math.max(2, Math.round(asset.count * density));
  const placed: { x: number; y: number }[] = [];

  // Clusters gather around a stable anchor, like a composed bowl.
  const anchor = disc(r, asset.radius * 0.62);
  const spread = asset.distribution === "cluster" ? asset.radius * 0.42 : asset.radius;

  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    // Best-of-N candidates: keeps pieces of one ingredient evenly spread.
    let best = { x: 0.5, y: 0.5 };
    let bestScore = -1;
    for (let c = 0; c < 14; c++) {
      const p =
        asset.distribution === "cluster"
          ? disc(r, spread, anchor.x, anchor.y)
          : disc(r, spread);
      const fromCentre = Math.hypot(p.x - 0.5, p.y - 0.5);
      if (fromCentre > asset.radius) continue;
      const nearest = placed.reduce((m, q) => Math.min(m, Math.hypot(p.x - q.x, p.y - q.y)), 1);
      if (nearest > bestScore) {
        bestScore = nearest;
        best = p;
      }
    }
    placed.push(best);
    pieces.push({
      key: `${ingredientId}-${i}`,
      ingredientId,
      variant: i % asset.variants,
      x: best.x,
      y: best.y,
      size: asset.size * (1 + rand(r, -asset.sizeJitter, asset.sizeJitter)),
      rotation: rand(r, -asset.rotate / 2, asset.rotate / 2),
      flip: r() < 0.5,
      z: asset.layer * 1000 + Math.floor(r() * 999),
    });
  }
  return pieces;
};

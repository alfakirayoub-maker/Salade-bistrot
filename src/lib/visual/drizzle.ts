/** Deterministic drizzle paths for sauces (bowl coordinates, 0–100). */
import { hashString, mulberry32, openPath, rand, type Pt } from "./svg";

export interface Drizzle {
  path: string;
  flecks: Pt[];
  drops: { x: number; y: number; r: number }[];
}

/**
 * A back-and-forth zigzag, like sauce poured from a squeeze bottle.
 * Each sauce slot gets its own angle so several sauces do not overlap.
 */
export const drizzleFor = (sauceId: string, slot: number): Drizzle => {
  const r = mulberry32(hashString(`drizzle:${sauceId}`));
  const angle = (slot * 60 + rand(r, -12, 12) + 25) * (Math.PI / 180);
  const R = 31;
  const passes = 5;
  const pts: Pt[] = [];
  const gap = (R * 1.5) / passes;
  for (let k = 0; k <= passes; k++) {
    const y = -R * 0.75 + k * gap + rand(r, -1.5, 1.5);
    const half = Math.sqrt(Math.max(0, R * R - y * y)) * rand(r, 0.7, 0.88);
    const dir = k % 2 === 0 ? 1 : -1;
    // A pass across the bowl with a gentle wobble…
    pts.push([-half * dir, y], [rand(r, -4, 4), y + rand(r, -1.6, 1.6)], [half * dir * 0.92, y + gap * 0.12]);
    // …then a rounded U-turn into the next pass.
    if (k < passes) pts.push([half * dir * 1.04 + dir * 2.5, y + gap * 0.5]);
  }
  const rotated = pts.map(([x, y]): Pt => [
    50 + x * Math.cos(angle) - y * Math.sin(angle),
    50 + x * Math.sin(angle) + y * Math.cos(angle),
  ]);
  const flecks: Pt[] = [];
  for (let i = 0; i < 22; i++) {
    const p = rotated[Math.floor(r() * rotated.length)];
    flecks.push([p[0] + rand(r, -2, 2), p[1] + rand(r, -2, 2)]);
  }
  const drops = [0, 1, 2].map(() => {
    const p = rotated[Math.floor(r() * rotated.length)];
    return { x: p[0] + rand(r, -4, 4), y: p[1] + rand(r, -4, 4), r: rand(r, 0.7, 1.3) };
  });
  return { path: openPath(rotated), flecks, drops };
};

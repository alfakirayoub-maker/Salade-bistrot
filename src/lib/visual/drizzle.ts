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
const rotate = (pts: Pt[], angle: number): Pt[] =>
  pts.map(([x, y]): Pt => [50 + x * Math.cos(angle) - y * Math.sin(angle), 50 + x * Math.sin(angle) + y * Math.cos(angle)]);

/** Back-and-forth passes with rounded U-turns, like a squeeze bottle. */
const zigzag = (r: () => number, R: number, passes: number): Pt[] => {
  const pts: Pt[] = [];
  const gap = (R * 1.5) / passes;
  for (let k = 0; k <= passes; k++) {
    const y = -R * 0.75 + k * gap + rand(r, -1.5, 1.5);
    const half = Math.sqrt(Math.max(0, R * R - y * y)) * rand(r, 0.7, 0.88);
    const dir = k % 2 === 0 ? 1 : -1;
    pts.push([-half * dir, y], [rand(r, -4, 4), y + rand(r, -1.6, 1.6)], [half * dir * 0.92, y + gap * 0.12]);
    if (k < passes) pts.push([half * dir * 1.04 + dir * 2.5, y + gap * 0.5]);
  }
  return pts;
};

/** A loose spiral from the rim towards the centre. */
const spiral = (r: () => number, R: number, turns: number): Pt[] => {
  const pts: Pt[] = [];
  const steps = Math.round(turns * 14);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const d = R * (1 - t * 0.82) + rand(r, -1, 1);
    pts.push([Math.cos(a) * d, Math.sin(a) * d]);
  }
  return pts;
};

/**
 * Each sauce slot gets its own gesture (zigzag, spiral, short zigzag) and
 * angle, so two or three sauces read as separate drizzles, not a grid.
 */
export const drizzleFor = (sauceId: string, slot: number): Drizzle => {
  const r = mulberry32(hashString(`drizzle:${sauceId}`));
  const angle = (slot * 70 + rand(r, -10, 10) + 25) * (Math.PI / 180);
  const shape = slot % 3 === 0 ? zigzag(r, 31, 5) : slot % 3 === 1 ? spiral(r, 27, 1.6) : zigzag(r, 19, 3);
  const pts = rotate(shape, angle);
  const flecks: Pt[] = [];
  for (let i = 0; i < 22; i++) {
    const p = pts[Math.floor(r() * pts.length)];
    flecks.push([p[0] + rand(r, -2, 2), p[1] + rand(r, -2, 2)]);
  }
  const drops = [0, 1, 2].map(() => {
    const p = pts[Math.floor(r() * pts.length)];
    return { x: p[0] + rand(r, -4, 4), y: p[1] + rand(r, -4, 4), r: rand(r, 0.7, 1.3) };
  });
  return { path: openPath(pts), flecks, drops };
};

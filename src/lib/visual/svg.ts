/** Small SVG authoring toolkit used by the prototype ingredient sprites. */

export type Rng = () => number;

/** Deterministic PRNG so every composition is stable between renders. */
export const mulberry32 = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const rand = (r: Rng, a: number, b: number) => a + (b - a) * r();
export const pick = <T>(r: Rng, list: readonly T[]): T => list[Math.floor(r() * list.length)];
export const n = (v: number) => (Math.round(v * 100) / 100).toString();

export type Pt = [number, number];

/** Smooth closed path through points (Catmull-Rom → cubic Bézier). */
export const closedPath = (pts: Pt[], tension = 1): string => {
  const len = pts.length;
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 0; i < len; i++) {
    const p0 = pts[(i - 1 + len) % len];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % len];
    const p3 = pts[(i + 2) % len];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d + "Z";
};

/** Smooth open path through points. */
export const openPath = (pts: Pt[]): string => {
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
};

/** Irregular organic outline around an ellipse. */
export const blobPts = (
  r: Rng,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count = 10,
  irregularity = 0.12,
  rotation = 0,
): Pt[] => {
  const pts: Pt[] = [];
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const k = 1 + (r() * 2 - 1) * irregularity;
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k;
    pts.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
  }
  return pts;
};

export const blob = (...args: Parameters<typeof blobPts>) => closedPath(blobPts(...args));

const clamp = (v: number, a = 0, b = 255) => Math.max(a, Math.min(b, v));

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export const shade = (hex: string, amt: number): string => {
  const v = parseInt(hex.slice(1), 16);
  const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((ch) =>
    Math.round(amt >= 0 ? clamp(ch + (255 - ch) * amt) : clamp(ch * (1 + amt))),
  );
  return `#${c.map((ch) => ch.toString(16).padStart(2, "0")).join("")}`;
};

export const mix = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
};

type Stop = [offset: number, color: string, opacity?: number];

/** Collects <defs> for one sprite document. */
export class Defs {
  private items: string[] = [];
  private i = 0;

  private stops(stops: Stop[]) {
    return stops
      .map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op === undefined ? "" : ` stop-opacity="${op}"`}/>`)
      .join("");
  }

  radial(stops: Stop[], o: { cx?: number; cy?: number; r?: number; fx?: number; fy?: number } = {}) {
    const id = `g${this.i++}`;
    const { cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy } = o;
    this.items.push(
      `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${this.stops(stops)}</radialGradient>`,
    );
    return `url(#${id})`;
  }

  linear(stops: Stop[], angleDeg = 90) {
    const id = `g${this.i++}`;
    const a = (angleDeg * Math.PI) / 180;
    const x = Math.cos(a) / 2;
    const y = Math.sin(a) / 2;
    this.items.push(
      `<linearGradient id="${id}" x1="${n(0.5 - x)}" y1="${n(0.5 - y)}" x2="${n(0.5 + x)}" y2="${n(0.5 + y)}">${this.stops(stops)}</linearGradient>`,
    );
    return `url(#${id})`;
  }

  clip(content: string) {
    const id = `c${this.i++}`;
    this.items.push(`<clipPath id="${id}">${content}</clipPath>`);
    return `url(#${id})`;
  }

  /** Organic surface grain, clipped to the shape it is applied to. */
  grain(amount: number, frequency: number, seed: number) {
    const id = `t${this.i++}`;
    const a = n(amount * 2.2);
    const b = n(-amount * 0.75);
    this.items.push(
      `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" seed="${seed}"/>` +
        `<feColorMatrix type="matrix" values="0 0 0 0 0.12 0 0 0 0 0.1 0 0 0 0 0.05 0 0 0 ${a} ${b}" result="d"/>` +
        `<feComposite in="d" in2="SourceGraphic" operator="in" result="di"/>` +
        `<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="di"/></feMerge></filter>`,
    );
    return `url(#${id})`;
  }

  toString() {
    return this.items.join("");
  }
}

/**
 * Wraps sprite content into a standalone SVG document with a soft contact
 * shadow baked in (light comes from the top-left, like the bowl).
 */
export const spriteDocument = (content: string, defs: Defs, size: number, shadow = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">` +
  `<defs>${defs}<filter id="ds" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
  `<feDropShadow dx="${n(1.4 * shadow)}" dy="${n(2.2 * shadow)}" stdDeviation="${n(1.5 * shadow)}" flood-color="#1f2a12" flood-opacity="${n(0.42 * Math.min(1, shadow))}"/></filter></defs>` +
  `<g filter="url(#ds)">${content}</g></svg>`;

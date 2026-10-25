/**
 * PROTOTYPE base textures (rice, lettuce, pasta…) painted procedurally on a
 * canvas. A base fills the bottom of the bowl, so it is drawn as one dense
 * texture rather than as individual sprites. Replace with real top-down
 * photography by setting `src` in assets.ts.
 */
import { hashString, mulberry32, type Rng, rand, shade, mix } from "./svg";

type Painter = (ctx: CanvasRenderingContext2D, size: number, r: Rng) => void;

const fillBg = (ctx: CanvasRenderingContext2D, size: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
};

/** Elongated grains (rice). */
const grains =
  (colors: string[], bg: string, length: number, width: number, density: number): Painter =>
  (ctx, size, r) => {
    fillBg(ctx, size, bg);
    const s = size / 600;
    const count = Math.round(density * (size / 600) ** 2);
    for (let i = 0; i < count; i++) {
      const x = r() * size;
      const y = r() * size;
      const a = r() * Math.PI;
      const L = length * s * rand(r, 0.8, 1.15);
      const W = width * s * rand(r, 0.85, 1.1);
      const c = colors[Math.floor(r() * colors.length)];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.shadowColor = "rgba(40,30,10,0.28)";
      ctx.shadowBlur = 2.5 * s;
      ctx.shadowOffsetX = 0.8 * s;
      ctx.shadowOffsetY = 1.2 * s;
      const g = ctx.createLinearGradient(0, -W, 0, W);
      g.addColorStop(0, shade(c, 0.35));
      g.addColorStop(0.5, c);
      g.addColorStop(1, shade(c, -0.18));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, L / 2, W / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

/** Small round beads (quinoa). */
const beads =
  (colors: string[], bg: string, radius: number, density: number): Painter =>
  (ctx, size, r) => {
    fillBg(ctx, size, bg);
    const s = size / 600;
    const count = Math.round(density * (size / 600) ** 2);
    for (let i = 0; i < count; i++) {
      const x = r() * size;
      const y = r() * size;
      const R = radius * s * rand(r, 0.8, 1.2);
      const c = colors[Math.floor(r() * colors.length)];
      ctx.shadowColor = "rgba(40,30,10,0.3)";
      ctx.shadowBlur = 2 * s;
      ctx.shadowOffsetX = 0.6 * s;
      ctx.shadowOffsetY = 1 * s;
      const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.35, R * 0.1, x, y, R);
      g.addColorStop(0, shade(c, 0.4));
      g.addColorStop(1, shade(c, -0.15));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "transparent";
      // germ ring
      ctx.strokeStyle = shade(c, 0.5);
      ctx.lineWidth = 0.7 * s;
      ctx.beginPath();
      ctx.arc(x, y, R * 0.75, rand(r, 0, 6), rand(r, 0, 6) + 2);
      ctx.stroke();
    }
  };

/** Puffed wheat: larger golden puffs with a crease. */
const puffs: Painter = (ctx, size, r) => {
  fillBg(ctx, size, "#b98838");
  const s = size / 600;
  const count = Math.round(1300 * (size / 600) ** 2);
  for (let i = 0; i < count; i++) {
    const x = r() * size;
    const y = r() * size;
    const L = 22 * s * rand(r, 0.8, 1.2);
    const W = 13 * s * rand(r, 0.85, 1.1);
    const a = r() * Math.PI;
    const c = mix("#e2b25a", "#c98a32", r());
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.shadowColor = "rgba(60,30,5,0.35)";
    ctx.shadowBlur = 4 * s;
    ctx.shadowOffsetX = 1.2 * s;
    ctx.shadowOffsetY = 2 * s;
    const g = ctx.createRadialGradient(-L * 0.15, -W * 0.25, 1, 0, 0, L * 0.6);
    g.addColorStop(0, shade(c, 0.45));
    g.addColorStop(1, shade(c, -0.15));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, L / 2, W / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(120,70,20,0.55)";
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(-L * 0.38, 0);
    ctx.quadraticCurveTo(0, W * 0.15, L * 0.38, 0);
    ctx.stroke();
    ctx.restore();
  }
};

/** Penne pasta: ridged tubes with visible openings. */
const penne =
  (color: string, bg: string): Painter =>
  (ctx, size, r) => {
    fillBg(ctx, size, bg);
    const s = size / 600;
    const count = Math.round(520 * (size / 600) ** 2);
    for (let i = 0; i < count; i++) {
      const x = r() * size;
      const y = r() * size;
      const L = 52 * s * rand(r, 0.85, 1.1);
      const W = 15 * s * rand(r, 0.9, 1.1);
      const a = r() * Math.PI;
      const c = mix(color, shade(color, -0.12), r());
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.shadowColor = "rgba(50,35,10,0.4)";
      ctx.shadowBlur = 5 * s;
      ctx.shadowOffsetX = 1.5 * s;
      ctx.shadowOffsetY = 2.5 * s;
      const g = ctx.createLinearGradient(0, -W / 2, 0, W / 2);
      g.addColorStop(0, shade(c, 0.4));
      g.addColorStop(0.45, c);
      g.addColorStop(1, shade(c, -0.25));
      ctx.fillStyle = g;
      const sk = W * 0.45;
      ctx.beginPath();
      ctx.moveTo(-L / 2 + sk, -W / 2);
      ctx.lineTo(L / 2, -W / 2);
      ctx.lineTo(L / 2 - sk, W / 2);
      ctx.lineTo(-L / 2, W / 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 0.8 * s;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(-L / 2 + sk * 0.5, (k * W) / 6);
        ctx.lineTo(L / 2 - sk * 0.5, (k * W) / 6);
        ctx.stroke();
      }
      ctx.fillStyle = shade(c, -0.35);
      ctx.beginPath();
      ctx.ellipse(L / 2 - sk / 2, 0, sk / 2.4, W / 2.3, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

/** Leafy bases: overlapping, ruffled leaves with veins and shadowed gaps. */
const leaves =
  (palette: { light: string; mid: string; dark: string; rib: string }, bg: string, leafLen: number, count: number, jagged: boolean): Painter =>
  (ctx, size, r) => {
    fillBg(ctx, size, bg);
    const s = size / 600;
    const total = Math.round(count * (size / 600) ** 2);
    for (let i = 0; i < total; i++) {
      const x = rand(r, -0.05, 1.05) * size;
      const y = rand(r, -0.05, 1.05) * size;
      const L = leafLen * s * rand(r, 0.7, 1.3);
      const W = L * (jagged ? 0.3 : 0.5) * rand(r, 0.8, 1.2);
      const a = r() * Math.PI * 2;
      const tone = r();
      const base = tone < 0.33 ? palette.dark : tone < 0.75 ? palette.mid : palette.light;
      const phase = r() * 6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.shadowColor = "rgba(8,24,2,0.55)";
      ctx.shadowBlur = 14 * s;
      ctx.shadowOffsetX = 3 * s;
      ctx.shadowOffsetY = 5 * s;
      const g = ctx.createLinearGradient(-L / 2, 0, L / 2, 0);
      g.addColorStop(0, shade(base, -0.18));
      g.addColorStop(0.45, shade(base, 0.12));
      g.addColorStop(1, shade(base, -0.05));
      ctx.fillStyle = g;
      ctx.beginPath();
      const steps = jagged ? 11 : 44;
      const edge = (k: number, side: 1 | -1) => {
        const t = k / steps;
        const env = Math.sin(Math.PI * Math.pow(t, 0.75));
        const ruffle = jagged
          ? (k % 2 ? 0.42 : 1)
          : 1 + 0.09 * Math.sin(k * 1.9 + phase + (side > 0 ? 0 : 2)) + rand(r, -0.04, 0.04);
        return [-L / 2 + t * L, side * W * env * ruffle] as const;
      };
      ctx.moveTo(-L / 2, 0);
      for (let k = 0; k <= steps; k++) ctx.lineTo(...edge(k, -1));
      for (let k = steps; k >= 0; k--) ctx.lineTo(...edge(k, 1));
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "transparent";
      // Pale centre of the leaf, fading to the ruffled edge.
      const rg = ctx.createRadialGradient(-L * 0.05, 0, 1, -L * 0.05, 0, W * 1.1);
      rg.addColorStop(0, "rgba(240,250,200,0.28)");
      rg.addColorStop(1, "rgba(240,250,200,0)");
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.strokeStyle = palette.rib;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = (jagged ? 1.4 : 3.2) * s;
      ctx.beginPath();
      ctx.moveTo(-L / 2, 0);
      ctx.quadraticCurveTo(0, W * 0.06, L * 0.42, 0);
      ctx.stroke();
      if (!jagged) {
        ctx.lineWidth = 0.9 * s;
        ctx.globalAlpha = 0.3;
        for (let k = 1; k < 7; k++) {
          const lx = -L / 2 + (k / 7) * L * 0.9;
          ctx.beginPath();
          ctx.moveTo(lx, 0);
          ctx.quadraticCurveTo(lx + L * 0.05, -W * 0.35, lx + L * 0.12, -W * 0.75);
          ctx.moveTo(lx, 0);
          ctx.quadraticCurveTo(lx + L * 0.05, W * 0.35, lx + L * 0.12, W * 0.75);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  };

/** Soft dome lighting: the food mounds up in the middle of the bowl. */
const mound = (ctx: CanvasRenderingContext2D, size: number) => {
  const g = ctx.createRadialGradient(size * 0.44, size * 0.42, size * 0.05, size / 2, size / 2, size * 0.62);
  g.addColorStop(0, "rgba(255,255,240,0.14)");
  g.addColorStop(0.55, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
};

const PAINTERS: Record<string, Painter> = {
  "ble-souffle": puffs,
  laitue: leaves({ light: "#b9dc6a", mid: "#7fb83e", dark: "#4a8a26", rib: "#e6f3bc" }, "#24470f", 230, 70, false),
  "pates-blanches": penne("#f1d27c", "#c9a24e"),
  "riz-blanc": grains(["#fbf8ef", "#f3eee0", "#ffffff", "#ebe4d2"], "#d9d0bc", 15, 6, 5200),
  roquette: leaves({ light: "#6aa63a", mid: "#3f7a22", dark: "#2a5a16", rib: "#a6d07a" }, "#1c3a0c", 120, 240, true),
  quinoa: beads(["#f2e6c8", "#e8d6aa", "#d9b98a", "#b4564a", "#f6eedb"], "#cdb88c", 4.2, 7000),
  "pates-completes": penne("#b9844a", "#7e5328"),
  "riz-brun": grains(["#c9a46a", "#b88f56", "#d8b67e", "#a67d48"], "#8e6a3e", 15, 6, 5200),
};

const cache = new Map<string, string>();

/** Returns an object URL (PNG) of the base texture, painted once and cached. */
export const getBaseTexture = async (id: string, size = 720): Promise<string | null> => {
  const key = `${id}@${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const painter = PAINTERS[id];
  if (!painter || typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  painter(ctx, size, mulberry32(hashString(id)));
  mound(ctx, size);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  cache.set(key, url);
  return url;
};

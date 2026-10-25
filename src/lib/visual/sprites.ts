/**
 * PROTOTYPE ingredient sprites.
 *
 * These are procedurally drawn, top-down illustrations used only until real
 * transparent ingredient photography is produced (see docs/ASSETS.md). Each
 * generator draws one piece centred in a 100×100 box. Light comes from the
 * top-left, matching the bowl and the baked contact shadow.
 */
import {
  type Defs,
  type Pt,
  type Rng,
  blob,
  blobPts,
  closedPath,
  mix,
  n,
  openPath,
  pick,
  rand,
  shade,
} from "./svg";

export type SpriteGen = (r: Rng, d: Defs, seed: number) => string;

const TAU = Math.PI * 2;
const polar = (cx: number, cy: number, radius: number, a: number): Pt => [
  cx + Math.cos(a) * radius,
  cy + Math.sin(a) * radius,
];

/** Soft specular sheen for moist / glossy surfaces. */
const sheen = (d: Defs, cx: number, cy: number, rx: number, ry: number, op = 0.35, rot = -30) => {
  const g = d.radial([
    [0, "#ffffff", op],
    [1, "#ffffff", 0],
  ]);
  return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${g}" transform="rotate(${rot} ${n(cx)} ${n(cy)})"/>`;
};

const rotateAll = (pts: Pt[], a: number, cx = 50, cy = 50): Pt[] =>
  pts.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  });

/** Rounded polygon (quadratic corners). */
const roundedPoly = (pts: Pt[], t = 0.22) => {
  const len = pts.length;
  let d = "";
  for (let i = 0; i < len; i++) {
    const p = pts[i];
    const prev = pts[(i - 1 + len) % len];
    const next = pts[(i + 1) % len];
    const a: Pt = [p[0] + (prev[0] - p[0]) * t, p[1] + (prev[1] - p[1]) * t];
    const b: Pt = [p[0] + (next[0] - p[0]) * t, p[1] + (next[1] - p[1]) * t];
    d += `${i === 0 ? "M" : "L"}${n(a[0])} ${n(a[1])}Q${n(p[0])} ${n(p[1])} ${n(b[0])} ${n(b[1])}`;
  }
  return d + "Z";
};

const hull = (points: Pt[]): Pt[] => {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: Pt[] = [];
  for (const pt of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
};

// ---------------------------------------------------------------------------
// Generic families
// ---------------------------------------------------------------------------

interface SliceOpts {
  radius: number;
  skin: string;
  skinWidth: number;
  flesh: [center: string, edge: string];
  irregularity?: number;
  grain?: number;
  grainFreq?: number;
  inner?: (r: Rng, d: Defs, R: number) => string;
  gloss?: number;
  squash?: number;
}

/** Round cross-section slice (cucumber, carrot, radish, kiwi…). */
const slice =
  (o: SliceOpts): SpriteGen =>
  (r, d, seed) => {
    const R = o.radius * rand(r, 0.92, 1.06);
    const ry = R * (o.squash ?? rand(r, 0.92, 1));
    const rot = r() * TAU;
    const irr = o.irregularity ?? 0.03;
    const outer = blob(r, 50, 50, R, ry, 14, irr, rot);
    const inner = blob(r, 50, 50, R - o.skinWidth, ry - o.skinWidth, 14, irr * 0.6, rot);
    const flesh = d.radial([
      [0, o.flesh[0]],
      [0.75, mix(o.flesh[0], o.flesh[1], 0.6)],
      [1, o.flesh[1]],
    ], { fx: 0.44, fy: 0.42 });
    const g = d.grain(o.grain ?? 0.22, o.grainFreq ?? 0.7, seed);
    return (
      `<g filter="${g}"><path d="${outer}" fill="${o.skin}"/><path d="${inner}" fill="${flesh}"/>` +
      `<g transform="rotate(${n((rot * 180) / Math.PI)} 50 50)">${o.inner?.(r, d, R - o.skinWidth) ?? ""}</g></g>` +
      sheen(d, 44, 42, R * 0.55, R * 0.3, o.gloss ?? 0.25)
    );
  };

interface CubeOpts {
  top: string;
  side: string;
  size: [number, number];
  irregularity?: number;
  depth?: number;
  grain?: number;
  extra?: (r: Rng, d: Defs, top: Pt[]) => string;
  gloss?: number;
}

/** Diced pieces seen from above with a hint of their side faces. */
const cube =
  (o: CubeOpts): SpriteGen =>
  (r, d, seed) => {
    const s = rand(r, o.size[0], o.size[1]);
    const a = r() * TAU;
    const irr = o.irregularity ?? 0.08;
    const half = s / 2;
    let top: Pt[] = [
      [50 - half, 48 - half],
      [50 + half, 48 - half],
      [50 + half, 48 + half],
      [50 - half, 48 + half],
    ].map(([x, y]) => [x + rand(r, -irr, irr) * s, y + rand(r, -irr, irr) * s] as Pt);
    top = rotateAll(top, a, 50, 48);
    const depth = o.depth ?? s * 0.28;
    const shifted = top.map(([x, y]) => [x + depth * 0.45, y + depth] as Pt);
    const body = hull([...top, ...shifted]);
    const topFill = d.linear([
      [0, shade(o.top, 0.18)],
      [1, shade(o.top, -0.06)],
    ], 50);
    const g = d.grain(o.grain ?? 0.28, 0.9, seed);
    return (
      `<g filter="${g}"><path d="${roundedPoly(body, 0.18)}" fill="${o.side}"/>` +
      `<path d="${roundedPoly(top, 0.2)}" fill="${topFill}"/>${o.extra?.(r, d, top) ?? ""}</g>` +
      (o.gloss ? sheen(d, 47, 44, s * 0.3, s * 0.16, o.gloss) : "")
    );
  };

interface CrescentOpts {
  outer: number;
  thickness: number;
  span: number;
  fill: [inner: string, outer: string];
  skin?: string;
  skinWidth?: number;
  grain?: number;
  extra?: (r: Rng, d: Defs) => string;
}

/** Crescent slices (avocado, apple, pear, peach, orange segment, cashew). */
const crescent =
  (o: CrescentOpts): SpriteGen =>
  (r, d, seed) => {
    const R = o.outer * rand(r, 0.92, 1.06);
    const span = o.span * rand(r, 0.9, 1.05);
    const start = -Math.PI / 2 - span / 2;
    const steps = 12;
    const cy = 50 + R * 0.55;
    const outerPts: Pt[] = [];
    const innerPts: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = start + (span * i) / steps;
      const taper = Math.sin((Math.PI * i) / steps);
      outerPts.push(polar(50, cy, R, a));
      innerPts.push(polar(50, cy, R - o.thickness * (0.25 + 0.75 * taper), a));
    }
    const shape = closedPath([...outerPts, ...innerPts.reverse()], 0.9);
    const fill = d.radial([
      [0.55, o.fill[0]],
      [1, o.fill[1]],
    ], { cx: 0.5, cy: 1.05, r: 0.75 });
    const g = d.grain(o.grain ?? 0.2, 0.8, seed);
    const rot = rand(r, 0, 360);
    const skin = o.skin
      ? `<path d="${openPath(outerPts)}" fill="none" stroke="${o.skin}" stroke-width="${o.skinWidth ?? 1.6}" stroke-linecap="round"/>`
      : "";
    return (
      `<g transform="rotate(${n(rot)} 50 50)"><g filter="${g}"><path d="${shape}" fill="${fill}"/>${skin}${o.extra?.(r, d) ?? ""}</g>` +
      sheen(d, 46, cy - R + o.thickness * 0.45, R * 0.35, o.thickness * 0.18, 0.3, 0) +
      `</g>`
    );
  };

interface StripOpts {
  length: [number, number];
  width: [number, number];
  fill: [string, string];
  bend?: number;
  taper?: number;
  irregularity?: number;
  grain?: number;
  extra?: (r: Rng, d: Defs, spine: Pt[], w: number) => string;
  gloss?: number;
}

/** Elongated pieces following a bent spine (pepper strips, chicken, pods…). */
const strip =
  (o: StripOpts): SpriteGen =>
  (r, d, seed) => {
    const L = rand(r, o.length[0], o.length[1]);
    const W = rand(r, o.width[0], o.width[1]);
    const bend = (o.bend ?? 0.3) * (r() < 0.5 ? -1 : 1) * rand(r, 0.4, 1);
    const steps = 10;
    const spine: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps - 0.5;
      spine.push([50 + t * L, 50 + Math.cos(t * Math.PI) * bend * L * 0.35 - bend * L * 0.17]);
    }
    const left: Pt[] = [];
    const right: Pt[] = [];
    const taper = o.taper ?? 0.6;
    for (let i = 0; i <= steps; i++) {
      const p = spine[i];
      const q = spine[Math.min(steps, i + 1)];
      const pp = spine[Math.max(0, i - 1)];
      const dx = q[0] - pp[0];
      const dy = q[1] - pp[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const t = i / steps;
      const w = (W / 2) * (1 - taper * Math.pow(Math.abs(t - 0.5) * 2, 2.2)) * (1 + rand(r, -1, 1) * (o.irregularity ?? 0.05));
      left.push([p[0] + nx * w, p[1] + ny * w]);
      right.push([p[0] - nx * w, p[1] - ny * w]);
    }
    const shape = closedPath([...left, ...right.reverse()], 0.95);
    const fill = d.linear([
      [0, o.fill[0]],
      [1, o.fill[1]],
    ], 90 + rand(r, -20, 20));
    const g = d.grain(o.grain ?? 0.22, 0.85, seed);
    const rot = rand(r, 0, 360);
    return (
      `<g transform="rotate(${n(rot)} 50 50)"><g filter="${g}"><path d="${shape}" fill="${fill}"/>${o.extra?.(r, d, spine, W) ?? ""}</g>` +
      (o.gloss ? `<path d="${openPath(spine.slice(2, -2).map(([x, y]) => [x, y - W * 0.22] as Pt))}" stroke="#fff" stroke-opacity="${o.gloss}" stroke-width="${n(W * 0.16)}" fill="none" stroke-linecap="round"/>` : "") +
      `</g>`
    );
  };

/** Several small pieces grouped in one sprite (corn, raisins, seeds…). */
const cluster =
  (count: [number, number], spread: number, piece: (r: Rng, d: Defs, x: number, y: number, i: number) => string): SpriteGen =>
  (r, d) => {
    const total = Math.round(rand(r, count[0], count[1]));
    const out: string[] = [];
    for (let i = 0; i < total; i++) {
      const a = r() * TAU;
      const rad = Math.sqrt(r()) * spread;
      out.push(piece(r, d, 50 + Math.cos(a) * rad, 50 + Math.sin(a) * rad, i));
    }
    return out.join("");
  };

const ball = (d: Defs, x: number, y: number, rad: number, base: string, gloss = 0.5) => {
  const g = d.radial([
    [0, shade(base, 0.35)],
    [0.6, base],
    [1, shade(base, -0.25)],
  ], { fx: 0.36, fy: 0.32 });
  return (
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rad)}" fill="${g}"/>` +
    `<ellipse cx="${n(x - rad * 0.32)}" cy="${n(y - rad * 0.36)}" rx="${n(rad * 0.32)}" ry="${n(rad * 0.2)}" fill="#fff" opacity="${gloss}" transform="rotate(-35 ${n(x)} ${n(y)})"/>`
  );
};

const grillMarks = (r: Rng, d: Defs, extent: number, color = "#3d2410") => {
  const g = d.linear([
    [0, color, 0],
    [0.5, color, 0.78],
    [1, color, 0],
  ], 90);
  let out = "";
  const a = rand(r, 20, 50);
  for (let i = -1; i <= 1; i++) {
    out += `<rect x="${n(50 - extent)}" y="${n(50 + i * extent * 0.55 - 2.2)}" width="${n(extent * 2)}" height="4.4" fill="${g}" transform="rotate(${n(a)} 50 50)"/>`;
  }
  return out;
};

const fibres = (r: Rng, count: number, color: string, len: number, opacity = 0.35, w = 0.6) => {
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = rand(r, 50 - len, 50 + len * 0.6);
    const y = rand(r, 44, 56);
    out += `<path d="M${n(x)} ${n(y)}q${n(len * 0.3)} ${n(rand(r, -1.5, 1.5))} ${n(len * 0.6)} ${n(rand(r, -1, 1))}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

const cucumberSeeds = (r: Rng, d: Defs, R: number) => {
  let out = "";
  const jelly = "#d7e9a6";
  for (let k = 0; k < 3; k++) {
    const a = (k * TAU) / 3 + 0.3;
    const [x, y] = polar(50, 50, R * 0.32, a);
    out += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(R * 0.3)}" ry="${n(R * 0.2)}" fill="${jelly}" opacity="0.75" transform="rotate(${n((a * 180) / Math.PI + 90)} ${n(x)} ${n(y)})"/>`;
    for (let s = -1; s <= 1; s++) {
      const [sx, sy] = polar(50, 50, R * 0.36, a + s * 0.32);
      out += `<ellipse cx="${n(sx)}" cy="${n(sy)}" rx="${n(R * 0.09)}" ry="${n(R * 0.045)}" fill="#f6f8e6" opacity="0.95" transform="rotate(${n(((a + s * 0.32) * 180) / Math.PI)} ${n(sx)} ${n(sy)})"/>`;
    }
  }
  return out;
};

const radialLines = (r: Rng, R: number, count: number, color: string, op: number, from = 0.15) => {
  let out = "";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + rand(r, -0.08, 0.08);
    const [x1, y1] = polar(50, 50, R * from, a);
    const [x2, y2] = polar(50, 50, R * rand(r, 0.8, 0.95), a);
    out += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-opacity="${op}" stroke-width="0.6" stroke-linecap="round"/>`;
  }
  return out;
};

const tomatoGel = (r: Rng, d: Defs, R: number, lobes: number) => {
  let out = `<circle cx="50" cy="50" r="${n(R * 0.86)}" fill="#e2341f"/>`;
  const gel = d.radial([
    [0, "#f7a25e"],
    [1, "#ec6236"],
  ]);
  for (let k = 0; k < lobes; k++) {
    const a = (k * TAU) / lobes + 0.4;
    const [x, y] = polar(50, 50, R * 0.42, a);
    out += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(R * 0.36)}" ry="${n(R * (lobes === 2 ? 0.5 : 0.3))}" fill="${gel}" transform="rotate(${n((a * 180) / Math.PI)} ${n(x)} ${n(y)})"/>`;
    for (let s = 0; s < 4; s++) {
      const [sx, sy] = polar(50, 50, R * rand(r, 0.28, 0.56), a + rand(r, -0.4, 0.4));
      out += `<ellipse cx="${n(sx)}" cy="${n(sy)}" rx="${n(R * 0.07)}" ry="${n(R * 0.045)}" fill="#f8dc8a" opacity="0.95"/>`;
    }
  }
  return out + `<circle cx="50" cy="50" r="${n(R * 0.14)}" fill="#e8492c"/>`;
};

const SPRITES: Record<string, SpriteGen> = {
  concombre: slice({ radius: 15, skin: "#2c5a1c", skinWidth: 1.7, flesh: ["#eef6cf", "#bcd97c"], inner: cucumberSeeds, grain: 0.18 }),

  "haricots-verts": (r, d, seed) =>
    [0, 1].map((i) =>
      strip({
        length: [40, 50],
        width: [4.2, 5.2],
        fill: ["#4f8f26", "#7cb73c"],
        bend: 0.18,
        taper: 0.75,
        gloss: 0.22,
        extra: (rr, _d, spine, w) =>
          spine.slice(2, -2).map(([x, y]) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(w * 0.5)}" ry="${n(w * 0.32)}" fill="#8fc64e" opacity="${n(rand(rr, 0.15, 0.35))}"/>`).join(""),
      })(r, d, seed + i),
    ).join(""),

  carottes: slice({
    radius: 12,
    skin: "#d8601a",
    skinWidth: 1.3,
    flesh: ["#f6a443", "#ef7d1f"],
    inner: (r, _d, R) => `<circle cx="50" cy="50" r="${n(R * 0.48)}" fill="#f8b65a" opacity="0.9"/>` + radialLines(r, R, 16, "#fbd08a", 0.45, 0.1),
  }),

  oignons: (r) => {
    let out = "";
    const R = rand(r, 15, 19);
    const a0 = rand(r, 0, 360);
    for (let k = 0; k < 3; k++) {
      const rad = R - k * 3.6;
      const span = rand(r, 140, 230);
      const s = ((a0 + rand(r, -20, 20)) * Math.PI) / 180;
      const e = s + (span * Math.PI) / 180;
      const [x1, y1] = polar(50, 50, rad, s);
      const [x2, y2] = polar(50, 50, rad, e);
      const arc = `M${n(x1)} ${n(y1)}A${n(rad)} ${n(rad)} 0 ${span > 180 ? 1 : 0} 1 ${n(x2)} ${n(y2)}`;
      out += `<path d="${arc}" stroke="#a23a72" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      out += `<path d="${arc}" stroke="#f3dbe8" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.95"/>`;
    }
    return `<g opacity="0.96">${out}</g>`;
  },

  "pomme-de-terre": cube({ top: "#f1d98c", side: "#cdb062", size: [13, 16], grain: 0.3 }),
  betterave: cube({ top: "#8e1747", side: "#560a28", size: [12, 15], grain: 0.25, gloss: 0.3 }),

  poivron: (r, d, seed) => {
    const color = pick(r, ["#d42a1d", "#f0b21c", "#d42a1d", "#e5671b"]);
    return strip({ length: [30, 40], width: [5.5, 7], fill: [shade(color, 0.12), shade(color, -0.12)], bend: 0.45, taper: 0.35, gloss: 0.45, grain: 0.12 })(r, d, seed);
  },

  artichaut: (r, d, seed) => {
    const g = d.grain(0.25, 0.8, seed);
    const rot = rand(r, 0, 360);
    let petals = "";
    for (let i = 0; i < 6; i++) {
      const a = -70 + i * 28 + rand(r, -6, 6);
      const len = rand(r, 22, 28) - Math.abs(i - 2.5) * 2;
      const fill = d.linear([
        [0, "#ece3b5"],
        [0.6, "#b7b36a"],
        [1, "#7c8a3c"],
      ], 270);
      petals += `<path d="M50 62 C${n(44)} ${n(62 - len * 0.4)} ${n(45)} ${n(62 - len)} 50 ${n(62 - len)} C55 ${n(62 - len)} 56 ${n(62 - len * 0.4)} 50 62Z" fill="${fill}" stroke="#6d7834" stroke-width="0.4" stroke-opacity="0.5" transform="rotate(${n(a)} 50 62)"/>`;
    }
    return `<g transform="rotate(${n(rot)} 50 50)"><g filter="${g}">${petals}<ellipse cx="50" cy="60" rx="9" ry="6" fill="#efe6bd"/></g></g>`;
  },

  fenouil: (r, d) => {
    let out = "";
    const rot = rand(r, 0, 360);
    for (let k = 0; k < 3; k++) {
      const w = 22 - k * 5;
      const h = 26 - k * 5;
      const fill = d.linear([
        [0, "#f7f8ea", 0.95],
        [1, "#d6e3a6", 0.9],
      ], 90);
      out += `<path d="M${n(50 - w / 2)} 62 C${n(50 - w / 2)} ${n(62 - h)} ${n(50 + w / 2)} ${n(62 - h)} ${n(50 + w / 2)} 62 L${n(50 + w / 2 - 2.6)} 62 C${n(50 + w / 2 - 2.6)} ${n(65 - h)} ${n(50 - w / 2 + 2.6)} ${n(65 - h)} ${n(50 - w / 2 + 2.6)} 62Z" fill="${fill}" stroke="#b8cf7a" stroke-width="0.4"/>`;
    }
    return `<g transform="rotate(${n(rot)} 50 50)">${out}</g>`;
  },

  brocolis: (r, d, seed) => {
    const rot = rand(r, 0, 360);
    const g = d.grain(0.35, 1.2, seed);
    const stem = d.linear([
      [0, "#d8e4a0"],
      [1, "#a9c065"],
    ], 0);
    let crown = "";
    const florets = 26;
    for (let i = 0; i < florets; i++) {
      const a = r() * TAU;
      const rad = Math.sqrt(r()) * 12;
      const [x, y] = polar(50, 44, rad, a);
      const c = mix("#2f5e1c", "#6a9a35", r() * 0.8);
      crown += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rand(r, 3, 4.2))}" fill="${c}"/>`;
    }
    return (
      `<g transform="rotate(${n(rot)} 50 50)"><path d="M46 52 L44 70 Q50 73 56 70 L54 52Z" fill="${stem}"/>` +
      `<g filter="${g}"><circle cx="50" cy="44" r="15" fill="#2c541a"/>${crown}</g>${sheen(d, 45, 38, 7, 4, 0.18)}</g>`
    );
  },

  tomates: crescent({
    outer: 24,
    thickness: 15,
    span: 1.9,
    fill: ["#f28a50", "#d9301f"],
    skin: "#b91c12",
    skinWidth: 2.2,
    extra: (r) => {
      let out = "";
      for (let i = 0; i < 9; i++) out += `<ellipse cx="${n(rand(r, 38, 62))}" cy="${n(rand(r, 46, 54))}" rx="1.2" ry="0.8" fill="#f8d98a"/>`;
      return out;
    },
  }),

  "tomates-cerises": slice({ radius: 10.5, skin: "#c51f14", skinWidth: 1.1, flesh: ["#e8432a", "#d42a18"], inner: (r, d, R) => tomatoGel(r, d, R, 2), gloss: 0.45 }),

  "tomates-confites": (r, d, seed) => {
    const g = d.grain(0.3, 0.9, seed);
    const fill = d.radial([
      [0, "#c8321c"],
      [1, "#7a150c"],
    ], { fx: 0.4, fy: 0.38 });
    let wrinkles = "";
    for (let i = 0; i < 5; i++) {
      const a = r() * TAU;
      const [x, y] = polar(50, 50, rand(r, 2, 8), a);
      wrinkles += `<path d="M${n(x)} ${n(y)}q${n(rand(r, -5, 5))} ${n(rand(r, -5, 5))} ${n(rand(r, -8, 8))} ${n(rand(r, -6, 6))}" stroke="#5c0f08" stroke-opacity="0.45" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
    }
    return (
      `<g filter="${g}"><path d="${blob(r, 50, 50, 13, 10.5, 11, 0.16, r() * TAU)}" fill="${fill}"/>${wrinkles}</g>` +
      `<ellipse cx="45" cy="45" rx="3.4" ry="1.6" fill="#fff" opacity="0.55" transform="rotate(-30 45 45)"/><circle cx="54" cy="53" r="0.9" fill="#fff" opacity="0.5"/>`
    );
  },

  "tomates-sechees": (r, d, seed) =>
    strip({
      length: [22, 30],
      width: [10, 13],
      fill: ["#9c2414", "#5a100a"],
      bend: 0.25,
      taper: 0.4,
      irregularity: 0.25,
      grain: 0.4,
      gloss: 0.18,
      extra: (rr) => fibres(rr, 5, "#3a0905", 10, 0.4, 0.8),
    })(r, d, seed),

  "aubergines-grillees": slice({
    radius: 15,
    skin: "#2e1532",
    skinWidth: 1.8,
    flesh: ["#e2c792", "#b48a4f"],
    irregularity: 0.06,
    inner: (r, d, R) => {
      let seeds = "";
      for (let i = 0; i < 14; i++) {
        const [x, y] = polar(50, 50, R * rand(r, 0.2, 0.6), r() * TAU);
        seeds += `<circle cx="${n(x)}" cy="${n(y)}" r="0.7" fill="#6b4a26" opacity="0.6"/>`;
      }
      return seeds + grillMarks(r, d, R);
    },
    gloss: 0.15,
  }),

  "courgettes-grillees": slice({
    radius: 14,
    skin: "#2c5a20",
    skinWidth: 1.6,
    flesh: ["#f1edc4", "#d1cf92"],
    inner: (r, d, R) => radialLines(r, R, 10, "#e8e3b0", 0.4) + grillMarks(r, d, R),
    gloss: 0.15,
  }),

  "chou-rouge": (r) => {
    let out = "";
    for (let i = 0; i < 8; i++) {
      const pts: Pt[] = [];
      const y0 = rand(r, 36, 64);
      for (let k = 0; k < 5; k++) pts.push([30 + k * 10, y0 + rand(r, -5, 5)]);
      const w = rand(r, 1.4, 2.4);
      const path = openPath(rotateAll(pts, rand(r, -0.6, 0.6)));
      out += `<path d="${path}" stroke="#5e1f63" stroke-width="${n(w)}" fill="none" stroke-linecap="round"/><path d="${path}" stroke="#c48bd0" stroke-width="${n(w * 0.35)}" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    }
    return `<g transform="rotate(${n(rand(r, 0, 360))} 50 50)">${out}</g>`;
  },

  "chou-blanc": (r) => {
    let out = "";
    for (let i = 0; i < 8; i++) {
      const pts: Pt[] = [];
      const y0 = rand(r, 36, 64);
      for (let k = 0; k < 5; k++) pts.push([30 + k * 10, y0 + rand(r, -5, 5)]);
      const w = rand(r, 1.5, 2.6);
      const path = openPath(rotateAll(pts, rand(r, -0.6, 0.6)));
      out += `<path d="${path}" stroke="#d3dfa2" stroke-width="${n(w)}" fill="none" stroke-linecap="round"/><path d="${path}" stroke="#f6f8e8" stroke-width="${n(w * 0.45)}" fill="none" stroke-linecap="round"/>`;
    }
    return `<g transform="rotate(${n(rand(r, 0, 360))} 50 50)">${out}</g>`;
  },

  champignons: (r, d, seed) => {
    const g = d.grain(0.3, 0.9, seed);
    const flesh = d.radial([
      [0, "#f4ecdc"],
      [1, "#dccbad"],
    ]);
    const s = rand(r, 0.9, 1.1);
    const path = `M32 50 C32 32 68 32 68 50 C68 54 62 55 58 54 L57 68 Q50 71 43 68 L42 54 C38 55 32 54 32 50Z`;
    return `<g transform="rotate(${n(rand(r, 0, 360))} 50 50) translate(50 50) scale(${n(s * 0.85)}) translate(-50 -50)"><g filter="${g}"><path d="${path}" fill="${flesh}" stroke="#8b6a45" stroke-width="1.6"/><path d="M38 49 C40 40 60 40 62 49" stroke="#bfa785" stroke-width="0.7" fill="none"/></g></g>`;
  },

  avocat: crescent({
    outer: 28,
    thickness: 11,
    span: 1.6,
    fill: ["#e8e486", "#8eb83b"],
    skin: "#2b4416",
    skinWidth: 1.8,
    grain: 0.12,
  }),

  mais: cluster([5, 7], 9, (r, d, x, y) => {
    const g = d.radial([
      [0, "#fff1a0"],
      [0.6, "#f6c838"],
      [1, "#e0a21c"],
    ], { fx: 0.4, fy: 0.35 });
    const a = rand(r, 0, 360);
    return `<rect x="${n(x - 3.2)}" y="${n(y - 2.8)}" width="6.4" height="5.6" rx="2.4" fill="${g}" transform="rotate(${n(a)} ${n(x)} ${n(y)})"/>`;
  }),

  "coeur-de-palmier": slice({
    radius: 11,
    skin: "#e2d6b0",
    skinWidth: 1.2,
    flesh: ["#fbf6e6", "#efe5c6"],
    inner: (_r, _d, R) =>
      [0.75, 0.5, 0.25].map((k) => `<circle cx="50" cy="50" r="${n(R * k)}" fill="none" stroke="#e1d4ad" stroke-width="0.7"/>`).join(""),
    grain: 0.15,
  }),

  noix: (r, d, seed) => {
    const g = d.grain(0.45, 1.1, seed);
    const fill = d.radial([
      [0, "#c08a4c"],
      [1, "#7a4a22"],
    ], { fx: 0.4, fy: 0.35 });
    let grooves = "";
    for (let i = 0; i < 6; i++) {
      const x = rand(r, 38, 62);
      const y = rand(r, 40, 60);
      grooves += `<path d="M${n(x)} ${n(y)}q${n(rand(r, -4, 4))} ${n(rand(r, -3, 3))} ${n(rand(r, -6, 6))} ${n(rand(r, -4, 4))}" stroke="#4a2810" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.7"/>`;
    }
    const rot = rand(r, 0, 360);
    return `<g transform="rotate(${n(rot)} 50 50)"><g filter="${g}"><path d="${blob(r, 43, 50, 8, 11, 10, 0.15)}" fill="${fill}"/><path d="${blob(r, 57, 50, 8, 11, 10, 0.15)}" fill="${fill}"/><path d="M50 40 L50 60" stroke="#4a2810" stroke-width="1.2" opacity="0.8"/>${grooves}</g></g>`;
  },

  cajou: crescent({ outer: 11, thickness: 7.5, span: 3.2, fill: ["#f6e6c0", "#e0c088"], grain: 0.3 }),

  cacahuetes: cluster([3, 4], 7, (r, d, x, y) => {
    const g = d.radial([
      [0, "#ecc48a"],
      [1, "#c48e4c"],
    ], { fx: 0.4, fy: 0.35 });
    const a = rand(r, 0, 360);
    return `<g transform="rotate(${n(a)} ${n(x)} ${n(y)})"><ellipse cx="${n(x)}" cy="${n(y)}" rx="5.2" ry="3.6" fill="${g}"/><line x1="${n(x - 4.5)}" y1="${n(y)}" x2="${n(x + 4.5)}" y2="${n(y)}" stroke="#a8743a" stroke-width="0.5" opacity="0.6"/></g>`;
  }),

  dattes: (r, d, seed) =>
    strip({
      length: [24, 28],
      width: [10, 12],
      fill: ["#6e3518", "#3c1a0a"],
      bend: 0.15,
      taper: 0.55,
      grain: 0.35,
      gloss: 0.35,
      extra: (rr) => fibres(rr, 4, "#2a1006", 10, 0.5, 0.7),
    })(r, d, seed),

  figues: (r, d, seed) => {
    const g = d.grain(0.25, 0.9, seed);
    const outer = closedPath(rotateAll(blobPts(r, 50, 52, 14, 16, 12, 0.05).map(([x, y]) => [x, y < 45 ? 50 + (y - 50) * 1.35 : y] as Pt), 0));
    const inner = blob(r, 50, 53, 10.5, 12, 12, 0.08);
    const pulp = d.radial([
      [0, "#f2cfa6"],
      [0.35, "#d65a5a"],
      [1, "#a8243a"],
    ]);
    let seeds = "";
    for (let i = 0; i < 26; i++) {
      const [x, y] = polar(50, 54, rand(r, 2, 9), r() * TAU);
      seeds += `<circle cx="${n(x)}" cy="${n(y)}" r="0.55" fill="#f8e2a0"/>`;
    }
    return `<g transform="rotate(${n(rand(r, 0, 360))} 50 50)"><g filter="${g}"><path d="${outer}" fill="#4f1f40"/><path d="${outer}" fill="#f2e3c8" transform="translate(50 52) scale(0.88) translate(-50 -52)"/><path d="${inner}" fill="${pulp}"/>${seeds}</g></g>`;
  },

  "raisins-secs": cluster([4, 5], 7, (r, d, x, y) => {
    const g = d.radial([
      [0, "#6a3a40"],
      [1, "#2a1218"],
    ], { fx: 0.38, fy: 0.35 });
    return `<path d="${blob(r, x, y, 3.6, 3, 8, 0.25, r() * TAU)}" fill="${g}"/><circle cx="${n(x - 1)}" cy="${n(y - 1)}" r="0.7" fill="#fff" opacity="0.35"/>`;
  }),

  "oignons-crispy": (r) => {
    let out = "";
    for (let i = 0; i < 9; i++) {
      const pts: Pt[] = [];
      const x0 = rand(r, 34, 54);
      const y0 = rand(r, 36, 64);
      for (let k = 0; k < 4; k++) pts.push([x0 + k * 5, y0 + rand(r, -4, 4)]);
      const c = pick(r, ["#b56a22", "#d99640", "#8f4c16", "#c98030"]);
      out += `<path d="${openPath(pts)}" stroke="${c}" stroke-width="${n(rand(r, 1.1, 1.8))}" fill="none" stroke-linecap="round"/>`;
    }
    return `<g transform="rotate(${n(rand(r, 0, 360))} 50 50)">${out}</g>`;
  },

  cornichons: slice({
    radius: 9.5,
    skin: "#34501a",
    skinWidth: 1.4,
    flesh: ["#c4c87a", "#94a148"],
    irregularity: 0.09,
    squash: 0.8,
    inner: (r, _d, R) => {
      let s = "";
      for (let i = 0; i < 8; i++) {
        const [x, y] = polar(50, 50, R * 0.38, (i / 8) * TAU);
        s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="0.9" ry="0.6" fill="#e8e8b8"/>`;
      }
      return s;
    },
  }),

  olives: (r, d) => {
    const black = r() < 0.55;
    const base = black ? "#2b2320" : "#7a8a2c";
    const fill = d.radial([
      [0, shade(base, 0.25)],
      [1, shade(base, -0.2)],
    ], { fx: 0.38, fy: 0.35 });
    const R = rand(r, 7.5, 9);
    const ring = `M${50 - R} 50a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0ZM${50 - R * 0.42} 50a${R * 0.42} ${R * 0.42} 0 1 1 ${R * 0.84} 0a${R * 0.42} ${R * 0.42} 0 1 1 ${-R * 0.84} 0Z`;
    return `<path d="${ring}" fill="${fill}" fill-rule="evenodd"/><path d="M${n(50 - R * 0.7)} ${n(50 - R * 0.55)} a${n(R * 0.9)} ${n(R * 0.9)} 0 0 1 ${n(R * 0.9)} ${n(-R * 0.25)}" stroke="#fff" stroke-opacity="0.45" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  },

  // -------------------------------------------------------------------------
  // Toppings
  // -------------------------------------------------------------------------

  "boeuf-roti": (r, d, seed) => {
    const g = d.grain(0.3, 0.8, seed);
    const meat = d.radial([
      [0, "#d77a76"],
      [0.65, "#b4504c"],
      [1, "#6f3424"],
    ], { fx: 0.45, fy: 0.45 });
    const shape = blob(r, 50, 50, 20, 12, 12, 0.12, r() * TAU);
    return `<g filter="${g}"><path d="${shape}" fill="${meat}" stroke="#5e2a1c" stroke-width="1.6"/>${fibres(r, 6, "#f2b3a8", 12, 0.35)}</g>${sheen(d, 46, 45, 9, 3, 0.22)}`;
  },

  "charcuterie-boeuf": slice({
    radius: 16,
    skin: "#5a1c1c",
    skinWidth: 0.9,
    flesh: ["#a8343a", "#7e2229"],
    irregularity: 0.05,
    inner: (r, _d, R) => {
      let s = "";
      for (let i = 0; i < 14; i++) {
        const [x, y] = polar(50, 50, R * Math.sqrt(r()) * 0.85, r() * TAU);
        s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rand(r, 0.6, 1.5))}" ry="${n(rand(r, 0.5, 1))}" fill="#f2cfc6" opacity="0.85"/>`;
      }
      return s;
    },
    gloss: 0.18,
  }),

  "saumon-fume": (r, d, seed) =>
    strip({
      length: [32, 40],
      width: [12, 15],
      fill: ["#f6905c", "#e9673a"],
      bend: 0.5,
      taper: 0.3,
      irregularity: 0.12,
      grain: 0.15,
      gloss: 0.25,
      extra: (rr, _d, spine, w) => {
        let s = "";
        for (let i = 1; i < spine.length - 1; i += 2) {
          const [x, y] = spine[i];
          s += `<path d="M${n(x - 2)} ${n(y - w * 0.45)} q${n(rand(rr, 1, 4))} ${n(w * 0.45)} ${n(rand(rr, 0, 3))} ${n(w * 0.9)}" stroke="#fcd8c2" stroke-width="1" fill="none" opacity="0.85"/>`;
        }
        return s;
      },
    })(r, d, seed),

  thon: (r, d, seed) => {
    const g = d.grain(0.35, 1, seed);
    let out = "";
    for (let i = 0; i < 4; i++) {
      const x = 50 + rand(r, -9, 9);
      const y = 50 + rand(r, -8, 8);
      const fill = mix("#cfa48a", "#a8765c", r());
      out += `<path d="${blob(r, x, y, rand(r, 5, 8), rand(r, 4, 6), 9, 0.3, r() * TAU)}" fill="${fill}"/>`;
    }
    return `<g filter="${g}">${out}${fibres(r, 6, "#f1d8c8", 9, 0.5)}</g>`;
  },

  calamars: (r, d, seed) => {
    const g = d.grain(0.2, 0.9, seed);
    const R = rand(r, 10, 12);
    const outer = blob(r, 50, 50, R, R * 0.9, 12, 0.06);
    const inner = blob(r, 50, 50, R * 0.55, R * 0.48, 12, 0.08);
    return `<g filter="${g}"><path d="${outer} ${inner}" fill="#f6eee2" fill-rule="evenodd" stroke="#e2cfb4" stroke-width="0.9"/></g>`;
  },

  anchois: (r, d, seed) =>
    strip({
      length: [30, 36],
      width: [4, 5],
      fill: ["#9a5a40", "#6e3a26"],
      bend: 0.3,
      taper: 0.8,
      grain: 0.2,
      gloss: 0.35,
      extra: (_rr, _d, spine) => `<path d="${openPath(spine)}" stroke="#c9c0b4" stroke-width="0.5" fill="none" opacity="0.7"/>`,
    })(r, d, seed),

  crevettes: (r, d, seed) => {
    const g = d.grain(0.15, 0.9, seed);
    const R = rand(r, 11, 13);
    const span = rand(r, 4.2, 4.7);
    const a0 = rand(r, 0, TAU);
    const steps = 16;
    const outer: Pt[] = [];
    const inner: Pt[] = [];
    const mid: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = a0 + span * t;
      const w = 11 - 7.5 * t;
      outer.push(polar(50, 50, R + w / 2, a));
      inner.push(polar(50, 50, R - w / 2, a));
      mid.push(polar(50, 50, R + w / 2 - 1.4, a));
    }
    const body = closedPath([...outer, ...[...inner].reverse()], 0.9);
    const fill = d.radial([
      [0.5, "#fbc6a4"],
      [0.8, "#f28a5c"],
      [1, "#e2562e"],
    ], { r: 0.6 });
    let segments = "";
    for (let i = 2; i < steps - 2; i += 2) {
      segments += `<line x1="${n(inner[i][0])}" y1="${n(inner[i][1])}" x2="${n(outer[i][0])}" y2="${n(outer[i][1])}" stroke="#fff1e4" stroke-width="0.9" opacity="0.8"/>`;
    }
    const end = a0 + span;
    const [tx, ty] = polar(50, 50, R, end);
    const tail = `<path d="${blob(r, tx, ty, 4.2, 2.6, 8, 0.15, end)}" fill="#d9482a"/>`;
    return `<g filter="${g}">${tail}<path d="${body}" fill="${fill}"/>${segments}<path d="${openPath(mid.slice(1, -2))}" stroke="#e4572e" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.85"/></g>`;
  },

  surimi: (r, d, seed) =>
    strip({
      length: [26, 32],
      width: [7, 8],
      fill: ["#fbf3ec", "#efe2d6"],
      bend: 0.05,
      taper: 0.1,
      grain: 0.15,
      extra: (_rr, dd, spine, w) => {
        const red = dd.linear([
          [0, "#e2482a", 0.95],
          [1, "#e2482a", 0],
        ], 90);
        const [a, b] = [spine[0], spine[spine.length - 1]];
        return `<rect x="${n(a[0])}" y="${n(a[1] - w / 2)}" width="${n(b[0] - a[0])}" height="${n(w * 0.55)}" rx="${n(w * 0.2)}" fill="${red}"/>` + fibres(_rr, 5, "#d9c8b8", 10, 0.5);
      },
    })(r, d, seed),

  poulet: (r, d, seed) =>
    strip({
      length: [26, 34],
      width: [8, 10],
      fill: ["#ecca94", "#cf9e5e"],
      bend: 0.15,
      taper: 0.2,
      irregularity: 0.12,
      grain: 0.3,
      extra: (rr, dd) => fibres(rr, 5, "#fbe7c4", 12, 0.45) + grillMarks(rr, dd, 12, "#5a3214"),
    })(r, d, seed),

  "charcuterie-poulet": slice({
    radius: 15,
    skin: "#e2a99a",
    skinWidth: 0.8,
    flesh: ["#f7d6cc", "#eebcb0"],
    inner: (r, _d, R) => {
      let s = "";
      for (let i = 0; i < 18; i++) {
        const [x, y] = polar(50, 50, R * Math.sqrt(r()) * 0.9, r() * TAU);
        s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rand(r, 0.3, 0.6))}" fill="#d8968a" opacity="0.6"/>`;
      }
      return s;
    },
    gloss: 0.2,
  }),

  "charcuterie-poulet-poivre": slice({
    radius: 15,
    skin: "#3a2a24",
    skinWidth: 1.6,
    flesh: ["#f4cfc4", "#e8b2a4"],
    inner: (r, _d, R) => {
      let s = "";
      for (let i = 0; i < 26; i++) {
        const [x, y] = polar(50, 50, R * rand(r, 0.82, 1), r() * TAU);
        s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rand(r, 0.4, 0.8))}" fill="#1e1814"/>`;
      }
      return s;
    },
    gloss: 0.2,
  }),

  "oeufs-caille": (r, d, seed) => {
    const g = d.grain(0.12, 1, seed);
    const white = d.radial([
      [0, "#ffffff"],
      [1, "#e8e2d2"],
    ], { fx: 0.4, fy: 0.35 });
    const yolk = d.radial([
      [0, "#ffd65a"],
      [1, "#efa418"],
    ]);
    const rot = rand(r, 0, 360);
    return `<g transform="rotate(${n(rot)} 50 50)"><g filter="${g}"><ellipse cx="50" cy="50" rx="10" ry="7.5" fill="${white}"/><path d="${blob(r, 51, 50, 4.8, 4, 9, 0.08)}" fill="${yolk}"/></g></g>`;
  },

  "oeufs-fermiers": (r, d, seed) => {
    const g = d.grain(0.18, 1, seed);
    const white = d.radial([
      [0, "#ffffff"],
      [1, "#e6dfcd"],
    ], { fx: 0.4, fy: 0.35 });
    const yolk = d.radial([
      [0, "#ffd84a"],
      [0.7, "#f6b81a"],
      [1, "#e49a10"],
    ]);
    const rot = rand(r, 0, 360);
    return `<g transform="rotate(${n(rot)} 50 50)"><g filter="${g}"><path d="${blob(r, 50, 50, 17, 12, 12, 0.03)}" fill="${white}"/><path d="${blob(r, 52, 50, 8.5, 7, 10, 0.1)}" fill="${yolk}"/></g>${sheen(d, 44, 45, 6, 3, 0.4)}</g>`;
  },

  edam: cube({ top: "#f5de86", side: "#d8b850", size: [11, 13], grain: 0.18 }),
  gouda: cube({ top: "#f2c246", side: "#d09a22", size: [11, 13], grain: 0.18 }),
  emmental: cube({
    top: "#f7e4a2",
    side: "#d9c070",
    size: [12, 14],
    grain: 0.15,
    extra: (r, _d, top) => {
      const cx = top.reduce((s, p) => s + p[0], 0) / 4;
      const cy = top.reduce((s, p) => s + p[1], 0) / 4;
      return `<circle cx="${n(cx + rand(r, -3, 2))}" cy="${n(cy + rand(r, -3, 2))}" r="${n(rand(r, 1.4, 2.2))}" fill="#e2c770"/>`;
    },
  }),

  "mozzarella-cerises": (r, d) => ball(d, 50, 50, rand(r, 7.5, 8.5), "#f2efe6", 0.75),

  feta: cube({ top: "#fbfaf2", side: "#e2ded0", size: [10, 13], irregularity: 0.18, grain: 0.4 }),

  parmesan: (r, d, seed) => {
    const g = d.grain(0.3, 1.2, seed);
    const fill = d.linear([
      [0, "#f8ebbc"],
      [1, "#e6cf86"],
    ], 30);
    return `<g filter="${g}" opacity="0.96"><path d="${blob(r, 50, 50, 15, 6.5, 10, 0.25, r() * TAU)}" fill="${fill}" stroke="#d6bb6a" stroke-width="0.5"/></g>`;
  },

  chevre: (r, d, seed) => {
    const g = d.grain(0.35, 1.3, seed);
    return `<g filter="${g}"><path d="${blob(r, 50, 50, 9, 8, 11, 0.22, r() * TAU)}" fill="#fdfcf6" stroke="#e1dccb" stroke-width="0.8"/></g>${sheen(d, 47, 46, 4, 2, 0.4)}`;
  },

  brie: (r, d, seed) => {
    const g = d.grain(0.2, 1, seed);
    const paste = d.linear([
      [0, "#f8e8b4"],
      [1, "#efd690"],
    ], 0);
    const rot = rand(r, 0, 360);
    return `<g transform="rotate(${n(rot)} 50 50)"><g filter="${g}"><path d="M36 52 L64 40 Q67 50 64 60 Z" fill="${paste}"/><path d="M64 40 Q67 50 64 60" stroke="#fbf8ee" stroke-width="3.2" fill="none" stroke-linecap="round"/></g></g>`;
  },

  "fromage-bleu": (r, d, seed) => {
    const g = d.grain(0.3, 1.2, seed);
    let veins = "";
    for (let i = 0; i < 7; i++) {
      const [x, y] = polar(50, 50, rand(r, 0, 6), r() * TAU);
      veins += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rand(r, 0.6, 1.4))}" fill="${pick(r, ["#4c6a6e", "#5f7f6a", "#3d5560"])}" opacity="0.85"/>`;
    }
    return `<g filter="${g}"><path d="${blob(r, 50, 50, 9, 8, 11, 0.24, r() * TAU)}" fill="#f3edd6"/>${veins}</g>`;
  },

  mangue: cube({ top: "#ffb42e", side: "#e88a10", size: [12, 14], grain: 0.12, gloss: 0.4 }),
  ananas: cube({
    top: "#ffd955",
    side: "#e8b22a",
    size: [12, 15],
    grain: 0.25,
    gloss: 0.3,
    extra: (r, _d, top) => {
      const cx = top.reduce((s, p) => s + p[0], 0) / 4;
      const cy = top.reduce((s, p) => s + p[1], 0) / 4;
      return [0, 1, 2].map((i) => `<line x1="${n(cx - 5)}" y1="${n(cy - 3 + i * 3)}" x2="${n(cx + 5)}" y2="${n(cy - 4 + i * 3 + rand(r, 0, 1))}" stroke="#f6c43a" stroke-width="0.6"/>`).join("");
    },
  }),
  melon: cube({ top: "#ffc27e", side: "#ec9a52", size: [12, 14], grain: 0.15, gloss: 0.35 }),

  poire: crescent({ outer: 22, thickness: 9, span: 1.7, fill: ["#fbf6de", "#ece3b0"], skin: "#c2b44a", skinWidth: 1.6, grain: 0.15 }),
  pomme: crescent({ outer: 22, thickness: 9, span: 1.7, fill: ["#fdf8e6", "#f0e4b8"], skin: "#c0262c", skinWidth: 1.8, grain: 0.12 }),
  peche: crescent({ outer: 22, thickness: 9, span: 1.6, fill: ["#ffc768", "#f59a2e"], skin: "#d0402a", skinWidth: 1.8, grain: 0.15 }),
  orange: crescent({
    outer: 20,
    thickness: 10,
    span: 1.8,
    fill: ["#ffb24a", "#f7871a"],
    skin: "#fbd9a0",
    skinWidth: 1.3,
    extra: (r) => {
      let s = "";
      for (let i = 0; i < 6; i++) s += `<ellipse cx="${n(rand(r, 40, 60))}" cy="${n(rand(r, 46, 54))}" rx="2.6" ry="0.6" fill="#ffd08a" opacity="0.6" transform="rotate(${n(rand(r, -30, 30))} 50 50)"/>`;
      return s;
    },
  }),

  framboise: (r, d) => {
    let out = "";
    for (let i = 0; i < 16; i++) {
      const [x, y] = polar(50, 50, Math.sqrt(r()) * 6.5, r() * TAU);
      out += ball(d, x, y, rand(r, 2.4, 3), pick(r, ["#cf1f4a", "#b8163d", "#de2c58"]), 0.55);
    }
    return out;
  },

  grenade: cluster([5, 7], 7, (r, d, x, y) => {
    const g = d.radial([
      [0, "#ff6a7a"],
      [0.7, "#c8102e"],
      [1, "#8a0a20"],
    ], { fx: 0.38, fy: 0.35 });
    const a = rand(r, 0, 360);
    return `<g transform="rotate(${n(a)} ${n(x)} ${n(y)})"><path d="M${n(x)} ${n(y - 4)} C${n(x + 3.8)} ${n(y - 2)} ${n(x + 3.4)} ${n(y + 3.6)} ${n(x)} ${n(y + 3.6)} C${n(x - 3.4)} ${n(y + 3.6)} ${n(x - 3.8)} ${n(y - 2)} ${n(x)} ${n(y - 4)}Z" fill="${g}"/><ellipse cx="${n(x - 1)}" cy="${n(y - 1)}" rx="1" ry="0.6" fill="#fff" opacity="0.7"/></g>`;
  }),

  "kiwi-kaki": slice({
    radius: 14,
    skin: "#6d4e2a",
    skinWidth: 1.2,
    flesh: ["#c6e07e", "#6eaa26"],
    inner: (r, _d, R) => {
      let s = `<ellipse cx="50" cy="50" rx="${n(R * 0.24)}" ry="${n(R * 0.2)}" fill="#f2f4d8"/>` + radialLines(r, R, 18, "#e3f0b4", 0.45, 0.25);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * TAU + rand(r, -0.05, 0.05);
        const [x, y] = polar(50, 50, R * 0.38, a);
        s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="0.9" ry="0.45" fill="#1a1408" transform="rotate(${n((a * 180) / Math.PI)} ${n(x)} ${n(y)})"/>`;
      }
      return s;
    },
    gloss: 0.3,
  }),

  // -------------------------------------------------------------------------
  // Petits plus
  // -------------------------------------------------------------------------

  "plantes-aromatiques": (r, d) => {
    let out = "";
    for (let i = 0; i < 3; i++) {
      const a = rand(r, 0, 360);
      const fill = d.linear([
        [0, "#5e9e36"],
        [1, "#2f6a1e"],
      ], 90);
      const x = 50 + rand(r, -6, 6);
      const y = 50 + rand(r, -6, 6);
      out += `<g transform="rotate(${n(a)} ${n(x)} ${n(y)})"><path d="M${n(x)} ${n(y + 7)} C${n(x - 7)} ${n(y + 2)} ${n(x - 6)} ${n(y - 6)} ${n(x)} ${n(y - 8)} C${n(x + 6)} ${n(y - 6)} ${n(x + 7)} ${n(y + 2)} ${n(x)} ${n(y + 7)}Z" fill="${fill}"/><path d="M${n(x)} ${n(y + 7)} L${n(x)} ${n(y - 6)}" stroke="#9fd06a" stroke-width="0.5" opacity="0.8"/></g>`;
    }
    return out;
  },

  lentilles: cluster([6, 8], 7, (r, d, x, y) => {
    const c = pick(r, ["#8a6a3a", "#6f6a34", "#9a7442"]);
    const g = d.radial([
      [0, shade(c, 0.25)],
      [1, shade(c, -0.15)],
    ], { fx: 0.4, fy: 0.35 });
    return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="2.6" ry="2.3" fill="${g}"/>`;
  }),

  "pois-chiches": cluster([2, 3], 6, (r, d, x, y) => {
    const g = d.radial([
      [0, "#f2d6a0"],
      [1, "#c89a58"],
    ], { fx: 0.38, fy: 0.32 });
    return `<path d="${blob(r, x, y, 5, 4.6, 9, 0.1, r() * TAU)}" fill="${g}"/><path d="M${n(x - 1)} ${n(y - 4)} q2 3 0 7" stroke="#b08048" stroke-width="0.6" fill="none" opacity="0.6"/>`;
  }),

  radis: slice({
    radius: 10,
    skin: "#c41a3c",
    skinWidth: 1.1,
    flesh: ["#fefbf8", "#f6e2e4"],
    inner: (r, _d, R) => radialLines(r, R, 14, "#f0c8d0", 0.5, 0.2),
    gloss: 0.2,
  }),

  chia: cluster([22, 28], 9, (r, _d, x, y) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="0.9" ry="0.7" fill="${pick(r, ["#3a3532", "#6b6560", "#cfc8bc", "#2a2624"])}"/>`),

  "croutons-ail": cube({
    top: "#e6b462",
    side: "#a8682a",
    size: [11, 13],
    irregularity: 0.12,
    grain: 0.5,
    extra: (r, _d, top) => {
      const cx = top.reduce((s, p) => s + p[0], 0) / 4;
      const cy = top.reduce((s, p) => s + p[1], 0) / 4;
      let s = "";
      for (let i = 0; i < 4; i++) s += `<circle cx="${n(cx + rand(r, -4, 4))}" cy="${n(cy + rand(r, -4, 4))}" r="0.6" fill="#4f7a2a"/>`;
      return s;
    },
  }),

  multigraines: cluster([7, 9], 9, (r, d, x, y) => {
    const kind = r();
    const a = rand(r, 0, 360);
    if (kind < 0.4) {
      const g = d.linear([
        [0, "#8aa856"],
        [1, "#4f6e2a"],
      ], 90);
      return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="4" ry="2.2" fill="${g}" transform="rotate(${n(a)} ${n(x)} ${n(y)})"/>`;
    }
    if (kind < 0.75) {
      return `<g transform="rotate(${n(a)} ${n(x)} ${n(y)})"><ellipse cx="${n(x)}" cy="${n(y)}" rx="3.4" ry="1.6" fill="#d8ccb0"/><line x1="${n(x - 3)}" y1="${n(y)}" x2="${n(x + 3)}" y2="${n(y)}" stroke="#7a6e5a" stroke-width="0.4"/></g>`;
    }
    return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="1.4" ry="0.9" fill="#f4e8c6" transform="rotate(${n(a)} ${n(x)} ${n(y)})"/>`;
  }),

  "baguettes-chips": (r, d, seed) => {
    const g = d.grain(0.45, 1.1, seed);
    const fill = d.radial([
      [0, "#f3d79a"],
      [0.75, "#e0ae5c"],
      [1, "#a8682a"],
    ]);
    let holes = "";
    for (let i = 0; i < 6; i++) holes += `<circle cx="${n(rand(r, 42, 58))}" cy="${n(rand(r, 46, 54))}" r="${n(rand(r, 0.5, 1.1))}" fill="#c8904a" opacity="0.7"/>`;
    return `<g transform="rotate(${n(rand(r, 0, 360))} 50 50)"><g filter="${g}"><ellipse cx="50" cy="50" rx="15" ry="8" fill="${fill}"/>${holes}</g></g>`;
  },
};

export const hasSprite = (id: string) => id in SPRITES;
export const getSprite = (id: string): SpriteGen | undefined => SPRITES[id];

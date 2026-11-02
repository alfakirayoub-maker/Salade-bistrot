import { describe, expect, it } from "vitest";
import { ASSETS, type PieceAsset } from "./assets";
import { pieceCount, piecesForSlots, SlotRegistry, SLOTS } from "./placement";

const piece = (id: string) => ASSETS[id] as PieceAsset;
const REGALE = ["concombre", "tomates", "carottes", "mais", "betterave", "champignons", "olives", "noix", "poivron", "chou-rouge", "cornichons", "tomates-cerises", "crevettes", "poulet", "oeufs-fermiers", "feta", "mozzarella-cerises", "avocat", "mangue", "saumon-fume", "croutons-ail", "pois-chiches"];

const fill = (ids: string[]) => {
  const reg = new SlotRegistry();
  const slots = Object.fromEntries(ids.map((id) => [id, reg.claim(id, pieceCount(piece(id)))]));
  return { reg, slots };
};

describe("slot placement", () => {
  it("keeps every ingredient in place when another is added or removed", () => {
    const { reg, slots } = fill(["concombre", "carottes", "mais", "feta"]);
    reg.claim("olives", pieceCount(piece("olives")));
    reg.release("carottes");
    for (const id of ["concombre", "mais", "feta"]) expect(reg.claim(id, pieceCount(piece(id)))).toEqual(slots[id]);
  });

  it("never stacks two ingredients on the same spot while the bowl has room", () => {
    const { slots } = fill(REGALE);
    const all = Object.values(slots).flat();
    expect(all.length).toBeLessThanOrEqual(SLOTS.length);
    expect(new Set(all).size).toBe(all.length);
  });

  it("fills the centre as well as the rim of a light bowl", () => {
    const ids = ["concombre", "tomates-cerises", "carottes", "mais", "olives", "poulet", "feta"];
    const { slots } = fill(ids);
    const radii = Object.entries(slots).flatMap(([id, s]) => piecesForSlots(id, piece(id), s).map((p) => Math.hypot(p.x - 0.5, p.y - 0.5)));
    expect(radii.filter((d) => d < 0.15).length).toBeGreaterThanOrEqual(4);
    expect(radii.filter((d) => d > 0.26).length).toBeGreaterThanOrEqual(10);
  });

  it("spreads a full bowl out to the rim instead of piling in the middle", () => {
    const { slots } = fill(REGALE);
    const radii = Object.entries(slots).flatMap(([id, s]) => piecesForSlots(id, piece(id), s).map((p) => Math.hypot(p.x - 0.5, p.y - 0.5)));
    const outer = radii.filter((d) => d > 0.26).length / radii.length;
    // An even spread puts about half of the area (r > 0.26 of 0.37) in the outer ring.
    expect(outer).toBeGreaterThan(0.4);
    expect(Math.max(...radii)).toBeLessThan(0.4);
  });

  it("spreads one ingredient's pieces apart", () => {
    const { slots } = fill(["concombre"]);
    const pts = slots.concombre.map((s) => SLOTS[s]);
    let min = 1;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
    expect(min).toBeGreaterThan(0.12);
  });

  it("keeps the full Régale bowl readable", () => {
    const total = REGALE.reduce((n, id) => n + pieceCount(piece(id)), 0);
    expect(total).toBeLessThanOrEqual(125);
  });
});

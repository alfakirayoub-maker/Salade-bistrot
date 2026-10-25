/**
 * The selection chip records where it was tapped so the bowl can launch the
 * pieces from there (like the reference configurator). One-shot per item.
 */
const origins = new Map<string, { x: number; y: number; at: number }>();

export const setDropOrigin = (id: string, el: Element | null) => {
  if (!el) return;
  const b = el.getBoundingClientRect();
  origins.set(id, { x: b.left + b.width / 2, y: b.top + b.height / 2, at: Date.now() });
};

export const consumeDropOrigin = (id: string) => {
  const o = origins.get(id);
  origins.delete(id);
  // Ignore stale origins (e.g. sprite took long to load after a scroll).
  return o && Date.now() - o.at < 1500 ? o : null;
};

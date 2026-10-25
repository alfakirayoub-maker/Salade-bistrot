"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type { Selection } from "@/lib/menu/types";
import { getAsset, getSpriteUrl, type PieceAsset, type SauceAsset } from "@/lib/visual/assets";
import { getBaseTexture } from "@/lib/visual/baseTextures";
import { BOWL_INTERIOR, bowlImageUrl } from "@/lib/visual/bowl";
import { drizzleFor } from "@/lib/visual/drizzle";
import { layoutPieces, type Piece } from "@/lib/visual/placement";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { consumeDropOrigin } from "./dropOrigin";

export interface SaladBowlProps {
  selection: Selection;
  /** "build": drop animations + pointer tilt. "static": no motion (previews). */
  mode?: "build" | "static";
  /** Final reveal: slow sway, glow and zoom. */
  celebrate?: boolean;
  /** Multiplies piece counts (formula previews use fewer pieces). */
  density?: number;
  emptyLabel?: string;
  className?: string;
  label?: string;
}

/**
 * Keeps removed ids mounted until their exit animation finishes.
 * Returns [id, leaving] pairs in a stable order.
 */
const usePresence = (ids: string[], animate: boolean, exitMs: number) => {
  const key = ids.join("|");
  const [state, setState] = useState({ key, rendered: ids, leaving: [] as string[] });

  // Adjust state while rendering when the id list changes (no extra effect pass).
  if (state.key !== key) {
    const current = new Set(ids);
    const rendered = animate ? [...state.rendered] : [...ids];
    for (const id of ids) if (!rendered.includes(id)) rendered.push(id);
    const leaving = animate ? rendered.filter((id) => !current.has(id)) : [];
    setState({ key, rendered, leaving });
  }

  const leavingKey = state.leaving.join("|");
  useEffect(() => {
    if (!leavingKey) return;
    const gone = new Set(leavingKey.split("|"));
    const t = window.setTimeout(() => {
      setState((s) => ({
        ...s,
        rendered: s.rendered.filter((id) => !gone.has(id) || s.key.split("|").includes(id)),
        leaving: s.leaving.filter((id) => !gone.has(id)),
      }));
    }, exitMs);
    return () => window.clearTimeout(t);
  }, [leavingKey, exitMs]);

  const leaving = new Set(state.leaving);
  return state.rendered.map((id) => [id, leaving.has(id)] as const);
};

// ---------------------------------------------------------------------------
// Bases
// ---------------------------------------------------------------------------

/** Wedge polygon (always 26 points so CSS can interpolate between counts). */
const wedge = (index: number, total: number) => {
  if (total <= 1) {
    const pts = Array.from({ length: 25 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return `${50 + Math.cos(a) * 75}% ${50 + Math.sin(a) * 75}%`;
    });
    return `polygon(50% 50%, ${pts.join(", ")})`;
  }
  const start = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const span = (Math.PI * 2) / total;
  const pts = Array.from({ length: 25 }, (_, i) => {
    const a = start + (i / 24) * span;
    return `${50 + Math.cos(a) * 75}% ${50 + Math.sin(a) * 75}%`;
  });
  return `polygon(50% 50%, ${pts.join(", ")})`;
};

const BaseLayer = memo(function BaseLayer({ ids, animate }: { ids: string[]; animate: boolean }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const presence = usePresence(ids, animate, 450);

  useEffect(() => {
    let alive = true;
    ids.forEach((id) => {
      const asset = getAsset(id);
      const direct = asset?.kind === "base" ? asset.src : undefined;
      (direct ? Promise.resolve(direct) : getBaseTexture(id)).then((u) => {
        if (alive && u) setUrls((prev) => (prev[id] === u ? prev : { ...prev, [id]: u }));
      });
    });
    return () => {
      alive = false;
    };
  }, [ids]);

  const active = ids.length;
  return (
    <>
      {presence.map(([id, leaving]) => {
        const index = ids.indexOf(id);
        const url = urls[id];
        return (
          <div
            key={id}
            className="bowl-base"
            data-leaving={leaving || !url || undefined}
            style={{
              clipPath: index >= 0 ? wedge(index, active) : undefined,
              backgroundImage: url ? `url(${url})` : undefined,
            }}
          />
        );
      })}
    </>
  );
});

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const PieceGroup = memo(function PieceGroup({
  id,
  pieces,
  leaving,
  animateIn,
  reduced,
  bowlRef,
}: {
  id: string;
  pieces: Piece[];
  leaving: boolean;
  animateIn: boolean;
  reduced: boolean;
  bowlRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const played = useRef(false);
  // Decided once at mount: pieces already in the bowl on load just fade in.
  const [shouldDrop] = useState(animateIn);

  useEffect(() => {
    let alive = true;
    Promise.all(pieces.map((p) => getSpriteUrl(id, p.variant))).then((u) => alive && setUrls(u));
    return () => {
      alive = false;
    };
  }, [id, pieces]);

  const ready = urls.length === pieces.length && urls.every(Boolean);

  // Entrance: pieces fly from the tapped chip (or from above) and settle.
  useLayoutEffect(() => {
    if (!ready || played.current) return;
    played.current = true;
    const els = refs.current.filter(Boolean) as HTMLDivElement[];
    if (!shouldDrop || reduced) {
      gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.4, stagger: 0.015 });
      return;
    }
    const bowl = bowlRef.current?.getBoundingClientRect();
    const origin = consumeDropOrigin(id);
    const tl = gsap.timeline();
    els.forEach((el, i) => {
      const p = pieces[i];
      if (!bowl) return;
      const px = bowl.left + p.x * bowl.width;
      const py = bowl.top + p.y * bowl.height;
      const ox = origin ? origin.x - px + gsap.utils.random(-12, 12) : gsap.utils.random(-30, 30);
      const oy = origin ? origin.y - py : -bowl.height * 0.75 - py + bowl.top;
      const apex = Math.min(oy, 0) - bowl.height * gsap.utils.random(0.08, 0.16);
      const spin = gsap.utils.random(-120, 120);
      const at = i * 0.055;
      gsap.set(el, { x: ox, y: oy, scale: 0.5, rotation: p.rotation + spin, opacity: 0 });
      tl.to(el, { opacity: 1, duration: 0.12 }, at)
        .to(el, { x: 0, duration: 0.62, ease: "power1.inOut" }, at)
        .to(el, { y: apex, duration: 0.34, ease: "power2.out" }, at)
        .to(el, { y: 0, duration: 0.28, ease: "power2.in" }, at + 0.34)
        .to(el, { rotation: p.rotation, duration: 0.62, ease: "power2.out" }, at)
        .to(el, { scale: 1.22, duration: 0.34, ease: "power2.out" }, at)
        .to(el, { scale: 0.94, duration: 0.28, ease: "power2.in" }, at + 0.34)
        .to(el, { scale: 1, duration: 0.32, ease: "back.out(2.2)" }, at + 0.62);
    });
    return () => {
      tl.progress(1);
    };
  }, [ready, shouldDrop, reduced, id, pieces, bowlRef]);

  // Exit: lift slightly and fade, without touching other ingredients.
  useEffect(() => {
    if (!leaving) return;
    const els = refs.current.filter(Boolean);
    const tween = gsap.to(els, {
      opacity: 0,
      scale: reduced ? 1 : 0.7,
      y: reduced ? 0 : -14,
      duration: reduced ? 0.15 : 0.32,
      ease: "power2.in",
      stagger: reduced ? 0 : 0.02,
    });
    return () => {
      tween.kill();
    };
  }, [leaving, reduced]);

  if (!ready) return null;
  return (
    <>
      {pieces.map((p, i) => (
        <div
          key={p.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="bowl-piece"
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: `${p.size * 100}%`,
            zIndex: p.z,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            opacity: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[i] ?? undefined} alt="" draggable={false} style={{ transform: p.flip ? "scaleX(-1)" : undefined }} />
        </div>
      ))}
    </>
  );
});

// ---------------------------------------------------------------------------
// Sauces
// ---------------------------------------------------------------------------

const SauceDrizzle = memo(function SauceDrizzle({
  id,
  slot,
  leaving,
  animateIn,
  reduced,
}: {
  id: string;
  slot: number;
  leaving: boolean;
  animateIn: boolean;
  reduced: boolean;
}) {
  const asset = getAsset(id) as SauceAsset | undefined;
  const drizzle = useMemo(() => drizzleFor(id, slot), [id, slot]);
  const group = useRef<SVGGElement>(null);
  const main = useRef<SVGPathElement>(null);
  const shine = useRef<SVGPathElement>(null);
  const [shouldPour] = useState(animateIn);

  useLayoutEffect(() => {
    const g = group.current;
    if (!g || !main.current || !shine.current) return;
    if (!shouldPour || reduced) {
      gsap.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      return;
    }
    const len = main.current.getTotalLength();
    const paths = [main.current, shine.current, ...Array.from(g.querySelectorAll<SVGPathElement>(".shadow"))];
    gsap.set(paths, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(g.querySelectorAll(".fleck, .drop"), { opacity: 0, scale: 0, transformOrigin: "center" });
    const tl = gsap.timeline();
    tl.to(paths, { strokeDashoffset: 0, duration: 1.15, ease: "power1.inOut" })
      .to(g.querySelectorAll(".drop"), { opacity: 1, scale: 1, duration: 0.25, stagger: 0.08, ease: "back.out(3)" }, 0.6)
      .to(g.querySelectorAll(".fleck"), { opacity: 1, scale: 1, duration: 0.3, stagger: 0.015 }, 0.8)
      .set(paths, { strokeDasharray: "none" });
    return () => {
      tl.progress(1);
    };
  }, [shouldPour, reduced, slot]);

  useEffect(() => {
    if (!leaving || !group.current) return;
    const t = gsap.to(group.current, { opacity: 0, duration: 0.35 });
    return () => {
      t.kill();
    };
  }, [leaving]);

  if (!asset) return null;
  return (
    <g ref={group} opacity={asset.opacity}>
      <path d={drizzle.path} fill="none" stroke="#0b1405" strokeOpacity={0.3} strokeWidth={asset.width * 1.25} strokeLinecap="round" strokeLinejoin="round" transform="translate(0.45 0.75)" className="shadow" />
      <path ref={main} d={drizzle.path} fill="none" stroke={asset.color} strokeWidth={asset.width} strokeLinecap="round" strokeLinejoin="round" />
      <path
        ref={shine}
        d={drizzle.path}
        fill="none"
        stroke={asset.highlight}
        strokeWidth={asset.width * 0.32}
        strokeLinecap="round"
        opacity={0.75}
        transform="translate(-0.25 -0.3)"
      />
      {drizzle.drops.map((d, i) => (
        <circle key={i} className="drop" cx={d.x} cy={d.y} r={d.r} fill={asset.color} />
      ))}
      {asset.flecks &&
        drizzle.flecks.map(([x, y], i) => <circle key={i} className="fleck" cx={x} cy={y} r={0.28} fill={asset.flecks} />)}
    </g>
  );
});

// ---------------------------------------------------------------------------
// Bowl
// ---------------------------------------------------------------------------

export function SaladBowl({
  selection,
  mode = "build",
  celebrate = false,
  density = 1,
  emptyLabel,
  className,
  label,
}: SaladBowlProps) {
  const reducedPref = usePrefersReducedMotion();
  const interactive = mode === "build";
  const reduced = reducedPref || !interactive;
  const bowlRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  // Items present when the bowl first appears fade in instead of dropping.
  const [initialIds] = useState(() => new Set(Object.values(selection).flat()));
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const pieceIds = useMemo(
    () => [...selection.ingredient, ...selection.topping, ...selection.petitPlus].filter((id) => getAsset(id)?.kind === "pieces"),
    [selection.ingredient, selection.topping, selection.petitPlus],
  );
  const piecePresence = usePresence(pieceIds, interactive && !reducedPref, 420);
  useEffect(() => {
    const present = new Set([...pieceIds, ...selection.sauce]);
    for (const id of initialIds) if (!present.has(id)) initialIds.delete(id);
  }, [pieceIds, selection.sauce, initialIds]);
  const saucePresence = usePresence(selection.sauce, interactive && !reducedPref, 400);
  const layouts = useMemo(() => {
    const map: Record<string, Piece[]> = {};
    for (const [id] of piecePresence) {
      const asset = getAsset(id);
      if (asset?.kind === "pieces") map[id] = layoutPieces(id, asset as PieceAsset, density);
    }
    return map;
  }, [piecePresence, density]);

  // A gentle "bump" when something lands, so the bowl reacts to the action.
  const total = pieceIds.length + selection.base.length + selection.sauce.length;
  useEffect(() => {
    if (!interactive || reducedPref || !hasMounted.current || !tiltRef.current) return;
    const t = gsap.fromTo(tiltRef.current, { scale: 1 }, { scale: 1.018, duration: 0.18, delay: 0.55, yoyo: true, repeat: 1, ease: "sine.inOut" });
    return () => {
      t.kill();
    };
  }, [total, interactive, reducedPref]);

  // Pointer parallax tilt (fine pointers only).
  useEffect(() => {
    const el = bowlRef.current;
    const tilt = tiltRef.current;
    if (!el || !tilt || !interactive || reducedPref) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      rx(((e.clientY - b.top) / b.height - 0.5) * -9);
      ry(((e.clientX - b.left) / b.width - 0.5) * 9);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [interactive, reducedPref]);

  // Reveal: slow sway and zoom.
  useEffect(() => {
    const tilt = tiltRef.current;
    if (!celebrate || !tilt) return;
    if (reducedPref) return;
    const tl = gsap.timeline();
    tl.fromTo(tilt, { scale: 0.92 }, { scale: 1, duration: 1.1, ease: "expo.out" }).to(
      tilt,
      { rotation: 5, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 },
      0.2,
    );
    return () => {
      tl.kill();
      gsap.set(tilt, { rotation: 0, scale: 1 });
    };
  }, [celebrate, reducedPref]);

  const empty = selection.base.length === 0 && pieceIds.length === 0 && selection.sauce.length === 0;
  const inset = `${(0.5 - BOWL_INTERIOR) * 100}%`;

  return (
    <div
      ref={bowlRef}
      className={`bowl ${celebrate ? "bowl--celebrate" : ""} ${className ?? ""}`}
      role="img"
      aria-label={label}
    >
      <div className="bowl-glow" aria-hidden />
      <div className="bowl-ground" aria-hidden />
      <div ref={tiltRef} className="bowl-tilt" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bowl-dish" src={bowlImageUrl()} alt="" draggable={false} />
        <div className="bowl-well" style={{ inset }}>
          <BaseLayer ids={selection.base} animate={interactive && !reducedPref} />
        </div>
        <div className="bowl-pieces">
          {piecePresence.map(([id, leaving]) =>
            layouts[id] ? (
              <PieceGroup
                key={id}
                id={id}
                pieces={layouts[id]}
                leaving={leaving}
                animateIn={interactive && !initialIds.has(id)}
                reduced={reduced}
                bowlRef={bowlRef}
              />
            ) : null,
          )}
        </div>
        <svg className="bowl-sauce" viewBox="0 0 100 100" preserveAspectRatio="none">
          {saucePresence.map(([id, leaving]) => (
            <SauceDrizzle
              key={id}
              id={id}
              slot={Math.max(0, selection.sauce.indexOf(id))}
              leaving={leaving}
              animateIn={interactive && !initialIds.has(id)}
              reduced={reduced}
            />
          ))}
        </svg>
        <div className="bowl-shade" style={{ inset }} />
        {empty && emptyLabel ? <div className="bowl-empty">{emptyLabel}</div> : null}
      </div>
    </div>
  );
}

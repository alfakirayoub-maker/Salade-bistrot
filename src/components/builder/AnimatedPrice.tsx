"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { formatMAD } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** Price that counts smoothly to its new value (instant with reduced motion). */
export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const locale = useLocale();
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (reduced || start === value) {
      from.current = value;
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    const duration = 420;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + (value - start) * eased);
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return (
    <span className={className}>
      <span aria-hidden>{formatMAD(shown, locale)}</span>
      <span className="sr-only" aria-live="polite">
        {formatMAD(value, locale)}
      </span>
    </span>
  );
}

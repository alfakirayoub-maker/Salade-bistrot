"use client";

import { useEffect, useState } from "react";
import { getSpriteUrl } from "@/lib/visual/assets";

const FLOATERS = [
  { id: "avocat", x: "4%", y: "18%", w: 82, r: "-18deg", d: "0s" },
  { id: "tomates-cerises", x: "86%", y: "10%", w: 58, r: "12deg", d: "-1.5s" },
  { id: "concombre", x: "90%", y: "62%", w: 66, r: "0deg", d: "-3s" },
  { id: "feta", x: "10%", y: "78%", w: 46, r: "20deg", d: "-2s" },
  { id: "crevettes", x: "70%", y: "88%", w: 70, r: "-30deg", d: "-4s" },
  { id: "plantes-aromatiques", x: "0%", y: "52%", w: 52, r: "40deg", d: "-5s" },
];

/** Decorative ingredients drifting around the hero photo. */
export function FloatingIngredients() {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  useEffect(() => {
    Promise.all(FLOATERS.map((f) => getSpriteUrl(f.id, 1, 200))).then(setUrls);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {FLOATERS.map((f, i) =>
        urls[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={f.id}
            src={urls[i]!}
            alt=""
            className="float rise absolute drop-shadow-[0_12px_14px_rgba(32,36,33,0.25)]"
            style={{ left: f.x, top: f.y, width: f.w, ["--r" as string]: f.r, animationDelay: `${f.d}, ${i * 120}ms` }}
          />
        ) : null,
      )}
    </div>
  );
}

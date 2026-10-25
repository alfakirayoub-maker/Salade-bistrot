"use client";

import { memo, useEffect, useState } from "react";
import { getAsset, getSpriteUrl } from "@/lib/visual/assets";
import { getBaseTexture } from "@/lib/visual/baseTextures";

const ARRANGEMENTS: Record<number, { x: number; y: number; s: number }[]> = {
  1: [{ x: 50, y: 50, s: 74 }],
  2: [
    { x: 38, y: 44, s: 54 },
    { x: 62, y: 58, s: 54 },
  ],
  3: [
    { x: 36, y: 40, s: 46 },
    { x: 64, y: 42, s: 46 },
    { x: 50, y: 66, s: 46 },
  ],
};

/** Circular preview of an ingredient, drawn with the same assets as the bowl. */
export const IngredientThumb = memo(function IngredientThumb({ id }: { id: string }) {
  const asset = getAsset(id);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    if (!asset) return;
    if (asset.kind === "pieces") {
      const count = Math.min(3, asset.thumbCount);
      Promise.all(Array.from({ length: count }, (_, i) => getSpriteUrl(id, i % asset.variants, 160))).then(
        (u) => alive && setUrls(u.filter((x): x is string => !!x)),
      );
    } else if (asset.kind === "base") {
      (asset.src ? Promise.resolve(asset.src) : getBaseTexture(id)).then((u) => alive && u && setUrls([u]));
    }
    return () => {
      alive = false;
    };
  }, [id, asset]);

  if (asset?.kind === "sauce") {
    return (
      <span className="relative block h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#e6e8e2)] shadow-[inset_0_-3px_6px_rgba(0,0,0,0.08)]">
        <span
          className="absolute inset-[18%] rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.25)]"
          style={{ background: `radial-gradient(circle at 38% 32%, ${asset.highlight}, ${asset.color} 55%)`, opacity: Math.max(0.75, asset.opacity) }}
        />
        <span className="absolute left-[30%] top-[28%] h-[14%] w-[22%] -rotate-[30deg] rounded-full bg-white/60 blur-[1px]" />
      </span>
    );
  }

  if (asset?.kind === "base") {
    return (
      <span
        className="block h-full w-full rounded-full bg-cover bg-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),inset_0_-6px_12px_rgba(0,0,0,0.25)]"
        style={{ backgroundImage: urls[0] ? `url(${urls[0]})` : undefined, backgroundColor: "#d9d4c4" }}
      />
    );
  }

  const layout = ARRANGEMENTS[urls.length] ?? ARRANGEMENTS[1];
  return (
    <span className="relative block h-full w-full">
      {urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={u}
          alt=""
          draggable={false}
          className="absolute -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{ left: `${layout[i].x}%`, top: `${layout[i].y}%`, width: `${layout[i].s}%` }}
        />
      ))}
    </span>
  );
});

/**
 * Top-down charcoal stoneware bowl (echoes the dark bowl of the official
 * menu photography). Drawn once as an SVG data URL; no filters so it stays
 * cheap while the bowl is tilted or scaled.
 */
import { mulberry32, n } from "./svg";

/** Radius of the food area as a fraction of the bowl box. */
export const BOWL_INTERIOR = 0.42;

let cached: string | null = null;

export const bowlImageUrl = (): string => {
  if (cached) return cached;
  const r = mulberry32(7);
  let speckles = "";
  for (let i = 0; i < 220; i++) {
    const a = r() * Math.PI * 2;
    const d = 44 + r() * 5.4;
    const x = 50 + Math.cos(a) * d;
    const y = 50 + Math.sin(a) * d;
    speckles += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.08 + r() * 0.16)}" fill="#d9d4c8" opacity="${n(0.12 + r() * 0.25)}"/>`;
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1000" height="1000"><defs>` +
    `<radialGradient id="body" cx="0.5" cy="0.5" r="0.5"><stop offset="0.86" stop-color="#2d302e"/><stop offset="1" stop-color="#171918"/></radialGradient>` +
    `<linearGradient id="lip" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop offset="0" stop-color="#6b706c"/><stop offset="0.45" stop-color="#2f3230"/><stop offset="1" stop-color="#121413"/></linearGradient>` +
    `<radialGradient id="well" cx="0.5" cy="0.5" r="0.5" fx="0.6" fy="0.62"><stop offset="0" stop-color="#2a2d2b"/><stop offset="0.8" stop-color="#1c1e1d"/><stop offset="1" stop-color="#0e0f0f"/></radialGradient>` +
    `<linearGradient id="spec" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `</defs>` +
    `<circle cx="50" cy="50" r="49.6" fill="url(#body)"/>` +
    `<circle cx="50" cy="50" r="47" fill="none" stroke="url(#lip)" stroke-width="4.6"/>` +
    speckles +
    `<circle cx="50" cy="50" r="49.3" fill="none" stroke="url(#spec)" stroke-width="0.7"/>` +
    `<circle cx="50" cy="50" r="44.6" fill="url(#well)"/>` +
    `<circle cx="50" cy="50" r="44.6" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="0.5"/>` +
    `</svg>`;
  cached = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return cached;
};

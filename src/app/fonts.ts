import { Baloo_2, Baloo_Bhaijaan_2, Bebas_Neue, DM_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

// UI text: DM Sans (Latin) and IBM Plex Sans Arabic.
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-dm-sans", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
});
// Headings and formula names: Baloo 2, and its Arabic sibling Baloo Bhaijaan 2.
const baloo = Baloo_2({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], variable: "--font-baloo", display: "swap" });
const balooArabic = Baloo_Bhaijaan_2({
  subsets: ["arabic"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo-arabic",
  display: "swap",
  preload: false,
});
// Formula prices, like "59 DHS" on the printed menu.
const bebas = Bebas_Neue({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-bebas", display: "swap" });

/** Class names that expose the font CSS variables used by globals.css. */
export const fontVariables = [dmSans, plexArabic, baloo, balooArabic, bebas].map((f) => f.variable).join(" ");

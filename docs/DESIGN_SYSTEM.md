# Design system (mobile-first)

Tokens and type classes live in `src/app/globals.css`. Before/after at 390px:
`docs/screenshots/mobile-before-after.png`.

## Typography

| Role | French | Arabic |
|---|---|---|
| Headings (`.t-display`, `.t-h1`–`.t-h3`) | Baloo 2, 700–800, leading ~1.0–1.15 | Baloo Bhaijaan 2 (same family), leading 1.25–1.45, no tracking |
| Formula name (`.t-formula`) | Baloo 2 800 capitals in a dark/green pill, like the printed menu | Baloo Bhaijaan 2 |
| Formula price (`.t-price-display`) | Bebas Neue, like "59 DHS" on the menu | Baloo Bhaijaan 2 (Bebas has no Arabic) |
| UI (`.t-title`, `.t-body`, `.t-label`, `.t-small`) | DM Sans (optical sizes), 13–17px | IBM Plex Sans Arabic, +1px, leading 1.6–1.8 |
| Eyebrows (`.t-eyebrow`) | 11px caps, 0.16em tracking | 13px, no caps, no tracking |
| Totals (`.t-price`) | DM Sans 600, tabular figures | same digits (Morocco uses Western digits) |

The heading font was chosen by the restaurant (option "Gourmand", Nov 2026) to
match the rounded lettering of the new printed menu.

Sizes are fluid with `clamp()` (hero ≈48px at 390px). Arabic never inherits Latin
letter-spacing (`html[lang="ar"] * { letter-spacing: 0 }`). Signed amounts are
wrapped in a Unicode LTR isolate (`formatDelta`) so "+15" keeps its sign in RTL.

Arabic fonts are not preloaded, so French pages never download them.

## Colour & surfaces

Warm paper `#f7f5ef`, cream cards `#fbfaf6`, charcoal ink `#1d211e`, hairlines
`#e3e0d6`, one green for action (`leaf-deep #4f8a17`). Shadows are soft and rare;
cards use a 1px inset line instead of heavy borders.

## Components

`.btn` (+ `.btn-primary`, `.btn-leaf`, `.btn-ghost`), `.icon-btn` (44px), `.card`,
`.field` (16px text, so iOS does not zoom on focus). Press feedback: scale 0.975.

## Builder layout (mobile)

1. Top bar: back · formula (opens the summary) · language · cart, plus a 5-segment
   tappable progress bar.
2. Stage: the bowl, which compacts when the ingredient list scrolls; smaller
   on screens under 700px tall.
3. Picker sheet: `02 / 05`, Baloo step title, dot counter "3 sur 8", rule line,
   search toggle, topping category filters, 4-column grid (3 below 360px).
4. Action bar in the thumb zone: animated total | Continuer + next step, with
   safe-area padding. Only the list scrolls: no nested scroll traps.

The builder writes a session draft, so switching language (which remounts the
page) keeps the formula, composition, step and name.

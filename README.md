# Bistrot Salad Bar — Salad builder

Mobile-first, bilingual (FR / AR-RTL) build-your-own-salad experience for
Bistrot Salad Bar, Meknès. Next.js 16 · TypeScript · Tailwind 4 · GSAP · next-intl.

```bash
npm install
npm run dev        # http://localhost:3000 → /fr
npm test           # pricing engine, order total, WhatsApp message
npm run lint && npm run typecheck && npm run build
```

Routes: `/fr`, `/ar`, `/{locale}/composer`, `/{locale}/menu`, `/{locale}/panier`, `/{locale}/commande`.

## Where things live

- Official menu data: `src/lib/menu/data.ts` (transcribed from the PDF menu, nothing invented)
- Rules awaiting confirmation: `src/lib/menu/policies.ts` → `docs/OPEN_QUESTIONS.md`
- Pricing engine: `src/lib/pricing/engine.ts` (+ tests)
- Bowl engine: `src/components/bowl/SaladBowl.tsx`, assets in `src/lib/visual/`
- Translations: `src/messages/{fr,ar}.json`
- Database (Supabase, applied): `supabase/migrations/`; admin page `/admin` → `docs/ADMIN.md`

Docs: `docs/ANALYSIS_AND_PLAN.md`, `docs/OPEN_QUESTIONS.md`, `docs/ASSETS.md`.

Ingredient visuals are illustrations drawn in code (kept by the restaurant); real photos can replace any of them, see `docs/ASSETS.md`. Menu items are managed from `/admin` (see `docs/ADMIN.md`).

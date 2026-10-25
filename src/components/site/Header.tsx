"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart/store";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function CartButton() {
  const t = useTranslations("nav");
  const lines = useCart();
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <Link href="/panier" aria-label={t("cartCount", { count })} className="icon-btn relative text-ink">
      <ShoppingBag size={20} strokeWidth={1.75} aria-hidden />
      {count > 0 && (
        <span className="t-num absolute end-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-leaf-deep px-1 text-[10.5px] font-semibold text-white ring-2 ring-paper">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("brand");
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={t("home")}>
      <Image src="/brand/logo-mark.png" alt="" width={372} height={450} className="h-8 w-auto" priority />
      {!compact && (
        <span className="text-[13px] font-semibold uppercase leading-none tracking-[0.14em] text-ink max-[359px]:hidden" dir="ltr">
          Bistrot <span className="text-leaf-deep">Salad</span> Bar
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 bg-paper/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-[14px] font-medium text-ink-soft md:flex" aria-label={t("main")}>
          <Link href="/composer" className="transition-colors hover:text-ink">
            {t("compose")}
          </Link>
          <Link href="/menu" className="transition-colors hover:text-ink">
            {t("menu")}
          </Link>
          <Link href="/#formules" className="transition-colors hover:text-ink">
            {t("formulas")}
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          <CartButton />
        </div>
      </div>
      <div className="h-px bg-line/70" />
    </header>
  );
}

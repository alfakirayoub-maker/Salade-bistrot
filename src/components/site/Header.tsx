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
    <Link
      href="/panier"
      aria-label={t("cartCount", { count })}
      className="relative grid h-9 w-9 place-items-center rounded-full bg-stone text-ink transition-colors hover:bg-line"
    >
      <ShoppingBag size={18} aria-hidden />
      {count > 0 && (
        <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-[11px] font-bold text-white ring-2 ring-paper">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("brand");
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={t("home")}>
      <Image src="/brand/logo-mark.png" alt="" width={372} height={450} className="h-9 w-auto" priority />
      {!compact && (
        <span className="text-[15px] font-extrabold uppercase leading-none tracking-[0.12em] text-ink" dir="ltr">
          Bistrot <span className="text-leaf-deep">Salad</span> Bar
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex" aria-label={t("main")}>
          <Link href="/composer" className="hover:text-ink">
            {t("compose")}
          </Link>
          <Link href="/menu" className="hover:text-ink">
            {t("menu")}
          </Link>
          <Link href="/#formules" className="hover:text-ink">
            {t("formulas")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          <CartButton />
        </div>
      </div>
    </header>
  );
}

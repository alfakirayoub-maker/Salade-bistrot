"use client";

import { createContext, useContext, useMemo } from "react";
import { CATEGORIES, type Category, type MenuItem } from "./types";
import { MENU_ITEMS } from "./data";
import { setVisualAliases } from "@/lib/visual/assets";

interface MenuContextValue {
  items: MenuItem[];
  itemsById: Record<string, MenuItem>;
  byCategory: Record<Category, MenuItem[]>;
}

const build = (items: MenuItem[]): MenuContextValue => {
  // Items added from the admin page borrow the visual of an existing item.
  setVisualAliases(Object.fromEntries(items.filter((i) => i.visual && i.visual !== i.id).map((i) => [i.id, i.visual!])));
  return {
    items,
    itemsById: Object.fromEntries(items.map((i) => [i.id, i])),
    byCategory: Object.fromEntries(
      CATEGORIES.map((c) => [c, items.filter((i) => i.category === c).sort((a, b) => a.order - b.order)]),
    ) as Record<Category, MenuItem[]>,
  };
};

const MenuContext = createContext<MenuContextValue>(build(MENU_ITEMS));

/** Provides the live menu (loaded on the server) to client components. */
export function MenuProvider({ items, children }: { items: MenuItem[]; children: React.ReactNode }) {
  const value = useMemo(() => build(items), [items]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export const useMenu = () => useContext(MenuContext);

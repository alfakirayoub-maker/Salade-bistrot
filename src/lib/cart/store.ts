"use client";

/**
 * Local cart persisted in localStorage. Each line stores the exact
 * composition; prices are always recomputed from the menu, never stored.
 */
import { useSyncExternalStore } from "react";
import { CATEGORIES, emptySelection, type Selection } from "@/lib/menu/types";

export interface CartLine {
  id: string;
  formulaId: string;
  selection: Selection;
  name: string;
  quantity: number;
  createdAt: number;
}

const KEY = "bsb-cart-v1";
const listeners = new Set<() => void>();
let lines: CartLine[] = [];
let loaded = false;

const sanitize = (raw: unknown): CartLine[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((l) => {
    if (!l || typeof l !== "object" || typeof l.id !== "string" || typeof l.formulaId !== "string") return [];
    const selection = emptySelection();
    for (const c of CATEGORIES) {
      const v = l.selection?.[c];
      if (Array.isArray(v)) selection[c] = v.filter((x: unknown): x is string => typeof x === "string");
    }
    const quantity = Math.min(20, Math.max(1, Math.floor(Number(l.quantity) || 1)));
    return [{ id: l.id, formulaId: l.formulaId, selection, name: String(l.name ?? "").slice(0, 40), quantity, createdAt: Number(l.createdAt) || Date.now() }];
  });
};

const load = () => {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    lines = sanitize(JSON.parse(window.localStorage.getItem(KEY) ?? "[]"));
  } catch {
    lines = [];
  }
};

const commit = (next: CartLine[]) => {
  lines = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable (private mode): the cart still works for this visit.
  }
  listeners.forEach((l) => l());
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
};

const EMPTY: CartLine[] = [];
const snapshot = () => {
  load();
  return lines;
};

export const useCart = () => useSyncExternalStore(subscribe, snapshot, () => EMPTY);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const cart = {
  get: () => snapshot(),
  add: (line: Omit<CartLine, "id" | "createdAt" | "quantity">) => {
    load();
    const id = newId();
    commit([...lines, { ...line, id, quantity: 1, createdAt: Date.now() }]);
    return id;
  },
  replace: (id: string, line: Omit<CartLine, "id" | "createdAt" | "quantity">) => {
    load();
    commit(lines.map((l) => (l.id === id ? { ...l, ...line } : l)));
  },
  setQuantity: (id: string, quantity: number) => {
    load();
    commit(lines.map((l) => (l.id === id ? { ...l, quantity: Math.min(20, Math.max(1, quantity)) } : l)));
  },
  remove: (id: string) => {
    load();
    commit(lines.filter((l) => l.id !== id));
  },
  clear: () => commit([]),
};

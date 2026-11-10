// Выбор цвета и размера. Хранится в localStorage, чтобы следующий этап —
// оформление заказа — забрал параметры. Подписка нужна, чтобы финал
// предметной сцены показывал пару в выбранном цвете.
import { choose, colors, sizes, type ColorId } from "@/content";

export type Order = { color: ColorId; size: number };

const KEY = "temp:order";
const listeners = new Set<(o: Order) => void>();
let current: Order = { color: choose.defaultColor, size: choose.defaultSize };
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && colors.some((c) => c.id === raw.color) && (sizes as readonly number[]).includes(raw.size)) {
      current = { color: raw.color, size: raw.size };
    }
  } catch {
    // приватный режим или битые данные — остаёмся на значениях по умолчанию
  }
}

export function getOrder(): Order {
  load();
  return current;
}

export function setOrder(patch: Partial<Order>) {
  load();
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {}
  listeners.forEach((fn) => fn(current));
}

export function subscribeOrder(fn: (o: Order) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const defaultOrder: Order = { color: choose.defaultColor, size: choose.defaultSize };

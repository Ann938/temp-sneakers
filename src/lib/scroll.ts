// Живой экземпляр Lenis и переходы к разделам.
// Разделы сидят внутри закреплённых сцен, поэтому их «позиция» — это не top
// элемента, а точка внутри сцены (например, конец полёта фото в галерею).
// Сцены регистрируют функции, которые эту точку считают по факту.
import type Lenis from "lenis";
import type { SectionKey } from "@/content";

let lenis: Lenis | null = null;
const targets = new Map<SectionKey, () => number>();

export function setLenis(l: Lenis | null) {
  lenis = l;
}

export function registerTarget(key: SectionKey, getY: () => number) {
  targets.set(key, getY);
  return () => {
    if (targets.get(key) === getY) targets.delete(key);
  };
}

export function hasTarget(key: string): key is SectionKey {
  return targets.has(key as SectionKey);
}

export function scrollToSection(key: SectionKey, immediate = false) {
  const getY = targets.get(key);
  if (!getY) return false;
  const y = Math.max(0, Math.round(getY()));
  const far = Math.abs(y - window.scrollY) > window.innerHeight * 6;
  if (lenis) {
    // Lenis помнит высоту страницы на момент создания — до того, как пины
    // добавили свои экраны. Без пересчёта переход упирается в старый предел.
    lenis.resize();
    // Дальний переход через несколько сцен — быстрее, чтобы не «смотреть кино» заново
    lenis.scrollTo(y, { immediate, duration: far ? 1.6 : 1.2, lock: true });
  } else {
    window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  }
  return true;
}

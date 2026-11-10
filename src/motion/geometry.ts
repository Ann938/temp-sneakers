// Общая геометрия сцен. Числа поз — в координатах макета (ДВ 1440 / МВ 390),
// перевод в пиксели — тем же масштабом, что и в CSS (--u в globals.scss).

export const MOBILE_QUERY = "(max-width: 1279px)";

export const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

// Ширина холста и высота хэдера макета
export const canvas = () => (isMobile() ? 390 : 1440);
export const headerH = () => (isMobile() ? 80 : 96);

// Должно совпадать с --u в globals.scss
export function getU() {
  return isMobile()
    ? Math.min(window.innerWidth / 390, window.innerHeight / 800, 1.6)
    : Math.min(window.innerWidth / 1440, window.innerHeight / 860, 1.3333);
}

export type Rect = { x: number; y: number; w: number; h: number };

// Прямоугольник элемента относительно экрана сцены. Меряем статичные
// «слоты», которые сами не анимируются, поэтому результат не зависит
// от текущего кадра анимации.
export function relRect(el: Element, stage: Element): Rect {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}

// Где реально лежит картинка внутри слота при object-fit cover/contain
export function fitRect(slot: Rect, aspect: number, fit: "cover" | "contain"): Rect {
  const byW = { w: slot.w, h: slot.w / aspect };
  const byH = { w: slot.h * aspect, h: slot.h };
  const pick = fit === "cover" ? (byW.h >= slot.h ? byW : byH) : byW.h <= slot.h ? byW : byH;
  return { x: slot.x + (slot.w - pick.w) / 2, y: slot.y + (slot.h - pick.h) / 2, w: pick.w, h: pick.h };
}

// Поза обуви: центр (cx — от левого края холста, dy — от центра зоны
// под хэдером) и ширина изображения, всё в единицах макета.
export type Pose = { cx: number; dy: number; w: number };
export type PxPose = { cx: number; cy: number; w: number };

export function poseToPx(p: Pose, stageW: number, stageH: number): PxPose {
  const u = getU();
  const left = (stageW - canvas() * u) / 2;
  const top = headerH() * u;
  const mid = top + (stageH - top) / 2;
  return { cx: left + p.cx * u, cy: mid + p.dy * u, w: p.w * u };
}

// Перевод позы в transform для картинки с базовой шириной baseW.
// Масштаб всегда ≤ 1: базовая ширина берётся по самой крупной позе,
// так исходник только уменьшается и остаётся чётким.
export function poseToTransform(p: PxPose, baseW: number, baseH: number) {
  return { x: p.cx - baseW / 2, y: p.cy - baseH / 2, scale: p.w / baseW };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

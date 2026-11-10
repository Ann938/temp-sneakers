// Сцена 1: первый экран → галерея (принцип Numa).
// 1) текст и кнопка уходят вверх;
// 2) фото бегуньи раскрывается почти на весь экран — камера «подъезжает»;
// 3) фото сжимается и садится в первую карточку галереи;
// 4) остальные карточки разъезжаются рядами со сдвигом и появляются по очереди.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getU, headerH, relRect, type Rect } from "./geometry";
import { registerTarget } from "@/lib/scroll";

const PHOTO_ASPECT = 1536 / 1024;

export function buildHero(root: HTMLElement, { reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const stage = q("[data-stage]");
  const flyer = q("[data-flyer]");
  const img = q<HTMLImageElement>("[data-flyer-img]");
  const heroSlot = q("[data-hero-slot]");
  const heroStatic = q("[data-hero-static]");
  const cardSlot = q("[data-card-slot]");
  const text = q("[data-hero-text]");
  const head = q("[data-gallery-head]");
  const gallery = head.parentElement as HTMLElement;
  const cards = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-card]:not([data-card-slot])"));

  const gridEl = cardSlot.parentElement as HTMLElement;
  const moreList = root.querySelector<HTMLElement>("[data-more-card]")?.parentElement ?? null;

  const geo = { W: 0, H: 0, u: 1, hero: {} as Rect, full: {} as Rect, card: {} as Rect };

  const measure = () => {
    const s = stage.getBoundingClientRect();
    geo.u = getU();
    geo.W = s.width;
    geo.H = s.height;
    geo.hero = relRect(heroSlot, stage);
    geo.card = relRect(cardSlot, stage);
    // «Почти на весь экран»: под хэдером, с тонкими полями по краям
    const pad = 16 * geo.u; // поля 16 и на МВ
    const top = headerH() * geo.u;
    geo.full = { x: pad, y: top, w: geo.W - pad * 2, h: geo.H - top - pad };
    // reduced motion: без «подъезда» камеры — фото сразу переходит в карточку
    if (reduced) geo.full = geo.hero;
    // МВ: ряды 3–4 идут после пина. Подтягиваем их в пустую часть экрана
    // под вторым рядом, чтобы между рядами был тот же шаг 12.
    if (moreList) {
      if (mobile) {
        const grid = relRect(gridEl, stage);
        const gap = geo.H - (grid.y + grid.h) - 12 * geo.u;
        moreList.style.marginTop = `${-Math.max(0, gap)}px`;
      } else moreList.style.marginTop = "";
    }
    img.style.width = `${geo.W}px`;
    img.style.height = `${geo.W / PHOTO_ASPECT}px`;
  };
  measure();

  // Окно фото: позиция, размер, скругление и «зум» камеры внутри окна
  const p = { x: 0, y: 0, w: 0, h: 0, r: 0, z: 1 };
  const apply = () => {
    const { W, H } = geo;
    flyer.style.clipPath = `inset(${p.y}px ${W - p.x - p.w}px ${H - p.y - p.h}px ${p.x}px round ${p.r}px)`;
    // как object-fit: cover под текущее окно — фото не растягивается
    const iw = Math.max(p.w, p.h * PHOTO_ASPECT) * p.z;
    const ih = iw / PHOTO_ASPECT;
    const tx = p.x + p.w / 2 - iw / 2;
    const ty = p.y + p.h / 2 - ih / 2;
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${iw / W})`;
  };

  const R = () => 24 * geo.u;
  const rect = (k: "hero" | "full" | "card") => ({
    x: () => geo[k].x,
    y: () => geo[k].y,
    w: () => geo[k].w,
    h: () => geo[k].h,
  });

  const lengthVh = reduced ? 1.6 : 2.6;
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    onUpdate: apply,
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () => `+=${window.innerHeight * lengthVh}`,
      pin: stage,
      scrub: reduced ? true : 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 2, // пин выше по странице считается первым
    },
  });

  // ---- Фото: первый экран → почти весь экран → карточка ----
  tl.fromTo(p, { ...rect("hero"), r: R, z: 1 }, { ...rect("full"), r: () => 32 * geo.u, duration: 3, ease: "power2.inOut" }, 0.4);
  // спокойный участок: фото на весь экран, камера медленно приближается
  if (!reduced) tl.to(p, { z: 1.06, duration: 1.2 }, 3.4);
  tl.fromTo(
    p,
    { ...rect("full"), r: () => 32 * geo.u },
    { ...rect("card"), r: R, z: 1, duration: 3.2, ease: "power3.inOut", immediateRender: false },
    4.6,
  );

  // ---- Текст первого экрана уходит вверх ----
  tl.to(text, { y: () => -120 * geo.u, autoAlpha: 0, duration: 2.2, ease: "power1.in" }, 0);

  // ---- Галерея собирается вокруг фото ----
  tl.set(gallery, { pointerEvents: "auto" }, 6);
  tl.fromTo(head, { y: () => 48 * geo.u, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.4, ease: "power2.out" }, 6.1);
  // ДВ: верхний ряд въезжает справа, нижний — слева, дальние карточки — с
  // большим сдвигом. МВ: две колонки разъезжаются от краёв экрана.
  const offsetX = (i: number) => {
    if (mobile) return ((i + 1) % 2 === 1 ? 70 : -70) * geo.u;
    const row = i < 3 ? 0 : 1;
    const col = row === 0 ? i + 1 : i - 3;
    return row === 0 ? (100 + col * 60) * geo.u : -(100 + (3 - col) * 60) * geo.u;
  };
  tl.fromTo(
    cards,
    reduced
      ? { x: 0, y: 0, scale: 1, autoAlpha: 0 } // только проявление, без полёта
      : { x: (i: number) => offsetX(i), y: () => 56 * geo.u, scale: 0.9, autoAlpha: 0 },
    { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 1.7, ease: "power3.out", stagger: 0.16 },
    6.3,
  );
  tl.addLabel("about", 8.9);
  tl.to({}, { duration: 0.8 }, 8.9); // спокойный участок: галерея собрана

  // МВ: ряды галереи после пина проявляются по мере прокрутки, по одному разу
  const more = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-more-card]"));
  if (mobile && more.length) {
    gsap.set(more, { autoAlpha: 0, y: () => 40 * geo.u });
    ScrollTrigger.batch(more, {
      start: "top 92%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, { autoAlpha: 1, y: 0, duration: reduced ? 0.3 : 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
    });
  }

  // Статичное фото прячем только когда летящий слой встал на его место
  gsap.set(flyer, { visibility: "visible" });
  gsap.set(heroStatic, { visibility: "hidden" });
  apply();

  const onRefreshInit = () => measure();
  const onRefresh = () => apply();
  ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
  ScrollTrigger.addEventListener("refresh", onRefresh);

  const st = tl.scrollTrigger!;
  const off = registerTarget("about", () => st.start + (tl.labels.about / tl.duration()) * (st.end - st.start));

  return () => {
    off();
    ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
    ScrollTrigger.removeEventListener("refresh", onRefresh);
  };
}

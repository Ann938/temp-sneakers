"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { hasTarget, scrollToSection, setLenis } from "@/lib/scroll";
import { buildHero } from "@/motion/hero";
import { buildStory } from "@/motion/story";
import { MOBILE_QUERY } from "@/motion/geometry";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Плавный скролл + сцены главной. Монтируется один раз на странице.
// Прогресс сцен живёт в GSAP, React за время прокрутки не перерисовывается.
export default function Motion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    ScrollTrigger.config({ ignoreMobileResize: true });
    // Браузер не должен сам прыгать по якорю и восстанавливать позицию до
    // того, как сцены посчитали длину пинов
    history.scrollRestoration = "manual";

    // Lenis только на десктопе с колесом/тачпадом и без reduced motion
    let lenis: Lenis | null = null;
    let raf: ((t: number) => void) | null = null;
    if (!reduced && !touch) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      raf = (t: number) => lenis!.raf(t * 1000); // gsap.ticker отдаёт секунды
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      setLenis(lenis);
    }

    const offs: (() => void)[] = [];
    // ДВ и МВ — разные постановки сцен. При переходе через 1280 matchMedia
    // откатывает всё созданное и строит заново под новую раскладку.
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 1280px)", mobile: MOBILE_QUERY }, (c) => {
      const mobile = Boolean(c.conditions?.mobile);
      const local: (() => void)[] = [];
      // Порядок важен: пин выше по странице создаётся первым
      const hero = document.querySelector<HTMLElement>("[data-scene=hero]");
      const story = document.querySelector<HTMLElement>("[data-scene=story]");
      if (hero) local.push(buildHero(hero, { reduced, mobile }));
      if (story) local.push(buildStory(story, { reduced, mobile }));
      return () => local.forEach((o) => o());
    });
    const ctx = { revert: () => mm.revert() };
    document.documentElement.classList.add("motion-ready");

    // После пересчёта пинов высота страницы меняется — сообщаем Lenis
    const syncLenis = () => lenis?.resize();
    ScrollTrigger.addEventListener("refresh", syncLenis);
    offs.push(() => ScrollTrigger.removeEventListener("refresh", syncLenis));
    syncLenis();

    // Пересчёт позиций: после шрифтов (меняется высота текста) и полной загрузки
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    // Переход по ссылке вида /#choose со служебных страниц. Ждём загрузку
    // и шрифты: до этого длина закреплённых сцен ещё не окончательная.
    const hash = window.location.hash.slice(1);
    let hashTimer = 0;
    const goToHash = () => {
      hashTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
        scrollToSection(hash as never, true);
      }, 80);
    };
    if (hash && hasTarget(hash)) {
      const ready = () => (document.fonts ? document.fonts.ready.then(goToHash) : goToHash());
      if (document.readyState === "complete") ready();
      else window.addEventListener("load", ready, { once: true });
    }

    return () => {
      clearTimeout(hashTimer);
      window.removeEventListener("load", refresh);
      offs.forEach((o) => o());
      ctx.revert();
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
      setLenis(null);
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return null;
}

@AGENTS.md

# ТЕМП — лендинг кроссовок

Макет: Figma `IksG4RrSMnbyTjK8qbG5HH`, узел `425:1133` (ДВ светлая `405:499`, тёмная `418:594`, МВ `405:587` / `418:736`).
Названия слоёв в Figma устарели — тексты берём с экрана, они в `src/content.ts`.

## Стек и правила
- Next 16 (App Router) + SCSS-модули, GSAP ScrollTrigger + Lenis. Без Tailwind.
- Все размеры через `u()` из `src/styles/_core.scss`; `--u` в `globals.scss` = min(100vw/1440, 100svh/860, 1.3333px). JS-двойник — `getU()` в `src/motion/geometry.ts`, менять только вместе.
- Палитра — переменные `--temp-*` из Figma, тема = `data-theme` на `<html>`. Смена темы не трогает геометрию.
- Тексты — только в `src/content.ts`.

## Сцены (src/motion)
- `hero.ts` — первый экран → галерея: фото летит слоем `[data-flyer]` (clip-path + cover), садится в `[data-card-slot]`.
- `story.ts` — «Лёгкость» → предметная съёмка → выбор пары. Позы обуви — `POSES` в координатах макета 1440. Соседние ракурсы летят по одной траектории, смена — короткий перелив.
- Разделы для меню регистрируются через `registerTarget` (`src/lib/scroll.ts`): позиция — точка внутри пина, а не top элемента.
- Выбор цвета/размера — `src/lib/order.ts`, ключ `localStorage` `temp:order`.

## Картинки
`node scripts/prepare-assets.mjs <папка PNG из Figma>` — WebP + цветовые варианты пары (`pair-<color>.webp`).

## Проверка
- `npm run dev -- -p 3100`
- `PW_CHROME=<chrome.exe> node scripts/shot.mjs http://localhost:3100/ <out> 1440 900 light|dark` — кадры по скроллу
- `node scripts/check.mjs <out>` — меню, тема, ресайз, быстрый/обратный скролл, выбор, переходы со служебных страниц

## МВ
- Всё ≤1279px — одна колонка по макету 390 (`@include mobile` в конце каждого модуля, миксины `m-*` в ядре).
  `--u` на МВ = min(100vw/390, 100svh/800, 1.6px); планшет — та же колонка, шире не растёт.
- Сцены пересобираются через `gsap.matchMedia` при переходе через 1280 (`Motion.tsx`), позы МВ — `POSES_M` в `story.ts`.
- На МВ в пин первой сцены входят два ряда галереи, ряды 3–4 — список `.more` сразу после пина.
- Проверка МВ — WebKit: `ENGINE=webkit MOBILE=1 node scripts/shot.mjs <url> <out> 390 844`, `node scripts/check-mobile.mjs <out>`.

## Этапы
1. ДВ главной с анимацией + служебные страницы — сделано.
2. МВ — сделано (телефон и планшет), ждёт проверки заказчика.
3. Оформление заказа `/checkout` (`src/components/Checkout.tsx`) — сделано: берёт цвет/размер из `temp:order`,
   цены/доставка/промокод — заглушки в `content.ts` → `checkout`. Отправки на сервер нет: заказ пишется в
   `localStorage` `temp:lastOrder`. Проверка — `node scripts/check-checkout.mjs <out>`.
   Чёрная пара — реальное фото из Figma (440:588), кадр подгоняется под белую в `prepare-assets.mjs`.

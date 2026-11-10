// Сцена 2: предметная съёмка.
// «Лёгкость» (фото шага) → камера подъезжает к кроссовку на ноге → фото
// растворяется, остаётся тот же кроссовок без фона → ракурсы по темам:
// подошва, трикотаж, посадка, резина → пара спереди → пара садится в выбор.
//
// Плавной смены ракурсов без 3D-модели добиваемся так: оба соседних
// изображения летят по ОДНОЙ траектории (центр и ширина совпадают на каждом
// кадре), а смена картинки — короткий перелив в середине движения.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { features } from "@/content";
import { registerTarget } from "@/lib/scroll";
import { fitRect, getU, poseToPx, poseToTransform, relRect, type Pose, type PxPose } from "./geometry";

type ShoeId = (typeof features)[number]["id"] | "front";

// Размеры исходников (px) — нужны до загрузки картинок
const SRC: Record<ShoeId, [number, number]> = {
  landing: [1695, 928],
  fresh: [1254, 1254],
  fit: [1672, 941],
  route: [1732, 908],
  front: [1536, 1024],
};

// Позы по макету: [начало спокойного участка, конец — камера чуть ближе].
// Обувь не заходит в колонку текста (текст слева 80–680, справа 760–1360).
const POSES_D: Record<ShoeId, [Pose, Pose]> = {
  // подошва и пятка с амортизацией, носок смотрит на текст
  landing: [{ cx: 360, dy: 10, w: 780 }, { cx: 350, dy: 14, w: 820 }],
  // трикотаж крупно справа
  fresh: [{ cx: 1085, dy: 0, w: 600 }, { cx: 1080, dy: -6, w: 650 }],
  // верх и пятка слева
  fit: [{ cx: 366, dy: 0, w: 713 }, { cx: 372, dy: -4, w: 752 }],
  // подошва снизу, выходит за правый край, как в макете
  route: [{ cx: 1104, dy: 0, w: 904 }, { cx: 1112, dy: 6, w: 948 }],
  // пара целиком спереди, по центру
  // (слова «Двигайся / по-своему» стоят по краям — пара между ними не заходит на текст)
  front: [{ cx: 720, dy: 10, w: 960 }, { cx: 720, dy: 6, w: 990 }],
};

// МВ (холст 390): «карточка товара» — текст сверху, вся остальная высота
// экрана — студия. dy здесь от центра этой зоны (считается по фактической
// высоте текста), поэтому пустот нет на любом телефоне. Обувь крупная и
// чуть выходит за края экрана — ощущение крупного плана.
const POSES_M: Record<ShoeId, [Pose, Pose]> = {
  landing: [{ cx: 195, dy: 0, w: 430 }, { cx: 202, dy: 4, w: 456 }],
  fresh: [{ cx: 195, dy: 0, w: 390 }, { cx: 190, dy: -4, w: 414 }],
  fit: [{ cx: 195, dy: 0, w: 430 }, { cx: 200, dy: -4, w: 452 }],
  route: [{ cx: 208, dy: 0, w: 450 }, { cx: 214, dy: 4, w: 474 }],
  front: [{ cx: 195, dy: 0, w: 440 }, { cx: 195, dy: -4, w: 460 }],
};

// Кроссовок на фото «Лёгкость»: центр и доля ширины кадра (замер по исходнику)
const STEP_SHOE = { fx: 0.679, fy: 0.635, fw: 0.437 };
const STEP_ASPECT = 1672 / 941;
// Доля ширины, которую занимает обувь в PNG профиля
const PROFILE_FILL = 0.919;
// Пара для выбора: исходник 1672×941, вписан без обрезки
const PAIR_ASPECT = 1672 / 941;

export function buildStory(root: HTMLElement, { reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const POSES = mobile ? POSES_M : POSES_D;
  const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const stage = q("[data-stage]");
  const stepText = q("[data-step-text]");
  const photo = q<HTMLImageElement>("[data-step-photo]");
  const photoSlot = photo.parentElement as HTMLElement;
  const choice = q("[data-choice]");
  const choiceTitle = q("[data-choice-title]");
  // цвет/размер и кнопка (на ДВ кнопка стоит под фото пары)
  const choiceControls = Array.from(root.querySelectorAll<HTMLElement>("[data-choice-controls]"));
  const choicePair = q("[data-choice-pair]");
  const choiceSlot = q("[data-choice-slot]");
  const wordL = q("[data-word=left]");
  const wordR = q("[data-word=right]");

  const ids: ShoeId[] = [...features.map((f) => f.id), "front"];
  const shoe = Object.fromEntries(ids.map((id) => [id, q(`[data-shoe=${id}]`)])) as Record<ShoeId, HTMLElement>;
  const copy = Object.fromEntries(features.map((f) => [f.id, q(`[data-copy=${f.id}]`)])) as Record<string, HTMLElement>;

  // ---- Геометрия, пересчитывается на каждый refresh ----
  const g = {
    W: 0,
    H: 0,
    u: 1,
    base: {} as Record<ShoeId, { w: number; h: number }>,
    bridgeStart: {} as PxPose,
    photoMove: { x: 0, y: 0, scale: 1 },
    choicePose: {} as PxPose,
    zoneMid: 0,
  };

  // МВ: позы считаются от центра студии под текстом, ДВ — от центра экрана
  const px = (p: Pose): PxPose =>
    mobile
      ? { cx: (g.W - 390 * g.u) / 2 + p.cx * g.u, cy: g.zoneMid + p.dy * g.u, w: p.w * g.u }
      : poseToPx(p, g.W, g.H);

  const spot = q("[data-spot]");
  const copyPositioners = Object.values(copy).map((c) => c.parentElement as HTMLElement);
  const measureZone = () => {
    if (!mobile) return;
    // нижняя граница самого высокого текста — дальше начинается студия
    const textBottom = Math.max(...copyPositioners.map((el) => { const r = relRect(el, stage); return r.y + r.h; }));
    const top = textBottom + 8 * g.u;
    const bottom = g.H - 12 * g.u;
    g.zoneMid = (top + bottom) / 2;
    const d = Math.min((bottom - top) * 0.95, 380 * g.u);
    Object.assign(spot.style, { width: `${d}px`, height: `${d}px`, left: `${g.W / 2 - d / 2}px`, top: `${g.zoneMid - d / 2}px` });
  };

  const choiceInner = choice.firstElementChild as HTMLElement;
  const fitChoice = () => {
    choice.style.removeProperty("--u");
    const top = choiceInner.getBoundingClientRect().top - choice.getBoundingClientRect().top;
    const room = choice.clientHeight - top - 16 * g.u; // запас снизу
    const need = choiceInner.offsetHeight;
    if (need > room && room > 0) choice.style.setProperty("--u", `${(g.u * room) / need}px`);
  };

  const measure = () => {
    const s = stage.getBoundingClientRect();
    g.W = s.width;
    g.H = s.height;
    g.u = getU();
    measureZone();

    // Фото шага и точка кроссовка на нём. На МВ фото обрезано (cover),
    // поэтому точку считаем от реального положения картинки в слоте.
    const ph = relRect(photoSlot, stage);
    const img = fitRect(ph, STEP_ASPECT, "cover");
    const shoeX = img.x + img.w * STEP_SHOE.fx;
    const shoeY = img.y + img.h * STEP_SHOE.fy;
    gsap.set(photo, { transformOrigin: `${shoeX - ph.x}px ${shoeY - ph.y}px` });
    // профиль такого размера, чтобы его обувь совпала с обувью на фото
    const profileW = (img.w * STEP_SHOE.fw) / PROFILE_FILL;
    g.bridgeStart = { cx: shoeX, cy: shoeY, w: profileW };
    const land = px(POSES.landing[0]);
    g.photoMove = { x: land.cx - shoeX, y: land.cy - shoeY, scale: land.w / profileW };

    // Блок выбора должен целиком помещаться в экран: на телефоне с панелями
    // браузера или крупным шрифтом высоты может не хватить, и размеры уезжали
    // за край. Тогда уменьшаем весь блок своим --u, пропорции не меняются.
    fitChoice();

    // Финал: пара спереди садится туда, где стоит пара в блоке выбора
    // (ДВ — вписана целиком, МВ — на всю ширину с обрезкой пустых полей)
    const cs = relRect(choiceSlot, stage);
    // ДВ (445:646): пара 75.53% ширины рамки по центру, сдвинута вверх на 18%
    const pair = mobile
      ? fitRect(cs, PAIR_ASPECT, "cover")
      : { x: cs.x + cs.w * 0.1224, y: cs.y - cs.h * 0.18, w: cs.w * 0.7553, h: cs.h * 1.2667 };
    g.choicePose = { cx: pair.x + pair.w / 2, cy: pair.y + pair.h / 2, w: pair.w * 0.93 };

    // Базовая ширина = самая крупная поза: масштаб только ≤ 1
    for (const id of ids) {
      const maxW = Math.max(...POSES[id].map((p) => p.w * g.u));
      const [sw, sh] = SRC[id];
      const w = Math.min(maxW, sw * 1.15); // не растягиваем исходник сильнее 115%
      g.base[id] = { w, h: (w * sh) / sw };
      shoe[id].style.width = `${g.base[id].w}px`;
      shoe[id].style.height = `${g.base[id].h}px`;
    }
  };
  measure();

  const T = (id: ShoeId, pose: () => PxPose) => ({
    x: () => poseToTransform(pose(), g.base[id].w, g.base[id].h).x,
    y: () => poseToTransform(pose(), g.base[id].w, g.base[id].h).y,
    scale: () => poseToTransform(pose(), g.base[id].w, g.base[id].h).scale,
  });
  const at = (id: ShoeId, i: 0 | 1) => () => px(POSES[id][i]);
  const U = (n: number) => () => n * g.u;

  // ---- Таймлайн ----
  const M = reduced ? 0.3 : 1; // при reduced motion переходы короткие, без полётов
  const PUSH = !reduced;
  const HOLD = 0.9;
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  let t = 0;

  // Спокойный участок: читаем «Лёгкость»
  t += 0.7;

  // Мост: подъезд к кроссовку на фото → кроссовок без фона
  const B = 1.7 * M;
  tl.to(stepText, { y: U(-60), autoAlpha: 0, duration: 0.6 * M, ease: "power1.in" }, t);
  tl.to(
    photo,
    { x: () => g.photoMove.x, y: () => g.photoMove.y, scale: () => g.photoMove.scale, duration: B, ease: "power2.inOut" },
    t,
  );
  tl.to(photo, { autoAlpha: 0, duration: 0.55 * M }, t + 0.75 * M);
  tl.fromTo(
    shoe.landing,
    { ...T("landing", () => g.bridgeStart) },
    { ...T("landing", at("landing", 0)), duration: B, ease: "power2.inOut" },
    t,
  );
  tl.to(shoe.landing, { opacity: 1, duration: 0.6 * M }, t + 0.6 * M);
  // МВ: студия проявляется вместе с кроссовком без фона
  if (mobile) tl.fromTo(spot, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.8 * M, ease: "power2.out" }, t + 0.7 * M);
  t += B;

  // Тексты и прогресс
  const textIn = (el: HTMLElement, time: number) =>
    tl.fromTo(el, { y: U(40), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 * M + 0.1, ease: "power2.out" }, time);
  const textOut = (el: HTMLElement, time: number) =>
    tl.to(el, { y: U(-40), autoAlpha: 0, duration: 0.35 * M + 0.05, ease: "power1.in" }, time);

  textIn(copy.landing, t - 0.35 * M);

  const order: ShoeId[] = ids;
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    const next = order[i + 1];
    if (i === 0) tl.addLabel("features", t);

    // Спокойный участок: камера медленно приближается к детали
    if (PUSH) tl.to(shoe[id], { ...T(id, at(id, 1)), duration: HOLD, ease: "sine.inOut" }, t);
    t += HOLD;

    if (!next) break;
    const Mv = 1.15 * M;

    // уходящий текст исчезает раньше, чем появится следующий
    if (copy[id]) textOut(copy[id], t);

    // Обе картинки летят по одной траектории, перелив — в середине пути.
    // Новый ракурс лежит выше и проявляется поверх ещё непрозрачного старого,
    // старый гаснет только потом: даже если скролл остановили посреди
    // перехода, сквозь обувь не просвечивает фон (на тёмной теме это читалось
    // как серая тень).
    const from = at(id, PUSH ? 1 : 0);
    const to = at(next, 0);
    tl.to(shoe[id], { ...T(id, to), duration: Mv, ease: "power2.inOut" }, t);
    tl.fromTo(shoe[next], { ...T(next, from), opacity: 0 }, { ...T(next, to), duration: Mv, ease: "power2.inOut" }, t);
    tl.to(shoe[next], { opacity: 1, duration: 0.16 * Mv, ease: "power1.in" }, t + 0.4 * Mv);
    tl.to(shoe[id], { opacity: 0, duration: 0.06 * Mv }, t + 0.56 * Mv);

    if (copy[next]) textIn(copy[next], t + 0.68 * Mv);
    if (next === "front") {
      // «Двигайся по-своему»: слова съезжаются к паре с краёв
      tl.fromTo(wordL, { x: U(-140), autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5 * Mv, ease: "power3.out" }, t + 0.55 * Mv);
      tl.fromTo(wordR, { x: U(140), autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5 * Mv, ease: "power3.out" }, t + 0.55 * Mv);
    }
    t += Mv;
  }

  // Финал: пара уменьшается и садится в блок выбора
  const F = 1.4 * M;
  tl.to(wordL, { x: U(-90), autoAlpha: 0, duration: 0.4 * F, ease: "power1.in" }, t);
  tl.to(wordR, { x: U(90), autoAlpha: 0, duration: 0.4 * F, ease: "power1.in" }, t);
  tl.to(shoe.front, { ...T("front", () => g.choicePose), duration: F, ease: "power3.inOut" }, t);
  if (mobile) tl.to(spot, { autoAlpha: 0, scale: 0.8, duration: 0.4 * F, ease: "power1.in" }, t);
  // интерфейс выбора появляется, когда пара уже ушла из зоны заголовка;
  // на МВ пара летит вверх сквозь зону цветов и размеров — ждём дольше
  const late = mobile ? 0.12 : 0;
  tl.fromTo(choice, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, t + 0.55 * F);
  tl.fromTo(choiceTitle, { y: U(36), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.32 * F, ease: "power2.out" }, t + 0.62 * F);
  tl.fromTo(choiceControls, { y: U(36), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: (0.3 - late) * F, ease: "power2.out", stagger: 0.04 }, t + (0.68 + late) * F);
  // пара спереди переливается в пару сбоку выбранного цвета
  tl.fromTo(choicePair, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.3 * F }, t + 0.7 * F);
  tl.to(shoe.front, { opacity: 0, duration: 0.28 * F }, t + 0.72 * F);
  t += F;
  tl.addLabel("choose", t);
  tl.to({}, { duration: 0.5 }, t); // спокойный участок перед обычным скроллом

  const st = ScrollTrigger.create({
    animation: tl,
    trigger: root,
    start: "top top",
    end: () => `+=${window.innerHeight * tl.duration() * (reduced ? 0.45 : 0.62)}`,
    pin: stage,
    scrub: reduced ? true : 0.7,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    refreshPriority: 1,
  });

  const onRefreshInit = () => measure();
  ScrollTrigger.addEventListener("refreshInit", onRefreshInit);

  const pos = (label: string) => st.start + (tl.labels[label] / tl.duration()) * (st.end - st.start);
  const offs = [
    registerTarget("features", () => pos("features") + 2),
    registerTarget("choose", () => pos("choose") + 2),
  ];

  return () => {
    offs.forEach((o) => o());
    ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
    st.kill();
  };
}

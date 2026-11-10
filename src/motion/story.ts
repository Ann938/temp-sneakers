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
import { fitRect, getU, headerH, poseToPx, poseToTransform, relRect, type Pose, type PxPose } from "./geometry";

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

// МВ: позы не задаются числами, а считаются по факту (см. measureMobile):
// текст + отступ 32 + обувь — одна группа, которая стоит по центру экрана
// под хэдером. Обувь по ширине не выходит за колонку 358 (поля 16).
// Видимая часть обуви внутри PNG (доли кадра: x0, y0, x1, y1) — замер по исходникам.
const BBOX: Record<ShoeId, [number, number, number, number]> = {
  landing: [0.053, 0.128, 0.972, 0.9],
  fresh: [0.026, 0.148, 0.978, 0.85],
  fit: [0.052, 0.117, 0.959, 0.908],
  route: [0.111, 0.042, 0.955, 0.95],
  front: [0.102, 0.139, 0.898, 0.889],
};
const M_COLUMN = 358;
const M_GAP = 56; // текст → обувь: больше макетных 32, чтобы группа заполняла экран без лишнего воздуха

// Кроссовок на фото «Лёгкость»: центр и доля ширины кадра (замер по исходнику)
const STEP_SHOE = { fx: 0.679, fy: 0.635, fw: 0.437 };
const STEP_ASPECT = 1672 / 941;
// Доля ширины, которую занимает обувь в PNG профиля
const PROFILE_FILL = 0.919;
// Пара для выбора: исходник 1672×941, вписан без обрезки
const PAIR_ASPECT = 1672 / 941;

export function buildStory(root: HTMLElement, { reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const POSES = POSES_D;
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
    mPose: {} as Record<ShoeId, PxPose>,
  };

  const px = (p: Pose): PxPose => poseToPx(p, g.W, g.H);

  // ---- МВ: каждое состояние — группа «текст + обувь» по центру экрана ----
  const words = wordL.parentElement as HTMLElement;
  const textOf = (id: ShoeId) => (id === "front" ? words : (copy[id].parentElement as HTMLElement));
  const measureMobile = () => {
    for (const id of ids) {
      textOf(id).style.removeProperty(id === "front" ? "padding-top" : "top");
    }
    if (!mobile) return;
    const u = g.u;
    const head = headerH() * u;
    const area = g.H - head;
    for (const id of ids) {
      const [x0, y0, x1, y1] = BBOX[id];
      const [sw, sh] = SRC[id];
      const textH = id === "front" ? wordL.offsetHeight : textOf(id).offsetHeight;
      // ширина: видимая обувь ровно в колонку 358, но не выше свободного места
      const maxVisH = area - textH - M_GAP * u - 48 * u;
      let w = (M_COLUMN * u) / (x1 - x0);
      const visH = (wW: number) => wW * (sh / sw) * (y1 - y0);
      if (visH(w) > maxVisH) w = maxVisH / ((sh / sw) * (y1 - y0));
      const groupH = textH + M_GAP * u + visH(w);
      const top = head + Math.max(16 * u, (area - groupH) / 2);
      // текст встаёт в начало группы
      if (id === "front") textOf(id).style.paddingTop = `${top - head}px`;
      else textOf(id).style.top = `${top - head}px`;
      // обувь: верх видимой части — сразу под текстом, по горизонтали — центр колонки
      const imgH = w * (sh / sw);
      const shoeTop = top + textH + M_GAP * u;
      g.mPose[id] = {
        cx: g.W / 2 - ((x0 + x1) / 2 - 0.5) * w,
        cy: shoeTop - y0 * imgH + imgH / 2,
        w,
      };
    }
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
    measureMobile();

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
    const land = mobile ? g.mPose.landing : px(POSES.landing[0]);
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
      const maxW = mobile ? g.mPose[id].w : Math.max(...POSES[id].map((p) => p.w * g.u));
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
  // МВ: одна поза на состояние — камера не приближается, чтобы обувь не выходила за поля 16
  const at = (id: ShoeId, i: 0 | 1) => () => (mobile ? g.mPose[id] : px(POSES[id][i]));
  const U = (n: number) => () => n * g.u;

  // ---- Таймлайн ----
  const M = reduced ? 0.3 : 1; // при reduced motion переходы короткие, без полётов
  const PUSH = !reduced && !mobile;
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

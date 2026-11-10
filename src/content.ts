// Путь к файлу из public/ с учётом подпапки сайта на GitHub Pages
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const asset = (p: string) => BASE_PATH + p;

// Все тексты сайта в одном месте. Вёрстка про конкретные слова ничего не знает.
// Тексты главной — из макета Figma «ТЕМП / ДВ».

export const site = {
  name: "ТЕМП",
  title: "ТЕМП — кроссовки под твой ритм",
  description:
    "Лёгкие дышащие кроссовки ТЕМП: упругая амортизация, трикотажный верх и посадка под твою стопу. Пять цветов, размеры 36–46.",
};

// Ключи разделов — общие для меню, кнопок и сцен анимации
export type SectionKey = "about" | "features" | "choose";

export const nav: { key: SectionKey; label: string }[] = [
  { key: "about", label: "О кроссовках" },
  { key: "features", label: "Преимущества" },
  { key: "choose", label: "Цвета и размеры" },
];

export const headerCta = "Выбрать пару";

export const hero = {
  title: ["Кроссовки", "под твой ритм"],
  lead: "Комфорт спортивной обуви в повседневном стиле. Лёгкие, дышащие, с упругой поддержкой каждого шага.",
  cta: "Выбрать свою пару",
  image: { src: asset("/img/runner.webp"), alt: "Бегунья в белых кроссовках ТЕМП на стадионе" },
};

export const gallery = {
  title: "Одна пара, больше планов",
  lead: "Спортивный характер и лаконичный дизайн. Кроссовки для пробежки, работы и встречи с друзьями.",
  // Первая карточка — фото первого экрана: оно «прилетает» в неё при скролле
  cards: [
    { src: asset("/img/runner.webp"), alt: "Пробежка на стадионе" },
    { src: asset("/img/people-2.webp"), alt: "Прогулка в парке" },
    { src: asset("/img/people-3.webp"), alt: "Тренировка на улице" },
    { src: asset("/img/people-4.webp"), alt: "Отдых после пробежки" },
    { src: asset("/img/people-5.webp"), alt: "Прогулка с собакой" },
    { src: asset("/img/people-6.webp"), alt: "Встреча с друзьями" },
    { src: asset("/img/people-7.webp"), alt: "Разминка на ступенях" },
    { src: asset("/img/people-8.webp"), alt: "Пробежка по городу" },
  ],
};

export const firstStep = {
  title: ["Лёгкость, которую", "чувствуешь"],
  lead: "Воздушный трикотаж и лёгкая подошва не утяжеляют шаг, чтобы больше двигаться и меньше чувствовать обувь на ногах.",
  image: { src: asset("/img/first-step.webp"), alt: "Шаг в кроссовках ТЕМП по беговой дорожке" },
};

// Предметная сцена: порядок = порядок состояний
export const features = [
  {
    id: "landing",
    title: ["Мягкое приземление"],
    lead: "Упругая пена по всей длине подошвы смягчает шаг, комфорт на каждом километре.",
    side: "right" as const,
    image: { src: asset("/img/shoe-profile.webp"), alt: "Кроссовок ТЕМП в профиль, амортизирующая подошва" },
  },
  {
    id: "fresh",
    title: ["Ногам свежо,", "даже в движении"],
    lead: "Дышащий трикотаж выпускает лишнее тепло и пропускает воздух. Чтобы ногам было комфортно даже в насыщенный день.",
    side: "left" as const,
    image: { src: asset("/img/shoe-knit.webp"), alt: "Дышащий трикотаж верха крупным планом" },
  },
  {
    id: "fit",
    title: ["Плотно сидят,", "мягко облегают"],
    lead: "Эластичный верх подстраивается под стопу, усиленная пятка удерживает её при движении, посадка без жёсткого давления.",
    side: "right" as const,
    image: { src: asset("/img/shoe-heel.webp"), alt: "Верх и пятка кроссовка ТЕМП" },
  },
  {
    id: "route",
    title: ["Рассчитаны", "на долгий маршрут"],
    lead: "Износостойкая резина защищает подошву в самых нагруженных местах.",
    side: "left" as const,
    image: { src: asset("/img/shoe-outsole.webp"), alt: "Резиновые зоны подошвы кроссовка ТЕМП" },
  },
];

export const finale = {
  words: ["Двигайся", "по-своему"],
  image: { src: asset("/img/pair-front.webp"), alt: "Пара кроссовок ТЕМП спереди" },
};

export const colors = [
  { id: "white", label: "белый", swatch: "#ffffff" },
  { id: "pink", label: "розовый", swatch: "#f666b5" },
  { id: "lime", label: "лаймовый", swatch: "#b6ee45" },
  { id: "ink", label: "чёрный", swatch: "#0e0f10" },
  { id: "orange", label: "оранжевый", swatch: "#ff812e" },
] as const;
export type ColorId = (typeof colors)[number]["id"];

export const sizes = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46] as const;

export const choose = {
  title: ["Выбери свой цвет", "и размер"],
  colorLabel: "Цвет",
  sizeLabel: "Размер",
  cta: "Оформить заказ",
  defaultColor: "white" as ColorId,
  defaultSize: 38,
};

export const pairImage = (color: ColorId) =>
  asset(color === "white" ? "/img/pair.webp" : `/img/pair-${color}.webp`);

export const footer = {
  links: [
    { href: "/contacts", label: "Контакты" },
    { href: "/delivery", label: "Доставка" },
    { href: "/returns", label: "Возврат" },
  ],
  copyright: "© 2026 ТЕМП",
};

// ---- Оформление заказа ----
// Цены, сроки и промокод — заглушки для презентации, заменить на реальные.
export const checkout = {
  title: ["Оформление", "заказа"],
  lead: "Пара уже ждёт. Осталось несколько полей — и мы отправим её в день заказа.",
  price: 12990,
  maxQty: 3,
  freeFrom: 7000,
  promo: { code: "ТЕМП10", percent: 10 },
  steps: {
    contacts: "Контакты",
    delivery: "Доставка",
    payment: "Оплата",
    comment: "Пожелания",
  },
  delivery: [
    { id: "courier", title: "Курьер", time: "1–2 дня", price: 390, free: true, note: "Подождёт 15 минут, пока вы примеряете" },
    { id: "pickup", title: "Пункт выдачи", time: "2–5 дней", price: 190, free: true, note: "Больше 20 000 пунктов по России" },
    { id: "post", title: "Почта России", time: "5–10 дней", price: 290, free: false, note: "В любой населённый пункт" },
  ],
  payment: [
    { id: "card", title: "Картой онлайн", note: "Visa, Mastercard, Мир" },
    { id: "sbp", title: "СБП", note: "Оплата по QR-коду в банке" },
    { id: "cash", title: "При получении", note: "Картой или наличными после примерки" },
  ],
  agree: "Согласен с условиями доставки и обработки персональных данных",
  submit: "Подтвердить заказ",
  success: {
    title: ["Заказ", "принят"],
    lead: "Мы позвоним в течение 15 минут, чтобы подтвердить детали. Письмо с номером заказа уже на почте.",
    back: "Вернуться на главную",
  },
};
export type DeliveryId = (typeof checkout.delivery)[number]["id"];
export type PaymentId = (typeof checkout.payment)[number]["id"];

export const formatPrice = (n: number) => `${n.toLocaleString("ru-RU").replace(/ /g, " ")} ₽`;

// ---- Служебные страницы ----
// Данные контактов — заглушки для презентации, заменить на реальные.
export const pages = {
  contacts: {
    eyebrow: "Контакты",
    title: ["Всегда на связи,", "в твоём темпе"],
    lead: "Поможем с размером, расскажем про уход и ответим на вопросы о заказе. Пишите в любой удобный канал.",
    image: asset("/img/shoe-knit.webp"),
    cards: [
      { label: "Телефон", value: "8 800 000-00-00", note: "Ежедневно с 9:00 до 21:00", href: "tel:88000000000" },
      { label: "Почта", value: "hello@temp.shoes", note: "Отвечаем в течение дня", href: "mailto:hello@temp.shoes" },
      { label: "Шоурум", value: "Москва, ул. Бегущих, 1", note: "Пн–Вс 11:00–21:00, примерка без записи" },
      { label: "Мессенджеры", value: "Telegram · WhatsApp", note: "@temp_shoes" },
    ],
  },
  delivery: {
    eyebrow: "Доставка",
    title: ["Привезём пару", "к первой пробежке"],
    lead: "Отправляем заказ в день оформления. Можно примерить перед оплатой и оставить только то, что подошло.",
    image: asset("/img/shoe-outsole.webp"),
    cards: [
      { label: "Курьер", value: "1–2 дня", note: "По Москве и Санкт-Петербургу. Бесплатно от 7 000 ₽" },
      { label: "Пункты выдачи", value: "2–5 дней", note: "Больше 20 000 пунктов по всей России" },
      { label: "Почта России", value: "5–10 дней", note: "В любой населённый пункт" },
      { label: "Примерка", value: "15 минут", note: "Курьер подождёт, пока вы примеряете пару" },
    ],
  },
  returns: {
    eyebrow: "Возврат",
    title: ["Не подошли —", "вернём без вопросов"],
    lead: "Если размер или цвет не подошёл, оформите возврат в течение 30 дней. Деньги вернём в течение 10 дней.",
    image: asset("/img/shoe-heel.webp"),
    cards: [
      { label: "Шаг 1", value: "Заявка", note: "Напишите нам или нажмите «Вернуть» в письме с заказом" },
      { label: "Шаг 2", value: "Упаковка", note: "Кроссовки без следов носки, в коробке и с ярлыками" },
      { label: "Шаг 3", value: "Отправка", note: "Курьер заберёт пару бесплатно в удобное время" },
      { label: "Шаг 4", value: "Деньги", note: "Вернутся на карту в течение 10 дней" },
    ],
  },
};
export type PageKey = keyof typeof pages;

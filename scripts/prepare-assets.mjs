// Готовит изображения из Figma для сайта:
// 1) переводит PNG в WebP (вес в 5–8 раз меньше при той же чёткости);
// 2) делает цветовые варианты пары для блока выбора.
// Запуск: node scripts/prepare-assets.mjs <папка с исходниками Figma>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2];
const out = path.resolve('public/img');
fs.mkdirSync(out, { recursive: true });

// имя исходника → имя на сайте
const photos = {
  '01-runner.png': 'runner',
  '09-first-step.png': 'first-step',
  'g2.png': 'people-2', 'g3.png': 'people-3', 'g4.png': 'people-4', 'g5.png': 'people-5',
  'g6.png': 'people-6', 'g7.png': 'people-7', 'g8.png': 'people-8',
};
const cutouts = {
  '10-shoe-profile.png': 'shoe-profile',
  'knit.png': 'shoe-knit',
  '11-knit-full.png': 'shoe-heel',
  '13-outsole.png': 'shoe-outsole',
  '14-pair-front.png': 'pair-front',
  'pair.png': 'pair',
};

for (const [f, name] of Object.entries(photos)) {
  await sharp(path.join(src, f)).webp({ quality: 82 }).toFile(path.join(out, name + '.webp'));
}
for (const [f, name] of Object.entries(cutouts)) {
  // alphaQuality 100 — иначе на краях прозрачной обуви появляется «грязный» ореол
  await sharp(path.join(src, f)).webp({ quality: 86, alphaQuality: 100 }).toFile(path.join(out, name + '.webp'));
}

// ---- Цветовые варианты пары ----
// Перекраска «градиентной картой»: яркость пикселя сохраняется как рисунок
// вязки и тени, а цвет берётся из палитры. Тёмная резина подошвы (низкая
// яркость) остаётся тёмной, поэтому конструкция обуви не теряется.
const palettes = {
  pink:   { shadow: [92, 20, 58],  mid: [232, 86, 164], light: [255, 214, 236] },
  lime:   { shadow: [58, 84, 10],  mid: [170, 226, 60], light: [240, 255, 205] },
  // чёрный целиком, включая шнурки: светлые участки уходят лишь в тёмно-серый,
  // чтобы рисунок вязки и шнуровки читался бликами, а не пропадал
  ink:    { shadow: [3, 3, 4],     mid: [14, 14, 16],   light: [58, 58, 62] },
  orange: { shadow: [120, 36, 0],  mid: [255, 112, 28], light: [255, 196, 150] },
};
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (p, l) => {
  // l: 0..1. Ниже 0.18 — резина, её не красим, только чуть сдвигаем к тени.
  if (l < 0.18) return null;
  const t = (l - 0.18) / 0.82;
  const [a, b, k] = t < 0.55 ? [p.shadow, p.mid, t / 0.55] : [p.mid, p.light, (t - 0.55) / 0.45];
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
};

for (const base of ['pair']) {
  const file = path.join(src, 'pair.png');
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [name, p] of Object.entries(palettes)) {
    const buf = Buffer.from(data);
    for (let i = 0; i < buf.length; i += 4) {
      if (buf[i + 3] === 0) continue;
      const l = (0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2]) / 255;
      const c = ramp(p, l);
      if (!c) continue;
      // мягкий вход окраски у порога, чтобы не было ступеньки на границе резины
      const w = Math.min(1, (l - 0.18) / 0.08);
      buf[i] = lerp(buf[i], c[0], w);
      buf[i + 1] = lerp(buf[i + 1], c[1], w);
      buf[i + 2] = lerp(buf[i + 2], c[2], w);
    }
    await sharp(buf, { raw: info }).webp({ quality: 86, alphaQuality: 100 })
      .toFile(path.join(out, `${base}-${name}.webp`));
  }
}

// ---- Готовые фото цветов из Figma заменяют перекраску ----
// Кадр подгоняется под белую пару: та же доля ширины и тот же центр, чтобы
// при переключении цвета пара не прыгала. Исходник не растягиваем — меняется
// только размер холста вокруг него.
const bbox = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 40) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
  return { x0, y0, x1, y1, W: info.width, H: info.height };
};
const realPhotos = { ink: 'pair-black.png' };
const ref = await bbox(path.join(src, 'pair.png'));
const refFill = (ref.x1 - ref.x0) / ref.W;
const refCx = (ref.x0 + ref.x1) / 2 / ref.W;
const refCy = (ref.y0 + ref.y1) / 2 / ref.H;
for (const [name, file] of Object.entries(realPhotos)) {
  const f = path.join(src, file);
  if (!fs.existsSync(f)) continue;
  const b = await bbox(f);
  const cw = Math.round((b.x1 - b.x0) / refFill);
  const ch = Math.round((cw * ref.H) / ref.W);
  // где центр обуви должен оказаться на новом холсте и откуда брать исходник
  const dx = Math.round(refCx * cw - (b.x0 + b.x1) / 2);
  const dy = Math.round(refCy * ch - (b.y0 + b.y1) / 2);
  const sx = Math.max(0, -dx), sy = Math.max(0, -dy);
  const left = Math.max(0, dx), top = Math.max(0, dy);
  const w = Math.min(b.W - sx, cw - left), h = Math.min(b.H - sy, ch - top);
  const piece = await sharp(f).extract({ left: sx, top: sy, width: w, height: h }).toBuffer();
  await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left, top }])
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(path.join(out, `pair-${name}.webp`));
}

for (const f of fs.readdirSync(out)) {
  const m = await sharp(path.join(out, f)).metadata();
  console.log(f.padEnd(26), `${m.width}x${m.height}`, (fs.statSync(path.join(out, f)).size / 1024 | 0) + 'KB');
}

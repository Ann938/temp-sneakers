// Проверка МВ на движке Safari (WebKit): меню, переходы, выбор, служебные
// страницы, тёмная тема, маленький телефон и планшет.
// node scripts/check-mobile.mjs <outDir>
import { webkit } from "playwright";
import path from "node:path";
import fs from "node:fs";

const out = process.argv[2] || "check-m";
fs.mkdirSync(out, { recursive: true });
const base = "http://localhost:3100";
const browser = await webkit.launch();
const errors = [];
const log = (...a) => console.log(...a);

async function open(w, h, theme = "light") {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.addInitScript((t) => localStorage.setItem("temp:theme", t), theme);
  return page;
}
const overflow = (p) =>
  p.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll("body *")].filter((el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width && r.right > W + 1 && st.visibility !== "hidden" && !el.closest("[data-stage]");
    });
    return { scroll: document.documentElement.scrollWidth > W, offenders: bad.slice(0, 5).map((e) => e.className || e.tagName) };
  });

// 1. Меню на 390
let p = await open(390, 844);
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.getByRole("button", { name: "Открыть меню" }).tap();
await p.waitForTimeout(700);
await p.screenshot({ path: path.join(out, "menu-open.jpg"), type: "jpeg", quality: 60 });
await p.locator("#mobile-menu").getByText("Преимущества").tap();
await p.waitForTimeout(2200);
log("menu -> features scrollY", await p.evaluate(() => Math.round(scrollY)));
await p.screenshot({ path: path.join(out, "menu-features.jpg"), type: "jpeg", quality: 60 });
await p.getByRole("button", { name: "Открыть меню" }).tap();
await p.waitForTimeout(600);
await p.locator("#mobile-menu").getByText("Выбрать пару").tap();
await p.waitForTimeout(2500);
await p.getByRole("radio", { name: "чёрный" }).tap();
await p.getByRole("radio", { name: "44" }).tap();
await p.waitForTimeout(800);
await p.screenshot({ path: path.join(out, "choose-black.jpg"), type: "jpeg", quality: 60 });
log("stored", await p.evaluate(() => localStorage.getItem("temp:order")));
log("overflow 390", JSON.stringify(await overflow(p)));
await p.close();

// 2. Тёмная тема, маленький телефон, планшет — по кадру на ключевых точках
for (const [w, h, theme] of [[390, 844, "dark"], [375, 667, "light"], [768, 1024, "light"]]) {
  p = await open(w, h, theme);
  await p.goto(base + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (const f of [0, 0.09, 0.2, 0.42, 0.62, 1]) {
    await p.evaluate((y) => scrollTo(0, y), Math.round(H * f));
    await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(out, `${w}x${h}-${theme}-${String(Math.round(f * 100)).padStart(3, "0")}.jpg`), type: "jpeg", quality: 55 });
  }
  log(`overflow ${w}x${h}`, JSON.stringify(await overflow(p)));
  await p.close();
}

// 3. Служебные страницы
p = await open(390, 844);
for (const page of ["contacts", "delivery"]) {
  await p.goto(`${base}/${page}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(out, `page-${page}.jpg`), type: "jpeg", quality: 60, fullPage: true });
  log(`overflow /${page}`, JSON.stringify(await overflow(p)));
}
await p.close();

log("errors:", errors.length ? errors.join("\n") : "none");
await browser.close();

// Проверка поведения главной: меню, тема, ресайз, быстрый/обратный скролл,
// выбор параметров, переходы со служебных страниц.
// node scripts/check.mjs <outDir>
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const out = process.argv[2] || "check";
fs.mkdirSync(out, { recursive: true });
const base = "http://localhost:3100";
const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
const shot = (n) => page.screenshot({ path: path.join(out, n + ".jpg"), type: "jpeg", quality: 60 });
const Y = () => page.evaluate(() => Math.round(scrollY));
const wait = (ms) => page.waitForTimeout(ms);
const log = (...a) => console.log(...a);

await page.goto(base + "/", { waitUntil: "networkidle" });
await wait(1200);

// 1. Меню
for (const [label, name] of [["Цвета и размеры", "nav-choose"], ["О кроссовках", "nav-about"], ["Преимущества", "nav-features"]]) {
  await page.getByRole("navigation", { name: "Разделы" }).getByText(label).click();
  await wait(2600);
  log(name, "scrollY", await Y());
  await shot(name);
}

// 2. Тема посреди сцены: положение и кадр не меняются
await page.mouse.move(720, 450);
await page.mouse.wheel(0, 1400);
await wait(1800);
const y0 = await Y();
await shot("theme-before");
await page.getByRole("switch", { name: "Тёмная тема" }).click();
await wait(900);
const y1 = await Y();
await shot("theme-after");
log("theme toggle scrollY", y0, "->", y1, y0 === y1 ? "OK" : "CHANGED");

// 3. Ресайз посреди сцены
await page.setViewportSize({ width: 1280, height: 760 });
await wait(1500);
await shot("resize-1280");
await page.setViewportSize({ width: 1680, height: 1050 });
await wait(1500);
await shot("resize-1680");
await page.setViewportSize({ width: 1440, height: 900 });
await wait(1500);

// 4. Быстрый скролл вниз и обратно
for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 900);
await wait(400);
await shot("fast-down-mid");
await wait(1800);
await shot("fast-down-settled");
for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -700);
await wait(1800);
await shot("reverse");
log("after reverse scrollY", await Y());

// 5. Выбор цвета и размера сохраняется
await page.getByRole("navigation", { name: "Разделы" }).getByText("Цвета и размеры").click();
await wait(2600);
await page.getByRole("radio", { name: "розовый" }).click();
await page.getByRole("radio", { name: "42" }).click();
await wait(700);
await shot("choose-pink-42");
await page.getByRole("link", { name: "Оформить заказ" }).click();
await page.waitForURL("**/checkout**");
await wait(600);
await shot("choose-to-checkout");
log("stored", await page.evaluate(() => localStorage.getItem("temp:order")));

// 6. Служебные страницы и возврат к разделу
for (const p of ["contacts", "delivery", "returns"]) {
  await page.goto(`${base}/${p}`, { waitUntil: "networkidle" });
  await wait(1600);
  await shot("page-" + p);
}
await page.getByRole("navigation", { name: "Разделы" }).getByText("Цвета и размеры").click();
await page.waitForURL("**/#choose");
await wait(2500);
await shot("from-page-to-choose");
log("from page -> choose scrollY", await Y(), "label:", await page.locator("legend").first().innerText());

log("errors:", errors.length ? errors.join("\n") : "none");
await browser.close();

// Проверка оформления заказа: ошибки, маска, промокод, успех; ДВ и МВ.
// node scripts/check-checkout.mjs <outDir>
import { chromium, webkit } from "playwright";
import path from "node:path";
import fs from "node:fs";
const out = process.argv[2] || "check-co";
fs.mkdirSync(out, { recursive: true });
const errors = [];
const shot = (p, n, full = false) => p.screenshot({ path: path.join(out, n + ".jpg"), type: "jpeg", quality: 60, fullPage: full });

for (const [name, engine, vp, theme] of [
  ["desk-light", chromium, { width: 1440, height: 900 }, "light"],
  ["desk-dark", chromium, { width: 1440, height: 900 }, "dark"],
  ["mob-light", webkit, { width: 390, height: 844 }, "light"],
]) {
  const b = await engine.launch(engine === chromium ? { executablePath: process.env.PW_CHROME } : {});
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: engine === webkit ? 2 : 1, hasTouch: engine === webkit });
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.addInitScript((t) => { localStorage.setItem("temp:theme", t); localStorage.setItem("temp:order", JSON.stringify({ color: "pink", size: 40 })); }, theme);
  await p.goto("http://localhost:3100/checkout", { waitUntil: "networkidle" });
  await p.waitForTimeout(1400);
  await shot(p, name + "-1-initial", true);
  await p.getByRole("button", { name: /Подтвердить заказ/ }).click();
  await p.waitForTimeout(900);
  await shot(p, name + "-2-errors");
  await p.getByLabel("Имя и фамилия").fill("Анна Смирнова");
  await p.getByLabel("Телефон").pressSequentially("9161234567");
  await p.getByRole("textbox", { name: "Почта" }).fill("anna@example.com");
  await p.getByText("Пункт выдачи", { exact: true }).click();
  await p.getByLabel("Город").fill("Москва");
  await p.getByLabel("Адрес пункта выдачи").fill("ул. Тверская, 7");
  await p.getByText("СБП", { exact: true }).click();
  await p.getByLabel("Промокод").fill("темп10");
  await p.getByRole("button", { name: "Применить" }).click();
  await p.getByRole("radio", { name: "лаймовый" }).click();
  await p.getByRole("button", { name: "Больше" }).click();
  await p.waitForTimeout(600);
  console.log(name, "phone:", await p.getByLabel("Телефон").inputValue(), "| total:", await p.locator("dl div:last-child dd").first().innerText());
  await shot(p, name + "-3-filled", true);
  await p.getByRole("button", { name: /Подтвердить заказ/ }).click();
  await p.waitForTimeout(2600);
  await shot(p, name + "-4-success");
  console.log(name, "lastOrder:", await p.evaluate(() => localStorage.getItem("temp:lastOrder")?.slice(0, 90)));
  console.log(name, "hscroll:", await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
  await b.close();
}
console.log("errors:", errors.length ? errors.join("\n") : "none");

"use client";

import { useEffect, useState } from "react";
import s from "./ThemeToggle.module.scss";

type Theme = "light" | "dark";

// «ТЕМП / Переключатель темы»: кроссовок-бегунок едет по дорожке.
// Тема меняется только атрибутом на <html> — геометрия страницы и прогресс
// сцен не трогаются, поэтому положение скролла сохраняется.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // тема уже выставлена скриптом в <head>, синхронизируемся с ней
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("temp:theme", next);
    } catch {}
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      className={s.toggle}
      data-dark={dark || undefined}
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label="Тёмная тема"
    >
      <svg className={`${s.icon} ${s.sun}`} viewBox="0 0 18 18" aria-hidden="true">
        <path d="M12 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path d="M9 1.5V3M9 15v1.5M1.5 9H3m12 0h1.5M3.75 3.75l1.125 1.125m8.25 8.25 1.125 1.125M3.75 14.25l1.125-1.125m8.25-8.25L14.25 3.75" strokeLinecap="round" />
      </svg>
      <svg className={`${s.icon} ${s.moon}`} viewBox="0 0 18 18" aria-hidden="true">
        <path
          d="M15 11.4a6.15 6.15 0 0 1-8.4-8.4 6.3 6.3 0 1 0 8.4 8.4Z"
          strokeLinejoin="round"
        />
      </svg>
      <span className={s.knob}>
        <svg viewBox="0 0 28 22" aria-hidden="true">
          <path
            d="M2.625 4.875C4.375 8.375 7.875 9.25 10.5 6.625L12.25 4.875L16.625 10.125L23.625 12.75C25.375 13.625 26.25 15.375 25.375 17.125H2.625C0.875 17.125 0.875 14.5 1.75 11.875L2.625 4.875Z"
            className={s.shoe}
          />
          <path
            d="M1.75 17.125H25.375M11.375 8.375L14 7.5M14 11L16.625 10.125M16.625 12.75L19.25 11.875"
            className={s.laces}
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  );
}

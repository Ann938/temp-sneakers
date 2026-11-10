"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { choose, colors, pairImage, sizes } from "@/content";
import { defaultOrder, getOrder, setOrder, subscribeOrder, type Order } from "@/lib/order";
import s from "./Choice.module.scss";

// Блок выбора цвета и размера. Параметры сохраняются сразу при выборе,
// страница /checkout забирает их из того же хранилища.
export default function Choice() {
  const [order, setLocal] = useState<Order>(defaultOrder);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(getOrder());
    return subscribeOrder(setLocal);
  }, []);

  // МВ: размеры листаются вбок — выбранный держим в видимой части ленты.
  // Двигаем только саму ленту, страницу не трогаем.
  const sizesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = sizesRef.current;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    const btn = row.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!btn) return;
    // позиция кнопки внутри ленты (offsetLeft считается от другого предка)
    const inRow = btn.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    const left = inRow - (row.clientWidth - btn.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [order.size]);

  const color = colors.find((c) => c.id === order.color) ?? colors[0];

  return (
    <div className={s.choice}>
      <h2 className={s.title} data-choice-title>
        {choose.title.map((l, i) => (
          <span key={l} className={s.titleLine}>
            {i > 0 && " "}
            {l}
          </span>
        ))}
      </h2>
      <div className={s.row}>
        <div className={s.controls} data-choice-controls>
          <div className={s.group} role="group" aria-labelledby="choice-color">
            <p className={s.label} id="choice-color">
              {choose.colorLabel}: <span className={s.value}>{color.label}</span>
            </p>
            <div className={s.swatches} role="radiogroup" aria-label={choose.colorLabel}>
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === order.color}
                  aria-label={c.label}
                  className={s.swatch}
                  style={{ "--swatch": c.swatch } as React.CSSProperties}
                  onClick={() => setOrder({ color: c.id })}
                />
              ))}
            </div>
          </div>

          <div className={s.group} role="group" aria-labelledby="choice-size">
            <p className={s.label} id="choice-size">{choose.sizeLabel}</p>
            <div className={s.sizes} role="radiogroup" aria-label={choose.sizeLabel} ref={sizesRef}>
              {sizes.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={n === order.size}
                  className={s.size}
                  onClick={() => setOrder({ size: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={s.slot} data-choice-slot>
          <div className={s.pair} data-choice-pair>
            {colors.map((c) => (
              <img
                key={c.id}
                src={pairImage(c.id)}
                alt={c.id === order.color ? `Кроссовки ТЕМП, ${c.label} цвет` : ""}
                aria-hidden={c.id !== order.color}
                data-active={c.id === order.color || undefined}
                decoding="async"
              />
            ))}
          </div>
        </div>

        {/* Кнопка — под фото пары (макет 445:646) */}
        <div className={s.actions} data-choice-controls>
          <Link href="/checkout" className={s.cta}>
            {choose.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

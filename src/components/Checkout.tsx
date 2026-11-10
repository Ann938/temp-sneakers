"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  checkout,
  colors,
  formatPrice,
  pairImage,
  sizes,
  type DeliveryId,
  type PaymentId,
} from "@/content";
import { defaultOrder, getOrder, setOrder, subscribeOrder, type Order } from "@/lib/order";
import s from "./Checkout.module.scss";

type Fields = { name: string; phone: string; email: string; city: string; address: string; comment: string };
type Errors = Partial<Record<keyof Fields | "agree", string>>;

// Маска телефона: +7 (999) 123-45-67
function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let out = "+7";
  if (p[0]) out += ` (${p[0]}`;
  if (p[0].length === 3) out += ")";
  if (p[1]) out += ` ${p[1]}`;
  if (p[2]) out += `-${p[2]}`;
  if (p[3]) out += `-${p[3]}`;
  return out;
}

function validate(f: Fields, delivery: DeliveryId, agree: boolean): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Как к вам обращаться?";
  if (f.phone.replace(/\D/g, "").length !== 11) e.phone = "Нужен номер из 10 цифр после +7";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Проверьте почту — сюда придёт номер заказа";
  if (f.city.trim().length < 2) e.city = "Укажите город";
  if (f.address.trim().length < 4)
    e.address = delivery === "pickup" ? "Укажите адрес пункта выдачи" : "Укажите улицу, дом и квартиру";
  if (!agree) e.agree = "Нужно согласие, чтобы оформить заказ";
  return e;
}

export default function Checkout() {
  const [order, setLocal] = useState<Order>(defaultOrder);
  const [qty, setQty] = useState(1);
  const [delivery, setDelivery] = useState<DeliveryId>("courier");
  const [payment, setPayment] = useState<PaymentId>("card");
  const [fields, setFields] = useState<Fields>({ name: "", phone: "", email: "", city: "", address: "", comment: "" });
  const [agree, setAgree] = useState(true);
  const [touched, setTouched] = useState<Partial<Record<keyof Errors, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<"none" | "ok" | "bad">("none");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | { number: string; total: number }>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [jump, setJump] = useState(0);

  useEffect(() => {
    if (!jump) return;
    const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    if (!first) return;
    first.focus({ preventScroll: true });
    const y = first.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }, [jump]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(getOrder());
    return subscribeOrder(setLocal);
  }, []);

  const color = colors.find((c) => c.id === order.color) ?? colors[0];
  const opt = checkout.delivery.find((d) => d.id === delivery)!;

  const sum = useMemo(() => {
    const goods = checkout.price * qty;
    const discount = promo === "ok" ? Math.round((goods * checkout.promo.percent) / 100) : 0;
    const ship = opt.free && goods - discount >= checkout.freeFrom ? 0 : opt.price;
    return { goods, discount, ship, total: goods - discount + ship };
  }, [qty, promo, opt]);

  const errors = validate(fields, delivery, agree);
  const show = (k: keyof Errors) => (submitted || touched[k]) && errors[k];
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: k === "phone" ? formatPhone(e.target.value) : e.target.value }));
  const blur = (k: keyof Errors) => () => setTouched((t) => ({ ...t, [k]: true }));

  const applyPromo = () => {
    if (!promoInput.trim()) return;
    setPromo(promoInput.trim().toUpperCase() === checkout.promo.code ? "ok" : "bad");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      // ведём к первому полю с ошибкой — после отрисовки, когда поля уже помечены
      setJump((n) => n + 1);
      return;
    }
    setSending(true);
    // Отправки на сервер пока нет: заказ сохраняется локально для демонстрации
    window.setTimeout(() => {
      const number = "TMP-" + Date.now().toString(36).slice(-6).toUpperCase();
      try {
        localStorage.setItem(
          "temp:lastOrder",
          JSON.stringify({ number, ...order, qty, delivery, payment, ...fields, total: sum.total, at: new Date().toISOString() }),
        );
      } catch {}
      setDone({ number, total: sum.total });
      setSending(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  };

  if (done) {
    return (
      <section className={s.success} aria-live="polite">
        <div className={s.successVisual} aria-hidden="true">
          <span className={s.disc} />
          <img src={pairImage(order.color)} alt="" className={s.successPair} />
          <span className={s.check}>
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        </div>
        <span className={s.eyebrow}>№ {done.number}</span>
        <h1 className={s.title}>
          {checkout.success.title.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </h1>
        <p className={s.lead}>{checkout.success.lead}</p>
        <dl className={s.successList}>
          <div>
            <dt>Пара</dt>
            <dd>
              {color.label}, {order.size} · {qty} шт.
            </dd>
          </div>
          <div>
            <dt>Доставка</dt>
            <dd>
              {opt.title}, {opt.time}
            </dd>
          </div>
          <div>
            <dt>Итого</dt>
            <dd>{formatPrice(done.total)}</dd>
          </div>
        </dl>
        <Link href="/" className={s.submit}>
          {checkout.success.back}
        </Link>
      </section>
    );
  }

  return (
    <div className={s.layout}>
      <div className={s.head}>
        <span className={s.eyebrow}>Шаг к первой пробежке</span>
        <h1 className={s.title}>
          {checkout.title.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </h1>
        <p className={s.lead}>{checkout.lead}</p>
      </div>

      {/* ---- Карточка заказа ---- */}
      <aside className={s.summary} aria-label="Ваш заказ">
        <div className={s.card}>
          <div className={s.pairStage}>
            <span className={s.pairGlow} aria-hidden="true" />
            {colors.map((c) => (
              <img
                key={c.id}
                src={pairImage(c.id)}
                alt={c.id === order.color ? `Кроссовки ТЕМП, ${c.label}` : ""}
                aria-hidden={c.id !== order.color}
                data-active={c.id === order.color || undefined}
              />
            ))}
          </div>

          <div className={s.product}>
            <div>
              <p className={s.productName}>Кроссовки ТЕМП</p>
              <p className={s.productMeta}>
                {color.label}, размер {order.size}
              </p>
            </div>
            <p className={s.productPrice}>{formatPrice(checkout.price)}</p>
          </div>

          <div className={s.tweak}>
            <div className={s.miniSwatches} role="radiogroup" aria-label="Цвет">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === order.color}
                  aria-label={c.label}
                  className={s.miniSwatch}
                  style={{ "--swatch": c.swatch } as React.CSSProperties}
                  onClick={() => setOrder({ color: c.id })}
                />
              ))}
            </div>
            <label className={s.sizeSelect}>
              <span className="visually-hidden">Размер</span>
              <select value={order.size} onChange={(e) => setOrder({ size: Number(e.target.value) })}>
                {sizes.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className={s.qty} aria-label="Количество">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Меньше">
                −
              </button>
              <output aria-live="polite">{qty}</output>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(checkout.maxQty, q + 1))}
                disabled={qty >= checkout.maxQty}
                aria-label="Больше"
              >
                +
              </button>
            </div>
          </div>

          <div className={s.promo} data-state={promo}>
            <input
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value);
                if (promo !== "none") setPromo("none");
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
              placeholder="Промокод"
              aria-label="Промокод"
            />
            <button type="button" onClick={applyPromo}>
              {promo === "ok" ? "✓" : "Применить"}
            </button>
            <span className={s.promoNote} aria-live="polite">
              {promo === "ok" && `Скидка ${checkout.promo.percent}% применена`}
              {promo === "bad" && "Такого промокода нет"}
            </span>
          </div>

          <dl className={s.totals}>
            <div>
              <dt>Товары, {qty} шт.</dt>
              <dd>{formatPrice(sum.goods)}</dd>
            </div>
            {sum.discount > 0 && (
              <div className={s.discount}>
                <dt>Скидка</dt>
                <dd>−{formatPrice(sum.discount)}</dd>
              </div>
            )}
            <div>
              <dt>Доставка</dt>
              <dd>{sum.ship === 0 ? "Бесплатно" : formatPrice(sum.ship)}</dd>
            </div>
            <div className={s.total}>
              <dt>Итого</dt>
              <dd>{formatPrice(sum.total)}</dd>
            </div>
          </dl>
        </div>
      </aside>

      {/* ---- Форма ---- */}
      <form ref={formRef} className={s.form} onSubmit={onSubmit} noValidate>
        <section className={s.step}>
          <h2 className={s.stepTitle}>
            {checkout.steps.contacts}
          </h2>
          <div className={s.grid2}>
            <Field label="Имя и фамилия" value={fields.name} onChange={set("name")} onBlur={blur("name")} error={show("name")} autoComplete="name" />
            <Field
              label="Телефон"
              value={fields.phone}
              onChange={set("phone")}
              onBlur={blur("phone")}
              error={show("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 (___) ___-__-__"
            />
            <Field
              label="Почта"
              value={fields.email}
              onChange={set("email")}
              onBlur={blur("email")}
              error={show("email")}
              type="email"
              autoComplete="email"
              wide
            />
          </div>
        </section>

        <section className={s.step}>
          <h2 className={s.stepTitle}>
            {checkout.steps.delivery}
          </h2>
          <div className={s.options} role="radiogroup" aria-label={checkout.steps.delivery}>
            {checkout.delivery.map((d) => {
              const free = d.free && sum.goods - sum.discount >= checkout.freeFrom;
              return (
                <label key={d.id} className={s.option} data-checked={delivery === d.id || undefined}>
                  <input type="radio" name="delivery" checked={delivery === d.id} onChange={() => setDelivery(d.id)} />
                  <span className={s.optionTop}>
                    <b>{d.title}</b>
                    <em>{free ? "Бесплатно" : formatPrice(d.price)}</em>
                  </span>
                  <span className={s.optionTime}>{d.time}</span>
                  <span className={s.optionNote}>{d.note}</span>
                </label>
              );
            })}
          </div>
          <div className={s.grid2}>
            <Field label="Город" value={fields.city} onChange={set("city")} onBlur={blur("city")} error={show("city")} autoComplete="address-level2" />
            <Field
              label={delivery === "pickup" ? "Адрес пункта выдачи" : "Улица, дом, квартира"}
              value={fields.address}
              onChange={set("address")}
              onBlur={blur("address")}
              error={show("address")}
              autoComplete="street-address"
            />
          </div>
        </section>

        <section className={s.step}>
          <h2 className={s.stepTitle}>
            {checkout.steps.payment}
          </h2>
          <div className={s.options} role="radiogroup" aria-label={checkout.steps.payment}>
            {checkout.payment.map((p) => (
              <label key={p.id} className={s.option} data-checked={payment === p.id || undefined}>
                <input type="radio" name="payment" checked={payment === p.id} onChange={() => setPayment(p.id)} />
                <span className={s.optionTop}>
                  <b>{p.title}</b>
                </span>
                <span className={s.optionNote}>{p.note}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={s.step}>
          <h2 className={s.stepTitle}>
            {checkout.steps.comment}
          </h2>
          <Field label="Комментарий курьеру или пожелания" value={fields.comment} onChange={set("comment")} multiline />
          <label className={s.agree} data-error={show("agree") ? true : undefined}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              aria-invalid={Boolean(show("agree"))}
            />
            <span className={s.box} aria-hidden="true" />
            <span>{checkout.agree}</span>
          </label>
          {show("agree") && <p className={s.error}>{errors.agree}</p>}
        </section>

        {/* На МВ — закреплённая панель с суммой и кнопкой */}
        <div className={s.submitBar}>
          <div className={s.submitTotal}>
            <span>Итого</span>
            <b>{formatPrice(sum.total)}</b>
          </div>
          <button type="submit" className={s.submit} data-sending={sending || undefined} disabled={sending}>
            {sending ? "Отправляем…" : checkout.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

// Поле с «плавающей» подписью: внутри поля, при вводе уезжает наверх
function Field({
  label,
  error,
  wide,
  multiline,
  ...rest
}: {
  label: string;
  error?: string | false;
  wide?: boolean;
  multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useMemo(() => "f-" + label.replace(/\s+/g, "-"), [label]);
  const props = { id, placeholder: rest.placeholder ?? " ", "aria-invalid": Boolean(error), "aria-describedby": error ? id + "-e" : undefined };
  return (
    <div className={s.field} data-wide={wide || multiline || undefined} data-error={error ? true : undefined}>
      {multiline ? (
        <textarea {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} {...props} rows={3} />
      ) : (
        <input {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} {...props} />
      )}
      <label htmlFor={id}>{label}</label>
      {error && (
        <p className={s.error} id={id + "-e"}>
          {error}
        </p>
      )}
    </div>
  );
}

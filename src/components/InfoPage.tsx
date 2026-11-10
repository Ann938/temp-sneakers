import Link from "next/link";
import { pages, type PageKey } from "@/content";
import Footer from "./Footer";
import Header from "./Header";
import s from "./InfoPage.module.scss";

// Служебные страницы в стиле главной: крупный заголовок, кроссовок-герой
// в «предметной» подаче и карточки с фактами. Появление — на CSS, без JS.
export default function InfoPage({ page }: { page: PageKey }) {
  const p = pages[page];

  return (
    <>
      <Header />
      <main className={s.main}>
        <section className={s.hero}>
          <div className={s.copy}>
            <span className={s.eyebrow}>{p.eyebrow}</span>
            <h1 className={s.title}>
              {p.title.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </h1>
            <p className={s.lead}>{p.lead}</p>
            <Link href="/#choose" className={s.cta}>
              Выбрать свою пару
            </Link>
          </div>
          <div className={s.visual} aria-hidden="true">
            <span className={s.disc} />
            <img src={p.image} alt="" className={s.shoe} />
          </div>
        </section>

        <ul className={s.cards}>
          {p.cards.map((c, i) => {
            const body = (
              <>
                <span className={s.cardLabel}>{c.label}</span>
                <span className={s.cardValue}>{c.value}</span>
                <span className={s.cardNote}>{c.note}</span>
              </>
            );
            const href = "href" in c ? c.href : undefined;
            return (
              <li key={c.label} className={s.card} style={{ "--i": i } as React.CSSProperties}>
                {href ? (
                  <a href={href} className={s.cardInner}>
                    {body}
                    <span className={s.arrow}>↗</span>
                  </a>
                ) : (
                  <div className={s.cardInner}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </>
  );
}

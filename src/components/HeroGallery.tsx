import { gallery, hero } from "@/content";
import { SectionLink } from "./Header";
import s from "./HeroGallery.module.scss";

// Сколько карточек стоит в закреплённом экране на МВ (два ряда по две)
const MOBILE_IN_STAGE = 4;

// Сцена 1: первый экран → галерея «Одна пара, больше планов».
// Оба состояния свёрстаны слоями в одном экране, который закрепляется на
// время перехода. Фото бегуньи — отдельный «летящий» слой: оно расширяется
// почти на весь экран и садится в первую карточку галереи.
// Слоты (data-*-slot) статичны: по ним сцена меряет точную геометрию.
export default function HeroGallery() {
  return (
    <section className={s.scene} data-scene="hero" aria-label="О кроссовках">
      <div className={s.stage} data-stage>
        <div className={s.hero}>
          <div className={s.heroText} data-hero-text>
            <h1 className={s.title}>
              {hero.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className={s.lead}>{hero.lead}</p>
            <SectionLink to="choose" className={s.cta}>
              {hero.cta}
            </SectionLink>
          </div>
          <div className={s.heroSlot} data-hero-slot>
            {/* Статичное фото: видно сразу и без скриптов. Сцена прячет его
                и подменяет летящим слоем ровно в той же геометрии. */}
            <img src={hero.image.src} alt={hero.image.alt} fetchPriority="high" data-hero-static />
          </div>
        </div>

        <div className={s.gallery}>
          <div className={s.galleryHead} data-gallery-head>
            <h2 className={s.h2}>{gallery.title}</h2>
            <p className={s.lead}>{gallery.lead}</p>
          </div>
          <ul className={s.grid}>
            {gallery.cards.map((c, i) => (
              <li
                key={c.src + i}
                className={s.card}
                data-card={i}
                data-card-slot={i === 0 || undefined}
                data-desk-only={i >= MOBILE_IN_STAGE || undefined}
              >
                {i > 0 && <img src={c.src} alt={c.alt} loading="eager" decoding="async" />}
                {i === 0 && <span className="visually-hidden">{c.alt}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className={s.flyer} data-flyer aria-hidden="true">
          <img src={hero.image.src} alt="" data-flyer-img />
        </div>
      </div>

      {/* МВ: на экран помещаются два ряда галереи, остальные идут следом
          обычным скроллом — продолжением той же сетки */}
      <ul className={s.more} aria-hidden="true">
        {gallery.cards.slice(MOBILE_IN_STAGE).map((c) => (
          <li key={c.src} className={s.card} data-more-card>
            <img src={c.src} alt="" loading="lazy" decoding="async" />
          </li>
        ))}
      </ul>
    </section>
  );
}

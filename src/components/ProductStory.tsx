import { features, finale, firstStep } from "@/content";
import Choice from "./Choice";
import s from "./ProductStory.module.scss";

// Сцена 2: «Лёгкость» → предметная съёмка → финал → выбор пары.
// Всё — слои одного закреплённого экрана. Камера «подъезжает» к шагу на фото,
// фото растворяется, и на его месте остаётся тот же кроссовок без фона.
// Дальше обувь меняет ракурсы, тексты сменяют друг друга по сторонам,
// а в конце пара уменьшается и садится в блок выбора.
export default function ProductStory() {
  return (
    <section className={s.scene} data-scene="story" aria-label="Преимущества">
      <div className={s.stage} data-stage>
        {/* ---- 0. Лёгкость, которую чувствуешь ---- */}
        <div className={s.step}>
          <div className={s.copy} data-step-text>
            <h2 className={s.h2}>
              {firstStep.title.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </h2>
            <p className={s.lead}>{firstStep.lead}</p>
          </div>
          <div className={s.stepSlot}>
            <img src={firstStep.image.src} alt={firstStep.image.alt} data-step-photo />
          </div>
        </div>

        {/* ---- Обувь: один слой на ракурс ---- */}
        <div className={s.shoes} aria-hidden="true">
          {features.map((f) => (
            <img key={f.id} className={s.shoe} src={f.image.src} alt="" data-shoe={f.id} decoding="async" />
          ))}
          <img className={s.shoe} src={finale.image.src} alt="" data-shoe="front" decoding="async" />
        </div>

        {/* ---- Тексты состояний ---- */}
        <div className={s.copies}>
          {features.map((f) => (
            <div key={f.id} className={s.copyPos} data-side={f.side}>
              <div className={s.copy} data-copy={f.id}>
                <h2 className={s.h2}>
                  {f.title.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </h2>
                <p className={s.lead}>{f.lead}</p>
              </div>
            </div>
          ))}
          <h2 className={s.words} aria-label={finale.words.join(" ")}>
            <span data-word="left">{finale.words[0]}</span>
            <span data-word="right">{finale.words[1]}</span>
          </h2>
        </div>

        {/* ---- Финал: выбор пары ---- */}
        <div className={s.choice} data-choice>
          <Choice />
        </div>
      </div>
    </section>
  );
}

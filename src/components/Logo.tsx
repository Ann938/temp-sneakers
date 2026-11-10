import s from "./Logo.module.scss";

// «ТЕМП / логотип» из Figma. Знак перерисован в currentColor, чтобы
// работать в обеих темах (в исходном SVG была светлая подложка).
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`${s.logo} ${className}`}>
      <svg className={s.mark} viewBox="0 0 47.0769 36" aria-hidden="true">
        <path
          d="M0 8.58462L2.82462 3.64154C3.60923 2.22923 4.94308 1.52308 6.82615 1.52308H46.1354L40.2508 9.29077H27.7754L19.0662 20.3538C16.5554 22.8646 13.1815 24.7477 8.94462 26.0031L15.5354 9.29077H0V8.58462Z"
          fill="currentColor"
        />
        <path
          className={s.swoosh}
          d="M4.00152 34.0062C7.76768 27.6508 13.1815 25.5323 23.0677 22.4723C33.66 19.1769 38.3677 17.2938 40.7215 13.5277C40.7215 20.1185 35.5431 24.12 25.8923 26.9446C15.3 30.0046 8.23845 29.7692 4.00152 34.0062Z"
          fill="currentColor"
        />
      </svg>
      <span className={s.word}>ТЕМП</span>
    </span>
  );
}

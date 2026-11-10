"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { BASE_PATH, headerCta, nav, type SectionKey } from "@/content";
import { scrollToSection } from "@/lib/scroll";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import s from "./Header.module.scss";

// Ссылки ведут на /#раздел: со служебных страниц это обычный переход,
// а на главной клик перехватывается и страница едет к точке внутри сцены.
export function SectionLink({
  to,
  className,
  children,
  onNavigate,
}: {
  to: SectionKey;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const onClick = (e: MouseEvent) => {
    onNavigate?.();
    if (scrollToSection(to)) {
      e.preventDefault();
      history.replaceState(null, "", `#${to}`);
    }
  };
  return (
    <a href={`${BASE_PATH}/#${to}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Открытое меню: страница под ним не прокручивается, Esc закрывает
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className={s.header} data-open={open || undefined}>
      <div className={s.inner}>
        <Link href="/" className={s.logo} aria-label="ТЕМП — на главную" onClick={close}>
          <Logo />
        </Link>
        <nav className={s.nav} aria-label="Разделы">
          {nav.map((n) => (
            <SectionLink key={n.key} to={n.key} className={s.link}>
              {n.label}
            </SectionLink>
          ))}
        </nav>
        <div className={s.actions}>
          <ThemeToggle />
          <SectionLink to="choose" className={s.cta}>
            {headerCta}
          </SectionLink>
          <button
            type="button"
            className={s.burger}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* МВ · меню открыто */}
      <div className={s.menu} id="mobile-menu" aria-hidden={!open} inert={!open}>
        <nav className={s.menuNav} aria-label="Разделы">
          {nav.map((n, i) => (
            <SectionLink
              key={n.key}
              to={n.key}
              className={s.menuLink}
              onNavigate={close}
            >
              <span style={{ "--i": i } as React.CSSProperties}>{n.label}</span>
            </SectionLink>
          ))}
        </nav>
        <SectionLink to="choose" className={s.menuCta} onNavigate={close}>
          {headerCta}
        </SectionLink>
      </div>
      <button type="button" className={s.scrim} aria-hidden="true" tabIndex={-1} onClick={close} />
    </header>
  );
}

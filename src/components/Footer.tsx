import Link from "next/link";
import { footer } from "@/content";
import Logo from "./Logo";
import s from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={s.footer}>
      <Link href="/" className={s.logo} aria-label="ТЕМП — на главную">
        <Logo />
      </Link>
      <nav className={s.links} aria-label="Информация">
        {footer.links.map((l) => (
          <Link key={l.href} href={l.href} className={s.link}>
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}

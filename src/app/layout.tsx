import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { asset, site } from "@/content";
import "@/styles/globals.scss";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN || "http://localhost:3100"),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  keywords: ["кроссовки", "беговые кроссовки", "трикотажные кроссовки", "ТЕМП", "амортизация"],
  openGraph: {
    title: site.title,
    description: site.description,
    type: "website",
    locale: "ru_RU",
    images: [{ url: asset("/img/pair-front.webp"), width: 1536, height: 1024, alt: "Кроссовки ТЕМП" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#101819" },
  ],
};

// Тема ставится до первой отрисовки, иначе тёмная тема мигает светлой.
// При первом визите — тёмная; дальше сайт помнит выбор посетителя.
const themeScript = `(function(){try{var t=localStorage.getItem('temp:theme');if(t!=='light'&&t!=='dark'){t='dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

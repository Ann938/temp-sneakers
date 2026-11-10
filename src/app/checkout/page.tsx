import type { Metadata } from "next";
import Checkout from "@/components/Checkout";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { checkout } from "@/content";
import s from "./page.module.scss";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: checkout.lead,
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <Header />
      <main className={s.main}>
        <Checkout />
      </main>
      <Footer />
    </>
  );
}

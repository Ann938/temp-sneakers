import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroGallery from "@/components/HeroGallery";
import Motion from "@/components/Motion";
import ProductStory from "@/components/ProductStory";
import { asset, site } from "@/content";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Кроссовки ТЕМП",
  description: site.description,
  brand: { "@type": "Brand", name: "ТЕМП" },
  image: [asset("/img/pair-front.webp"), asset("/img/shoe-profile.webp")],
  color: "белый, розовый, лаймовый, чёрный, оранжевый",
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroGallery />
        <ProductStory />
      </main>
      <Footer />
      <Motion />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

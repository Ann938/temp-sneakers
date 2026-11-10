import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { pages } from "@/content";

export const metadata: Metadata = {
  title: "Возврат",
  description: pages.returns.lead,
};

export default function Page() {
  return <InfoPage page="returns" />;
}

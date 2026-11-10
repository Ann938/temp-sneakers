import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { pages } from "@/content";

export const metadata: Metadata = {
  title: "Контакты",
  description: pages.contacts.lead,
};

export default function Page() {
  return <InfoPage page="contacts" />;
}

import { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import AboutClient from "./AboutClient";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "About DevBhakti | Bridging Tradition and Technology",
    description: "Learn more about DevBhakti.in — the digital platform connecting devotees with temples for seamless pooja and seva bookings.",
    keywords: "about devbhakti, temple technology, digital pooja booking, spiritual platform India",
  };

  return getPageMetadata("about", fallback);
}

export default function AboutPage() {
  return <AboutClient />;
}

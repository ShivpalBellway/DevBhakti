import React from "react";
import PoojaListClient from "./PoojaListClient";
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Poojas & Sevas | DevBhakti - Sacred Rituals at Holy Temples",
    description: "Explore and book authentic Vedic poojas, aartis and sevas at India's most sacred temples through DevBhakti.",
    keywords: "pooja booking, online seva, vedic rituals, temple services India, book aarti online",
  };

  return getPageMetadata("poojas", fallback);
}

const PoojasPage = () => {
  return <PoojaListClient />;
};

export default PoojasPage;

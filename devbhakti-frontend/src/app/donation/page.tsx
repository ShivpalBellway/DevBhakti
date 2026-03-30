import { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import DonationClient from "./DonationClient";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Donate to Temples - DevBhakti",
    description: "Support your favorite temples with a heartfelt donation. Every contribution helps maintain sacred spaces and continue divine services.",
    keywords: "temple donation, donate online, sacred temples, spiritual giving, Hindu temple support",
  };

  return getPageMetadata("donation", fallback);
}

export default function DonationPage() {
  return <DonationClient />;
}

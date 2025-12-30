import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BannerSection from "@/components/landing/BannerSection";
import TemplesSection from "@/components/landing/TemplesSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PoojasSection from "@/components/landing/PoojasSection";
import MarketplaceSection from "@/components/landing/MarketplaceSection";
import LiveDarshanSection from "@/components/landing/LiveDarshanSection";
import TrustSection from "@/components/landing/TrustSection"; // Added this import
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DevBhakti - Your Digital Gateway to Divine Experiences",
  description: "Discover temples, book poojas, watch live darshan, explore sacred marketplace, and stay connected with your favorite institutions — all in one platform.",
  keywords: "temple booking, live darshan, pooja booking, spiritual marketplace, Hindu temples, online darshan, temple donations",
  alternates: {
    canonical: "https://devbhakti.com",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <BannerSection />
      <TemplesSection />
      <FeaturesSection />
      <PoojasSection />
      <LiveDarshanSection />
      <TrustSection />
      <MarketplaceSection />
      <CTASection />
      <Footer />
    </main>
  );
}

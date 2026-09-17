import { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MazaGaneshaFormClient from "@/components/mandals/MazaGaneshaFormClient";

export const metadata: Metadata = {
  title: "Thank You - Entry Submitted | DevBhakti",
  description: "Thank you for participating in the festive contest on DevBhakti.",
};

export default async function ThankYouPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fdf8f0]">
      <Navbar isSolid />
      <MazaGaneshaFormClient slug={slug} isThankYouPage={true} />
      <Footer />
    </main>
  );
}

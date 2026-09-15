import { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MazaGaneshaClient from "@/components/mandals/MazaGaneshaClient";

export const metadata: Metadata = {
  title: "Festive Contest – DevBhakti",
  description: "Participate in festive contests by DevBhakti. Share and win exciting prizes.",
};

export default async function DynamicCampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fdf8f0]">
        <Navbar isSolid />
        <MazaGaneshaClient slug={slug} />
        <Footer />
    </main>
  );
}

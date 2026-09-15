import { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MazaGaneshaFormClient from "@/components/mandals/MazaGaneshaFormClient";

export const metadata: Metadata = {
  title: "Participate - Contest Entry | DevBhakti",
  description: "Submit your entry for the festive contest. Upload photos, share your details, and win exciting prizes on DevBhakti.",
};

export default async function ParticipatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fdf8f0]">
      <Navbar isSolid />
      <MazaGaneshaFormClient slug={slug} />
      <Footer />
    </main>
  );
}

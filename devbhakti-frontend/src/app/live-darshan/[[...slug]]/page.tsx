import { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import LiveDarshanClient from "./LiveDarshanClient";
import axios from "axios";
import { API_URL } from "@/config/apiConfig";

export async function generateMetadata({ params }: { params: { slug?: string[] } }): Promise<Metadata> {
  const slug = params.slug?.[0];
  
  const fallback: Metadata = {
    title: "Live Darshan | Experience Divine Rituals in Real-Time",
    description: "Watch live darshan from sacred temples across India. Participate in aarti, witness rituals, and receive divine blessings from the comfort of your home.",
    keywords: "live darshan, online aarti, temple live stream, spiritual experience",
  };

  // If no slug is provided (base /live-darshan page), use CMS tags
  if (!slug) {
    return getPageMetadata("live-darshan", fallback);
  }

  // If a slug is provided, try to fetch temple details for specific metadata
  try {
    const res = await axios.get(`${API_URL}/temples`);
    if (res.data.success) {
      const temples = res.data.data;
      const temple = temples.find((t: any) => t.slug === slug || t.id === slug || t._id === slug);
      
      if (temple) {
        return {
          title: `Live Darshan of ${temple.name} | DevBhakti`,
          description: `Experience the divine presence with the live darshan of ${temple.name} in ${temple.location}. Watch sacred rituals and aarti live.`,
          keywords: `${temple.name} live darshan, ${temple.location} temple live, live aarti ${temple.name}`,
          openGraph: {
            title: `Live Darshan of ${temple.name}`,
            description: `Watch sacred rituals live from ${temple.name}.`,
          }
        };
      }
    }
  } catch (error) {
    console.error("[SEO] Live Darshan metadata error:", error);
  }

  return fallback;
}

export default function LiveDarshanPage() {
  return <LiveDarshanClient />;
}

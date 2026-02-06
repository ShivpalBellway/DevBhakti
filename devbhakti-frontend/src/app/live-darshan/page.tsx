"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, MapPin, Users, Heart, Share2, Calendar } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import axios from "axios";
import { API_URL, BASE_URL } from "@/config/apiConfig";

// Helper to convert any YouTube URL to Embed format
const getEmbedUrl = (url: string) => {
  if (!url) return "";
  try {
    // Handle standard watch URLs
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    // 0. Handle raw Channel ID (Direct ID input)
    // Example: UCfm7YHik2xfIAbvwBKWoVNw
    if (url.trim().startsWith("UC") && !url.includes("/") && !url.includes(".")) {
      return `https://www.youtube.com/embed/live_stream?channel=${url.trim()}`;
    }

    // 1. Handle Channel URL for Permanent Live Link (e.g. youtube.com/channel/UC...)
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/");
    }
    // Handle live stream direct links if they are not embed formatted
    if (!url.includes("embed") && url.includes("youtube.com")) {
      // Best effort for other formats or return as is if already embed
      return url;
    }
    return url;
  } catch (e) {
    return url;
  }
};

export default function LiveDarshanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LiveDarshanContent />
    </Suspense>
  );
}

function LiveDarshanContent() {
  const [temples, setTemples] = useState<any[]>([]);
  const [selectedTemple, setSelectedTemple] = useState<any>(null);
  const [isLikeActive, setIsLikeActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // Fetch Live Temples
  useEffect(() => {
    const fetchLiveTemples = async () => {
      try {
        const res = await axios.get(`${API_URL}/temples`);
        if (res.data.success) {
          // Filter:
          // - Temple side ne Live ON kiya ho (isLive)
          // - YouTube live URL resolve hua ho (liveUrl)
          // - Admin ne website visibility ke liye approve kiya ho (liveStatus)
          const liveTemples = res.data.data.filter(
            (t: any) => (t.isLive || t.liveUrl) && t.liveStatus
          );

          if (liveTemples.length > 0) {
            setTemples(liveTemples);

            const paramId = searchParams.get('templeId');
            const matched = paramId ? liveTemples.find((t: any) => t.id === paramId || t._id === paramId) : null;

            setSelectedTemple(matched || liveTemples[0]);
            setIsPlaying(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch live temples", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveTemples();
  }, [searchParams]);

  const handleTempleClick = (temple: any) => {
    setSelectedTemple(temple);
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper to safely get full Image URL
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder-temple.jpg";
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sacred"></div>
      </div>
    );
  }

  if (!selectedTemple) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center p-10 mt-20">
          <h2 className="text-3xl font-bold mb-4">No Live Darshans Currently</h2>
          <p className="text-muted-foreground">Please check back later for live aartis and darshans.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-sacred/30">
      <Navbar />

      <main className="relative pb-20 pt-20 overflow-x-hidden">
        {/* FULL WIDTH HERO VIDEO SECTION */}
        <section className="relative w-full h-[60vh] md:h-[85vh] bg-black overflow-hidden group">

          {/* Video Player or Thumbnail */}
          <div className="absolute inset-0 z-0">
            {isPlaying && selectedTemple.liveUrl ? (
              <iframe
                src={`${getEmbedUrl(selectedTemple.liveUrl)}?autoplay=1&mute=0&controls=1&rel=0`}
                title="Live Darshan"
                className="w-full h-full object-cover"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <>
                <Image
                  src={getImageUrl(selectedTemple.image)}
                  alt={selectedTemple.name}
                  fill
                  className="object-cover opacity-90"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
              </>
            )}
          </div>

          {/* Overlay Content Container (Hidden if playing? No, keep it subtle or hide on interaction) */}
          {/* Only show overlay if NOT playing OR if user hovers/pauses (can't easily detect pause on iframe) */}
          {/* We will overlay it but make it pointer-events-none so clicking passes to iframe if playing */}

          <div className={`absolute inset-0 container px-4 flex flex-col justify-between py-10 z-10 pointer-events-none ${isPlaying ? 'opacity-0 hover:opacity-100 transition-opacity duration-300' : ''}`}>

            {/* Top Header Info (Overlay) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-red-600 hover:bg-red-600 border-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" /> LIVE
                  </Badge>
                  {selectedTemple.viewers && (
                    <Badge className="bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium">
                      <Users size={14} /> {selectedTemple.viewers} Viewers
                    </Badge>
                  )}
                </div>
              </motion.div>

              {/* Upcoming Event Badge */}
              <div className="hidden md:block pointer-events-none">
                {/* Can add dynamic next aarti if available in backend */}
              </div>
            </div>

            {/* Center Play Button (Only if NOT playing) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(true)}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-sacred/90 flex items-center justify-center cursor-pointer shadow-[0_0_50px_rgba(255,107,0,0.6)] backdrop-blur-md border-2 border-white/20 z-20 pointer-events-auto"
                >
                  <Play className="fill-white text-white ml-2" size={48} />
                </motion.div>
              </div>
            )}

            {/* Bottom Info (Location & Full Name) */}
            <div className="pointer-events-auto bg-gradient-to-t from-black via-black/50 to-transparent p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2 text-white/90">
                <MapPin className="text-sacred" size={24} />
                <span className="text-xl font-medium tracking-wide uppercase shadow-black drop-shadow-lg">{selectedTemple.location}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-2xl opacity-90">{selectedTemple.name}</h2>
            </div>

          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 mt-12">
          {/* Sub-Action Bar (Moved below hero) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            <div className="lg:col-span-7">
              <h3 className="text-3xl font-bold mb-4">About the Darshan</h3>
              <p className="text-foreground text-lg leading-relaxed">{selectedTemple.description}</p>
            </div>
            <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-4">
              <Button
                variant="outline"
                className={`h-14 px-8 rounded-xl gap-2 text-lg transition-all border-2 ${isLikeActive ? "bg-red-50 text-red-500 border-red-200" : "bg-transparent border-input hover:bg-accent"}`}
                onClick={() => setIsLikeActive(!isLikeActive)}
              >
                <Heart className={isLikeActive ? "fill-red-500 text-red-500" : ""} size={24} />
                {isLikeActive ? "Liked" : "Like"}
              </Button>
              <Button variant="secondary" className="h-14 px-6 rounded-xl">
                <Share2 size={24} />
              </Button>
            </div>
          </div>

          {/* HORIZONTAL TEMPLE SELECTOR */}
          {temples.length > 1 && (
            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-foreground">
                  <span className="w-10 h-1 bg-sacred rounded-full" /> Other Living Sanctuaries
                </h3>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar py-4">
                {temples.map((temple, idx) => (
                  <motion.div
                    key={temple.id}
                    whileHover={{ y: -10 }}
                    onClick={() => handleTempleClick(temple)}
                    className={`min-w-[300px] md:min-w-[360px] snap-start cursor-pointer transition-all duration-500 group ${selectedTemple.id === temple.id ? "opacity-100 ring-4 ring-sacred ring-offset-4 rounded-[1.5rem]" : "opacity-80 hover:opacity-100"
                      }`}
                  >
                    <div className="relative aspect-video rounded-[1.5rem] overflow-hidden shadow-lg border border-border">
                      <Image
                        src={getImageUrl(temple.image)}
                        alt={temple.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-bold text-lg mb-1 line-clamp-1">{temple.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-xs font-medium">{temple.location}</span>
                          {temple.id === selectedTemple.id && (
                            <Badge className="bg-red-600 text-[10px] font-bold h-5 uppercase animate-pulse">Now Playing</Badge>
                          )}
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full p-2 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={14} fill="white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, MapPin, Users, Heart, Share2, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
            (t: any) => t.isLive && t.liveStatus
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
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 relative flex items-center justify-center min-h-[70vh] p-6 text-center">

          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0 select-none">
            <Image
              src="/images/sacred_temple_ritual.png" // Using existing image
              alt="Temple Ritual"
              fill
              className="object-cover opacity-30 grayscale hover:grayscale-0 transition-all duration-1000"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-2xl mx-auto space-y-6"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 backdrop-blur-sm">
              <Calendar className="w-10 h-10 text-primary animate-pulse" />
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground drop-shadow-sm font-serif">
              The Sanctum is Silent
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-lg mx-auto">
              Currently, no live darshans are in progress. The divine presence awaits your return during scheduled aarti times.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-medium" asChild>
                <Link href="/temples">Explore Temples</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-2 hover:bg-accent/50 transition-all font-medium" asChild>
                <Link href="/poojas">Book a Pooja</Link>
              </Button>
            </div>
          </motion.div>
        </main>
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

          {/* Overlay Content Container (Always visible, clean layout) */}
          <div className="absolute inset-0 container px-4 flex flex-col justify-between py-8 z-10 pointer-events-none">

            {/* Top Header Info */}
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

            {/* Bottom Info (Generic Focus - Permanently Visible) */}
            <div className={`pointer-events-auto bg-gradient-to-t from-black via-black/60 to-transparent p-8 rounded-2xl transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 text-white/90">
                    <Play className="text-sacred fill-sacred" size={24} />
                    <span className="text-sm md:text-md font-bold tracking-[0.3em] uppercase drop-shadow-lg">Universal Divine Presence</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl font-serif mb-2 italic">Live Darshan</h2>
                  <p className="text-white/80 text-sm md:text-lg max-w-2xl font-medium tracking-wide leading-relaxed">
                    Experience the sacred aartis and divine rituals from India's most revered shrines. Choose your preferred sanctuary below to begin your spiritual journey.
                  </p>

                  {/* Selective Temple Highlight */}
                  <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm w-fit px-4 py-2 rounded-full border border-white/10">
                    <MapPin className="text-sacred" size={14} />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{selectedTemple.name}, {selectedTemple.location}</span>
                  </div>
                </div>

                {/* Primary Actions for Live Viewer */}
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Button
                    className="h-12 px-8 rounded-full bg-sacred hover:bg-[#ff8c33] text-white font-black text-sm uppercase tracking-widest gap-2 shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all"
                    asChild
                  >
                    <Link href={`/donation?temple=${selectedTemple.id}`}>
                      <Heart className="w-4 h-4 fill-white" />
                      Donate Now
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-8 rounded-full border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 font-black text-sm uppercase tracking-widest gap-2 transition-all"
                    asChild
                  >
                    <Link href={`/booking?temple=${selectedTemple.id}`}>
                      <Calendar className="w-4 h-4" />
                      Book Pooja
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 mt-12">
          {/* Generic Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16 bg-white shadow-xl shadow-primary/5 p-8 rounded-[2.5rem] border border-primary/5">
            <div className="lg:col-span-12 space-y-4 text-center max-w-4xl mx-auto">
              <div className="inline-block px-4 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-2">
                Divine Essence
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-[#2a1b01] font-serif leading-tight">The Sacred Power of Live Darshan</h3>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
                Live Darshan is a portal to the divine. Witnessing sacred rituals in real-time invites the energy of the shrine into your home. This digital sanctuary connects you with your chosen deities whenever you seek peace.
              </p>
              <div className="pt-4">
                <p className="text-sacred font-bold italic text-sm md:text-md opacity-80">
                  "Darshan transcends physical boundaries, connecting the devotee directly to the divine."
                </p>
              </div>
            </div>
          </div>

          {/* HORIZONTAL TEMPLE SELECTOR */}
          {temples.length > 1 && (
            <section>
              <div className="flex flex-col md:flex-row items-center justify-between mb-10 px-2 gap-4">
                <div className="space-y-1">
                  {/* <h3 className="text-3xl font-black uppercase tracking-tighter flex items-lef gap-3 text-foreground">
                    <span className="w-12 h-1.5 bg-sacred rounded-full" /> Other Live Temples
                  </h3> */}

                  <h3 className="text-3xl md:text-4xl font-black text-[#2a1b01] font-serif leading-tight">Other Live Temples</h3>
                  {/* <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] ml-15">Choose your gateway to the divine</p> */}
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-sacred/20 text-sacred/60 uppercase font-black text-[9px] px-3 tracking-widest">
                    {temples.length} Live Channels Available
                  </Badge>
                </div>
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

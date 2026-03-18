"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, MapPin, Users, Heart, Share2, Calendar, Search, Sparkles } from "lucide-react";
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

// --- Divine Animation Components ---

const BellAnimation = ({ trigger, isLooping = false }: { trigger: number; isLooping?: boolean }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload audio from a more reliable source
    // Using a clear bell sound from Mixkit
    const bellUrl = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
    audioRef.current = new Audio(bellUrl);
    audioRef.current.volume = 1.0;

    // Attempt to load
    audioRef.current.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isLooping) {
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => {
          console.warn("Bell loop blocked or failed:", e);
        });
      } else if (trigger > 0) {
        audioRef.current.loop = false;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => {
          console.warn("Bell play blocked or failed:", e.message);
          // If blocked by browser, we can't do much without user interaction,
          // but logging helps debug why it's silent.
        });
      } else if (!isLooping) {
        audioRef.current.pause();
      }
    }
  }, [trigger, isLooping]);

  return null; // Visual bell removed as requested
};

const FlowerShower = ({ trigger }: { trigger: number }) => {
  const [flowers, setFlowers] = useState<any[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newFlowers = Array.from({ length: 60 }).map((_, i) => ({
        id: `${trigger}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 3,
        size: 15 + Math.random() * 25,
        rotation: Math.random() * 360,
        type: ['🌸', '🌼', '🌷', '🌹'][Math.floor(Math.random() * 4)]
      }));
      setFlowers(prev => [...prev.slice(-40), ...newFlowers]);

      const timer = setTimeout(() => {
        setFlowers(prev => prev.filter(f => !f.id.startsWith(`${trigger}-`)));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[99] overflow-hidden">
      <AnimatePresence>
        {flowers.map((f) => (
          <motion.div
            key={f.id}
            initial={{ top: "-10%", opacity: 0, left: `${f.left}%` }}
            animate={{ 
              top: "110%",
              opacity: [0, 1, 1, 0.8, 0],
              rotate: f.rotation + 720,
              x: [0, (Math.random() * 50 - 25)]
            }}
            transition={{ 
              duration: f.duration, 
              delay: f.delay, 
              ease: "linear" 
            }}
            style={{ 
              fontSize: f.size,
              position: 'absolute'
            }}
            className="select-none"
          >
            {f.type}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const AartiAnimation = ({ trigger }: { trigger: number }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: "-50%", y: 200 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.7, 1.2, 1, 0.7],
            y: [150, 0, 0, 100],
          }}
          transition={{
            duration: 8,
            times: [0, 0.15, 0.85, 1],
            ease: "easeOut"
          }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-[100]"
        >
          <div className="relative">
            <img
              src="/images/rotate_thali.gif"
              alt="Aarti Thali"
              className="w-64 h-64 md:w-[500px] md:h-[500px] object-contain drop-shadow-[0_20px_60px_rgba(255,107,0,0.6)]"
            />
            {/* Sacred Glow */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
  const [bellTrigger, setBellTrigger] = useState(0);
  const [flowerTrigger, setFlowerTrigger] = useState(0);
  const [aartiTrigger, setAartiTrigger] = useState(0);
  const [isAartiActive, setIsAartiActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (aartiTrigger > 0) {
      setIsAartiActive(true);
      const timer = setTimeout(() => setIsAartiActive(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [aartiTrigger]);

  // Automatic Trigger on Temple Change
  useEffect(() => {
    if (selectedTemple && isPlaying) {
      // Delay slightly for video to load
      const timer = setTimeout(() => {
        setBellTrigger(prev => prev + 1);
        setFlowerTrigger(prev => prev + 1);
        setAartiTrigger(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedTemple?.id, isPlaying]);

  // Fetch Live Temples
  useEffect(() => {
    const fetchLiveTemples = async () => {
      try {
        const res = await axios.get(`${API_URL}/temples`);
        if (res.data.success) {

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

      {/* Hero Header Section */}
      <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden mb-12">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/sacred_live_darshan_hero_bg.png"
            alt="Sacred Live Darshan"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background/95" />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-sacred/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <div className="space-y-4">
              <Badge variant="outline" className="border-primary/30 text-primary px-4 py-1 rounded-full bg-white/60 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-2 fill-primary" />
                Divine Essence
              </Badge>
              <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground drop-shadow-sm leading-tight">
                The Sacred Power of <span className="text-primary italic">Live Darshan</span>
              </h1>
              <p className="text-base md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed font-medium">
                Live Darshan is a portal to the divine. Witnessing sacred rituals in real-time invites the energy into your home, connecting you with chosen deities for eternal peace.
              </p>
            </div>

            {/* Premium Search & Explore */}
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
              <div className="relative flex items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-orange-100/50 p-1.5">
                <div className="flex-1 flex items-center px-4">
                  <Search className="h-5 w-5 text-primary mr-3" />
                  <input
                    type="text"
                    placeholder="Search for live temple..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none py-4 text-lg font-medium"
                  />
                </div>
                <Button
                  className="px-8 h-[54px] rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm uppercase tracking-widest hidden sm:flex shrink-0"
                  onClick={() => {
                    const selector = document.getElementById('other-temples');
                    if (selector) selector.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore
                </Button>
              </div>
              <p className="mt-4 text-sacred font-serif italic text-sm md:text-md opacity-90 text-center">
                "Darshan transcends physical boundaries, connecting the devotee directly to the divine."
              </p>
            </div>
          </motion.div>
        </div>
      </section>



      <main className="relative pb-1 pt-1 overflow-x-hidden">
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

          <AartiAnimation trigger={aartiTrigger} />
          <FlowerShower trigger={flowerTrigger} />
          <BellAnimation trigger={bellTrigger} isLooping={isAartiActive} />

          {/* Top Info (Always on Video) */}
          <div className="absolute top-0 inset-x-0 p-8 z-10 pointer-events-none">
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
        </section>

        {/* Info Area Below Video */}
        <section className="bg-white border-b border-border/50 py-4">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex flex-col lg:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 text-primary mb-1">
                  {/* <Play className="fill-primary" size={16} /> */}
                  {/* <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase">Sacred Live Presence</span> */}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Link href={`/temples/${selectedTemple.id}`} className="block group">
                    <h2 className="text-2xl md:text-3xl font-black text-[#2a1b01] font-serif group-hover:text-primary transition-colors leading-tight">
                      {selectedTemple.name}, {selectedTemple.location}
                    </h2>
                  </Link>
                  {/* <Link href={`/temples/${selectedTemple.id}`} className="flex items-center gap-2 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors">
                    <MapPin className="text-primary" size={12} />
                    <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest whitespace-nowrap">
                      {selectedTemple.name}, {selectedTemple.location}
                    </span>
                  </Link> */}
                </div>
              </div>


             <div className="flex items-center gap-1 bg-slate-50 rounded-full border border-slate-200">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setBellTrigger(prev => prev + 1)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-border hover:bg-orange-50 transition-all hover:border-orange-200"
                    title="Ring Bell"
                  >
                    🔔
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFlowerTrigger(prev => prev + 1)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-border hover:bg-pink-50 transition-all hover:border-pink-200"
                    title="Offer Flowers"
                  >
                    🌸
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAartiTrigger(prev => prev + 1)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-border hover:bg-yellow-50 transition-all hover:border-yellow-200 overflow-hidden"
                    title="Perform Aarti"
                  >
                    <img src="/images/rotate_thali.gif" alt="Aarti" className="w-10 h-10 object-contain" />
                  </motion.button>
                </div>



              {/* Primary Actions */}
              <div className="flex flex-wrap items-center gap-4 shrink-0 bg-white shadow-soft p-3 md:p-4 rounded-[1.5rem] border border-orange-50/50">
                {/* Manual Devotion Buttons */}
             
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-10 px-6 rounded-full border-2 border-primary/20 bg-white text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-none"
                    asChild
                  >
                    <Link href={`/donation?temple=${selectedTemple.id}`}>
                      <Heart className="w-3.5 h-3.5" />
                      Donate
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 px-6 rounded-full border-2 border-primary/20 bg-white text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-none"
                    asChild
                  >
                    <Link href={`/booking?temple=${selectedTemple.id}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      Book Pooja
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 mt-12">









          {/* HORIZONTAL TEMPLE SELECTOR */}
          {temples.length > 0 && (
            <section id="other-temples">
              <div className="flex flex-col md:flex-row items-center justify-between mb-10 px-2 gap-4">
                <div className="space-y-1">
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
                {temples
                  .filter(temple => temple.name.toLowerCase().includes(searchQuery.toLowerCase()) || temple.location.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((temple, idx) => (
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

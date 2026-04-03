"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, MapPin, Users, Heart, Share2, Calendar, Search, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
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
    if (url.includes("view_stream?channel=")) return url;
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.trim().startsWith("UC") && !url.includes("/") && !url.includes(".")) {
      return `https://www.youtube.com/embed/live_stream?channel=${url.trim()}`;
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/");
    }
    if (!url.includes("embed") && url.includes("youtube.com")) {
      return url;
    }
    return url;
  } catch (e) {
    return url;
  }
};

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
    if (shortMatch) return shortMatch[1];
    const embedMatch = url.match(/embed\/([^?&/]+)/);
    if (embedMatch) return embedMatch[1];
  } catch (e) {}
  return null;
};

// --- Divine Animation Components ---

const BellAnimation = ({ trigger }: { trigger: number }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const bellUrl = "/videos/kalsstockmedia-log-soft-low-frequency-bell-sound-temple-asmr-309725.mp3";
    audioRef.current = new Audio(bellUrl);
    audioRef.current.volume = 1.0;
    audioRef.current.loop = true;
    audioRef.current.load();

    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (trigger > 0) {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      audioRef.current.loop = true;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Bell play blocked:", e));
      stopTimerRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 5000);
    } else {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [trigger]);

  return null;
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
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function LiveDarshanClient() {
  const [temples, setTemples] = useState<any[]>([]);
  const [selectedTemple, setSelectedTemple] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bellTrigger, setBellTrigger] = useState(0);
  const [flowerTrigger, setFlowerTrigger] = useState(0);
  const [aartiTrigger, setAartiTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth / 1.5 : scrollLeft + clientWidth / 1.5;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Fetch Live Temples
  useEffect(() => {
    const fetchLiveTemples = async () => {
      try {
        const res = await axios.get(`${API_URL}/temples`, { params: { isLive: true } });
        if (res.data.success) {
          const liveTemples = res.data.data;

          if (liveTemples.length > 0) {
            setTemples(liveTemples);

            const slugArr = params?.slug as string[] | undefined;
            const currentSlug = slugArr ? slugArr[0] : null;
            const paramId = searchParams.get('templeId');

            let matched = null;
            if (currentSlug) {
              matched = liveTemples.find((t: any) => t.slug === currentSlug || t.id === currentSlug || t._id === currentSlug);
            } else if (paramId) {
              matched = liveTemples.find((t: any) => t.id === paramId || t._id === paramId);
            }

            const initialTemple = matched || liveTemples[0];
            setSelectedTemple(initialTemple);
            setIsPlaying(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch live temples", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveTemples();
  }, [params, searchParams]);

  const handleTempleClick = (temple: any) => {
    setSelectedTemple(temple);
    setIsPlaying(true);
    router.push(`/live-darshan/${temple.slug || temple.id}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <div className="absolute inset-0 z-0 select-none">
            <Image
              src="/images/sacred_temple_ritual.png"
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
      <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden mb-0">
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 -left-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-sacred/30 rounded-full blur-[120px] opacity-60" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-5xl mx-auto space-y-6"
          >
            <div className="space-y-6">
              <Badge variant="outline" className="border-primary/30 text-primary px-6 py-1.5 rounded-full bg-white/70 backdrop-blur-md shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-2 fill-primary" />
                <span className="font-bold tracking-wider">DIVINE ESSENCE</span>
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black text-foreground drop-shadow-md leading-tight md:whitespace-nowrap">
                The Sacred Power of <span className="text-primary italic">Live Darshan</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed font-medium">
                Experience the divine through Live Darshan. Witness sacred rituals in real-time <br className="hidden md:block" /> to welcome peace, energy, and spiritual growth into your home.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="relative p-0 overflow-x-hidden">
        <section className="relative w-full h-[60vh] md:h-[85vh] bg-black overflow-hidden group">
          <div className="absolute inset-0 z-0">
            {isPlaying && selectedTemple.liveUrl ? (
              <>
                <iframe
                  id="yt-player"
                  src={`${getEmbedUrl(selectedTemple.liveUrl)}?autoplay=1&mute=0&controls=0&rel=0&disablekb=1&modestbranding=1&playsinline=1&iv_load_policy=3`}
                  title="Live Darshan"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <div
                  className="absolute inset-0 z-10 cursor-pointer bg-transparent"
                  onClick={() => setIsPlaying(false)}
                ></div>
              </>
            ) : (
              <>
                {(() => {
                  const videoId = getYouTubeVideoId(selectedTemple.liveUrl || "");
                  const thumbSrc = videoId
                    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                    : "/images/sacred_live_darshan_hero_bg.png";
                  return (
                    <img
                      src={thumbSrc}
                      alt={selectedTemple.name}
                      className="w-full h-full absolute inset-0 object-cover transition-opacity duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (videoId && target.src.includes("maxresdefault")) {
                          target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        } else if (!target.src.includes('sacred_live_darshan_hero_bg')) {
                          target.src = "/images/sacred_live_darshan_hero_bg.png";
                        }
                      }}
                    />
                  );
                })()}
                <div className="absolute inset-0 bg-black/20" />
              </>
            )}
          </div>
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <AartiAnimation trigger={aartiTrigger} />
            <FlowerShower trigger={flowerTrigger} />
          </div>
          <BellAnimation trigger={bellTrigger} />
          <div className="absolute top-0 inset-x-0 p-8 z-10 pointer-events-none">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pointer-events-auto">
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-white">
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

        <section className="bg-[#7b4623] border-y border-[#7b4623]/30 py-4 sticky top-0 z-20 shadow-lg">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="text-center lg:text-left space-y-1 flex-1">
                <Link href={`/temples/${selectedTemple.slug || selectedTemple.id}`} className="inline-block group">
                  <div className="flex flex-col gap-1 justify-center lg:justify-start">
                    <h2 className="text-2xl md:text-3xl font-serif font-black text-white transition-all duration-300 leading-tight">
                      {selectedTemple.name}
                    </h2>
                    <div className="flex items-center justify-center lg:justify-start gap-1.5 text-white/60 font-medium uppercase tracking-widest text-[11px] group-hover:text-white/90 transition-colors">
                      <MapPin size={12} className="text-primary/80 group-hover:text-primary transition-colors" />
                      <span>{selectedTemple.location}</span>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="flex justify-center flex-1">
                <div className="flex items-center gap-3 md:gap-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 p-2 shadow-inner group/devotion">
                  <motion.button
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setBellTrigger(prev => prev + 1)}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-lg border border-primary/10 hover:shadow-primary/20 transition-all"
                  >
                    🔔
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFlowerTrigger(prev => prev + 1)}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-lg border border-primary/10 hover:shadow-pink-200 transition-all"
                  >
                    🌸
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAartiTrigger(prev => prev + 1)}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-lg border border-primary/10 hover:shadow-yellow-200 transition-all overflow-hidden"
                  >
                    <img src="/images/aarti_thali.png" alt="Aarti" className="w-9 h-9 md:w-10 md:h-10 object-contain" />
                  </motion.button>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" className="h-9 px-4 rounded-full border border-primary/20 bg-white text-dark font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm" asChild>
                    <Link href={`/donation?temple=${selectedTemple.id}`}>
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      Donate Now
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-9 px-4 rounded-full border border-primary/20 bg-white text-primary font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm" asChild>
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

        <div className="container mx-auto px-4 md:px-6 mt-12 relative">
          {temples.length > 0 && (
            <section id="other-temples">
              <div className="flex flex-col lg:flex-row items-center justify-between mb-4 px-2 gap-4 lg:gap-6 relative z-10 mt-2">
                <div className="space-y-1 shrink-0">
                  <h3 className="text-3xl md:text-4xl font-black text-primary font-serif leading-tight text-center lg:text-left">Other Live Temples</h3>
                </div>
                <div className="relative max-w-sm w-full mx-auto lg:absolute lg:left-1/2 lg:-translate-x-1/2 group z-20">
                  <div className="relative flex items-center bg-white border-2 border-[#7c4624]/30 hover:border-[#7c4624]/50 focus-within:border-[#7c4624]/60 rounded-full shadow-md overflow-hidden transition-all duration-300 py-1">
                    <div className="flex-1 flex items-center px-4">
                      <Search className="h-4 w-4 text-[#7c4624]/70 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search for live temple..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none py-1.5 text-sm font-semibold text-[#2a1b01] placeholder:text-muted-foreground/70"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 hidden lg:flex">
                  <Badge variant="outline" className="border-sacred/20 text-sacred/60 uppercase font-black text-[9px] px-3 tracking-widest whitespace-nowrap bg-white/50 backdrop-blur-sm">
                    {temples.length} Live Channels Available
                  </Badge>
                </div>
              </div>
              <div className="relative group/scroll mt-2">
                <div
                  ref={scrollRef}
                  className="flex gap-8 overflow-x-auto snap-x no-scrollbar pt-4 pb-12 px-8 scroll-smooth -mx-8 relative z-0"
                >
                  {temples
                    .filter(temple => (temple.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || (temple.location?.toLowerCase().includes(searchQuery.toLowerCase()) || false))
                    .map((temple) => (
                      <motion.div
                        key={temple.id}
                        onClick={() => handleTempleClick(temple)}
                        className={`min-w-[300px] md:min-w-[360px] snap-start cursor-pointer transition-all duration-500 group relative ${selectedTemple.id === temple.id
                          ? "z-10 opacity-100 ring-[5px] ring-primary ring-offset-4 rounded-[1.5rem] scale-[1.02]"
                          : "opacity-100 hover:opacity-100"
                          }`}
                      >
                        <div className="relative aspect-video rounded-[1.5rem] overflow-hidden shadow-2xl border border-border/50">
                          <img
                            src={getImageUrl(temple.image)}
                            alt={temple.name}
                            className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/sacred_live_darshan_hero_bg.png";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80" />
                          <div className="absolute bottom-5 left-5 right-5">
                            <p className="text-white font-bold text-xl mb-1.5 line-clamp-1 drop-shadow-md">{temple.name}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-white/90 text-sm font-medium">
                                <MapPin size={12} className="mr-1 text-primary" />
                                {temple.location}
                              </div>
                              {temple.id === selectedTemple.id && (
                                <Badge className="bg-red-600 text-[10px] font-bold h-5 uppercase animate-pulse border-none shadow-lg">Now Playing</Badge>
                              )}
                            </div>
                          </div>
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full p-2.5 text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <Play size={16} fill="white" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
                <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-xl border border-primary/20 flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-white z-10">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-xl border border-primary/20 flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-white z-10">
                  <ChevronRight size={24} />
                </button>
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

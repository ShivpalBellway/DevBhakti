"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, MapPin, Users, Heart, Share2, Calendar, Search, Sparkles, ChevronLeft, ChevronRight, ChevronDown, BadgeCheck, ShoppingBag, Clock, X, Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import axios from "axios";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized } from "@/utils/localization";
import { getVideoRenderInfo, extractYouTubeId } from "@/lib/utils/videoUtils";
import { UniversalVideoPlayer } from "@/components/video/UniversalVideoPlayer";
import { trackViewLiveDarshan } from "@/lib/analytics";

const getYouTubeVideoId = (url: string): string | null => {
  return extractYouTubeId(url);
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
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
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
          initial={{ opacity: 0, scale: 0.5, x: "-50%", y: isMobile ? 60 : 200 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.7, 1.2, 1, 0.7],
            y: isMobile ? [50, 10, 10, 50] : [150, 0, 0, 100],
          }}
          transition={{
            duration: 8,
            times: [0, 0.15, 0.85, 1],
            ease: "easeOut"
          }}
          className="absolute bottom-2 md:bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-[100]"
        >
          <div className="relative">
            <img
              src="/images/rotate_thali.gif"
              alt="Aarti Thali"
              className="w-28 h-28 md:w-[500px] md:h-[500px] object-contain drop-shadow-[0_20px_60px_rgba(255,107,0,0.6)]"
            />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] md:blur-[80px] -z-10 animate-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DiyaAnimation = ({ trigger }: { trigger: number }) => {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
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
          initial={{ opacity: 0, scale: 0.5, x: "-50%", y: isMobile ? 60 : 200 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.7, 1.2, 1, 0.7],
            y: isMobile ? [50, 10, 10, 50] : [150, 0, 0, 100],
          }}
          transition={{
            duration: 8,
            times: [0, 0.15, 0.85, 1],
            ease: "easeOut"
          }}
          className="absolute bottom-2 md:bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-[100]"
        >
          <div className="relative">
            <img
              src="/images/diya.gif"
              alt="Diya"
              className="w-20 h-20 md:w-56 md:h-56 object-contain drop-shadow-[0_20px_60px_rgba(255,140,0,0.8)]"
            />
            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[30px] md:blur-[60px] -z-10 animate-pulse" />
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
  const [diyaTrigger, setDiyaTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { language, t: baseT } = useLanguage();
  const t = (key: string) => baseT(`live_darshan_page.${key}`);
  const selectedVideoInfo = getVideoRenderInfo(selectedTemple?.liveUrl || selectedTemple?.channelId || "");
  const [isIpHost, setIsIpHost] = useState(false);
  const [isAartiAccordionOpen, setIsAartiAccordionOpen] = useState(false);
  const [isParticipateOpen, setIsParticipateOpen] = useState(false);
  
  const handleShare = async () => {
    const url = window.location.href;
    const title = getLocalized(selectedTemple, 'name', language) || "Live Darshan";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Watch Live Darshan from ${title}`,
          url: url,
        });
        toast.success("Thanks for sharing!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Link copied to clipboard!");
      }).catch((err) => {
        console.error("Copy failed:", err);
        toast.error("Failed to copy link");
      });
    }
  };

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsIpHost(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname));
  }, []);

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth / 1.5 : scrollLeft + clientWidth / 1.5;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchLiveTemples = async () => {
      try {
        const res = await axios.get(`${API_URL}/temples`, { params: { lang: language } });
        if (res.data.success) {
          const liveTemples = res.data.data.filter(
            (t: any) => t.isLive && t.liveStatus
          );

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
            const initialInfo = getVideoRenderInfo(initialTemple?.liveUrl || initialTemple?.channelId || "");
            setIsPlaying(initialInfo.kind !== "unknown");
          }
        }
      } catch (error) {
        console.error("Failed to fetch live temples", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveTemples();
  }, [params, searchParams, language]);

  useEffect(() => {
    if (selectedTemple) {
      trackViewLiveDarshan({
        streamId: selectedTemple.id,
        templeName: selectedTemple.name,
      });
    }
  }, [selectedTemple]);

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
      <div className="min-h-screen bg-[#FFF9F3] flex items-center justify-center text-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedTemple) {
    return (
      <div className="min-h-screen bg-[#FFF9F3] flex flex-col">
        <Navbar />
        <main className="flex-1 relative flex items-center justify-center min-h-[70vh] p-6 text-center">
          <div className="absolute inset-0 z-0 select-none">
            <Image
              src="/images/sacred_temple_ritual.png"
              alt={t('sanctum_silent')}
              fill
              className="object-cover opacity-10 grayscale hover:grayscale-0 transition-all duration-1000"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F3] via-[#FFF9F3]/80 to-transparent" />
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
              {t('sanctum_silent')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-lg mx-auto">
              {t('sanctum_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-medium" asChild>
                <Link href="/temples">{t('buttons_explore')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-2 hover:bg-accent/50 transition-all font-medium" asChild>
                <Link href="/poojas">{t('buttons_book')}</Link>
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F3] selection:bg-sacred/30 flex flex-col">
      <Navbar />



      {/* --- MOBILE VIEW (block md:hidden) --- */}
      <main className="block md:hidden pt-20 px-3.5 pb-8 space-y-3.5">
        {/* Title Header with flourishes */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-2 text-[#7A3F1F]">
          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#7A3F1F]/40" />
          <span className="text-[10px] text-[#7A3F1F]">♦</span>
          <h1 className="text-xs font-serif font-extrabold uppercase tracking-widest text-[#7A3F1F]">{t('live_darshan')}</h1>
          <span className="text-[10px] text-[#7A3F1F]">♦</span>
          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#7A3F1F]/40" />
        </div>

        {/* Video Player Box */}
        <div className="w-full bg-black rounded-2xl overflow-hidden relative shadow-xl aspect-video border border-black/80 group">
          <div className="aspect-video w-full h-full relative flex items-center justify-center">
            {isPlaying && selectedVideoInfo.kind !== "unknown" ? (
              <UniversalVideoPlayer
                url={selectedTemple.liveUrl || selectedTemple.channelId}
                className="w-full h-full object-contain bg-black"
                autoPlay
                muted
                controls
                playsInline
              />
            ) : (
              <>
                {(() => {
                  const videoId = getYouTubeVideoId(selectedTemple?.liveUrl || selectedTemple?.channelId || "");
                  const thumbSrc = videoId
                    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                    : selectedTemple?.image
                    ? getImageUrl(selectedTemple.image)
                    : "/images/sacred_live_darshan_hero_bg.png";
                  return (
                    <img
                      src={thumbSrc}
                      alt={getLocalized(selectedTemple, 'name', language)}
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

          {/* Overlays */}
          <div className="absolute top-2.5 left-2.5 z-40 flex items-center gap-1.5 pointer-events-none">
            <Badge className="bg-red-600 hover:bg-red-600 text-white font-bold h-5 px-2 rounded-full flex items-center animate-pulse border-none shadow text-[10px]">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1" /> {t('status_live')}
            </Badge>
            <Badge className="bg-black/50 backdrop-blur-md text-white font-medium h-5 px-2 rounded-full border border-white/20 shadow text-[10px]">
              <Users size={10} className="mr-1" /> {selectedTemple?.viewerCount || "1.2K"}
            </Badge>
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <AartiAnimation trigger={aartiTrigger} />
            <FlowerShower trigger={flowerTrigger} />
            <DiyaAnimation trigger={diyaTrigger} />
          </div>
          <BellAnimation trigger={bellTrigger} />
        </div>

        {/* Temple Name & Location Row + Participate Toggle Button */}
        <div className="flex items-center justify-between pt-1 pb-1 gap-2">
          <div className="space-y-0.5 max-w-[65%]">
            <h2 className="text-base font-serif font-bold text-[#2a1a10] leading-tight line-clamp-1 flex items-center gap-1">
              <span>{getLocalized(selectedTemple, 'name', language)}</span>
              <BadgeCheck className="w-4 h-4 text-orange-500 fill-orange-100 shrink-0" />
            </h2>
            <div className="flex items-center text-[#7A3F1F] font-medium text-xs">
              <MapPin className="w-3 h-3 mr-1 opacity-80 shrink-0 text-orange-600" />
              <span className="line-clamp-1">{getLocalized(selectedTemple, 'location', language)}</span>
            </div>
          </div>

          {isParticipateOpen ? (
            <button
              onClick={() => setIsParticipateOpen(false)}
              className="w-8 h-8 rounded-full bg-[#5A1010] text-[#FFF4E8] flex items-center justify-center border border-[#F0D5B5] shadow-md active:scale-95 transition-transform shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsParticipateOpen(true)}
              className="bg-[#FFF4E8] border border-[#F0D5B5] hover:bg-[#FBE8D3] active:scale-95 text-[#5A1010] font-semibold rounded-full px-3.5 py-1.5 text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0"
            >
              <span className="text-xs">🙏</span>
              <span>{t('actions_participate')}</span>
            </button>
          )}
        </div>

        {/* Divine Reactions Popup Panel (Toggled via Participate button) */}
        <AnimatePresence>
          {isParticipateOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#FFF4E8] border border-[#F0D5B5] rounded-2xl p-2.5 shadow-sm my-1 overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-1 text-center">
                <button
                  onClick={() => setFlowerTrigger(prev => prev + 1)}
                  className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-white border border-[#F0D5B5] shadow-xs flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    🌸
                  </div>
                  <span className="text-[10px] font-bold text-[#5A1010] leading-tight line-clamp-1">{t('offer_flowers')}</span>
                </button>

                <button
                  onClick={() => setBellTrigger(prev => prev + 1)}
                  className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-white border border-[#F0D5B5] shadow-xs flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    🔔
                  </div>
                  <span className="text-[10px] font-bold text-[#5A1010] leading-tight line-clamp-1">{t('ring_bell')}</span>
                </button>

                <button
                  onClick={() => setAartiTrigger(prev => prev + 1)}
                  className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-white border border-[#F0D5B5] shadow-xs flex items-center justify-center text-xl group-hover:scale-105 transition-transform p-2">
                    <img src="/images/aarti_thali.png" alt="Aarti" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-bold text-[#5A1010] leading-tight line-clamp-1">{t('aarti_with_thali')}</span>
                </button>

                <button
                  onClick={() => setDiyaTrigger(prev => prev + 1)}
                  className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-white border border-[#F0D5B5] shadow-xs flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    🪔
                  </div>
                  <span className="text-[10px] font-bold text-[#5A1010] leading-tight line-clamp-1">{t('light_diya')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3 Quick Action Cards Row */}
        <div id="mobile-quick-actions" className="grid grid-cols-3 gap-2 py-1">
          <Link
            href={`/donation?temple=${selectedTemple?.id || ''}`}
            className="bg-[#FFF4E8] border border-[#F0D5B5] hover:border-orange-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition-all"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-orange-100/80 border border-orange-200/60 flex items-center justify-center shrink-0">
                <Heart className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <span className="text-[11px] font-bold text-[#5A1010] leading-tight line-clamp-2">{t('actions_donate')}</span>
            </div>
            <span className="text-[#5A1010]/60 font-bold text-xs shrink-0 pl-0.5">&gt;</span>
          </Link>

          <Link
            href={`/booking?temple=${selectedTemple?.id || ''}`}
            className="bg-[#FFF4E8] border border-[#F0D5B5] hover:border-orange-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition-all"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-orange-100/80 border border-orange-200/60 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <span className="text-[11px] font-bold text-[#5A1010] leading-tight line-clamp-2">{t('actions_book_pooja')}</span>
            </div>
            <span className="text-[#5A1010]/60 font-bold text-xs shrink-0 pl-0.5">&gt;</span>
          </Link>

          <Link
            href="/marketplace?category=All"
            className="bg-[#FFF4E8] border border-[#F0D5B5] hover:border-orange-300 rounded-xl p-2.5 flex items-center justify-between shadow-xs transition-all"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-orange-100/80 border border-orange-200/60 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <span className="text-[11px] font-bold text-[#5A1010] leading-tight line-clamp-2">{t('actions_sacred_items')}</span>
            </div>
            <span className="text-[#5A1010]/60 font-bold text-xs shrink-0 pl-0.5">&gt;</span>
          </Link>
        </div>

        {/* Dynamic Opening Hours Accordion Banner */}
        <div className="bg-[#FFF4E8] border border-[#F0D5B5] rounded-xl overflow-hidden shadow-xs">
          <button
            onClick={() => setIsAartiAccordionOpen(!isAartiAccordionOpen)}
            className="w-full p-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-400/30 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#5A1010] flex items-center gap-1">
                  {t('opening_hours')}
                </div>
                <div className="text-[11px] text-[#7A3F1F] font-medium">
                  {selectedTemple?.openTime
                    ? selectedTemple.openTime
                    : selectedTemple?.operatingHours && Array.isArray(selectedTemple.operatingHours) && selectedTemple.operatingHours.length > 0
                    ? `${selectedTemple.operatingHours[0]?.start || ''} - ${selectedTemple.operatingHours[selectedTemple.operatingHours.length - 1]?.end || selectedTemple.operatingHours[0]?.end || ''}`
                    : "5:30 AM - 9:30 PM"}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#7A3F1F] transition-transform duration-300 ${isAartiAccordionOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isAartiAccordionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-[#F0D5B5]/60 bg-white/70 p-3 space-y-2 text-xs"
              >
                {selectedTemple?.operatingHours && Array.isArray(selectedTemple.operatingHours) && selectedTemple.operatingHours.filter((s: any) => s.active).length > 0 ? (
                  selectedTemple.operatingHours.filter((s: any) => s.active).map((slot: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-[#2a1a10]">
                      <span className="flex items-center gap-1.5">
                        <span className="text-orange-500">🔔</span>
                        <span>{slot.label}</span>
                      </span>
                      <span className="font-bold text-[#7A3F1F]">{slot.start} {slot.end ? `- ${slot.end}` : ''}</span>
                    </div>
                  ))
                ) : selectedTemple?.openTime ? (
                  <div className="flex items-center justify-between text-[#2a1a10]">
                    <span className="flex items-center gap-1.5">
                      <span className="text-orange-500">🔔</span>
                      <span>{t('opening_hours')}</span>
                    </span>
                    <span className="font-bold text-[#7A3F1F]">{selectedTemple.openTime}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[#2a1a10]">
                    <span className="flex items-center gap-1.5">
                      <span className="text-orange-500">🔔</span>
                      <span>{t('opening_hours')}</span>
                    </span>
                    <span className="font-bold text-[#7A3F1F]">5:30 AM - 9:30 PM</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Other Live Darshans (2-Column Grid on Mobile) */}
        {temples.length > 0 && (
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-[#2a1a10]">{t('sections_other_temples')}</h3>
              <button
                onClick={() => {
                  const element = document.getElementById('other-temples');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-[#7A3F1F] flex items-center gap-0.5 hover:underline"
              >
                {t('view_all')} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {temples
                .filter(t => t.id !== selectedTemple?.id)
                .slice(0, 4)
                .map((temple) => (
                  <div
                    key={temple.id}
                    onClick={() => handleTempleClick(temple)}
                    className="cursor-pointer group relative rounded-xl overflow-hidden border border-border/40 shadow-xs bg-black aspect-video flex flex-col justify-between p-2"
                  >
                    <img
                      src={getImageUrl(temple.image)}
                      alt={getLocalized(temple, 'name', language)}
                      className="w-full h-full absolute inset-0 object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/sacred_live_darshan_hero_bg.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Top badges */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center animate-pulse">
                        <span className="w-1 h-1 bg-white rounded-full mr-1" /> {t('status_live')}
                      </span>
                      <span className="bg-black/60 text-white text-[8px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur-xs flex items-center">
                        <Users size={8} className="mr-0.5" /> {temple?.viewerCount || "1.2K"}
                      </span>
                    </div>

                    {/* Bottom Title & Subtitle */}
                    <div className="relative z-10 text-white space-y-0.5">
                      <h4 className="font-bold text-[11px] line-clamp-1 drop-shadow-xs">{getLocalized(temple, 'name', language)}</h4>
                      <p className="text-[9px] text-white/80 line-clamp-1 flex items-center gap-0.5">
                        <MapPin size={8} className="text-orange-400 shrink-0" />
                        {getLocalized(temple, 'location', language)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* --- DESKTOP VIEW (hidden md:flex & hidden md:block) --- */}
      <main className="hidden md:flex relative pt-28 lg:pt-32 pb-12 w-full px-4 md:px-12 2xl:px-24 flex-col xl:flex-row gap-8 lg:gap-10">
        
        {/* Left Sidebar */}
        <div className="w-full xl:w-[400px] shrink-0 order-2 xl:order-1">
          <div className="flex items-center gap-3 mb-4 text-[#7A3F1F]">
            <div className="rotate-45 w-2.5 h-2.5 bg-[#e3c299]" />
            <h1 className="text-[28px] font-serif font-black p-0 m-0 leading-none">{t('live_darshan')}</h1>
            <div className="rotate-45 w-2.5 h-2.5 bg-[#e3c299]" />
          </div>
          
          <div className="bg-[#FFF4E8] rounded-2xl p-6 border border-[#F0D5B5] shadow-sm flex flex-col gap-6 relative">
            <div className="space-y-1.5">
              <h2 className="text-[22px] font-serif font-bold text-[#2a1a10] leading-tight flex items-start gap-2">
                <span>{getLocalized(selectedTemple, 'name', language)}</span>
                <BadgeCheck className="w-5 h-5 text-orange-500 fill-orange-100 shrink-0 mt-1" />
              </h2>
              <div className="flex items-center text-[#7A3F1F] font-medium text-[13px]">
                <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-80 shrink-0" />
                {getLocalized(selectedTemple, 'location', language)}
              </div>
            </div>
            
            {/* Desktop Aarti Timings Matching Design */}
            <div className="bg-[#FCF5EA] rounded-xl border border-[#F0D5B5]/60 shadow-sm overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between uppercase pb-1 border-b border-[#F0D5B5]/40">
                  <span className="text-[12px] font-black tracking-widest text-[#2A1A10]/80">
                    {t('opening_hours')}
                  </span>
                  {/* <span className="text-[11px] font-bold text-orange-600 cursor-pointer hover:underline">
                    View All
                  </span> */}
                </div>

                {selectedTemple?.operatingHours && Array.isArray(selectedTemple.operatingHours) && selectedTemple.operatingHours.filter((s: any) => s.active).length > 0 ? (
                  <div className="space-y-0.5">
                    {selectedTemple.operatingHours.filter((s: any) => s.active).map((slot: any, idx: number, arr: any[]) => (
                      <div key={idx} className={`flex items-center justify-between text-[13px] text-[#2a1a10] font-medium py-2 ${idx !== arr.length - 1 ? 'border-b border-[#F0D5B5]/40' : ''}`}>
                        <span className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-[#C16D38] fill-transparent" />
                          <span>{slot.label}</span>
                        </span>
                        <span className="font-bold text-[#7A3F1F]/90">{slot.start} {slot.end ? `- ${slot.end}` : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback Aarti Timings */
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[13px] text-[#2a1a10] font-medium py-2 border-b border-[#F0D5B5]/40">
                      <span className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-[#C16D38]" />
                        <span>{t('kakad_aarti')}</span>
                      </span>
                      <span className="font-bold text-[#7A3F1F]/90">5:30 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] text-[#2a1a10] font-medium py-2 border-b border-[#F0D5B5]/40">
                      <span className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-[#C16D38]" />
                        <span>{t('madhyan_aarti')}</span>
                      </span>
                      <span className="font-bold text-[#7A3F1F]/90">12:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] text-[#2a1a10] font-medium py-2 border-b border-[#F0D5B5]/40">
                      <span className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-[#C16D38]" />
                        <span>{t('dhoop_aarti')}</span>
                      </span>
                      <span className="font-bold text-[#7A3F1F]/90">7:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] text-[#2a1a10] font-medium py-2">
                      <span className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-[#C16D38]" />
                        <span>{t('shej_aarti')}</span>
                      </span>
                      <span className="font-bold text-[#7A3F1F]/90">9:30 PM</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button className="w-full h-12 bg-[#5A1010] hover:bg-[#430707] text-white rounded-xl shadow-md text-sm font-semibold flex items-center justify-center gap-2" asChild>
                <Link href={`/donation?temple=${selectedTemple?.id || ''}`}>
                  <Heart className="w-4 h-4" />
                  {t('actions_donate')}
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full h-12 border-[#DCC3A8] bg-transparent hover:bg-[#F2DFCE] text-[#5A1010] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors" asChild>
                <Link href={`/booking?temple=${selectedTemple?.id || ''}`}>
                  <Calendar className="w-4 h-4" />
                  {t('actions_book_pooja')}
                </Link>
              </Button>

              <Button variant="outline" className="w-full h-12 border-[#DCC3A8] bg-transparent hover:bg-[#F2DFCE] text-[#5A1010] rounded-xl text-sm font-semibold flex items-center justify-center transition-colors" asChild>
                <Link href="/marketplace?category=All">
                  <ShoppingBag className="w-4 h-4 mr-2 shrink-0" />
                  <div className="flex flex-col items-start leading-[1.2]">
                    <span>{t('actions_sacred_items')}</span>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" onClick={handleShare} className="w-full h-12 border-[#DCC3A8] bg-transparent hover:bg-[#F2DFCE] text-[#5A1010] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <Share2 className="w-4 h-4" />
                {t('share_darshan')}
              </Button>
            </div>
            
            {/* Bottom Actions (Animations) */}
            <div className="flex items-center justify-between px-2 pt-5 border-t border-[#F0D5B5]/60 mt-1">
              <button 
                onClick={() => setFlowerTrigger(prev => prev + 1)} 
                className="hover:scale-110 transition-transform active:scale-95 text-[28px] drop-shadow-sm flex-1 flex justify-center"
              >
                🌸
              </button>
              <button 
                onClick={() => setBellTrigger(prev => prev + 1)} 
                className="hover:scale-110 transition-transform active:scale-95 text-[28px] drop-shadow-sm flex-1 flex justify-center"
              >
                🔔
              </button>
              <button 
                onClick={() => setAartiTrigger(prev => prev + 1)} 
                className="hover:scale-110 transition-transform active:scale-95 w-8 h-8 flex items-center justify-center flex-1 drop-shadow-sm mx-auto"
              >
                 <img src="/images/aarti_thali.png" alt="Aarti" className="w-full h-full object-contain" />
              </button>
              <button 
                onClick={() => setDiyaTrigger(prev => prev + 1)} 
                className="hover:scale-110 transition-transform active:scale-95 text-[28px] drop-shadow-sm flex-1 flex justify-center"
              >
                🪔
              </button>
            </div>
          </div>
        </div>

        {/* Right Content / Video */}
        <div className="flex-1 w-full bg-black rounded-xl overflow-hidden relative shadow-2xl flex flex-col justify-center min-h-[50vh] xl:min-h-0 border-2 border-black group order-1 xl:order-2">
          <div className="aspect-video w-full h-full relative flex items-center justify-center">
             {isPlaying && selectedVideoInfo.kind !== "unknown" ? (
                <UniversalVideoPlayer
                  url={selectedTemple.liveUrl || selectedTemple.channelId}
                  className="w-full h-full object-contain bg-black"
                  autoPlay
                  muted
                  controls
                  playsInline
                />
              ) : (
                <>
                  {(() => {
                    const videoId = getYouTubeVideoId(selectedTemple?.liveUrl || selectedTemple?.channelId || "");
                    const thumbSrc = videoId
                      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                      : selectedTemple?.image
                      ? getImageUrl(selectedTemple.image)
                      : "/images/sacred_live_darshan_hero_bg.png";
                    return (
                      <img
                        src={thumbSrc}
                        alt={getLocalized(selectedTemple, 'name', language)}
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
          
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 pointer-events-none">
            <Badge className="bg-red-600 hover:bg-red-600 text-white font-bold h-6 md:h-7 px-3 rounded-full flex items-center animate-pulse border-none shadow-md text-xs">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-2" /> {t('status_live')}
            </Badge>
            <Badge className="bg-black/40 hover:bg-black/40 backdrop-blur-md text-white font-medium h-6 md:h-7 px-3 rounded-full border border-white/20 shadow-md text-xs">
              <Users size={12} className="mr-1.5" /> {selectedTemple?.viewerCount || "1.2K"}
            </Badge>
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <AartiAnimation trigger={aartiTrigger} />
            <FlowerShower trigger={flowerTrigger} />
            <DiyaAnimation trigger={diyaTrigger} />
          </div>
          <BellAnimation trigger={bellTrigger} />
        </div>
      </main>

      {/* --- DESKTOP OTHER LIVE DARSHANS --- */}
      <div className="hidden md:block w-full px-4 md:px-12 2xl:px-24 mb-16 relative">
        {temples.length > 0 && (
          <section id="other-temples">
            <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4 relative z-10">
              <div className="space-y-1 shrink-0 flex items-baseline gap-3">
                <h3 className="text-[20px] font-bold text-[#2a1a10] font-sans">{t('sections_other_temples')}</h3>
                <div className="flex items-center text-red-600 text-[11px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5" />
                  {temples.length} {t('temples_live')}
                </div>
              </div>
            </div>
            
            <div className="relative group/scroll mt-3">
              <div
                ref={scrollRef}
                className="flex gap-4 md:gap-6 overflow-x-auto snap-x no-scrollbar pb-6 scroll-smooth"
              >
                {temples
                  .filter(temple => temple.name.toLowerCase().includes(searchQuery.toLowerCase()) || temple.location.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((temple) => (
                    <motion.div
                      key={temple.id}
                      onClick={() => handleTempleClick(temple)}
                      className={`min-w-[280px] md:min-w-[320px] snap-start cursor-pointer transition-all duration-300 group relative ${selectedTemple.id === temple.id
                        ? "z-10 ring-4 ring-[#5A1010] rounded-2xl scale-[1.02]"
                        : "opacity-90 hover:opacity-100"
                        }`}
                    >
                      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-border/50">
                        <img
                          src={getImageUrl(temple.image)}
                          alt={getLocalized(temple, 'name', language)}
                          className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/sacred_live_darshan_hero_bg.png";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white font-bold text-lg mb-1 line-clamp-1 drop-shadow-md">{getLocalized(temple, 'name', language)}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-white/90 text-xs font-medium">
                              <MapPin size={10} className="mr-1 text-primary" />
                              {getLocalized(temple, 'location', language)}
                            </div>
                            {temple.id === selectedTemple.id && (
                              <Badge className="bg-red-600 text-[9px] font-bold h-4 px-1.5 uppercase animate-pulse border-none shadow-lg">{t('status_now_playing')}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full p-2 text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <Play size={12} fill="white" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
              <button 
                onClick={() => scroll("left")} 
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-[#F0D5B5] flex items-center justify-center text-[#5A1010] transition-colors hover:bg-[#F2DFCE] z-10"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => scroll("right")} 
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-[#F0D5B5] flex items-center justify-center text-[#5A1010] transition-colors hover:bg-[#F2DFCE] z-10"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </section>
        )}
      </div>

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

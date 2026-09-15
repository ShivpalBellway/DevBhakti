"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import {
  User,
  UserPlus,
  Camera,
  Share2,
  Heart,
  Trophy,
  ArrowRight,
  MapPin,
  ChevronRight,
  Smartphone,
  Loader2,
  Sparkles,
  Crown,
  Award,
  X,
} from "lucide-react";

type ParticipantType = "home" | "mandal";

interface GalleryEntry {
  id: string;
  name: string;
  city: string;
  likesCount: number;
  participantType: ParticipantType;
  images: string[];
  caption?: string;
  createdAt: string;
}

const STEPS = [
  { icon: Smartphone, step: "1", title: "1. Download DevBhakti", desc: "Get the app on your phone." },
  { icon: User,       step: "2", title: "2. Register",          desc: "Create your account in a few seconds." },
  { icon: Camera,     step: "3", title: "3. Upload Your Ganesha", desc: "Share a beautiful photo of your Ganpati at home." },
  { icon: Share2,     step: "4", title: "4. Share & Celebrate",  desc: "Show it to your family and friends." },
];

function GalleryCard({
  entry,
  slug,
  onCardClick,
}: {
  entry: GalleryEntry;
  slug: string;
  onCardClick: (entry: GalleryEntry) => void;
}) {
  const [likes, setLikes] = useState(entry.likesCount || 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const primaryImage =
    entry.images && entry.images.length > 0
      ? entry.images[0].startsWith("http") || entry.images[0].startsWith("data:")
        ? entry.images[0]
        : `${BASE_URL}${entry.images[0]}`
      : "/maza-ganesha-hero.png";

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (!user) {
      alert("Please login first to vote for this Ganesha!");
      window.location.href = `/auth?redirect=/campaigns/${slug}`;
      return;
    }

    setLiking(true);
    try {
      const res = await axios.post(`${API_URL}/campaigns/entries/${entry.id}/like`, {
        userId: user?.id,
        userPhone: user?.phone,
      });

      if (res.data.success) {
        setLikes(res.data.likesCount);
        setLiked(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error casting vote!";
      alert(msg);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetUrl = `${window.location.origin}/campaigns/${slug}?entry=${entry.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${entry.name}'s Ganpati on DevBhakti`,
          text: `Vote for ${entry.name}'s Ganpati entry in Maza Ganesha Contest!`,
          url: targetUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(targetUrl);
        alert("Direct Entry Deep Link copied to clipboard!");
      } else {
        alert(`Copy this entry link: ${targetUrl}`);
      }
    }
  };

  return (
    <motion.div
      onClick={() => onCardClick(entry)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
    >
      {/* Top Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={primaryImage}
          alt={entry.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md shadow-sm ${
              entry.participantType === "mandal" ? "bg-[#88542B] text-white" : "bg-white/90 text-[#3d1a10]"
            }`}
          >
            {entry.participantType === "mandal" ? "Mandal" : "Home"}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex flex-col justify-between flex-1">
        {/* Action Row: Heart + Like Count on Left, Share Icon on Right */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-2 group/btn cursor-pointer outline-none"
          >
            <div className={`p-1.5 rounded-full transition-colors ${liked ? "bg-red-50 text-red-500" : "group-hover/btn:bg-red-50 text-red-500"}`}>
              <Heart className={`w-5 h-5 fill-red-500 text-red-500 transition-transform group-hover/btn:scale-110`} />
            </div>
            <span className="font-bold text-sm text-slate-800">{likes}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-1.5 rounded-full text-slate-600 hover:text-[#88542B] hover:bg-orange-50 transition-colors cursor-pointer"
            title="Share Entry Link"
          >
            <Share2 className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Devotee / Mandal Name & City */}
        <div>
          <h3 className="font-bold text-[#3d1a10] text-base leading-snug truncate">
            {entry.name}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm font-normal mt-0.5 truncate">
            {entry.city}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Lightbox Entry Modal Popup Component
// ─────────────────────────────────────────────
function EntryModal({
  entry,
  slug,
  onClose,
}: {
  entry: GalleryEntry;
  slug: string;
  onClose: () => void;
}) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [likes, setLikes] = useState(entry.likesCount || 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const images =
    entry.images && entry.images.length > 0
      ? entry.images.map((img) =>
          img.startsWith("http") || img.startsWith("data:") ? img : `${BASE_URL}${img}`
        )
      : ["/maza-ganesha-hero.png"];

  const handleLike = async () => {
    if (liking) return;
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (!user) {
      alert("Please login first to vote for this Ganesha!");
      window.location.href = `/auth?redirect=/campaigns/${slug}?entry=${entry.id}`;
      return;
    }

    setLiking(true);
    try {
      const res = await axios.post(`${API_URL}/campaigns/entries/${entry.id}/like`, {
        userId: user?.id,
        userPhone: user?.phone,
      });

      if (res.data.success) {
        setLikes(res.data.likesCount);
        setLiked(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error casting vote!";
      alert(msg);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const targetUrl = `${window.location.origin}/campaigns/${slug}?entry=${entry.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${entry.name}'s Ganpati on DevBhakti`,
          text: `Check out ${entry.name}'s Ganpati entry in ${slug} contest!`,
          url: targetUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(targetUrl);
        alert("Direct Entry Deep Link copied to clipboard!");
      } else {
        alert(`Copy this entry link: ${targetUrl}`);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1a0b07]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-[#88542B]/30 flex flex-col max-h-[90vh]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#3d1a10]/70 hover:bg-[#3d1a10] text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-amber-200/20 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header / Type */}
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-gradient-to-r from-[#88542B] to-[#3d1a10] text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-lg border border-amber-300/30">
              {entry.participantType === "mandal" ? "Mandal Entry" : "Home Entry"}
            </span>
          </div>

          {/* Image Viewport — Rich Warm Brown Theme */}
          <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#2a120b] via-[#3d1a10] to-[#2a120b] overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={images[currentImgIdx]}
              alt={entry.name}
              className="w-full h-full object-contain"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#3d1a10]/70 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-amber-200/20">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImgIdx(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImgIdx ? "bg-[#CA9E52] w-5" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="p-6 overflow-y-auto space-y-4 bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-amber-100 pb-4">
              <div>
                <h3 className="text-2xl font-serif font-black text-[#3d1a10]">
                  {entry.name}
                </h3>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                  <MapPin className="w-4 h-4 text-[#88542B]" />
                  <span className="capitalize font-medium text-slate-600">{entry.city}</span>
                </div>
              </div>

              {/* Vote & Share Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-sm ${
                    liked
                      ? "bg-red-500 text-white"
                      : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                  <span>{likes}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-2xl bg-[#fdf8f0] hover:bg-amber-100/70 text-[#88542B] border border-amber-200/80 transition-colors cursor-pointer shadow-xs"
                  title="Share Entry Link"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Caption / Note */}
            {entry.caption && (
              <div className="bg-[#fdf8f0] p-4 rounded-2xl border border-amber-200/80 shadow-xs">
                <p className="text-[#3d1a10] text-sm italic font-medium leading-relaxed">
                  &ldquo;{entry.caption}&rdquo;
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// CMS Banner Strip — fetches dynamic campaign page banners
// ─────────────────────────────────────────────
function CmsBannerStrip({ slug }: { slug: string }) {
  const [banners, setBanners] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!slug) return;
    axios
      .get(`${API_URL}/admin/cms/banners`, { params: { page: slug } })
      .then((res) => {
        const active = (res.data.data || []).filter((b: any) => b.active);
        if (active.length > 0) {
          setBanners(active);
        } else {
          setBanners([{ id: "default", image: "/maza-ganesha-hero.png" }]);
        }
      })
      .catch(() => {
        setBanners([{ id: "default", image: "/maza-ganesha-hero.png" }]);
      });
  }, [slug]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = setInterval(next, 3000);
    return () => clearInterval(t);
  }, [paused, next, banners.length]);

  if (banners.length === 0) return null;

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 1 }),
    center: { x: 0, opacity: 1, zIndex: 1 },
    exit:   (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 1, zIndex: 0 }),
  };

  return (
    <div
      className="relative w-full overflow-hidden group bg-black"
      style={{ height: "clamp(180px, 40vw, 560px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 } }}
          className="absolute inset-0"
        >
          <motion.div
            className="w-full h-full"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <img
              src={banners[current].image.startsWith("http") || banners[current].image.startsWith("data:")
                ? banners[current].image
                : `${BASE_URL}${banners[current].image}`}
              alt="Maza Ganesha Banner"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-6 md:left-12 flex items-center gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`rounded-full transition-all duration-500 ${
                i === current ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Floating CTA Button Overlay on Banner */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-30">
        <Link
          href={`/campaigns/${slug}/participate`}
          className="bg-gradient-to-r from-[#CA9E52] via-[#88542B] to-[#3d1a10] hover:from-[#88542B] hover:to-[#CA9E52] text-white font-black text-xs sm:text-sm md:text-base px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full shadow-2xl backdrop-blur-md border border-white/30 flex items-center gap-2 hover:scale-105 transition-all duration-300 group"
        >
          <span>Tell Us About Your Ganpati 🙏</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Progress bar */}
      {banners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <motion.div
            key={`pb-${current}-${paused}`}
            initial={{ width: "0%" }}
            animate={{ width: paused ? "0%" : "100%" }}
            transition={{ duration: paused ? 0 : 3, ease: "linear" }}
            className="h-full bg-gradient-to-r from-[#CA9E52] to-[#88542B]"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
export default function MazaGaneshaClient({ slug = "maza-ganesha" }: { slug?: string }) {
  const [activeTab, setActiveTab] = useState<"popular" | "latest">("popular");
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [winner, setWinner] = useState<any | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<GalleryEntry | null>(null);

  // Deep Link Support: Check for ?entry=ENTRY_ID in URL query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const entryId = params.get("entry") || params.get("entryId");
      if (entryId) {
        axios
          .get(`${API_URL}/campaigns/entries/single/${entryId}`)
          .then((res) => {
            if (res.data?.success && res.data?.data) {
              setSelectedEntry(res.data.data);
            }
          })
          .catch((err) => console.error("Error loading deep-linked entry:", err));
      }
    }
  }, []);

  // Fetch Campaign Info (including Winner) & Gallery Entries
  useEffect(() => {
    setLoading(true);

    // Fetch winner info
    axios
      .get(`${API_URL}/campaigns/info/${slug}`)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setCampaignInfo(res.data.data);
          if (res.data.data.winner) {
            setWinner(res.data.data.winner);
          }
        }
      })
      .catch(() => {});

    // Fetch entries
    axios
      .get(`${API_URL}/campaigns/gallery`, { params: { slug, sortBy: activeTab } })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setEntries(res.data.data);
        }
      })
      .catch((err) => console.error("Error fetching gallery:", err))
      .finally(() => setLoading(false));
  }, [activeTab, slug]);

  return (
    <div className="pt-24 xl:pt-28">
      {/* CMS Banner Strip */}
      <CmsBannerStrip slug={slug} />

      {/* ══════════════════════════════════════════════════════════════
          PUBLISHED WINNER CARD (Visible when Admin publishes winner)
      ══════════════════════════════════════════════════════════════ */}
      {winner && winner.entry && (
        <section className="py-10 bg-gradient-to-b from-[#fdf8f0] to-white border-b border-amber-200/60">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-[#3d1a10] via-[#542416] to-[#35150c] rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border-2 border-amber-400/50"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="relative shrink-0">
                  <img
                    src={winner.winnerImage || winner.entry.images[0] || "/maza-ganesha-hero.png"}
                    alt={winner.entry.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-amber-400 shadow-xl"
                  />
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-amber-400 text-[#3d1a10] flex items-center justify-center shadow-lg font-black">
                    <Crown className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-2 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                    <Award className="w-4 h-4 text-amber-400" /> Contest Winner Announced 🎉
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {winner.entry.name} — {winner.entry.city}
                  </h3>

                  <p className="text-amber-200 text-sm font-bold">
                    Prize: {winner.prize}
                  </p>
                  <p className="text-white/70 text-xs italic">
                    &ldquo;{winner.tagline}&rdquo;
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 xl:py-20 bg-[#fdf8f0]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl xl:text-4xl font-black text-[#3d1a10] mb-2 font-serif">How It Works</h2>
            <p className="text-[#88542B]/75 text-sm sm:text-base font-medium">It&apos;s simple. Just 4 easy steps.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 w-full">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex flex-col items-center text-center px-4 ${
                  i < STEPS.length - 1 ? "md:border-r md:border-amber-200/60" : ""
                }`}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#fdeedc] flex items-center justify-center mb-4 transition-transform hover:scale-105 shadow-sm">
                  <s.icon className="w-9 h-9 sm:w-10 sm:h-10 text-[#794a05] stroke-[2.2]" />
                </div>
                <h3 className="font-bold text-[#3d1a10] text-base sm:text-lg mb-1 leading-snug">{s.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-[200px]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GALLERY SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 xl:py-20 bg-[#fdf8f0]">
        <div className="container mx-auto px-4">
          {/* Header Row with Centered Title & Subtitle + Top-Right Tabs */}
          <div className="relative mb-12 flex flex-col md:block items-center">
            {/* Centered Heading & Subtitle */}
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl xl:text-4xl font-serif font-black text-[#3d1a10] mb-2">
                Our Ganesha Gallery
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm xl:text-base font-normal leading-relaxed">
                See Ganeshas from homes across India. Like your favourites and share the joy!
              </p>
            </div>

            {/* Popular / Latest Tab Switcher on Top-Right */}
            <div className="mt-6 md:mt-0 md:absolute md:top-0 md:right-0 flex items-center gap-2 bg-white/60 p-1 rounded-2xl border border-orange-100/80 shadow-xs">
              {(["popular", "latest"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 cursor-pointer ${
                    activeTab === tab
                      ? "bg-[#88542B] text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab === "popular" ? "Popular" : "Latest"}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery grid */}
          {loading ? (
            <div className="py-20 text-center text-[#88542B] flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="font-bold text-sm">Loading Ganesha Gallery...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-orange-100 max-w-lg mx-auto p-8 shadow-sm">
              <Sparkles className="w-10 h-10 text-[#CA9E52] mx-auto mb-3" />
              <h3 className="font-bold text-lg text-[#3d1a10] mb-1">Be the First to Participate!</h3>
              <p className="text-xs text-slate-400 mb-5">No entries submitted yet. Upload your Ganesha idol now!</p>
              <Link
                href={`/campaigns/${slug}/participate`}
                className="bg-[#88542B] hover:bg-[#CA9E52] text-white font-bold px-6 py-2.5 rounded-full text-xs transition-all inline-block"
              >
                Tell Us About Your Ganpati 🙏
              </Link>
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-5 xl:gap-6"
                >
                  {entries.map((entry) => (
                    <GalleryCard
                      key={entry.id}
                      entry={entry}
                      slug={slug}
                      onCardClick={(e) => setSelectedEntry(e)}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Load More Button */}
              <div className="mt-12 text-center">
                <button
                  onClick={() => alert("All entries loaded!")}
                  className="bg-white hover:bg-slate-50 text-[#3d1a10] border border-slate-200 font-bold px-8 py-2.5 rounded-xl shadow-xs text-sm transition-all cursor-pointer"
                >
                  Load More
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WIN PRIZES BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-between gap-6 bg-gradient-to-r from-[#3d1a10] to-[#88542B] rounded-2xl px-8 py-7 shadow-xl"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-[#CA9E52] flex items-center justify-center shrink-0 shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-xl xl:text-2xl">Win Exciting Prizes!</h3>
                <p className="text-white/70 text-sm mt-0.5 leading-relaxed">
                  Our expert jury will select the winning entries.{" "}
                  <span className="text-white/45">
                    Likes and shares are for engagement only and do not determine the winners.
                  </span>
                </p>
              </div>
            </div>
            <Link
              href={`/campaigns/${slug}/participate`}
              className="shrink-0 inline-flex items-center gap-2 bg-[#CA9E52] hover:bg-white hover:text-[#88542B] text-white font-bold px-7 py-3 rounded-full transition-all duration-300 text-sm whitespace-nowrap shadow"
            >
              Participate Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Lightbox Entry Modal Popup */}
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          slug={slug}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

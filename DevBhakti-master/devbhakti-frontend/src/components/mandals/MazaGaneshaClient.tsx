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
  Search,
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

interface EntryModalProps {
  entry: GalleryEntry;
  slug: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalEntries?: number;
}

function EntryModal({
  entry,
  slug,
  onClose,
  onPrev,
  onNext,
  currentIndex = 1,
  totalEntries = 1,
}: EntryModalProps) {
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

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-black/95 backdrop-blur-md select-none">
        {/* Top Header Bar — Counter & Close Button */}
        <div className="w-full flex items-center justify-between z-20">
          <div className="bg-white/10 text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
            {currentIndex} / {totalEntries}
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-lg"
            title="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Left Arrow Button */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-xl cursor-pointer"
            title="Previous Entry"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
        )}

        {/* Right Arrow Button */}
        {onNext && (
          <button
            onClick={onNext}
            className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-xl cursor-pointer"
            title="Next Entry"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Center Image Container */}
        <div className="relative flex-1 w-full max-w-4xl my-4 flex items-center justify-center overflow-hidden">
          <motion.img
            key={images[currentImgIdx]}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            src={images[currentImgIdx]}
            alt={entry.name}
            className="max-h-[65vh] sm:max-h-[72vh] w-auto max-w-full object-contain rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10"
          />

          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md z-20">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImgIdx(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentImgIdx ? "bg-[#CA9E52] w-6" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Details Overlay Panel */}
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/20 shadow-2xl z-20 text-[#3d1a10]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#88542B] text-white">
                  {entry.participantType === "mandal" ? "Mandal" : "Home"}
                </span>
                <h3 className="text-base sm:text-xl font-serif font-black text-[#3d1a10] truncate">
                  {entry.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#88542B]" />
                <span className="capitalize font-medium">{entry.city}</span>
              </div>
            </div>

            {/* Like & Share */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  liked
                    ? "bg-red-500 text-white"
                    : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span>{likes}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-[#88542B] border border-slate-200 transition-colors cursor-pointer"
                title="Share Entry"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {entry.caption && (
            <p className="mt-2.5 text-slate-600 text-xs sm:text-sm italic border-t border-slate-200/60 pt-2 truncate">
              &ldquo;{entry.caption}&rdquo;
            </p>
          )}
        </div>
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

  const handleBannerClick = (b: any) => {
    if (b.targetType === 'POOJA' && (b.targetSlug || b.targetId)) { window.location.href = `/poojas/${b.targetSlug || b.targetId}`; return; }
    if (b.targetType === 'TEMPLE' && (b.targetSlug || b.targetId)) { window.location.href = `/temples/${b.targetSlug || b.targetId}`; return; }
    if (b.targetType === 'PRODUCT' && (b.targetSlug || b.targetId)) { window.location.href = `/products/${b.targetSlug || b.targetId}`; return; }
    if (b.targetType === 'MANDAL' && (b.targetSlug || b.targetId)) { window.location.href = `/mandals/${b.targetSlug || b.targetId}`; return; }
    if (b.targetType === 'CONTEST' && (b.targetSlug || b.targetId)) { window.location.href = `/campaigns/${b.targetSlug || b.targetId}`; return; }
    if (b.targetType === 'CUSTOM_URL' && b.customUrl) { window.location.href = b.customUrl; return; }

    const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("user_token")) : null;

    if (savedUserStr || token) {
      window.location.href = `/campaigns/${slug}/participate`;
    } else {
      window.location.href = `/campaigns/${slug}/auth?redirect=/campaigns/${slug}/participate`;
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden group bg-black cursor-pointer"
      style={{ height: "clamp(180px, 40vw, 560px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => handleBannerClick(banners[current])}
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
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
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
              onClick={(e) => { e.stopPropagation(); setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`rounded-full transition-all duration-500 ${
                i === current ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}



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
  const [activeTab, setActiveTab] = useState<"popular" | "latest" | "alphabetical">("popular");
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [winner, setWinner] = useState<any | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<GalleryEntry | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      entry.name?.toLowerCase().includes(q) ||
      entry.city?.toLowerCase().includes(q) ||
      entry.caption?.toLowerCase().includes(q)
    );
  });

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
    setPage(1);

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

    // Fetch initial gallery entries (12 per page)
    axios
      .get(`${API_URL}/campaigns/gallery`, { params: { slug, sortBy: activeTab, page: 1, limit: 12 } })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setEntries(res.data.data);
          setHasMore(!!res.data.hasMore);
        }
      })
      .catch((err) => console.error("Error fetching gallery:", err))
      .finally(() => setLoading(false));
  }, [activeTab, slug]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await axios.get(`${API_URL}/campaigns/gallery`, {
        params: { slug, sortBy: activeTab, page: nextPage, limit: 12 },
      });
      if (res.data.success && res.data.data) {
        setEntries((prev) => [...prev, ...res.data.data]);
        setPage(nextPage);
        setHasMore(!!res.data.hasMore);
      }
    } catch (err) {
      console.error("Error loading more entries:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="pt-[72px] md:pt-[88px]">
      {/* CMS Banner Strip */}
      <CmsBannerStrip slug={slug} />

      {/* ══════════════════════════════════════════════════════════════
          PUBLISHED WINNER CARD (Visible when Admin publishes winner)
      ══════════════════════════════════════════════════════════════ */}
      {winner && winner.entry && (
        <section className="py-12 sm:py-16 bg-gradient-to-b from-[#fdf8f0] via-amber-50/40 to-[#fdf8f0] border-b border-amber-200/50">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-[#2a110a] via-[#3d1a10] to-[#4a1e12] rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border-2 border-[#CA9E52]/70"
            >
              {/* Decorative Background Glows */}
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                {/* Winner Image with Golden Crown Badge */}
                <div className="relative shrink-0 group">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-[#CA9E52] to-amber-300 rounded-3xl blur-xs opacity-75 group-hover:opacity-100 transition duration-500" />
                  <img
                    src={winner.winnerImage || winner.entry.images[0] || "/maza-ganesha-hero.png"}
                    alt={winner.entry.name}
                    className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover border-4 border-[#CA9E52] shadow-2xl"
                  />
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-[#3d1a10] flex items-center justify-center shadow-xl border-2 border-white font-black animate-bounce">
                    <Crown className="w-7 h-7 fill-current" />
                  </div>
                </div>

                {/* Winner Info Details */}
                <div className="text-center md:text-left space-y-3 flex-1">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#3d1a10] text-xs sm:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                    <Trophy className="w-4 h-4 fill-current" /> Contest Winner Announced 🎉
                  </div>

                  <h3 className="text-3xl sm:text-4xl xl:text-5xl font-serif font-black text-white capitalize leading-tight">
                    {winner.entry.name}
                  </h3>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-amber-200 text-sm font-bold bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span className="capitalize">{winner.entry.city}</span>
                    </div>

                    <div className="flex items-center gap-2 text-amber-300 text-sm font-bold bg-amber-400/20 px-4 py-1.5 rounded-xl border border-amber-400/30">
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>Prize: {winner.prize}</span>
                    </div>
                  </div>

                  {winner.tagline && (
                    <p className="text-amber-100/90 text-sm sm:text-base italic pt-2 font-medium leading-relaxed max-w-xl">
                      &ldquo;{winner.tagline}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="pt-6 sm:pt-8 pb-12 sm:pb-16 bg-[#fdf8f0]">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 w-full mb-10">
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

          {/* Participate CTA Button below How It Works */}
          <div className="flex justify-center">
            <Link
              href={`/campaigns/${slug}/participate`}
              className="bg-gradient-to-r from-[#CA9E52] via-[#88542B] to-[#3d1a10] hover:from-[#3d1a10] hover:to-[#CA9E52] text-white font-black text-base sm:text-lg px-8 py-3 rounded-full shadow-lg border border-amber-300/40 flex items-center gap-3 hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <span>Participate Now 🙏</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GALLERY SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 xl:py-20 bg-[#fdf8f0]">
        <div className="container mx-auto px-4">
          {/* Centered Gallery Title & Subtitle */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl xl:text-4xl font-serif font-black text-[#3d1a10] mb-2">
              Our Ganesha Gallery
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              See Ganeshas from homes across India. Like your favourites and share the joy!
            </p>
          </div>

          {/* Controls Bar: Popular / Latest / A-Z Tabs on Left, Working Search Bar on Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-amber-200/40">
            {/* Filter Tabs */}
            <div className="inline-flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-amber-200/60 shadow-sm shrink-0 self-start sm:self-auto">
              {(["popular", "latest", "alphabetical"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === tab
                      ? "bg-[#88542B] text-white shadow-xs"
                      : "bg-transparent text-slate-600 hover:text-[#3d1a10] hover:bg-slate-50"
                  }`}
                >
                  {tab === "popular" ? "Popular" : tab === "latest" ? "Latest" : "A - Z"}
                </button>
              ))}
            </div>

            {/* Real-time Working Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88542B]/70" />
              <input
                type="text"
                placeholder="Search by name, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-white border border-amber-200/80 rounded-2xl text-xs sm:text-sm font-medium text-[#3d1a10] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#88542B]/40 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
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
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-amber-200/60 max-w-md mx-auto p-8 shadow-xs">
              <Search className="w-8 h-8 text-[#88542B]/50 mx-auto mb-2" />
              <h4 className="font-bold text-base text-[#3d1a10]">No entries found</h4>
              <p className="text-xs text-slate-500 mt-1">No Ganesha entries match &ldquo;{searchQuery}&rdquo;</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-xs font-bold text-[#88542B] underline cursor-pointer"
              >
                Clear Search Filter
              </button>
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
                  {filteredEntries.map((entry) => (
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
                  onClick={handleLoadMore}
                  disabled={loadingMore || !hasMore}
                  className="inline-flex items-center gap-2 bg-[#3d1a10] hover:bg-[#542416] text-[#fdf8f0] font-bold px-9 py-3 rounded-full shadow-md border border-[#CA9E52]/40 text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
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
              className="shrink-0 inline-flex items-center gap-2 bg-[#CA9E52] hover:bg-white hover:text-[#88542B] text-[#3d1a10] hover:text-[#88542B] font-bold px-7 py-3 rounded-full transition-all duration-300 text-sm whitespace-nowrap shadow"
            >
              Participate Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Lightbox Entry Modal Popup — Fullscreen Dark Viewer matching Image 2 */}
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          slug={slug}
          onClose={() => setSelectedEntry(null)}
          onPrev={
            entries.findIndex((e) => e.id === selectedEntry.id) > 0
              ? () => {
                  const idx = entries.findIndex((e) => e.id === selectedEntry.id);
                  if (idx > 0) setSelectedEntry(entries[idx - 1]);
                }
              : undefined
          }
          onNext={
            entries.findIndex((e) => e.id === selectedEntry.id) < entries.length - 1
              ? () => {
                  const idx = entries.findIndex((e) => e.id === selectedEntry.id);
                  if (idx < entries.length - 1) setSelectedEntry(entries[idx + 1]);
                }
              : undefined
          }
          currentIndex={entries.findIndex((e) => e.id === selectedEntry.id) + 1}
          totalEntries={entries.length}
        />
      )}
    </div>
  );
}

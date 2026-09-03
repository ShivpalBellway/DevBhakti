"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Heart,
  Video,
  Share2,
  Phone,
  Mail,
  Users,
  Award,
  Building2,
  Sparkles,
  Gift,
  ArrowLeft,
  Clock,
  CheckCircle,
  ExternalLink,
  Link,
  User,
  X,
  Flower2,
  ShoppingBag,
  IndianRupee,
  Compass,
  FileText,
  Camera,
  Flame,
  Sun,
  Moon,
  Info,
  Navigation,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { API_URL } from "@/config/apiConfig";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized } from "@/utils/localization";
import { stripHtml } from "@/utils/textUtils";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { fetchPublicProducts } from "@/api/publicController";

type MandalTab =
  | "overview"
  | "gallery"
  | "live"
  | "poojas"
  | "aarti"
  | "events"
  | "sacred"
  | "donate"
  | "about"
  | "location";

const TRANSACTION_TABS: MandalTab[] = ["poojas", "sacred", "donate"];

export function MandalDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mandal, setMandal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [activeTab, setActiveTab] = useState<MandalTab>("overview");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const { language, t } = useLanguage();
  const canUseMandalTransactions = mandal?.isActive === true && String(mandal?.status || "").toUpperCase() === "APPROVED";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const savedUserStr = localStorage.getItem("user");
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        setCurrentUser(u);
        if (u.name && !donorName) setDonorName(u.name);
        if (u.email && !donorEmail) setDonorEmail(u.email);
        if (u.phone && !donorPhone) setDonorPhone(u.phone);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, [showDonateModal]);

  useEffect(() => {
    if (slug) {
      loadMandal();
    }
  }, [slug, language]);

  useEffect(() => {
    if (mandal?.id) {
      loadSacredProducts(mandal.id);
    }
  }, [mandal?.id, language]);

  useEffect(() => {
    if (mandal && !canUseMandalTransactions && TRANSACTION_TABS.includes(activeTab)) {
      setActiveTab("overview");
    }
  }, [activeTab, canUseMandalTransactions, mandal]);

  const loadMandal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/mandals/${slug}?lang=${language}`);
      const data = await response.json();
      if (data.success) {
        setMandal(data.data);
        if (data.data.products && Array.isArray(data.data.products) && data.data.products.length > 0) {
          setProducts(data.data.products);
        }
      } else {
        toast({
          title: t("common.error"),
          description: data.message || t("mandal_detail.load_error_desc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading mandal:", error);
    }
    setLoading(false);
  };

  const loadSacredProducts = async (mandalId?: string) => {
    if (mandal?.products && Array.isArray(mandal.products) && mandal.products.length > 0) {
      setProducts(mandal.products);
      return;
    }

    try {
      const data = await fetchPublicProducts({ mandalId, lang: language, limit: 20 });
      const productList = Array.isArray(data) ? data : (data?.products || []);
      if (productList.length > 0) {
        setProducts(productList);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching sacred products:", error);
      setProducts([]);
    }
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return "https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&q=80&w=1200";
    if (path.startsWith("http")) return path;
    return `${API_URL.replace("/api", "")}${path}`;
  };

  const getAllImages = (): string[] => {
    const imgs: string[] = [];
    if (mandal?.image) imgs.push(mandal.image);
    if (mandal?.bannerImages && Array.isArray(mandal.bannerImages)) {
      mandal.bannerImages.forEach((img: string) => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs.length > 0 ? imgs : ["https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&q=80&w=1200"];
  };
  const isIndianUser = (phone: string): boolean => {
      if (!phone) return true;
      let hasExplicitPlus = phone.trim().startsWith('+');
      let cleaned = phone.replace(/\D/g, '');
      
      if (cleaned.startsWith('00')) {
          cleaned = cleaned.substring(2);
          hasExplicitPlus = true;
      }
      
      if (hasExplicitPlus) {
          return cleaned.startsWith('91') || cleaned.startsWith('9191');
      }
      
      if (cleaned.length === 11 && cleaned.startsWith('0')) return true;
      if (cleaned.length === 12 && cleaned.startsWith('91')) return true;
      if (cleaned.length === 10) return true;
      
      return false;
  };

  const isInternational = currentUser?.phone ? !isIndianUser(currentUser.phone) : false;

  const handleDonate = async () => {
    if (!canUseMandalTransactions) {
      toast({
        title: "Donations Disabled",
        description: "Donations are enabled only for approved and active mandals.",
        variant: "destructive",
      });
      return;
    }

    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please select or enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    if (!donorEmail.trim() || !donorPhone.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email and phone number to receive the donation receipt.",
        variant: "destructive",
      });
      return;
    }

    setIsDonating(true);
    try {
      const response = await fetch(`${API_URL}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandalId: mandal.id,
          amount,
          donorName: isAnonymous ? "Anonymous" : (donorName || currentUser?.name || "Devotee"),
          donorEmail: donorEmail || currentUser?.email,
          donorPhone: donorPhone || currentUser?.phone,
          message: donationMessage,
          anonymous: isAnonymous,
          userId: currentUser?.id || undefined,
        }),
      });
      const data = await response.json();
      if (data.success && data.order && data.order.id) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(amount * 100),
          currency: "INR",
          name: mandal.name?.en || mandal.name || "Mandal",
          description: `Donation to ${mandal.name?.en || mandal.name || "Mandal"}`,
          order_id: data.order.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderType: "DONATION",
                  referenceId: data.donationId,
                  orderData: { donationId: data.donationId },
                }),
              });
              const verifyData = await verifyRes.json();
              
              if (verifyData.success) {
                toast({
                  title: "Donation Successful! 🙏",
                  description: "Thank you for your contribution. A receipt has been sent to your email.",
                });
                setShowDonateModal(false);
                loadMandal();
              } else {
                toast({
                  title: "Verification Failed",
                  description: verifyData.message || "Payment verification failed",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Verification Error:", error);
            }
          },
          prefill: {
            name: isAnonymous ? "Anonymous" : (donorName || currentUser?.name || ""),
            email: donorEmail || currentUser?.email || "",
            contact: donorPhone || currentUser?.phone || "",
          },
          theme: {
            color: "#6B0F1A",
          },
        };
        setShowDonateModal(false);
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        toast({
          title: "Error",
          description: data.message || "Could not initialize payment order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Donation error:", error);
    }
    setIsDonating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar isSolid={true} />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!mandal) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar isSolid={true} />
        <div className="flex flex-col items-center justify-center py-32">
          <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-2">Mandal Not Found</h2>
          <p className="text-zinc-500 mb-6">The requested Mandal details could not be found.</p>
          <Button onClick={() => router.push("/mandals")} className="bg-[#6B0F1A] text-white">
            Back to Mandals List
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const name = getLocalized(mandal, "name", language) || mandal.name || "Mandal";
  const description = getLocalized(mandal, "description", language) || mandal.description || "";
  const allImages = getAllImages();

  const donationAmounts = [500, 1000, 2500, 5000, 10000];

  // ── Section visibility helpers ──
  const hasLiveDarshan = !!(mandal?.isLive || mandal?.liveUrl);
  const hasEvents = !!(mandal?.events && mandal.events.length > 0);
  const hasPoojas = !!(mandal?.poojas && mandal.poojas.length > 0);
  const hasProducts = products.length > 0;
  const hasDescription = !!description;
  const hasLocation = !!(mandal?.address || mandal?.city || mandal?.state);
  const hasContact = !!(mandal?.phone || mandal?.contactPhone || mandal?.email || mandal?.contactEmail || mandal?.websiteUrl);
  const hasSocialLinks = !!(mandal?.instagramUrl || mandal?.instagram || mandal?.youtubeUrl || mandal?.youtube || mandal?.facebookUrl || mandal?.facebook);
  const hasContactOrSocial = hasContact || hasSocialLinks;

  // Helper to convert YouTube watch link to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/").split("&")[0];
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/").split("?")[0];
    }
    return url;
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id as any);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Compute adaptive column count for Row 1
  const row1Sections = [true, hasLiveDarshan, hasEvents].filter(Boolean).length; // gallery always shows
  const liveColSpan = hasEvents ? 2 : 3; // Live Darshan expands if no Events

  const tabsList = [
    { id: "gallery", label: t("mandal_detail.tab_gallery"), icon: Camera },
    ...(hasLiveDarshan ? [{ id: "live", label: t("mandal_detail.live_darshan"), icon: Video }] : []),
    ...(hasEvents ? [{ id: "events", label: t("mandal_detail.tab_events"), icon: Calendar }] : []),
    ...(hasPoojas ? [{ id: "poojas", label: t("common.poojas_sevas"), icon: Gift }] : []),
    { id: "donate", label: t("mandal_detail.donate_now"), icon: IndianRupee },
    ...(hasProducts ? [{ id: "sacred", label: t("common.sacred_items"), icon: ShoppingBag }] : []),
    ...(hasDescription ? [{ id: "about", label: t("mandal_detail.tab_about"), icon: Info }] : []),
    ...(hasLocation ? [{ id: "location", label: t("mandal_list.location"), icon: MapPin }] : []),
    ...(hasContactOrSocial ? [{ id: "contact", label: t("mandal_detail.contact_info"), icon: Phone }] : []),
  ].filter((tab) => canUseMandalTransactions || !TRANSACTION_TABS.includes(tab.id as MandalTab));

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900">
      {/* Solid Top Navbar */}
      <Navbar isSolid={true} />

      {/* ─── HERO BANNER SECTION (MATCHING TEMPLE DETAIL HERO HEIGHT) ───────────────── */}
      <section className="relative bg-gradient-to-r from-[#160403] via-[#2A0A06] to-[#120302] text-white pt-28 pb-12 px-4 md:px-8 lg:px-12 border-b border-amber-900/20 overflow-hidden min-h-[520px] lg:min-h-[580px] flex flex-col justify-center">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="w-full max-w-[1700px] mx-auto relative z-10">
          
          {/* Breadcrumb Back Button */}
          <div className="mb-4">
            <button
              onClick={() => router.push("/mandals")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200/80 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("mandal_detail.back_to_mandals")}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT HALF (7 COLS): DETAILS & ACTION CTAs & STATS BOX */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              
              {/* Main Title & Type */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
                  {name}
                </h1>
                <div className="text-amber-400 font-semibold text-sm sm:text-base tracking-wide">
                  {mandal.mandalType || "Ganesh Mandal"}
                </div>
              </div>

              {/* Sub-info Rows */}
              <div className="space-y-2 text-xs sm:text-sm text-amber-100/80 font-medium">
                {/* Location Row */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {[mandal.address, mandal.city, mandal.state].filter(Boolean).join(", ") ||
                      "Lalbaug, Mumbai, Maharashtra"}
                  </span>
                </div>

                {/* Dates Row */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Ganesh Chaturthi: 27 Aug – Anant Chaturdashi: 6 Sep 2026
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Live Darshan Button (if mandal has live stream / isLive) */}
                {(mandal?.isLive || mandal?.liveUrl) && (
                  <Button
                    onClick={() => {
                      setActiveTab("live");
                      const el = document.getElementById("mandal-tabs-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-5 sm:px-6 h-12 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-red-900/40 border border-red-500/30 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="leading-tight font-bold text-white">Live Darshan</div>
                      <div className="text-[10px] font-semibold text-red-100 opacity-90">Watch Now</div>
                    </div>
                  </Button>
                )}

                {canUseMandalTransactions && (
                  <>
                    {/* Pooja & Seva Book Now */}
                    <Button
                      onClick={() => router.push(`/mandals/${slug}/booking`)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 h-12 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-900/30"
                    >
                      <Gift className="w-4 h-4 text-slate-950" />
                      <div className="text-left">
                        <div className="leading-tight font-black">{t("common.poojas_sevas")}</div>
                        <div className="text-[10px] font-semibold opacity-90">{t("common.book_now")}</div>
                      </div>
                    </Button>

                    {/* Donate Now Support Mandal */}
                    <Button
                      onClick={() => {
                          if (isInternational) {
                              toast({
                                  title: "FCRA Restriction",
                                  description: "International donations are restricted by law (FCRA). Razorpay order creation disabled.",
                                  variant: "destructive",
                              });
                              return;
                          }
                          setShowDonateModal(true);
                      }}
                      disabled={isInternational}
                      variant="outline"
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold px-6 h-12 rounded-xl text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IndianRupee className="w-4 h-4 text-amber-400" />
                      <div className="text-left">
                        <div className="leading-tight font-bold">{isInternational ? "FCRA Restricted" : t("mandal_detail.donate_now")}</div>
                        <div className="text-[10px] font-normal text-amber-200/80">{t("mandal_detail.support_mandal")}</div>
                      </div>
                    </Button>
                  </>
                )}
              </div>

              {/* Utility Interaction Row */}
              <div className="flex items-center gap-5 text-xs text-amber-200/70">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{isLiked ? t("mandal_detail.liked") : t("mandal_detail.like")}</span>
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: name, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: "Link copied to clipboard!" });
                    }
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t("common.share")}</span>
                </button>
                <button
                  onClick={() => setActiveTab("location")}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{t("common.directions")}</span>
                </button>
              </div>

              {/* Bottom 4-Stat Box (Matching Screenshot) */}
              <div className="bg-black/40 backdrop-blur-md border border-amber-500/20 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {/* Stat 1: Established */}
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">{t("mandal_detail.established")}</div>
                    <div className="text-xs font-bold text-white">
                      {mandal.establishedYear || "1934"}
                    </div>
                  </div>
                </div>

                {/* Stat 2: Devotees */}
                <div className="flex items-center gap-2.5 border-l border-amber-500/10 pl-2.5">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">{t("mandal_detail.devotees_every_year")}</div>
                    <div className="text-xs font-bold text-white">
                      {mandal.annualDevotees || "10M+"}
                    </div>
                  </div>
                </div>

                {/* Stat 3: Days */}
                <div className="flex items-center gap-2.5 sm:border-l border-amber-500/10 sm:pl-2.5">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">{t("mandal_detail.days_of_celebration")}</div>
                    <div className="text-xs font-bold text-white">
                      {mandal.celebrationDays || "10 Days"}
                    </div>
                  </div>
                </div>

                {/* Stat 4: Hours */}
                <div className="flex items-center gap-2.5 border-l border-amber-500/10 pl-2.5">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">{t("mandal_detail.darshan_hours")}</div>
                    <div className="text-xs font-bold text-white">
                      {mandal.darshanTimings || "5:00 AM – 11:30 PM"}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT HALF (5 COLS): BIG IDOL / DEITY IMAGE */}
            <div className="lg:col-span-5 relative h-[250px] sm:h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shadow-xl border border-amber-500/20 group">
              <img
                src={getFullImageUrl(mandal.image || allImages[0])}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as any).src =
                    "https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] mb-1">
                  {mandal.presiding_deity || "Presiding Deity"}
                </Badge>
                <div className="text-xs font-semibold truncate">{name}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── HORIZONTAL TAB NAVIGATION BAR (MATCHING SCREENSHOT) ─────────────── */}
      <div id="mandal-tabs-section" className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-16 z-30 shadow-sm">
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3">
            {tabsList.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#6B0F1A] text-white shadow-md font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-zinc-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── UNIFIED SINGLE PAGE CONTENT (ALL SECTIONS RENDERED SEQUENTIALLY) ─── */}
      <main className="w-full max-w-[1700px] mx-auto px-4 md:px-8 lg:px-12 py-8 space-y-10">

        {/* ─── ROW 1: TOP CARDS GRID (GALLERY, LIVE DARSHAN, EVENTS) — ADAPTIVE ─── */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${hasLiveDarshan || hasEvents ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>

          {/* CARD: GALLERY */}
          <div id="section-gallery" className={`${hasLiveDarshan || hasEvents ? 'lg:col-span-1' : 'lg:col-span-4'} scroll-mt-28`}>
            <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-zinc-900 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-warm-brown" />
                      Gallery Showcase
                    </h3>
                    <Badge variant="outline" className="text-[10px] text-zinc-500 font-semibold border-zinc-200">
                      {allImages.length} {allImages.length === 1 ? 'Photo' : 'Photos'}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                    variant="ghost"
                    className="text-xs text-warm-brown hover:bg-amber-50 font-bold h-8 px-3 rounded-xl"
                  >
                    View All Photos ({allImages.length})
                  </Button>
                </div>

                {!hasLiveDarshan && !hasEvents ? (
                  /* Standalone Gallery Showcase (when no Live Darshan & Events) */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Main Featured Photo */}
                    <div
                      onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                      className="md:col-span-7 aspect-[16/10] md:aspect-auto md:h-[320px] rounded-2xl overflow-hidden bg-zinc-100 cursor-pointer relative group border border-zinc-100 shadow-sm"
                    >
                      <img
                        src={getFullImageUrl(allImages[0])}
                        alt="Gallery Featured"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-bold flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> Click to expand image
                        </span>
                      </div>
                    </div>

                    {/* Secondary Grid of Photos */}
                    <div className="md:col-span-5 grid grid-cols-2 gap-3">
                      {allImages.slice(1, 4).map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setLightboxIndex(idx + 1); setLightboxOpen(true); }}
                          className={`aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 cursor-pointer relative group border border-zinc-100 shadow-sm ${
                            allImages.length === 2 && idx === 0 ? "col-span-2 aspect-[16/9]" : ""
                          }`}
                        >
                          <img
                            src={getFullImageUrl(img)}
                            alt={`Thumb ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}

                      {allImages.length > 4 && (
                        <div
                          onClick={() => { setLightboxIndex(4); setLightboxOpen(true); }}
                          className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 cursor-pointer relative group border border-zinc-100 flex items-center justify-center text-white font-bold text-xs shadow-sm"
                        >
                          <img
                            src={getFullImageUrl(allImages[4])}
                            alt="More"
                            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute z-10 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                            +{allImages.length - 4} More
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Compact Sidebar Gallery (when Live Darshan or Events present) */
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                      className="col-span-2 aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-100 cursor-pointer relative group"
                    >
                      <img
                        src={getFullImageUrl(allImages[0])}
                        alt="Gallery Main"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {allImages.slice(1, 3).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => { setLightboxIndex(idx + 1); setLightboxOpen(true); }}
                        className="aspect-square rounded-xl overflow-hidden bg-zinc-100 cursor-pointer relative group"
                      >
                        <img
                          src={getFullImageUrl(img)}
                          alt={`Thumb ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                    {allImages.length > 3 && (
                      <div
                        onClick={() => { setLightboxIndex(3); setLightboxOpen(true); }}
                        className="aspect-square rounded-xl overflow-hidden bg-zinc-900 cursor-pointer relative group flex items-center justify-center text-white font-bold text-xs"
                      >
                        <img
                          src={getFullImageUrl(allImages[3])}
                          alt="More"
                          className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute z-10">+{allImages.length - 3} More</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* CARD: LIVE DARSHAN (adaptive: expands if no Events) */}
          {hasLiveDarshan && (
            <div id="section-live" className={`col-span-1 md:col-span-2 lg:col-span-${liveColSpan} scroll-mt-28`}>
              <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-zinc-900 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-red-600" />
                        Live Darshan
                      </h3>
                    </div>
                    <Badge className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 animate-pulse">
                      ● LIVE 24x7
                    </Badge>
                  </div>

                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 relative border border-zinc-200 flex items-center justify-center">
                    {mandal?.liveUrl ? (
                      <iframe
                        src={getEmbedUrl(mandal.liveUrl)}
                        className="w-full h-full"
                        allowFullScreen
                        title="Live Darshan Stream"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Video className="w-12 h-12 text-red-500 mx-auto mb-2 animate-pulse" />
                        <div className="text-base font-bold text-white">24x7 Live Darshan Stream</div>
                        <div className="text-xs text-zinc-400 mt-1">Direct live stream from {name}</div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-zinc-500 text-center font-medium mt-2">
                    Experience divine live darshan directly from {name}.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* CARD: EVENTS (only when mandal has real events) */}
          {hasEvents && (
            <div id="section-events" className="lg:col-span-1 scroll-mt-28">
              <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-zinc-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        Events
                      </h3>
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-400">Festive Schedule</span>
                  </div>

                  <div className="space-y-2.5">
                    {mandal.events.map((e: any) => ({
                      date: new Date(e.startDate || Date.now()).getDate().toString().padStart(2, "0"),
                      month: new Date(e.startDate || Date.now()).toLocaleString("en-US", { month: "short" }).toUpperCase(),
                      title: getLocalized(e, "title", language) || e.title || e.name || `${name} Event`,
                      time: e.startDate ? new Date(e.startDate).toLocaleDateString() : "Festive Seva",
                    })).slice(0, 4).map((ev: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/60 p-2 rounded-xl text-xs">
                        <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-black text-amber-900 leading-none">{ev.date}</span>
                          <span className="text-[8px] font-bold text-amber-700 uppercase tracking-tighter mt-0.5">{ev.month}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-zinc-900 text-xs truncate" title={ev.title}>{ev.title}</div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{ev.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => toast({ title: `${name} Events`, description: "All festival events & procession schedule active." })}
                  variant="outline"
                  className="w-full mt-3 h-8 text-xs font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  View Complete Schedule
                </Button>
              </Card>
            </div>
          )}

        </div>

        {/* ─── ROW 2: SPLIT GRID (POOJAS & SEVAS + SUPPORT MANDAL DONATION) ─── */}
        {canUseMandalTransactions && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* SECTION 4: POOJAS & SEVAS (Only when mandal has actual poojas) */}
            {mandal.poojas && mandal.poojas.length > 0 && (
              <div id="section-poojas" className={`scroll-mt-28 ${mandal.poojas && mandal.poojas.length > 0 ? 'lg:col-span-7' : 'lg:col-span-0 hidden'}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-6 bg-white shadow-sm space-y-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-warm-brown" />
                            Poojas & Sevas
                          </h3>
                          <p className="text-xs text-zinc-500">Book divine poojas & sevas online</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/mandals/${slug}/booking`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-warm-brown hover:underline"
                      >
                        View All
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                      {mandal.poojas.map((p: any, idx: number) => {
                        const pName = getLocalized(p, "name", language) || p.name || p.title;
                        const pDesc = getLocalized(p, "description", language) || p.description || p.desc || "Receive divine blessings";
                        const pImg = p.image ? getFullImageUrl(p.image) : "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&q=80&w=500";
                        const pPrice = p.price || 501;

                        return (
                          <div key={p.id || idx} className="rounded-2xl border border-zinc-200/80 p-3 bg-white hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                            <div>
                              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-2 bg-zinc-100">
                                <img src={pImg} alt={pName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-zinc-900 truncate mb-0.5">{pName}</h4>
                              <p className="text-[10px] sm:text-xs text-zinc-500 truncate mb-2">{pDesc}</p>
                              <div className="font-extrabold text-xs sm:text-sm text-zinc-900 mb-2.5">
                                ₹{typeof pPrice === "number" ? pPrice.toLocaleString("en-IN") : pPrice}
                              </div>
                            </div>
                            <Button
                              onClick={() => router.push(`/mandals/${slug}/booking`)}
                              className="w-full bg-[#6B0F1A] hover:bg-[#520B14] text-white font-bold h-8 text-[11px] rounded-xl transition-all shadow-sm"
                            >
                              Book Now
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* SECTION 5: SUPPORT THIS MANDAL / DONATION */}
            <div id="section-donate" className={`scroll-mt-28 ${mandal.poojas && mandal.poojas.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              <Card className="rounded-3xl border-amber-200/80 p-6 bg-gradient-to-b from-amber-50/70 to-white shadow-sm space-y-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-amber-200/50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-warm-brown" />
                          Support {name}
                        </h3>
                        <p className="text-xs text-zinc-600">Contributions for bhandara & seva</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 mt-4">
                    <div className="grid grid-cols-4 gap-2">
                      {donationAmounts.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => {
                            setSelectedAmount(amt);
                            setCustomAmount("");
                            setShowDonateModal(true);
                          }}
                          className={`py-2 bg-white border rounded-xl font-bold text-xs transition-all shadow-sm ${
                            selectedAmount === amt ? "border-warm-brown bg-amber-100/60 text-warm-brown" : "border-amber-200 text-zinc-800 hover:border-warm-brown"
                          }`}
                        >
                          ₹{amt.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-xs">₹</span>
                      <input
                        type="number"
                        placeholder="Custom Amount..."
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-warm-brown/20 focus:border-warm-brown"
                      />
                    </div>

                    <Button
                      onClick={() => setShowDonateModal(true)}
                      className="w-full bg-warm-brown hover:bg-warm-brown/90 text-white font-bold h-10 rounded-xl text-xs shadow-md shadow-amber-900/10"
                    >
                      <Gift className="w-4 h-4 mr-1.5" />
                      Donate Now
                    </Button>

                    <div className="text-center text-[10px] text-zinc-400 font-medium">
                      🔒 100% Secure Payment • Instant Email Tax Receipt
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* ─── SECTION 6: SACRED ITEMS & OFFERINGS (ONLY SHOWN IF ITEMS EXIST) ─── */}
        {canUseMandalTransactions && products && products.length > 0 && (
          <div id="section-sacred" className="scroll-mt-28">
            <Card className="rounded-3xl border-zinc-200/80 p-6 bg-white shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-warm-brown" />
                      Sacred Items & Offerings
                    </h3>
                    <p className="text-xs text-zinc-500">Blessed prasad, framed photos & divine keepsakes</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/marketplace")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-warm-brown hover:underline"
                >
                  View All Items
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {products.slice(0, 5).map((item: any, idx: number) => {
                  const price = item.price ?? item.variants?.[0]?.price ?? 251;
                  const itemName = getLocalized(item, "name", language) || item.name || "Sacred Item";
                  const itemImg = item.image ? getFullImageUrl(item.image) : "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=400";

                  return (
                    <Card
                      key={item.id || idx}
                      onClick={() => router.push(`/marketplace/product/${item.id}`)}
                      className="rounded-2xl border border-zinc-200/80 p-3 bg-white hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                    >
                      <div>
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-zinc-100">
                          <img src={itemImg} alt={itemName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h4 className="font-bold text-xs text-zinc-900 truncate">{itemName}</h4>
                        <div className="font-extrabold text-xs text-warm-brown mt-1">₹{typeof price === "number" ? price.toLocaleString("en-IN") : price}</div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/marketplace/product/${item.id}`);
                        }}
                        className="w-full mt-2 bg-[#6B0F1A] hover:bg-[#520B14] text-white font-bold h-8 text-[11px] rounded-xl transition-all shadow-sm"
                      >
                        Buy Now
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ─── ROW 4: BOTTOM CARDS (ABOUT, LOCATION, CONTACT) — Only shown if data exists ─── */}
        {(hasDescription || hasLocation || hasContactOrSocial) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ABOUT — only if mandal has a description */}
            {hasDescription && (
              <div id="section-about" className={`scroll-mt-28 ${hasLocation || hasContactOrSocial ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
                    <h3 className="text-xl font-serif font-bold text-zinc-900">About {name}</h3>
                  </div>

                  <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                    {typeof description === "string" && description.includes("<") ? (
                      <span dangerouslySetInnerHTML={{ __html: description }} />
                    ) : (
                      description
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* LOCATION — only if mandal has address/city/state */}
            {hasLocation && (
              <div id="section-location" className={`scroll-mt-28 ${hasDescription ? 'lg:col-span-3' : 'lg:col-span-6'}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
                    <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-warm-brown" />
                      Location
                    </h3>
                  </div>

                  <div className="text-xs text-zinc-700 font-medium">
                    {[mandal.address, mandal.city, mandal.state].filter(Boolean).join(", ")}
                  </div>

                  <div className="w-full rounded-2xl bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center p-4 text-center">
                    <Compass className="w-7 h-7 text-amber-600 mb-1" />
                    <div className="text-xs font-bold text-zinc-800">Google Maps Route</div>
                    <div className="text-[10px] text-zinc-400">Click to navigate to mandal</div>
                  </div>

                  <Button
                    onClick={() => {
                      const query = encodeURIComponent(`${name} ${mandal.city || ""}`);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                    }}
                    className="w-full bg-warm-brown hover:bg-warm-brown/90 text-white font-bold h-9 text-xs rounded-xl shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    Get Directions
                  </Button>
                </Card>
              </div>
            )}

            {/* CONTACT US — only if mandal has phone/email/website or social links */}
            {hasContactOrSocial && (
              <div id="section-contact" className={`scroll-mt-28 ${hasDescription ? 'lg:col-span-3' : 'lg:col-span-6'}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm space-y-3">
                  <div>
                    <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3 mb-3">
                      <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-warm-brown" />
                        Contact Us
                      </h3>
                    </div>

                    {hasContact && (
                      <div className="space-y-2.5 text-xs text-zinc-700 font-medium">
                        {(mandal?.phone || mandal?.contactPhone) && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-amber-600" />
                            <span>{mandal?.phone || mandal?.contactPhone}</span>
                          </div>
                        )}
                        {(mandal?.email || mandal?.contactEmail) && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-amber-600" />
                            <span className="truncate">{mandal?.email || mandal?.contactEmail}</span>
                          </div>
                        )}
                        {mandal?.websiteUrl && (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                            <span className="truncate">{mandal.websiteUrl}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasSocialLinks && (
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Follow Us</div>
                      <div className="flex items-center gap-2.5 text-zinc-600">
                        {(mandal?.instagramUrl || mandal?.instagram) && (
                          <a
                            href={mandal?.instagramUrl || mandal?.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                            title="Instagram"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                          </a>
                        )}
                        {(mandal?.youtubeUrl || mandal?.youtube) && (
                          <a
                            href={mandal?.youtubeUrl || mandal?.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                            title="YouTube"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.85.55 9.38.55 9.38.55s7.53 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                          </a>
                        )}
                        {(mandal?.facebookUrl || mandal?.facebook) && (
                          <a
                            href={mandal?.facebookUrl || mandal?.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                            title="Facebook"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

          </div>
        )}

      </main>

      <Footer />

      {/* ─── DONATION MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={canUseMandalTransactions && showDonateModal} onOpenChange={setShowDonateModal}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border border-amber-900/10 shadow-2xl bg-gradient-to-b from-[#FFFDF9] to-[#FFF9F2]">
          <DialogHeader className="text-center pb-2 border-b border-amber-900/10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6B0F1A] to-amber-700 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
              <Gift className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-serif font-bold text-[#6B0F1A]">
              Donate to {name}
            </DialogTitle>
            <DialogDescription className="text-xs text-amber-900/70">
              Support this mandal&apos;s sacred activities, festival arrangements & community service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B0F1A] block mb-2">Select Contribution Amount (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-1 ${
                      selectedAmount === amount
                        ? "bg-[#6B0F1A] text-white border-[#6B0F1A] shadow-md"
                        : "bg-white text-zinc-700 border-amber-900/15 hover:border-[#6B0F1A]/50 hover:bg-amber-50/50"
                    }`}
                  >
                    <span>₹{amount.toLocaleString("en-IN")}</span>
                    {selectedAmount === amount && <CheckCircle className="w-3.5 h-3.5 ml-1" />}
                  </button>
                ))}
              </div>
              <div className="mt-2.5">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#6B0F1A] text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Enter custom amount..."
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-amber-900/20 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]/20 focus:border-[#6B0F1A] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-amber-900/10">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B0F1A]">Your Contact Info</label>
              <div className="space-y-2">
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Full Name *" value={donorName} onChange={(e) => setDonorName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]/20 focus:border-[#6B0F1A]" />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="email" placeholder="Email Address *" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]/20 focus:border-[#6B0F1A]" required />
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="tel" placeholder="Mobile Number (e.g. +91 9999999999) *" value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6B0F1A]/20 focus:border-[#6B0F1A]" required />
                </div>
              </div>
            </div>

            {(() => {
              const raw = donorPhone.trim();
              const hasExplicitPlus = raw.startsWith('+');
              const cleaned = raw.replace(/\D/g, '');
              const isInternational = hasExplicitPlus && !cleaned.startsWith('91');

              if (isInternational) {
                return (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium text-center">
                    🚫 <strong>FCRA Notice:</strong> DevBhakti cannot accept international donations due to FCRA regulations. Thank you for your support!
                  </div>
                );
              }
              return null;
            })()}

            <Button
              className="w-full bg-[#6B0F1A] hover:bg-[#520B14] text-white py-3.5 h-auto text-base font-bold rounded-xl shadow-lg transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDonate}
              disabled={isDonating || (() => {
                const raw = donorPhone.trim();
                const hasExplicitPlus = raw.startsWith('+');
                const cleaned = raw.replace(/\D/g, '');
                return hasExplicitPlus && !cleaned.startsWith('91');
              })()}
            >
              {isDonating ? "Processing Donation..." : `Proceed to Donate ₹${(selectedAmount || parseInt(customAmount) || 0).toLocaleString("en-IN")}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── GALLERY LIGHTBOX ───────────────────────────────────────────────── */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-4xl max-h-[80vh] w-full px-8" onClick={(e) => e.stopPropagation()}>
            <img
              src={getFullImageUrl(allImages[lightboxIndex])}
              alt="Mandal Photo"
              className="w-full h-full object-contain max-h-[80vh] rounded-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Heart,
  Video,
  IndianRupee,
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
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { API_URL } from "@/config/apiConfig";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized } from "@/utils/localization";
import { stripHtml } from "@/utils/textUtils";

export function MandalDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mandal, setMandal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'gallery'>('about');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
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
  }, [slug]);

  const loadMandal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/mandals/${slug}`);
      const data = await response.json();
      if (data.success) {
        setMandal(data.data);
      } else {
        toast({
          title: t("common.error"),
          description: data.message || t("mandal_detail.load_error_desc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading mandal:", error);
      toast({
        title: t("common.error"),
        description: t("mandal_detail.load_failed"),
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return "/placeholder.jpg";
    if (path.startsWith('http')) return path;
    return `${API_URL.replace('/api', '')}${path}`;
  };

  const getAllImages = (): string[] => {
    const imgs: string[] = [];
    if (mandal?.image) imgs.push(mandal.image);
    if (mandal?.bannerImages && Array.isArray(mandal.bannerImages)) {
      mandal.bannerImages.forEach((img: string) => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs.length > 0 ? imgs : [""];
  };

  const handleDonate = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount <= 0) {
      toast({
        title: t("mandal_detail.invalid_amount_title"),
        description: t("mandal_detail.invalid_amount_desc"),
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
          name: mandal.name?.en || t("mandal_detail.mandal_default_name"),
          description: t("mandal_detail.donation_to", { name: mandal.name?.en || t("mandal_detail.mandal_default_name") }),
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
                })
              });
              const verifyData = await verifyRes.json();
              
              if (verifyData.success) {
                toast({
                  title: "Donation Successful! 🙏",
                  description: "Thank you for your generous contribution. A tax receipt has been emailed to you.",
                });
                setShowDonateModal(false);
                loadMandal();
              } else {
                toast({
                  title: t("mandal_detail.verification_failed_title"),
                  description: verifyData.message || t("mandal_detail.verification_failed_desc"),
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Verification Error:", error);
              toast({
                title: t("common.error"),
                description: t("mandal_detail.verification_error_desc"),
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: isAnonymous ? "Anonymous" : (donorName || currentUser?.name || ""),
            email: donorEmail || currentUser?.email || "",
            contact: donorPhone || currentUser?.phone || "",
          },
          theme: {
            color: "#7b4623",
          },
        };
       setShowDonateModal(false);
const razorpay = new (window as any).Razorpay(options);
razorpay.open();
      } else {
        toast({
          title: t("common.error"),
          description: data.message || t("mandal_detail.payment_init_error_desc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Donation error:", error);
      toast({
        title: t("common.error"),
        description: t("mandal_detail.payment_error_desc"),
        variant: "destructive",
      });
    }
    setIsDonating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!mandal) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-serif text-foreground mb-2">{t("mandal_detail.not_found_title")}</h2>
          <p className="text-muted-foreground mb-4">{t("mandal_detail.not_found_message")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const name = getLocalized(mandal, 'name') || t("mandal_detail.mandal_default_name");
  const description = getLocalized(mandal, 'description') || "";
  const allImages = getAllImages();
  const currentHeroImage = allImages[heroImageIndex] || mandal.image || "";

  const formatEventDate = (ev: any) => {
    const raw = ev.date || ev.startDate || ev.createdAt;
    if (!raw) return "Date TBD";
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return String(raw);
  };

  const getEventTitle = (ev: any) => {
    if (ev.name) {
      const loc = getLocalized(ev, "name");
      if (loc && loc !== "N/A") return loc;
      if (typeof ev.name === "string") return ev.name;
      if (ev.name.en) return ev.name.en;
    }
    return ev.title || "Mandal Festival Event";
  };
  const donationAmounts = [500, 1000, 2500, 5000, 10000];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      {/* Back Button */}
      <div className="container mx-auto px-4 md:px-8 mb-4">
        <Button
          variant="ghost"
          className="gap-2 hover:bg-[#7b4623]/10 text-slate-600 hover:text-[#7b4623] -ml-2"
          onClick={() => router.push("/mandals")}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("mandal_detail.back_to_mandals")}
        </Button>
      </div>

      {/* ========== HERO — Thumbnail Strip | Main Image | Info Panel ========== */}
      <section className="relative mx-4 md:mx-8 rounded-2xl md:rounded-3xl overflow-hidden border border-amber-900/10 shadow-2xl bg-slate-950">
        <div className="flex flex-col lg:flex-row">

          {/* ===== LEFT SIDE: Thumbnails + Main Image ===== */}
          <div className="flex w-full lg:w-[56%] xl:w-[58%] h-[280px] sm:h-[340px] md:h-[420px] lg:h-[500px] bg-[#0c0a09] flex-shrink-0">

            {/* Vertical Thumbnail Strip — left edge */}
            {allImages.length > 1 && (
              <div className="hidden md:flex flex-col w-[68px] lg:w-[72px] bg-black/40 border-r border-white/5 overflow-y-auto flex-shrink-0 py-2 gap-1.5 px-1.5">
                {allImages.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setHeroImageIndex(i)}
                    className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      i === heroImageIndex
                        ? "border-[#7b4623] shadow-md shadow-[#7b4623]/30 scale-[1.02]"
                        : "border-white/10 opacity-50 hover:opacity-80 hover:border-white/25"
                    }`}
                  >
                    <img
                      src={getFullImageUrl(img)}
                      alt={`${name} thumb ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as any).src = "https://via.placeholder.com/80x80?text=" + (i + 1); }}
                    />
                    {/* Active indicator dot */}
                    {i === heroImageIndex && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#7b4623] shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Main Preview Image */}
            <div className="relative flex-1 overflow-hidden group">
              {/* Blurred bg fill */}
              <img
                src={getFullImageUrl(currentHeroImage)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-25"
                aria-hidden="true"
              />
              {/* Crisp main image */}
              <img
                src={getFullImageUrl(currentHeroImage)}
                alt={name}
                className="relative w-full h-full object-contain mx-auto transition-all duration-500 group-hover:scale-[1.02]"
                onError={(e) => {
                  (e.target as any).src = "https://via.placeholder.com/1200x600?text=Mandal+Photo";
                }}
              />

              {/* Mobile: horizontal thumbnail strip at bottom */}
              {allImages.length > 1 && (
                <div className="md:hidden absolute bottom-0 left-0 right-0 z-10">
                  <div className="flex gap-1.5 px-3 py-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent overflow-x-auto">
                    {allImages.map((img: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setHeroImageIndex(i)}
                        className={`w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          i === heroImageIndex
                            ? "border-[#7b4623] scale-105"
                            : "border-white/20 opacity-60"
                        }`}
                      >
                        <img src={getFullImageUrl(img)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image counter — top right */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-black/60 backdrop-blur-md text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10">
                  {heroImageIndex + 1} / {allImages.length}
                </div>
              </div>

              {/* View Gallery — top left */}
              {allImages.length > 1 && (
                <button
                  onClick={() => { setLightboxIndex(heroImageIndex); setLightboxOpen(true); }}
                  className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 hover:bg-black/70 transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Gallery
                </button>
              )}

              {/* Prev / Next arrows on main image */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setHeroImageIndex((i: number) => (i - 1 + allImages.length) % allImages.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-lg border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setHeroImageIndex((i: number) => (i + 1) % allImages.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-lg border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Live Badge */}
              {mandal.isLive && (
                <div className="absolute bottom-14 md:bottom-4 left-4 z-10">
                  <Badge className="bg-red-600 text-white animate-pulse px-3 py-1.5 text-xs font-bold shadow-lg border-none">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    LIVE DARSHAN
                  </Badge>
                </div>
              )}

              {/* Edge fade into right panel */}
              <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-[#1a0c05] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* ===== RIGHT SIDE: Info Panel ===== */}
          <div className="relative w-full lg:w-[44%] xl:w-[42%] bg-gradient-to-br from-[#1a0c05] via-[#1e1008] to-[#140a03] flex flex-col justify-between p-5 sm:p-6 md:p-8 lg:p-9">

            {/* Subtle decorative pattern */}
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            {/* Top — Logo + Badges + Name */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                {mandal.image && (
                  <div className="w-11 h-11 md:w-13 md:h-13 rounded-lg bg-white/10 backdrop-blur-sm p-0.5 shadow-lg border border-white/10 flex-shrink-0 overflow-hidden">
                    <img src={getFullImageUrl(mandal.image)} alt={name} className="w-full h-full object-cover rounded-[7px]" />
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-[#7b4623] text-amber-100 border-none px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                    {mandal.mandalType || "Mandal"}
                  </Badge>
                  {mandal.presiding_deity && (
                    <Badge variant="outline" className="border-amber-600/30 text-amber-300/90 px-2.5 py-0.5 text-[10px]">
                      <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                      {mandal.presiding_deity}
                    </Badge>
                  )}
                </div>
              </div>

              <h1 className="text-[1.5rem] sm:text-2xl md:text-3xl font-serif font-bold text-white leading-tight tracking-tight mb-0.5">
                {name}
              </h1>
              {mandal.mandalType && (
                <p className="text-amber-400/60 text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] mb-5 md:mb-6">
                  {mandal.mandalType}, {mandal.city || "India"}
                </p>
              )}
            </div>

            {/* Middle — Info Rows */}
            <div className="relative z-10 space-y-3 mb-6 md:mb-8">
              {mandal.presiding_deity && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7b4623]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-400/80" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500/50">Presiding Deity</p>
                    <p className="text-[13px] md:text-sm font-semibold text-white/85">{mandal.presiding_deity}</p>
                  </div>
                </div>
              )}

              {(mandal.city || mandal.state) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7b4623]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-amber-400/80" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500/50">Location</p>
                    <p className="text-[13px] md:text-sm font-semibold text-white/85">
                      {[mandal.city, mandal.state].filter(Boolean).join(", ")}
                      {mandal.pinCode && <span className="text-white/40"> — {mandal.pinCode}</span>}
                    </p>
                  </div>
                </div>
              )}

              {mandal.festivals && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7b4623]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-amber-400/80" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500/50">Festivals</p>
                    <p className="text-[13px] md:text-sm font-semibold text-white/85">{mandal.festivals.split(",").map((f: string) => f.trim()).join(", ")}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom — Action Buttons */}
            <div className="relative z-10 space-y-2.5">
              <Button
                className="w-full bg-[#7b4623] hover:bg-[#63381b] active:bg-[#5d351a] shadow-lg shadow-[#7b4623]/25 text-white px-6 py-3 text-sm font-bold rounded-xl gap-2 transition-all active:scale-[0.98]"
                onClick={() => setShowDonateModal(true)}
              >
                <Gift className="w-4 h-4" />
                Donate Now
              </Button>

              <div className="flex gap-2">
                {mandal.isLive && mandal.liveUrl && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-red-600/15 hover:bg-red-600/25 text-red-300 border-red-500/25 hover:border-red-500/40 px-3 py-2.5 text-[11px] md:text-xs font-bold rounded-xl gap-1.5 transition-all"
                    onClick={() => window.open(mandal.liveUrl, "_blank")}
                  >
                    <Video className="w-3.5 h-3.5 animate-pulse" />
                    Live
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="flex-1 bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/10 hover:text-white px-3 py-2.5 text-[11px] md:text-xs font-semibold rounded-xl gap-1.5 transition-all"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? "fill-red-400 text-red-400 scale-110" : ""}`} />
                  {isLiked ? "Liked" : "Like"}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/10 hover:text-white px-3 py-2.5 text-[11px] md:text-xs font-semibold rounded-xl gap-1.5 transition-all"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({ title: name, url: window.location.href });
                    } else {
                      navigator.clipboard?.writeText(window.location.href);
                      toast({ title: "Link copied!", description: "Share this link with friends & family" });
                    }
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </Button>
              </div>
            </div>

            {/* Left edge glow line */}
            <div className="hidden lg:block absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/15 to-transparent" />
          </div>
        </div>
      </section>
      {/* ========== END HERO ========== */}

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-2xl">
                <TabsTrigger value="about" className="rounded-xl data-[state=active]:bg-[#7b4623] data-[state=active]:text-white font-semibold">
                  {t("mandal_detail.tab_about")}
                </TabsTrigger>
                <TabsTrigger value="events" className="rounded-xl data-[state=active]:bg-[#7b4623] data-[state=active]:text-white font-semibold">
                  {t("mandal_detail.tab_events")}
                </TabsTrigger>
                <TabsTrigger value="gallery" className="rounded-xl data-[state=active]:bg-[#7b4623] data-[state=active]:text-white font-semibold">
                  {t("mandal_detail.tab_gallery")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4 mt-6">
                <Card className="rounded-2xl border-amber-900/10 shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#7b4623]">
                      <Building2 className="w-5 h-5 text-[#7b4623]" />
                      {t("mandal_detail.about_mandal")}
                    </h2>
                    <div className="text-slate-700 leading-relaxed prose prose-slate max-w-none">
                      {description ? (
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                      ) : (
                        <p className="text-muted-foreground">{t("mandal_detail.no_description")}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {mandal.presiding_deity && (
                        <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#7b4623]" />
                            {t("mandal_detail.presiding_deity")}
                          </h4>
                          <p className="text-base font-bold text-slate-900 mt-1">{mandal.presiding_deity}</p>
                        </div>
                      )}
                      
                      {mandal.festivals && (
                        <div className="p-4 bg-orange-50/70 border border-orange-100 rounded-2xl">
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-orange-800 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#7b4623]" />
                            {t("mandal_detail.festivals")}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {mandal.festivals.split(",").map((festival: string, i: number) => (
                              <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-900 border-orange-200">
                                {festival.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <Card className="rounded-2xl border-amber-900/10 shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#7b4623]">
                      <Calendar className="w-5 h-5 text-[#7b4623]" />
                      {t("mandal_detail.upcoming_events")}
                    </h2>
                    {mandal.events && mandal.events.length > 0 ? (
                      <div className="space-y-4">
                        {mandal.events.map((event: any) => (
                          <div key={event.id} className="p-5 border border-slate-200/80 rounded-2xl hover:border-[#7b4623] transition-all bg-white hover:shadow-md">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900">{getEventTitle(event)}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 mt-2">
                                  <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg text-amber-900">
                                    <Calendar className="w-3.5 h-3.5 text-[#7b4623]" />
                                    {formatEventDate(event)}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                      {event.location}
                                    </span>
                                  )}
                                  <Badge variant="outline" className={event.status === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                                    {event.status === false ? "Past Event" : "Active Festival"}
                                  </Badge>
                                </div>
                                {(event.description || event.description_en) && (
                                  <div className="text-xs text-slate-500 mt-2.5 line-clamp-2 prose prose-xs">
                                    <div dangerouslySetInnerHTML={{ __html: stripHtml(getLocalized(event, "description") || event.description || "") }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <Calendar className="w-10 h-10 mx-auto opacity-30 text-[#7b4623]" />
                        <p>{t("mandal_detail.no_upcoming_events")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#7b4623]" />
                      {t("mandal_detail.gallery")}
                    </h2>
                    {allImages.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {allImages.map((image: string, index: number) => (
                          <div
                            key={index}
                            className="aspect-square rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer relative shadow-sm hover:shadow-lg transition-all"
                            onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                          >
                            <img
                              src={getFullImageUrl(image)}
                              alt={`${name} - ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as any).src = "https://via.placeholder.com/300x300?text=Photo";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                                <ExternalLink className="w-4 h-4 text-[#7b4623]" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 space-y-2">
                        <Building2 className="w-10 h-10 mx-auto opacity-20" />
                        <p>{t("mandal_detail.no_images_available")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - 1/3 */}
          <div className="space-y-6">
            <Card className="sticky top-24 shadow-xl border border-amber-900/10 rounded-3xl bg-gradient-to-b from-[#FFFDF9] to-[#FFF9F2] overflow-hidden">
              <CardContent className="p-6">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#7b4623]/10 text-[#7b4623] flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Gift className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#7b4623]">Support This Mandal</h3>
                  <p className="text-xs text-amber-900/70 mt-1">Your contribution directly empowers mandal activities & festivals</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {donationAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={`py-2.5 px-2 rounded-xl font-bold text-xs transition-all border ${
                        selectedAmount === amount
                          ? "bg-[#7b4623] text-white border-[#7b4623] shadow-md shadow-[#7b4623]/20"
                          : "bg-white text-slate-700 border-amber-900/15 hover:border-[#7b4623]/50 hover:bg-amber-50/50"
                      }`}
                    >
                      ₹{amount.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#7b4623] text-sm">₹</span>
                    <input
                      type="number"
                      placeholder="Custom amount..."
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-amber-900/20 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623]"
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-[#7b4623] hover:bg-[#5d351a] text-white py-3.5 h-auto text-base font-bold rounded-xl shadow-lg shadow-[#7b4623]/20 gap-2"
                  onClick={() => setShowDonateModal(true)}
                >
                  <Gift className="w-5 h-5" />
                  Donate Now
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 mt-3 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Instant PDF receipt sent to your email</span>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t("mandal_detail.donation_note")}
                </p>
              </CardContent>
            </Card>

            {mandal.isLive && mandal.liveUrl && (
              <Card className="border-red-500/20 shadow-lg shadow-red-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                    <h3 className="font-bold text-red-500">{t("mandal_detail.live_darshan")}</h3>
                    <Badge className="bg-red-500 text-white ml-auto animate-pulse">LIVE</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{t("mandal_detail.live_darshan_desc")}</p>
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white gap-2"
                    onClick={() => window.open(mandal.liveUrl, "_blank")}
                  >
                    <Video className="w-4 h-4" />
                    {t("mandal_detail.watch_now")}
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#7b4623]" />
                  {t("mandal_detail.contact_info")}
                </h3>
                <div className="space-y-3 text-sm">
                  {mandal.contactNumber && (
                    <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${mandal.contactNumber}`} className="hover:text-[#7b4623]">{mandal.contactNumber}</a>
                    </div>
                  )}
                  {mandal.email && (
                    <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${mandal.email}`} className="hover:text-[#7b4623]">{mandal.email}</a>
                    </div>
                  )}
                  {mandal.presidentName && (
                    <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{t("mandal_detail.president_label")}: <span className="font-medium">{mandal.presidentName}</span></span>
                    </div>
                  )}
                  {mandal.address && (
                    <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>{mandal.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {mandal.mandalType && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#7b4623]" />
                    {t("mandal_detail.mandal_type")}
                  </h3>
                  <Badge className="text-lg py-1 px-3">{mandal.mandalType}</Badge>
                  {mandal.registrationNumber && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("mandal_detail.registration_no")}: {mandal.registrationNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {/* ========== DONATION MODAL ========== */}
      <Dialog open={showDonateModal} onOpenChange={setShowDonateModal}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border border-amber-900/10 shadow-2xl bg-gradient-to-b from-[#FFFDF9] to-[#FFF9F2]">
          <DialogHeader className="text-center pb-2 border-b border-amber-900/10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7b4623] to-amber-700 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-[#7b4623]/20">
              <Gift className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-serif font-bold text-[#7b4623]">
              Donate to {name}
            </DialogTitle>
            <DialogDescription className="text-xs text-amber-900/70">
              Support this mandal&apos;s sacred activities, festivals & community service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7b4623] block mb-2">Select Contribution Amount (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-1 ${
                      selectedAmount === amount
                        ? "bg-[#7b4623] text-white border-[#7b4623] shadow-md shadow-[#7b4623]/20"
                        : "bg-white text-slate-700 border-amber-900/15 hover:border-[#7b4623]/50 hover:bg-amber-50/50"
                    }`}
                  >
                    <span>₹{amount.toLocaleString('en-IN')}</span>
                    {selectedAmount === amount && <CheckCircle className="w-3.5 h-3.5 ml-1" />}
                  </button>
                ))}
              </div>
              <div className="mt-2.5">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#7b4623] text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Enter custom amount..."
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-amber-900/20 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-amber-900/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#7b4623]">Your Details</label>
                {currentUser && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> Auto-filled
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <User className="w-4 h-4 text-amber-900/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Full Name *" value={donorName} onChange={(e) => setDonorName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623] disabled:opacity-50"
                    disabled={isAnonymous} />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-900/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="email" placeholder="Email Address *" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623]" required />
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-900/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="tel" placeholder="10-digit Mobile Number *" value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623]" required />
                </div>
                <textarea placeholder="Special message / Sankalp (Optional)..." value={donationMessage} onChange={(e) => setDonationMessage(e.target.value)}
                  className="w-full p-3 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623] resize-none" rows={2} />
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900/80">
              <Mail className="w-4 h-4 text-[#7b4623] shrink-0 mt-0.5" />
              <span>An official <strong>PDF Donation Receipt</strong> will be emailed automatically upon successful payment.</span>
            </div>

            {/* <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="anonymous" checked={isAnonymous}
                onChange={(e) => { setIsAnonymous(e.target.checked); if (e.target.checked) setDonorName("Anonymous"); else setDonorName(currentUser?.name || ""); }}
                className="w-4 h-4 rounded border-amber-900/30 text-[#7b4623] focus:ring-[#7b4623]" />
              <label htmlFor="anonymous" className="text-xs text-slate-700 cursor-pointer font-medium">Keep my name anonymous on public donor lists</label>
            </div> */}

            <Button
              className="w-full bg-[#7b4623] hover:bg-[#5d351a] text-white py-3.5 h-auto text-base font-bold rounded-xl shadow-lg shadow-[#7b4623]/20 transition-all mt-2"
              onClick={handleDonate} disabled={isDonating}
            >
              {isDonating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Donation...
                </span>
              ) : (
                `Proceed to Donate ₹${(selectedAmount || parseInt(customAmount) || 0).toLocaleString('en-IN')}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== GALLERY LIGHTBOX ========== */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % allImages.length);
            if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);
            if (e.key === "Escape") setLightboxOpen(false);
          }}
          tabIndex={0}
          ref={(el) => el?.focus()}
        >
          <button
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full border border-white/10">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          <div className="relative max-w-4xl max-h-[80vh] w-full px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={getFullImageUrl(allImages[lightboxIndex])}
              alt={`${name} - ${lightboxIndex + 1}`}
              className="w-full h-full object-contain max-h-[80vh] rounded-2xl shadow-2xl select-none"
              onError={(e) => { (e.target as any).src = "https://via.placeholder.com/800x600?text=Photo"; }}
            />
          </div>

          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-2xl border border-white/10 transition-all"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length); }}
                aria-label="Previous"
              >‹</button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-2xl border border-white/10 transition-all"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % allImages.length); }}
                aria-label="Next"
              >›</button>
            </>
          )}

          {allImages.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-sm max-w-[90vw] overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    i === lightboxIndex ? "border-[#7b4623] scale-110 shadow-lg" : "border-white/20 opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={getFullImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
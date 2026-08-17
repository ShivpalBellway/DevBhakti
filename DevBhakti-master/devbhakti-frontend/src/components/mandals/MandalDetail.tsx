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
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "gallery"
    | "live"
    | "poojas"
    | "aarti"
    | "events"
    | "sacred"
    | "donate"
    | "about"
    | "location"
  >("overview");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const { language, t } = useLanguage();

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
      loadSacredProducts();
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
    }
    setLoading(false);
  };

  const loadSacredProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products?category=SACRED_ITEM`);
      const data = await response.json();
      if (data && data.success) {
        setProducts(data.data || []);
      } else {
        // Fallback default sacred items if no API products
        setProducts([
          {
            id: "p1",
            name: "Lalbaugcha Raja Special Modak Prasad Box",
            price: 251,
            image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=400",
            category: "Sacred Prasad",
          },
          {
            id: "p2",
            name: "Blessed Ganesha Silver Coin (999 Purity)",
            price: 1100,
            image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400",
            category: "Divine Keepsake",
          },
          {
            id: "p3",
            name: "Authentic Divine Incense & Dhoop Stick Set",
            price: 151,
            image: "https://images.unsplash.com/photo-1602526430780-782d6b17831f?auto=format&fit=crop&q=80&w=400",
            category: "Pooja Samagri",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching sacred products:", error);
    }
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200";
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
    return imgs.length > 0 ? imgs : ["https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200"];
  };

  const handleDonate = async () => {
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

  // Tab definitions matching user screenshot (Live Darshan and Aarti removed completely)
  const tabsList = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "gallery", label: "Gallery", icon: Camera },
    { id: "poojas", label: "Poojas & Sevas", icon: Gift },
    { id: "events", label: "Events", icon: Calendar },
    { id: "sacred", label: "Sacred Items", icon: ShoppingBag },
    { id: "donate", label: "Donate", icon: IndianRupee },
    { id: "about", label: "About", icon: Info },
    { id: "location", label: "Location", icon: MapPin },
  ];

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
              Back to Mandals List
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
                {/* Pooja & Seva Book Now */}
                <Button
                  onClick={() => setActiveTab("poojas")}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 h-12 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-900/30"
                >
                  <Gift className="w-4 h-4 text-slate-950" />
                  <div>
                    <div className="leading-tight font-black">Pooja & Seva</div>
                    <div className="text-[10px] font-semibold opacity-90">Book Now</div>
                  </div>
                </Button>

                {/* Donate Now Support Mandal */}
                <Button
                  onClick={() => setShowDonateModal(true)}
                  variant="outline"
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold px-6 h-12 rounded-xl text-xs sm:text-sm flex items-center gap-2"
                >
                  <IndianRupee className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="leading-tight">Donate Now</div>
                    <div className="text-[10px] font-normal text-amber-200/80">Support Mandal</div>
                  </div>
                </Button>
              </div>

              {/* Utility Interaction Row */}
              <div className="flex items-center gap-5 text-xs text-amber-200/70">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{isLiked ? "Following" : "Follow"}</span>
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
                  <span>Share</span>
                </button>
                <button
                  onClick={() => setActiveTab("location")}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
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
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">Established</div>
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
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">Devotees Every Year</div>
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
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">Days of Celebration</div>
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
                    <div className="text-[8px] uppercase font-bold text-amber-200/60">Darshan Hours</div>
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
                    "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200";
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
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-16 z-30 shadow-sm">
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#6B0F1A] text-white shadow-md font-bold"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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

      {/* ─── TAB CONTENT SECTIONS ────────────────────────────────────────────── */}
      <main className="w-full max-w-[1700px] mx-auto px-4 md:px-8 lg:px-12 py-10">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="rounded-3xl border-zinc-200/80 shadow-sm p-6 bg-white">
                <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-warm-brown" />
                  About {name}
                </h3>
                <div className="text-zinc-700 text-sm md:text-base leading-relaxed space-y-4">
                  {description ? (
                    <div dangerouslySetInnerHTML={{ __html: description }} />
                  ) : (
                    <p>
                      {name} is one of the most revered and iconic Ganeshotsav Mandals in India. Founded with a rich heritage of devotion, community service, and grand festive traditions, it attracts millions of devotees every year for divine darshan and blessings.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Details Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="rounded-3xl border-amber-200/80 p-6 bg-amber-50/50 space-y-4">
                <h4 className="font-serif font-bold text-lg text-zinc-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Mandal Highlights
                </h4>
                <div className="space-y-3 text-xs md:text-sm">
                  <div className="flex justify-between py-2 border-b border-amber-200/50">
                    <span className="text-zinc-500">Presiding Deity</span>
                    <span className="font-bold text-zinc-800">{mandal.presiding_deity || "Shri Ganesha"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-amber-200/50">
                    <span className="text-zinc-500">Mandal Type</span>
                    <span className="font-bold text-zinc-800">{mandal.mandalType || "Public Festival"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-amber-200/50">
                    <span className="text-zinc-500">City / Location</span>
                    <span className="font-bold text-zinc-800">{mandal.city || "Mumbai"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-500">Registration Status</span>
                    <Badge className="bg-emerald-600 text-white font-bold">Verified Mandal</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2. GALLERY TAB */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold text-zinc-900">Mandal Photo Gallery</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                  className="aspect-square rounded-2xl overflow-hidden border border-zinc-200 cursor-pointer hover:shadow-lg transition-all group relative bg-zinc-100"
                >
                  <img
                    src={getFullImageUrl(img)}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. LIVE DARSHAN TAB */}
        {activeTab === "live" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-zinc-200 p-6 md:p-8 bg-zinc-900 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold">24x7 Live Darshan Stream</h3>
                </div>
                <Badge className="bg-red-600 text-white font-bold px-3 py-1">LIVE NOW</Badge>
              </div>

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center relative border border-white/10 shadow-2xl">
                {mandal.liveUrl ? (
                  <iframe
                    src={mandal.liveUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Live Stream"
                  />
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <Video className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                    <div className="text-lg font-bold text-white">Live Darshan Stream Coming Soon</div>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Official live video stream for {name} will be active during the festival duration.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* 4. POOJAS & SEVAS TAB */}
        {activeTab === "poojas" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 pb-3">
              <div>
                <h3 className="text-2xl font-serif font-bold text-warm-brown flex items-center gap-2">
                  Poojas & Sevas
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Online booking available for selected offerings
                </p>
              </div>
              <button
                onClick={() => router.push(`/mandals/${slug}/booking`)}
                className="inline-flex items-center gap-1 text-xs font-bold text-warm-brown hover:underline shrink-0"
              >
                View All Poojas & Sevas
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {mandal.poojas && mandal.poojas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {mandal.poojas.map((pooja: any, idx: number) => {
                  const poojaName = getLocalized(pooja, "name", language) || pooja.name || pooja.title;
                  const poojaDesc = getLocalized(pooja, "description", language) || pooja.description || "Offer sacred devotion";
                  const poojaImg = getFullImageUrl(pooja.imageUrl || pooja.image || pooja.bannerImage) || "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&q=80&w=500";
                  const poojaPrice = pooja.price || "501";

                  return (
                    <Card
                      key={pooja.id || idx}
                      className="rounded-2xl border border-zinc-200/80 p-3 bg-white hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <div>
                        {/* Card Image */}
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-amber-50">
                          <img
                            src={poojaImg}
                            alt={poojaName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-bold text-sm text-zinc-900 line-clamp-1 mb-0.5">
                          {poojaName}
                        </h4>
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-2 font-normal">
                          {poojaDesc}
                        </p>

                        {/* Price */}
                        <div className="font-extrabold text-sm text-zinc-900 mb-3">
                          ₹{typeof poojaPrice === "number" ? poojaPrice.toLocaleString("en-IN") : poojaPrice}
                        </div>
                      </div>

                      {/* Book Now Button */}
                      <Button
                        onClick={() => router.push(`/mandals/${slug}/booking`)}
                        className="w-full bg-warm-brown hover:bg-warm-brown/90 text-white font-bold rounded-xl h-9 text-xs shadow-sm"
                      >
                        Book Now
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-3xl p-8 text-center text-zinc-500 bg-white">
                <Gift className="w-10 h-10 mx-auto text-amber-600 mb-2 opacity-60" />
                <div>No poojas & sevas are currently available for this mandal.</div>
              </Card>
            )}
          </div>
        )}

        {/* 4. EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-zinc-900">Mandal Festival Events</h3>
            {mandal.events && mandal.events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mandal.events.map((event: any) => (
                  <Card key={event.id} className="rounded-3xl border-zinc-200 p-6 space-y-3 bg-white">
                    <h4 className="font-bold text-lg text-zinc-900">{event.title || "Festival Event"}</h4>
                    <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date || "27 Aug - 6 Sep 2026"}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{event.description || "Cultural performance and divine gathering."}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-3xl p-8 text-center text-zinc-500 bg-white">
                <Calendar className="w-10 h-10 mx-auto text-amber-600 mb-2" />
                <div>Upcoming cultural events & procession schedules will be updated shortly.</div>
              </Card>
            )}
          </div>
        )}

        {/* 7. SACRED ITEMS TAB */}
        {activeTab === "sacred" && (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-zinc-900">Blessed Sacred Items & Prasad</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((item, idx) => (
                <Card key={idx} className="rounded-3xl border-zinc-200 overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="aspect-square bg-zinc-100 overflow-hidden">
                    <img src={getFullImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 space-y-2">
                    <Badge className="bg-amber-100 text-amber-900 text-[10px]">{item.category || "Sacred Item"}</Badge>
                    <h4 className="font-bold text-sm text-zinc-900 truncate">{item.name}</h4>
                    <div className="text-base font-bold text-[#6B0F1A]">₹{item.price}</div>
                    <Button onClick={() => router.push("/sacred-items")} className="w-full bg-[#6B0F1A] text-white font-bold text-xs h-9 rounded-xl">
                      Order Sacred Item
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 8. DONATE TAB */}
        {activeTab === "donate" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="rounded-3xl border-amber-300 p-6 md:p-8 bg-gradient-to-b from-amber-50 to-white text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-[#6B0F1A] flex items-center justify-center mx-auto">
                <IndianRupee className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-zinc-900">Support {name}</h3>
              <p className="text-xs sm:text-sm text-zinc-600">
                Your generous contribution supports festival arrangements, bhandara prasad distribution, social welfare causes, and mandal upkeep.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {donationAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount("");
                      setShowDonateModal(true);
                    }}
                    className="py-3 bg-white border border-amber-200 rounded-xl font-bold text-sm text-zinc-800 hover:border-[#6B0F1A] hover:bg-amber-100/50 transition-all"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setShowDonateModal(true)}
                className="w-full bg-[#6B0F1A] hover:bg-[#520B14] text-white font-bold h-12 rounded-xl text-base shadow-lg"
              >
                Proceed to Donate
              </Button>
            </Card>
          </div>
        )}

        {/* 9. ABOUT TAB */}
        {activeTab === "about" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-zinc-200 p-6 md:p-8 bg-white space-y-4">
              <h3 className="text-2xl font-serif font-bold text-zinc-900">Mandal History & Committee</h3>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {name} has been celebrating Ganeshotsav with great devotion, peace, and unity for decades. The mandal committee works round-the-clock during festival days to ensure smooth queue management, security, and blessed darshan for all visiting devotees.
              </p>
            </Card>
          </div>
        )}

        {/* 10. LOCATION TAB */}
        {activeTab === "location" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-zinc-200 p-6 md:p-8 bg-white space-y-4">
              <h3 className="text-2xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-[#6B0F1A]" />
                Location & Route Directions
              </h3>
              <div className="text-sm font-semibold text-zinc-700">
                {[mandal.address, mandal.city, mandal.state].filter(Boolean).join(", ") || "Lalbaug, Mumbai, Maharashtra"}
              </div>
              <div className="h-64 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
                <div className="text-center space-y-2">
                  <Compass className="w-8 h-8 mx-auto text-amber-600" />
                  <div>Google Maps Navigation Preview</div>
                  <Button
                    onClick={() => {
                      const query = encodeURIComponent(`${name} ${mandal.city || ""}`);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                    }}
                    className="bg-[#6B0F1A] text-white font-bold text-xs rounded-xl"
                  >
                    Open in Google Maps
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

      </main>

      <Footer />

      {/* ─── DONATION MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={showDonateModal} onOpenChange={setShowDonateModal}>
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
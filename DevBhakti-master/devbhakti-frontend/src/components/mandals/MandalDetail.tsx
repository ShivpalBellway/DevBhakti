"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Download,
  PartyPopper,
  Printer,
} from "lucide-react";
import { downloadDonationReceiptPDF } from "@/utils/donationReceipt";
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
import { stripHtml, parseLocalizedValue } from "@/utils/textUtils";
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
  // Guard to prevent Razorpay handler from firing more than once per payment
  const receiptShownRef = useRef(false);
  const lastPaymentIdRef = useRef<string | null>(null);
  const [donationReceipt, setDonationReceipt] = useState<{
    donorName: string;
    amount: number;
    platformFee?: number;
    mandalName: string;
    donationId: string;
    date: string;
    email: string;
    phone: string;
    message?: string;
    txnId: string;
  } | null>(null);
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

  const loadMandal = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
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
    if (showSpinner) setLoading(false);
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
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [fetchingFee, setFetchingFee] = useState<boolean>(false);

  useEffect(() => {
    const amount = selectedAmount || parseInt(customAmount) || 0;
    if (amount > 0 && mandal?.id) {
      setFetchingFee(true);
      fetch(`${API_URL}/bookings/calculate-commission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          vendorType: "MANDAL",
          vendorId: mandal.id,
          category: "DONATION",
          isOffline: false
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setPlatformFee(data.data.totalCommission || 0);
          }
        })
        .catch(err => console.error("Error calculating fee:", err))
        .finally(() => setFetchingFee(false));
    } else {
      setPlatformFee(0);
    }
  }, [selectedAmount, customAmount, mandal?.id]);

  // Keyboard controls for gallery lightbox (Rules of Hooks compliant)
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        document.getElementById("lightbox-prev-btn")?.click();
      } else if (e.key === "ArrowRight") {
        document.getElementById("lightbox-next-btn")?.click();
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  const [showDonationOtpInput, setShowDonationOtpInput] = useState(false);
  const [donationOtp, setDonationOtp] = useState("");
  const [isSendingDonationOtp, setIsSendingDonationOtp] = useState(false);
  const [isVerifyingDonationOtp, setIsVerifyingDonationOtp] = useState(false);
  const [donationOtpSent, setDonationOtpSent] = useState(false);

  const handleOpenDonateModal = () => {
    if (isInternational) {
      toast({
        title: "FCRA Restriction",
        description: "International donations are restricted by law (FCRA). Razorpay order creation disabled.",
        variant: "destructive",
      });
      return;
    }

    setShowDonateModal(true);
  };

  const handleSendDonationOtp = async () => {
    if (!donorPhone || donorPhone.replace(/\D/g, '').length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive"
      });
      return;
    }
    setIsSendingDonationOtp(true);
    try {
      const rawDigits = donorPhone.replace(/\D/g, '').slice(-10);
      const normalizedPhone = "+91" + rawDigits;
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          role: "DEVOTEE",
          mode: "login"
        })
      });
      const data = await res.json();
      if (data.success) {
        setDonationOtpSent(true);
        setShowDonationOtpInput(true);
        toast({
          title: "OTP Sent! 📲",
          description: `An OTP has been sent to ${normalizedPhone}`,
        });
      } else {
        toast({
          title: "Failed to send OTP",
          description: data.message || "Please check phone number and try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error sending donation OTP:", err);
      toast({
        title: "Error",
        description: "Could not send OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingDonationOtp(false);
    }
  };

  const handleVerifyDonationOtp = async () => {
    if (!donationOtp || donationOtp.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete OTP.",
        variant: "destructive"
      });
      return;
    }
    setIsVerifyingDonationOtp(true);
    try {
      const rawDigits = donorPhone.replace(/\D/g, '').slice(-10);
      const normalizedPhone = "+91" + rawDigits;
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: donationOtp,
          role: "DEVOTEE"
        })
      });
      const data = await res.json();
      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;

      if (data.success && token) {
        if (token) localStorage.setItem("token", token);
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          setCurrentUser(user);
        }
        setShowDonationOtpInput(false);
        setDonationOtpSent(false);
        toast({
          title: "Verified & Logged In! 🙏",
          description: "Mobile number verified successfully.",
        });
      } else {
        toast({
          title: "Invalid OTP",
          description: data.message || "Incorrect OTP entered.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error verifying donation OTP:", err);
      toast({
        title: "Error",
        description: "Could not verify OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingDonationOtp(false);
    }
  };

  const handleDonate = async () => {
    const savedToken = localStorage.getItem("token") || localStorage.getItem("user_token");
    if (!savedToken && !currentUser) {
      toast({
        title: "Verification Required",
        description: "Please verify your mobile number with OTP first.",
        variant: "destructive",
      });
      return;
    }

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
    receiptShownRef.current = false;
    try {
      const response = await fetch(`${API_URL}/donations`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(savedToken ? { "Authorization": `Bearer ${savedToken}` } : {})
        },
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
        const totalAmountPayable = Math.round((amount + platformFee) * 100);
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.order.amount || totalAmountPayable,
          currency: "INR",
          name: mandal.name?.en || mandal.name || "Mandal",
          description: `Donation to ${mandal.name?.en || mandal.name || "Mandal"}`,
          order_id: data.order.id,
          handler: function (response: any) {
            // Guard: prevent Razorpay handler from firing more than once per payment session
            const currentPaymentId = response.razorpay_payment_id || data.donationId;
            if (receiptShownRef.current || (currentPaymentId && lastPaymentIdRef.current === currentPaymentId)) {
              return;
            }
            receiptShownRef.current = true;
            lastPaymentIdRef.current = currentPaymentId;

            setShowDonateModal(false);
            const now = new Date();
            // Format donation ID as short readable reference
            const rawId = data.donationId || "";
            const formattedDonationId = rawId
              ? `#DON-${rawId.slice(-8).toUpperCase()}`
              : "—";
            setDonationReceipt({
              donorName: isAnonymous ? "Anonymous" : (donorName || currentUser?.name || "Devotee"),
              amount,
              platformFee,
              mandalName: mandal.name?.en || mandal.name || "Mandal",
              donationId: formattedDonationId,
              date: now.toLocaleString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              email: donorEmail || currentUser?.email || "—",
              phone: donorPhone || currentUser?.phone || "—",
              message: donationMessage || undefined,
              txnId: response.razorpay_payment_id || "—",
            });

            // Asynchronously call backend verification & email in background
            fetch(`${API_URL}/payments/verify`, {
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
            })
              .then(async (res) => {
                const verifyData = await res.json();
                if (verifyData.success) {
                  loadMandal(false);
                }
              })
              .catch((error) => {
                console.error("Background Verification Error:", error);
              });
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
  const hasContact = !!(mandal?.email || mandal?.contactEmail || mandal?.websiteUrl);
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

  const activeAartis = Array.isArray(mandal?.aartiTimings)
    ? mandal.aartiTimings.filter((item: any) => item.isActive !== false)
    : [];
  const hasAartis = activeAartis.length > 0;

  const tabsList = [
    { id: "gallery", label: t("mandal_detail.tab_gallery"), icon: Camera },
    ...(hasLiveDarshan ? [{ id: "live", label: t("mandal_detail.live_darshan"), icon: Video }] : []),
    ...(hasEvents ? [{ id: "events", label: t("mandal_detail.tab_events"), icon: Calendar }] : []),
    ...(hasAartis ? [{ id: "aarti", label: "Aarti Timings", icon: Flame }] : []),
    ...(hasPoojas ? [{ id: "poojas", label: t("common.poojas_sevas"), icon: Gift }] : []),
    { id: "donate", label: t("mandal_detail.donate_now"), icon: IndianRupee },
    ...(hasProducts ? [{ id: "sacred", label: t("common.sacred_items"), icon: ShoppingBag }] : []),
    ...(hasDescription ? [{ id: "about", label: t("mandal_detail.tab_about"), icon: Info }] : []),
    ...(hasLocation ? [{ id: "location", label: t("mandal_list.location"), icon: MapPin }] : []),
    ...(hasContactOrSocial ? [{ id: "contact", label: t("mandal_detail.contact_info") }] : []),
  ].filter((tab) => canUseMandalTransactions || !TRANSACTION_TABS.includes(tab.id as MandalTab));

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900">
      {/* Solid Top Navbar */}
      <Navbar isSolid={true} />

      {/* ─── DONATION SUCCESS RECEIPT MODAL ─────────────────────────────── */}
      <Dialog open={!!donationReceipt} onOpenChange={(open) => { if (!open) setDonationReceipt(null); }}>
        <DialogContent className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-0 border border-amber-900/20 shadow-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F2] to-[#FFF4E5] z-[10000]">
          <DialogHeader className="sr-only">
            <DialogTitle>Donation Receipt</DialogTitle>
            <DialogDescription>Donation receipt details for {donationReceipt?.mandalName}</DialogDescription>
          </DialogHeader>

          {/* Header — warm brown theme */}
          <div className="bg-gradient-to-r from-[#7c4624] via-[#69391b] to-[#5c3a21] px-6 pt-8 pb-10 text-center relative overflow-hidden text-white">
            {/* Decorative glow circles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-amber-300/10 blur-xl" />
            {/* Success icon */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-950/40">
                <CheckCircle className="w-10 h-10 text-amber-950" strokeWidth={2.8} />
              </div>
              <div className="absolute -top-1 -right-1">
                <PartyPopper className="w-6 h-6 text-amber-300" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Donation Successful!</h2>
            <p className="text-amber-200/90 text-sm">
              🙏 Jai Ganesh — Your contribution has been received
            </p>
          </div>

          {/* Amount badge — floats over the join */}
          <div className="flex justify-center -mt-6 mb-1 relative z-10">
            <div className="bg-gradient-to-r from-[#7c4624] to-[#5c3a21] text-white font-black text-2xl px-8 py-2.5 rounded-full shadow-xl border-2 border-amber-300">
              ₹{((donationReceipt?.amount || 0) + (donationReceipt?.platformFee || 0)).toLocaleString("en-IN")}
            </div>
          </div>

          {/* Receipt body — warm cream */}
          <div className="px-6 pb-6 pt-3 space-y-3">
            {/* Mandal name */}
            <div className="text-center mb-3">
              <p className="text-[10px] text-[#7c4624] uppercase font-bold tracking-widest">Donated to</p>
              <p className="text-base font-bold text-zinc-900">{donationReceipt?.mandalName}</p>
            </div>

            {/* Receipt rows */}
            <div className="rounded-2xl overflow-hidden bg-white/90 border border-amber-900/15 shadow-sm">
              {/* Donor */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/10">
                <span className="text-[10px] text-[#7c4624] font-bold uppercase tracking-wider">Donor</span>
                <span className="text-sm font-semibold text-zinc-900 text-right max-w-[60%]">{donationReceipt?.donorName}</span>
              </div>
              {/* Date */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/10">
                <span className="text-[10px] text-[#7c4624] font-bold uppercase tracking-wider">Date & Time</span>
                <span className="text-xs font-semibold text-zinc-700 text-right max-w-[60%]">{donationReceipt?.date}</span>
              </div>

              {/* Amount breakdown if platformFee exists */}
              {donationReceipt?.platformFee ? (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-900/10 bg-amber-50/40">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Donation Amount</span>
                    <span className="text-xs font-semibold text-zinc-800">₹{donationReceipt.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-900/10 bg-amber-50/40">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Platform Support Fee</span>
                    <span className="text-xs font-semibold text-amber-800">+ ₹{donationReceipt.platformFee.toLocaleString("en-IN")}</span>
                  </div>
                </>
              ) : null}

              {/* Txn ID */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/10">
                <span className="text-[10px] text-[#7c4624] font-bold uppercase tracking-wider">Transaction ID</span>
                <span className="text-xs font-mono font-bold text-zinc-800 text-right max-w-[60%] break-all">{donationReceipt?.txnId}</span>
              </div>
              {/* Donation ID — highlighted */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/10 bg-amber-50/70">
                <span className="text-[10px] text-[#7c4624] font-bold uppercase tracking-wider">Donation ID</span>
                <span className="text-xs font-mono font-black text-[#7c4624] text-right max-w-[60%] break-all px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300">{donationReceipt?.donationId}</span>
              </div>
              {/* Email */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/10">
                <span className="text-[10px] text-[#7c4624] font-bold uppercase tracking-wider">Receipt Email</span>
                <span className="text-xs font-semibold text-zinc-700 text-right max-w-[60%] break-all">{donationReceipt?.email}</span>
              </div>
              {/* Message (if any) */}
              {donationReceipt?.message && (
                <div className="flex items-start justify-between px-4 py-3">
                  <span className="text-[10px] text-[#7c4624] font-bold uppercase tracking-wider">Message</span>
                  <span className="text-xs italic text-zinc-600 text-right max-w-[60%]">"{donationReceipt.message}"</span>
                </div>
              )}
            </div>

            {/* Info note */}
            <p className="text-center text-[10px] text-zinc-500 px-2 pt-1">
              📧 A detailed receipt will be sent to your registered email address.
            </p>

            {/* Action buttons */}
            {/* <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (donationReceipt) downloadDonationReceiptPDF(donationReceipt);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition border-2 border-[#7c4624] text-[#7c4624] hover:bg-[#7c4624]/10 shadow-sm cursor-pointer active:scale-95 z-20"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => { setDonationReceipt(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition bg-gradient-to-r from-[#7c4624] to-[#5c3a21] hover:from-[#5c3a21] hover:to-[#3e2413] text-white shadow-md shadow-[#7c4624]/20 cursor-pointer active:scale-95 z-20"
              >
                <CheckCircle className="w-4 h-4" />
                Done
              </button>
            </div> */}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── HERO BANNER SECTION (MATCHING BRAND THEME COLOR) ───────────────── */}
      <section className="relative bg-gradient-to-r from-[#7c4624] via-[#69391b] to-[#5c3a21] text-white pt-24 pb-8 lg:pt-28 lg:pb-10 border-b border-amber-900/30 overflow-hidden flex flex-col justify-center">
        {/* Ambient Glow & Subtle Pattern Grid Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(#7c4624_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          
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

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* HERO IMAGE CARD - FIRST ON MOBILE (order-1), SECOND ON DESKTOP (lg:order-2, 5 COLS) */}
            <div className="order-1 lg:order-2 lg:col-span-5 relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-amber-500/20 group bg-zinc-900">
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

            {/* DETAILS & ACTION CTAs & STATS BOX - SECOND ON MOBILE (order-2), FIRST ON DESKTOP (lg:order-1, 7 COLS) */}
            <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-between space-y-6">
              
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
                      onClick={handleOpenDonateModal}
                      disabled={isInternational}
                      variant="outline"
                      className="bg-[#FFE8CF] hover:bg-[#FCD8B0] text-[#80380B] border-[#DEB887] font-bold px-6 h-12 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <IndianRupee className="w-4 h-4 text-[#D97706]" />
                      <div className="text-left">
                        <div className="leading-tight font-bold text-[#80380B]">{isInternational ? "FCRA Restricted" : t("mandal_detail.donate_now")}</div>
                        <div className="text-[10px] font-medium text-[#92400E]/80">{t("mandal_detail.support_mandal")}</div>
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
              <div className="w-fit max-w-full bg-black/40 backdrop-blur-md border border-amber-500/20 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
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

          </div>
        </div>
      </section>

      {/* ─── HORIZONTAL TAB NAVIGATION BAR (MATCHING SCREENSHOT) ─────────────── */}
      <div id="mandal-tabs-section" className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4">
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
                      ? "bg-gradient-to-r from-[#7c4624] to-[#5c3a21] text-white shadow-md font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-zinc-500"}`} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── UNIFIED SINGLE PAGE CONTENT ─── */}
      <main className="container mx-auto px-4 py-5 space-y-4">

        {/* ─── ROW 1: TOP MEDIA GRID (GALLERY, LIVE DARSHAN, TODAY'S AARTI) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4">

          {/* CARD 1: LIVE DARSHAN (Only if mandal has live stream / isLive) */}
          {hasLiveDarshan && (
            <div id="section-live" className="scroll-mt-28 flex flex-col lg:col-span-5">
              <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div className="flex flex-col h-full justify-between gap-3">
                  <div className="flex items-center justify-between">
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

                  <div className="flex-1 w-full min-h-[280px] rounded-2xl overflow-hidden bg-zinc-950 relative border border-zinc-200 flex items-center justify-center">
                    {mandal?.liveUrl ? (
                      <iframe
                        src={getEmbedUrl(mandal.liveUrl)}
                        className="w-full h-full absolute inset-0"
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

                  <p className="text-xs text-zinc-500 text-center font-medium">
                    Experience divine live darshan directly from {name}.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* CARD 2: GALLERY (Expands to lg:col-span-8 or 12 if no Live Darshan) */}
          <div
            id="section-gallery"
            className={`scroll-mt-28 flex flex-col ${
              hasLiveDarshan
                ? hasAartis
                  ? "lg:col-span-4"
                  : "lg:col-span-7"
                : hasAartis
                ? "lg:col-span-8"
                : "lg:col-span-12"
            }`}
          >
            <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-zinc-900 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-warm-brown" />
                      Gallery
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
                    View All ({allImages.length})
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2">
                  <div
                    onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                    className="col-span-2 aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-100 cursor-pointer relative group"
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
                      className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 cursor-pointer relative group"
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
                      className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 cursor-pointer relative group flex items-center justify-center text-white font-bold text-xs"
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
              </div>
            </Card>
          </div>

          {/* CARD 3: TODAY'S AARTI TIMINGS (Only if has aartis or live darshan is present) */}
          {(hasAartis || hasLiveDarshan) && (
            <div
              id="section-aarti"
              className={`scroll-mt-28 flex flex-col ${
                hasLiveDarshan ? "lg:col-span-3" : "lg:col-span-4"
              }`}
            >
              <Card className="rounded-3xl border-amber-200/80 p-5 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center font-bold">
                        <Flame className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-base font-serif font-bold text-zinc-900">
                          Aarti Timings
                        </h3>
                        <p className="text-[10px] text-amber-900/70">Daily Aarti schedule</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                      {hasAartis ? `${activeAartis.length} Scheduled` : 'Daily'}
                    </Badge>
                  </div>

                  {hasAartis ? (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {activeAartis.map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className="p-2.5 bg-white rounded-xl border border-amber-100 shadow-sm flex items-center justify-between gap-2 hover:border-amber-300 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                              <Flame className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <span className="text-xs font-bold text-zinc-900 line-clamp-1">{item.name}</span>
                          </div>
                          <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/50 shrink-0">
                            {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-zinc-400 font-medium">
                      No Aarti timings updated yet.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

        </div>

        {/* ─── ROW 2: POOJAS & SEVAS (LEFT) + UPCOMING EVENTS (RIGHT) ─── */}
        {(hasPoojas || hasEvents) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">

            {/* ─── SECTION 4: POOJAS & SEVAS (Expands to col-span-12 if no Events) ─── */}
            {hasPoojas && (
              <div
                id="section-poojas"
                className={`scroll-mt-28 flex flex-col ${hasEvents ? "lg:col-span-8" : "lg:col-span-12"}`}
              >
                <Card className="rounded-3xl border-zinc-200/80 p-3.5 sm:p-4 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-warm-brown" />
                        Poojas & Sevas
                      </h3>
                      <p className="text-xs text-zinc-500">Online booking available for selected offerings</p>
                    </div>
                    <button
                      onClick={() => router.push(`/mandals/${slug}/booking`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-warm-brown hover:underline"
                    >
                      View All Poojas & Sevas <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative group/carousel mt-1">
                    <button
                      onClick={() => {
                        const container = document.getElementById("poojas-scroll-container");
                        if (container) container.scrollBy({ left: -260, behavior: "smooth" });
                      }}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-700 hover:bg-amber-50 transition-all"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const container = document.getElementById("poojas-scroll-container");
                        if (container) container.scrollBy({ left: 260, behavior: "smooth" });
                      }}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-700 hover:bg-amber-50 transition-all"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div 
                      id="poojas-scroll-container"
                      className="flex items-stretch gap-2.5 overflow-x-auto thin-scrollbar pb-2 pt-1 px-1 scroll-smooth"
                    >
                      {mandal.poojas.map((p: any, idx: number) => {
                        const pName = getLocalized(p, "name", language) || p.name || p.title;
                        const pDesc = getLocalized(p, "description", language) || p.description || p.desc || "Receive divine blessings";
                        const pImg = p.image ? getFullImageUrl(p.image) : "https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&q=80&w=600";
                        const pPrice = p.price || 501;

                        return (
                          <div 
                            key={p.id || idx} 
                            onClick={() => router.push(`/mandals/${slug}/booking`)}
                            className="w-[180px] sm:w-[200px] shrink-0 rounded-2xl border border-zinc-200/80 p-3 bg-white hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                          >
                            <div>
                              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden mb-2 bg-zinc-100">
                                <img src={pImg} alt={pName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <h4 className="font-bold text-xs text-zinc-900 truncate mb-0.5">{pName}</h4>
                              <p className="text-[11px] text-zinc-500 truncate mb-2">{pDesc}</p>
                              <div className="font-extrabold text-xs text-zinc-900 mb-2">
                                ₹{typeof pPrice === "number" ? pPrice.toLocaleString("en-IN") : pPrice}
                              </div>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/mandals/${slug}/booking`);
                              }}
                              className="w-full bg-gradient-to-r from-[#7c4624] to-[#5c3a21] hover:from-[#5c3a21] hover:to-[#3e2413] text-white font-bold h-8 text-[11px] rounded-xl transition-all shadow-md shadow-[#7c4624]/20"
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

            {/* ─── SECTION 5: UPCOMING EVENTS (Expands to col-span-12 if no Poojas) ─── */}
            {hasEvents && (
              <div
                id="section-events"
                className={`scroll-mt-28 flex flex-col ${hasPoojas ? "lg:col-span-4" : "lg:col-span-12"}`}
              >
                <Card className="rounded-3xl border-zinc-200/80 p-6 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-start h-full space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-zinc-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        Upcoming Events & Programs
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        const el = document.getElementById("section-events");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-xs font-bold text-warm-brown hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {mandal.events.map((e: any, idx: number) => {
                      const rawDateStr = e.date || e.startDate || "";
                      const cleanedDateStr = rawDateStr.replace(/(\d+)(st|nd|rd|th)/gi, "$1");
                      const parsedDate = cleanedDateStr && !isNaN(new Date(cleanedDateStr).getTime()) ? new Date(cleanedDateStr) : null;

                      const evDate = parsedDate ? parsedDate.getDate().toString().padStart(2, "0") : "--";
                      const evMonth = parsedDate ? parsedDate.toLocaleString("en-US", { month: "short" }).toUpperCase() : "";
                      const evTitle = getLocalized(e, "title", language) || e.title || parseLocalizedValue(e.name, language) || e.name || `${name} Event`;
                      const evDayTime = parsedDate 
                        ? `${parsedDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}`
                        : (rawDateStr || "Festive Seva");

                      const categories = ["Cultural", "Cultural", "Cultural", "Cultural"];
                      const catTag = categories[idx % categories.length];
                      const catBg = idx % 3 === 0 
                        ? "bg-orange-100 text-orange-900 border-orange-200" 
                        : idx % 3 === 1 
                          ? "bg-amber-100 text-amber-900 border-amber-200" 
                          : "bg-rose-100 text-rose-900 border-rose-200";

                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-amber-50/40 border border-amber-100/80 rounded-2xl hover:border-amber-200 transition-all gap-2">
                          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-black text-amber-950 leading-none">{evDate}</span>
                            <span className="text-[8px] font-bold text-amber-800 uppercase tracking-tighter mt-0.5">{evMonth}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-zinc-900 text-xs truncate">{evTitle}</div>
                            <div className="text-[10px] text-zinc-500 truncate mt-0.5">{evDayTime}</div>
                          </div>
                          <Badge className={`text-[9px] font-bold border px-2 py-0.5 shrink-0 ${catBg}`}>
                            {catTag}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

          </div>
        )}

        {/* ─── ROW 3: SACRED ITEMS & OFFERINGS + SUPPORT THIS MANDAL (DONATION) ─── */}
        {(hasProducts || canUseMandalTransactions) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">

            {/* ─── SECTION 6: SACRED ITEMS & OFFERINGS (Only when products exist) ─── */}
            {hasProducts && (
              <div id="section-sacred" className={`scroll-mt-28 flex flex-col ${canUseMandalTransactions ? "lg:col-span-8" : "lg:col-span-12"}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-3.5 sm:p-4 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-warm-brown" />
                        Sacred Items & Offerings
                      </h3>
                      <p className="text-xs text-zinc-500">Blessed prasad, framed photos & divine keepsakes</p>
                    </div>
                    <button
                      onClick={() => router.push("/marketplace")}
                      className="inline-flex items-center gap-1 text-xs font-bold text-warm-brown hover:underline"
                    >
                      View All Items
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative group/carousel mt-1">
                    <button
                      onClick={() => {
                        const container = document.getElementById("products-scroll-container");
                        if (container) container.scrollBy({ left: -260, behavior: "smooth" });
                      }}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-700 hover:bg-amber-50 hover:text-amber-900 transition-all opacity-90 group-hover/carousel:opacity-100"
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const container = document.getElementById("products-scroll-container");
                        if (container) container.scrollBy({ left: 260, behavior: "smooth" });
                      }}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-700 hover:bg-amber-50 hover:text-amber-900 transition-all opacity-90 group-hover/carousel:opacity-100"
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div 
                      id="products-scroll-container"
                      className="flex items-stretch gap-2.5 overflow-x-auto thin-scrollbar pb-2 pt-1 px-1 scroll-smooth"
                    >
                      {products.map((item: any, idx: number) => {
                        const price = item.price ?? item.variants?.[0]?.price ?? 251;
                        const itemName = getLocalized(item, "name", language) || item.name || "Sacred Item";
                        const itemImg = item.image ? getFullImageUrl(item.image) : "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=400";

                        return (
                          <Card
                            key={item.id || idx}
                            onClick={() => router.push(`/marketplace/product/${item.id}`)}
                            className="w-[180px] sm:w-[200px] shrink-0 rounded-2xl border border-zinc-200/80 p-3 bg-white hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                          >
                            <div>
                              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-zinc-100">
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
                              className="w-full mt-2 bg-gradient-to-r from-[#7c4624] to-[#5c3a21] hover:from-[#5c3a21] hover:to-[#3e2413] text-white font-bold h-8 text-[11px] rounded-xl transition-all shadow-md shadow-[#7c4624]/20"
                            >
                              Buy Now
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* ─── SECTION 7: SUPPORT THIS MANDAL (DONATION) (Expands to col-span-12 if no Products) ─── */}
            {canUseMandalTransactions && (
              <div
                id="section-donate"
                className={`scroll-mt-28 flex flex-col ${hasProducts ? "lg:col-span-4" : "lg:col-span-12"}`}
              >
                <Card className="rounded-3xl border-amber-200/80 p-6 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200/50 pb-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-warm-brown" />
                        Support {name}
                      </h3>
                      <p className="text-xs text-zinc-600">Your contribution helps us continue our seva & cultural activities</p>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className={`grid gap-2 ${hasProducts ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-5"}`}>
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

                    <div className={`space-y-3 ${!hasProducts ? "sm:flex sm:items-center sm:gap-4 sm:space-y-0" : ""}`}>
                      <div className="relative w-full flex-1">
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
                        onClick={handleOpenDonateModal}
                        className={`bg-warm-brown hover:bg-warm-brown/90 text-white font-bold h-11 px-6 rounded-xl text-xs shadow-md shadow-amber-900/10 flex items-center justify-center gap-2 ${
                          !hasProducts ? "sm:w-48 w-full" : "w-full"
                        }`}
                      >
                        <Gift className="w-4 h-4" />
                        Donate Now
                      </Button>
                    </div>

                    <div className="text-center text-[11px] text-zinc-500 font-medium pt-1">
                      🔒 100% Secure Payment • Instant Email Tax Receipt
                    </div>
                  </div>
                </Card>
              </div>
            )}

          </div>
        )}

        {/* ─── ROW 4: BOTTOM CARDS (ABOUT - 8 COLS, LOCATION - 2 COLS, CONTACT - 2 COLS) ─── */}
        {(hasDescription || hasLocation || hasContactOrSocial) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">

            {/* ABOUT (8 COLS) — only if mandal has a description */}
            {hasDescription && (
              <div id="section-about" className={`scroll-mt-28 ${hasLocation || hasContactOrSocial ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm space-y-3 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3 mb-3">
                      <h3 className="text-xl font-serif font-bold text-zinc-900">About {name}</h3>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto pr-2 custom-scrollbar text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                      {typeof description === "string" && description.includes("<") ? (
                        <span dangerouslySetInnerHTML={{ __html: description }} />
                      ) : (
                        description
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* LOCATION (2 COLS) — only if mandal has address/city/state/mapUrl */}
            {hasLocation && (
              <div id="section-location" className={`scroll-mt-28 ${hasDescription ? 'lg:col-span-2' : 'lg:col-span-6'}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm space-y-3 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3 mb-3">
                      <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-warm-brown" />
                        Location
                      </h3>
                    </div>

                    {([mandal.address, mandal.city, mandal.state].filter(Boolean).length > 0) && (
                      <div className="text-xs text-zinc-700 font-medium mb-3">
                        {[mandal.address, mandal.city, mandal.state].filter(Boolean).join(", ")}
                      </div>
                    )}

                    {(() => {
                      const mapUrl = mandal.mapUrl || "";
                      let embedSrc = "";
                      if (mapUrl.includes("src=")) {
                        const match = mapUrl.match(/src=["']([^"']+)["']/);
                        if (match && match[1]) embedSrc = match[1];
                      } else if (mapUrl.includes("google.com/maps/embed") || mapUrl.includes("maps.google.com")) {
                        embedSrc = mapUrl;
                      }

                      if (!embedSrc) {
                        const locQuery = [name, mandal.address, mandal.city, mandal.state].filter(Boolean).join(", ");
                        if (locQuery) {
                          embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(locQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                        }
                      }

                      const navUrl = mapUrl && mapUrl.startsWith("http") && !mapUrl.includes("embed")
                        ? mapUrl
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${[mandal.address, mandal.city, mandal.state].filter(Boolean).join(" ")}`)}`;

                      return (
                        <div
                          onClick={() => window.open(navUrl, "_blank")}
                          className="w-full h-36 rounded-2xl overflow-hidden border border-zinc-200 mb-3 shadow-inner bg-zinc-100 relative group cursor-pointer"
                        >
                          {embedSrc ? (
                            <iframe
                              src={embedSrc}
                              width="100%"
                              height="100%"
                              style={{ border: 0, pointerEvents: 'none' }}
                              allowFullScreen={false}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Location Map"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600"
                              alt="Map Location Preview"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end justify-between p-2.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1.5 text-white min-w-0">
                              <MapPin className="w-4 h-4 text-red-500 fill-red-500 shrink-0 animate-bounce" />
                              <span className="text-[11px] font-bold truncate drop-shadow">{mandal.city || name}</span>
                            </div>
                            <span className="text-[10px] font-bold bg-white/95 text-amber-950 px-2 py-0.5 rounded-full shadow-sm shrink-0">
                              Google Maps ↗
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <Button
                    onClick={() => {
                      const mapUrl = mandal.mapUrl || "";
                      let navUrl = mapUrl;
                      if (mapUrl.includes("src=")) {
                        const match = mapUrl.match(/src=["']([^"']+)["']/);
                        if (match && match[1]) navUrl = match[1];
                      }
                      if (!navUrl || !navUrl.startsWith("http")) {
                        navUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${mandal.address || mandal.city || ""}`)}`;
                      }
                      window.open(navUrl, "_blank");
                    }}
                    className="w-full bg-gradient-to-r from-[#7c4624] to-[#5c3a21] hover:from-[#5c3a21] hover:to-[#3e2413] text-white font-bold h-9 text-xs rounded-xl shadow-md shadow-[#7c4624]/20"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    Get Directions
                  </Button>
                </Card>
              </div>
            )}

            {/* CONTACT US (2 COLS) — only if mandal has email/website or social links */}
            {hasContactOrSocial && (
              <div id="section-contact" className={`scroll-mt-28 ${hasDescription ? 'lg:col-span-2' : 'lg:col-span-6'}`}>
                <Card className="rounded-3xl border-zinc-200/80 p-5 bg-white shadow-sm space-y-3 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3 mb-3">
                      <h3 className="text-xl font-serif font-bold text-zinc-900">
                        Contact Us
                      </h3>
                    </div>

                    {hasContact && (
                      <div className="space-y-2.5 text-xs text-zinc-700 font-medium">
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
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7c4624] to-amber-700 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
              <Gift className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-serif font-bold text-[#7c4624]">
              Donate to {name}
            </DialogTitle>
            <DialogDescription className="text-xs text-amber-900/70">
              Support this mandal&apos;s sacred activities, festival arrangements & community service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#7c4624] block mb-2">Select Contribution Amount (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-1 ${
                      selectedAmount === amount
                        ? "bg-gradient-to-r from-[#7c4624] to-[#5c3a21] text-white border-[#7c4624] shadow-md"
                        : "bg-white text-zinc-700 border-amber-900/15 hover:border-[#7c4624]/50 hover:bg-amber-50/50"
                    }`}
                  >
                    <span>₹{amount.toLocaleString("en-IN")}</span>
                    {selectedAmount === amount && <CheckCircle className="w-3.5 h-3.5 ml-1" />}
                  </button>
                ))}
              </div>
              <div className="mt-2.5">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#7c4624] text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="Enter custom amount..."
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-amber-900/20 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#7c4624]/20 focus:border-[#7c4624] transition-all"
                  />
                </div>
              </div>

              {/* Platform Support Fee Breakdown */}
              {(() => {
                const baseAmt = selectedAmount || parseInt(customAmount) || 0;
                if (baseAmt > 0) {
                  return (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-950 font-medium">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-600">Donation Amount:</span>
                        <span className="font-bold">₹{baseAmt.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-600 flex items-center gap-1">
                          Platform Support Fee
                          {fetchingFee && <span className="text-[10px] text-amber-600 animate-pulse">(calculating...)</span>}
                        </span>
                        <span className="font-bold text-amber-800">
                          + ₹{platformFee.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-amber-500/20 flex justify-between items-center text-sm font-black text-[#7c4624]">
                        <span>Total Payable:</span>
                        <span>₹{(baseAmt + platformFee).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="space-y-3 pt-2 border-t border-amber-900/10">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7c4624]">Your Contact Info</label>
              <div className="space-y-2">
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Full Name *" value={donorName} onChange={(e) => setDonorName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c4624]/20 focus:border-[#7c4624]" />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="email" placeholder="Email Address *" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c4624]/20 focus:border-[#7c4624]" required />
                </div>

                {/* Mobile Input & Send OTP Button */}
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Mobile Number (10 digits) *"
                    value={donorPhone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setDonorPhone(clean);
                    }}
                    className="w-full pl-10 pr-24 py-2.5 bg-white border border-amber-900/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c4624]/20 focus:border-[#7c4624]"
                    required
                  />
                  {currentUser || localStorage.getItem("token") ? (
                    <span className="absolute right-3 text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendDonationOtp}
                      disabled={isSendingDonationOtp || donorPhone.replace(/\D/g, '').length < 10}
                      className="absolute right-2 text-xs font-bold bg-[#7c4624] text-white px-3 py-1.5 rounded-lg hover:bg-[#5c3a21] transition-all disabled:opacity-40"
                    >
                      {isSendingDonationOtp ? "Sending..." : (donationOtpSent ? "Resend OTP" : "Send OTP")}
                    </button>
                  )}
                </div>

                {/* In-Modal OTP Input Box */}
                {!currentUser && !localStorage.getItem("token") && showDonationOtpInput && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">Enter OTP sent to +91 {donorPhone}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="6-digit OTP"
                        value={donationOtp}
                        onChange={(e) => setDonationOtp(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-center font-bold text-base tracking-widest text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#7c4624]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyDonationOtp}
                        disabled={isVerifyingDonationOtp || donationOtp.length < 4}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-40 shrink-0"
                      >
                        {isVerifyingDonationOtp ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  </div>
                )}
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
              className="w-full bg-gradient-to-r from-[#7c4624] to-[#5c3a21] hover:from-[#5c3a21] hover:to-[#3e2413] text-white py-3.5 h-auto text-base font-bold rounded-xl shadow-lg shadow-[#7c4624]/20 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDonate}
              disabled={isDonating || (() => {
                const raw = donorPhone.trim();
                const hasExplicitPlus = raw.startsWith('+');
                const cleaned = raw.replace(/\D/g, '');
                return hasExplicitPlus && !cleaned.startsWith('91');
              })()}
            >
              {isDonating 
                ? "Processing Donation..." 
                : `Proceed to Donate ₹${((selectedAmount || parseInt(customAmount) || 0) + platformFee).toLocaleString("en-IN")}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── GALLERY LIGHTBOX ───────────────────────────────────────────────── */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center select-none"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all"
            onClick={() => setLightboxOpen(false)}
            title="Close (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-5 left-5 z-20 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm border border-white/10">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {/* Left Arrow Button */}
          {allImages.length > 1 && (
            <button
              id="lightbox-prev-btn"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-lg hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
              }}
              title="Previous image (Left Arrow)"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Right Arrow Button */}
          {allImages.length > 1 && (
            <button
              id="lightbox-next-btn"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-lg hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
              }}
              title="Next image (Right Arrow)"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Main Image Container */}
          <div className="relative w-full h-full p-2 sm:p-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={getFullImageUrl(allImages[lightboxIndex])}
              alt={`Mandal Photo ${lightboxIndex + 1}`}
              className="max-w-[94vw] max-h-[90vh] w-auto h-auto object-contain rounded-2xl shadow-2xl transition-all duration-200"
            />
          </div>
        </div>
      )}

    </div>
  );
}

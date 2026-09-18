"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    Share2,
    MapPin,
    Star,
    Video,
    Calendar,
    Heart,
    Camera,
    ShoppingBag,
    Ticket,
    Play,
    Clock,
    Phone,
    Info,
    CheckCircle,
    Download,
    X,
    FileText,
    ArrowRight,
    IndianRupee,
    ShoppingCart,
    Globe,
    ExternalLink,
    Maximize2,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getLiveDarshanUrl } from "@/lib/utils/templeUtils";
import { extractYouTubeId } from "@/lib/utils/videoUtils";
import { getLocalized, getLocalizedArray } from "@/utils/localization";
import QRCode from "qrcode";
import { BASE_URL } from "@/config/apiConfig";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { TempleDetailProps } from "./TempleDetail";

export default function MobileTempleDetail({
    temple,
    isFavorite,
    activeImageIndex,
    setActiveImageIndex,
    user,
    isFullViewOpen,
    setIsFullViewOpen,
    selectedPurposes,
    setSelectedPurposes,
    showRatings,
    selectedEvent,
    setSelectedEvent,
    selectedNews,
    setSelectedNews,
    videoPlayUrl,
    setVideoPlayUrl,
    showAllEvents,
    setShowAllEvents,
    purposes,
    recommendedPoojas,
    galleryMedia,
   
    products,
    goToNext,
    goToPrev,
    goToMedia,
    toggleFavorite,
    handleDonation,
    handleBookPooja,
    getYouTubeId,
    getFullImageUrl,
    language,
    t,
    router,
    params,
}: TempleDetailProps) {
    const canBookPooja = temple.canBookPooja !== false;
    const canDonate = temple.canDonate !== false;

    // Photography Dialog state
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [photoStep, setPhotoStep] = useState(1);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    
    // Dynamic lists fetched from API
    const [photoPackages, setPhotoPackages] = useState<any[]>([]);
    const [allowedAreas, setAllowedAreas] = useState<string[]>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    
    // Selected fields
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [selectedPhotoArea, setSelectedPhotoArea] = useState("");
    const [selectedPhotoDate, setSelectedPhotoDate] = useState("");
    const [selectedPhotoSlot, setSelectedPhotoSlot] = useState<any>(null);
    const [agreedToRules, setAgreedToRules] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [bookingError, setBookingError] = useState("");

    // Fetch dynamic packages and allowed areas when dialog opens
    useEffect(() => {
        if (!isPhotoDialogOpen) return;
        
        // Allowed areas from temple object
        if (temple.allowedPhotoAreas) {
            try {
                const areas = typeof temple.allowedPhotoAreas === 'string'
                    ? JSON.parse(temple.allowedPhotoAreas)
                    : temple.allowedPhotoAreas;
                setAllowedAreas(Array.isArray(areas) ? areas : []);
            } catch (e) {
                setAllowedAreas([]);
            }
        }

        // Fetch custom photography packages
        const fetchPackages = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/temples/photography/${temple.id}/packages?lang=${language}`);
                const json = await res.json();
                if (json.success && json.data) {
                    const activePackages = json.data.filter((p: any) => p.isActive);
                    setPhotoPackages(activePackages);
                    if (activePackages.length > 0) {
                        setSelectedPackage(activePackages[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to load photography packages:", err);
            }
        };

        fetchPackages();
    }, [isPhotoDialogOpen, temple, language]);

    // Fetch slot availability when date changes
    useEffect(() => {
        if (!selectedPhotoDate || !isPhotoDialogOpen) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const res = await fetch(`${BASE_URL}/api/temples/photography/slots/availability?templeId=${temple.id}&date=${selectedPhotoDate}`);
                const json = await res.json();
                if (json.success && json.data) {
                    setAvailableSlots(json.data);
                    const firstAvail = json.data.find((s: any) => s.available);
                    setSelectedPhotoSlot(firstAvail || null);
                }
            } catch (err) {
                console.error("Failed to load slots:", err);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedPhotoDate, temple.id, isPhotoDialogOpen]);

    // About Temple expand/collapse
    const [showFullDesc, setShowFullDesc] = useState(false);

    // Live Darshan inline modal
    const [showLiveModal, setShowLiveModal] = useState(false);

    // Donation amount
    const [donationAmount, setDonationAmount] = useState<number>(251);

    // Device detection for App Store & Play Store links
    const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.devbhakti.user&hl=en_IN";
    const APP_STORE_URL = "https://apps.apple.com/in/app/devbhakti/id6761248156";
    const [appStoreUrl, setAppStoreUrl] = useState(PLAY_STORE_URL);
    const [isIOS, setIsIOS] = useState(false);
    const [showDownloadBanner, setShowDownloadBanner] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const ua = navigator.userAgent || "";
            const ios =
                /iphone|ipad|ipod/i.test(ua) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
                (/Macintosh/i.test(ua) && "ontouchend" in document);
            setIsIOS(ios);
            setAppStoreUrl(ios ? APP_STORE_URL : PLAY_STORE_URL);
        }
    }, []);

    const handleDownloadApp = (e: React.MouseEvent) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
            const ua = navigator.userAgent || "";
            const ios =
                /iphone|ipad|ipod/i.test(ua) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
                (/Macintosh/i.test(ua) && "ontouchend" in document);
            const targetUrl = ios ? APP_STORE_URL : PLAY_STORE_URL;
            window.open(targetUrl, "_blank", "noopener,noreferrer");
        }
    };

    const { addToCart: addToCartGlobal } = useCart();
    const { toast } = useToast();

    const resetPhotoFlow = () => {
        setIsPhotoDialogOpen(false);
        setPhotoStep(1);
        setAgreedToRules(false);
        setSelectedPhotoDate("");
        setSelectedPhotoArea("");
        setBookingError("");
        setBookingDetails(null);
        setQrCodeUrl("");
    };

    const handlePhotoSubmit = async () => {
        if (photoStep === 1 && !selectedPackage) {
            toast({ title: "Error", description: "Please select a package first.", variant: "destructive" });
            return;
        }
        if (photoStep === 2 && !selectedPhotoDate) {
            toast({ title: "Error", description: "Please choose a date.", variant: "destructive" });
            return;
        }
        if (photoStep === 3 && !selectedPhotoSlot) {
            toast({ title: "Error", description: "No time slot selected or available.", variant: "destructive" });
            return;
        }
        if (photoStep === 3 && !selectedPhotoArea) {
            toast({ title: "Error", description: "Please select an allowed area.", variant: "destructive" });
            return;
        }

        if (photoStep === 5) {
            // Payment Step -> Trigger Backend booking creation & Razorpay Checkout
            try {
                setBookingError("");
                
                // Get logged in user from localStorage
                const savedUserStr = localStorage.getItem("user");
                const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
                
                const bookingRes = await fetch(`${BASE_URL}/api/temples/photography/book`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        templeId: temple.id,
                        packageId: selectedPackage.id,
                        slotId: selectedPhotoSlot.id,
                        selectedArea: selectedPhotoArea,
                        bookingDate: selectedPhotoDate,
                        userId: savedUser?.id,
                        devoteeName: savedUser?.name || "Guest Devotee",
                        devoteePhone: savedUser?.phone || "9999999999",
                        devoteeEmail: savedUser?.email || "devotee@devbhakti.in"
                    })
                });

                const json = await bookingRes.json();
                if (!json.success) {
                    setBookingError(json.message || "Booking failed.");
                    return;
                }

                const { razorpayOrderId, bookingId, displayId, amount, platformFee, packagePrice } = json.data;

                // Load Razorpay Checkout
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
                    amount: Math.round(amount * 100),
                    currency: "INR",
                    name: "DevBhakti Photography",
                    description: `Pass for ${getLocalized(selectedPackage, 'name', language)}`,
                    order_id: razorpayOrderId,
                    handler: async function (response: any) {
                        try {
                            // Confirm payment verification
                            const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderType: "PHOTOGRAPHY",
                                    referenceId: bookingId
                                })
                            });
                            const verifyJson = await verifyRes.json();
                            if (verifyJson.success) {
                                const vData = verifyJson.data || {};
                                const finalBookingId = vData.bookingId || bookingId;
                                setBookingDetails({
                                    bookingId: finalBookingId,
                                    displayId: vData.displayId || displayId,
                                    packageName: vData.packageName || getLocalized(selectedPackage, 'name', language),
                                    bookingDate: vData.bookingDate || selectedPhotoDate,
                                    timeSlot: vData.timeSlot || selectedPhotoSlot.slotName,
                                    totalAmount: vData.totalAmount || amount,
                                    packagePrice: vData.packagePrice || packagePrice,
                                    platformFee: vData.platformFee || platformFee
                                });
                                
                                try {
                                    const qrUrl = `${window.location.origin}/temples/dashboard/verify-photo-ticket/${finalBookingId}`;
                                    const dataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 200 });
                                    setQrCodeUrl(dataUrl);
                                } catch (e) {
                                    console.error("Error generating QR", e);
                                }

                                setIsPhotoDialogOpen(true);
                                setPhotoStep(6);
                                toast({
                                    title: "Pass Confirmed! 🎉",
                                    description: "Your photography pass has been generated successfully.",
                                    variant: "success"
                                });
                            } else {
                                const errMsg = verifyJson.message || "Payment verification failed.";
                                setBookingError(errMsg);
                                toast({
                                    title: "Verification Failed",
                                    description: errMsg,
                                    variant: "destructive"
                                });
                            }
                        } catch (err: any) {
                            console.error("Verification error:", err);
                            setBookingError(err.message || "Payment verification error.");
                            toast({
                                title: "Verification Error",
                                description: "Could not verify payment. Please contact support.",
                                variant: "destructive"
                            });
                        }
                    },
                    prefill: {
                        name: savedUser?.name || "Guest",
                        email: savedUser?.email || "devotee@devbhakti.in",
                        contact: savedUser?.phone || "9999999999"
                    },
                    theme: {
                        color: "#7c4624"
                    },
                    modal: {
                        ondismiss: function () {
                            toast({
                                title: "Payment Cancelled",
                                description: "You closed the payment popup. You can try again whenever ready.",
                                variant: "default"
                            });
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', async function (response: any) {
                    await fetch(`${BASE_URL}/api/payments/failed`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderType: "PHOTOGRAPHY",
                            referenceId: bookingId,
                            error: response.error
                        })
                    });
                    setBookingError("Payment failed. Please try again.");
                });
                rzp.open();

            } catch (err: any) {
                setBookingError(err.message || "An error occurred during booking.");
            }
            return;
        }

        if (photoStep < 6) setPhotoStep(photoStep + 1);
    };

    const handleAddToCart = (product: any) => {
        const variant = product.variants?.[0];
        if (!variant) return;
        addToCartGlobal({
            productId: product.id,
            variantId: variant.id,
            name: getLocalized(product, "name", language),
            variantName: getLocalized(variant, "name", language),
            price: variant.price,
            image: product.image || "",
            quantity: 1,
            templeId: product.templeId,
        });
        toast({
            title: "Added to Cart",
            description: `${getLocalized(product, "name", language)} added to cart!`,
            variant: "success",
        });
    };

    const getProductImageUrl = (path: string) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith("http")) return path;
        return `${BASE_URL}${path}`;
    };

    // Dynamic darshan timings
    const activeOperatingHours = temple.operatingHours && Array.isArray(temple.operatingHours)
        ? temple.operatingHours.filter((s: any) => s.active)
        : [];

    // Normalize array props (guards against undefined before API responds)
    const safePoojas = temple.poojas ?? [];
    const safeProducts = products ?? [];
    const safeGalleryMedia = galleryMedia ?? [];

    // Dynamic events (upcoming)
    const upcomingEvents = temple.events || [];
    const displayedEvents = showAllEvents ? upcomingEvents : upcomingEvents.slice(0, 3);

    // Scroll to section function
    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-[#faf8f6] pb-32 text-[#3c2a21] font-sans antialiased text-base">

            {/* ───── Hero Image ───── */}
            <div className="relative h-[42vh] overflow-hidden rounded-b-[2.5rem] shadow-lg">
                <img
                    src={getFullImageUrl(temple.image)}
                    alt={getLocalized(temple, "name", language)}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Top nav */}
                <div className="absolute top-5 left-4 right-4 flex justify-between z-10">
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-[#7c4624] shadow-md active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-[#7c4624] shadow-md active:scale-95 transition-transform"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: getLocalized(temple, "name", language), url: window.location.href });
                            }
                        }}
                    >
                        <Share2 className="h-6 w-6" />
                    </button>
                </div>

                {/* Live badge on hero */}
                {temple.liveStatus && (
                    <div className="absolute bottom-16 left-6 z-10 flex items-center gap-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                        <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                        Live Darshan
                    </div>
                )}
            </div>

            {/* ───── Floating Info Card ───── */}
            <div className="relative px-3 -mt-10 z-20">
                <div className="bg-white rounded-3xl p-4 shadow-xl border border-orange-50">
                    <h1 className="text-3xl font-serif font-black text-[#5c3a21] leading-tight">
                        {getLocalized(temple, "name", language)}
                    </h1>
                    <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4 text-[#7c4624] shrink-0" />
                            <span className="truncate text-sm">{getLocalized(temple, "fullAddress", language)}</span>
                        </div>
                        {temple.phone && temple.showPhone !== false && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Phone className="h-4 w-4 text-[#7c4624] shrink-0" />
                                <span>{temple.phone}</span>
                            </div>
                        )}
                        {temple.website && temple.showWebsite !== false && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Globe className="h-4 w-4 text-[#7c4624] shrink-0" />
                                <a href={temple.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline truncate">
                                    Official Website
                                </a>
                            </div>
                        )}
                        {temple.mapUrl && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <MapPin className="h-4 w-4 text-[#7c4624] shrink-0" />
                                <a href={temple.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline truncate">
                                    Google Maps Location
                                </a>
                            </div>
                        )}
                    </div>

                    {showRatings && temple.rating && (
                        <div className="flex items-center gap-2 mt-3">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold text-foreground">{temple.rating}</span>
                            <span className="text-sm text-muted-foreground">({(temple.reviewsCount || 0).toLocaleString()} reviews)</span>
                        </div>
                    )}

                    {/* Live status strip */}
                    {temple.liveStatus && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-orange-50">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-ping" />
                                <span className="text-sm font-bold text-green-700">Live Darshan Available</span>
                            </div>
                            <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-md font-semibold">Watching Now</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ───── Quick Actions Grid ───── */}
            <div className="mt-4 px-3">
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50/50">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-y-6 gap-x-3">

                        {/* Book Pooja */}
                        {canBookPooja && (
                            <button onClick={() => scrollToSection("mobile-poojas-section")} className="flex flex-col items-center p-2 rounded-2xl transition-all text-center hover:bg-orange-50/50 active:scale-95">
                                <div className="h-14 w-14 bg-orange-100/70 rounded-2xl flex items-center justify-center mb-2 text-[#7c4624] shadow-sm">
                                    <Calendar className="h-7 w-7" />
                                </div>
                                <span className="text-sm font-bold leading-tight">Book Pooja</span>
                            </button>
                        )}

                        {/* Donate */}
                        {canDonate && (
                            <button onClick={() => scrollToSection("mobile-donation-section")} className="flex flex-col items-center p-2 rounded-2xl transition-all text-center hover:bg-orange-50/50 active:scale-95">
                                <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center mb-2 text-red-500 shadow-sm">
                                    <Heart className="h-7 w-7" />
                                </div>
                                <span className="text-sm font-bold leading-tight">Donate</span>
                            </button>
                        )}

                        {/* Live Darshan – only when live */}
                        {temple.liveStatus ? (
                            <button onClick={() => scrollToSection("mobile-live-section")} className="flex flex-col items-center p-2 rounded-2xl hover:bg-orange-50/50 active:scale-95 transition-all text-center">
                                <div className="h-14 w-14 bg-red-100/60 rounded-2xl flex items-center justify-center mb-2 text-red-600 shadow-sm relative">
                                    <Video className="h-7 w-7" />
                                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                </div>
                                <span className="text-sm font-bold leading-tight">Live Darshan</span>
                            </button>
                        ) : (
                            <div className="flex flex-col items-center p-2 rounded-2xl opacity-40 cursor-not-allowed text-center">
                                <div className="h-14 w-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-2 text-gray-400 shadow-sm">
                                    <Video className="h-7 w-7" />
                                </div>
                                <span className="text-sm font-bold leading-tight">Live Darshan</span>
                            </div>
                        )}

                        {/* Photography */}
                        {temple.photographyEnabled && (
                            <button onClick={() => router.push(`/temples/${temple.id}/photography`)} className="flex flex-col items-center p-2 rounded-2xl hover:bg-orange-50/50 active:scale-95 transition-all text-center">
                                <div className="h-14 w-14 bg-amber-100/60 rounded-2xl flex items-center justify-center mb-2 text-amber-700 shadow-sm">
                                    <Camera className="h-7 w-7" />
                                </div>
                                <span className="text-sm font-bold leading-tight">Photography</span>
                            </button>
                        )}

                        {/* Temple Shop */}
                        <button onClick={() => scrollToSection("mobile-shop-section")} className="flex flex-col items-center p-2 rounded-2xl hover:bg-orange-50/50 active:scale-95 transition-all text-center">
                            <div className="h-14 w-14 bg-[#3c2a21]/10 rounded-2xl flex items-center justify-center mb-2 text-[#3c2a21] shadow-sm">
                                <ShoppingBag className="h-7 w-7" />
                            </div>
                            <span className="text-sm font-bold leading-tight">Temple Shop</span>
                        </button>

                        {/* Darshan Tickets */}
                        {temple.isDarshanActive && (
                            <button onClick={() => router.push(`/darshan/${temple.id}`)} className="flex flex-col items-center p-2 rounded-2xl hover:bg-orange-50/50 active:scale-95 transition-all text-center">
                                <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-2 text-amber-600 shadow-sm">
                                    <Ticket className="h-7 w-7" />
                                </div>
                                <span className="text-sm font-bold leading-tight">Darshan Ticket</span>
                            </button>
                        )}

                    </div>
                </div>
            </div>

            {/* ───── Live Darshan Video Card ───── */}
            {temple.liveStatus && (
                <div id="mobile-live-section" className="mt-4 px-3">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-serif font-bold text-2xl text-[#5c3a21] flex items-center gap-2">
                            <Video className="w-6 h-6 text-red-500" /> Live Darshan
                        </h3>
                        <Link href={getLiveDarshanUrl(temple)} className="text-sm font-bold text-[#7c4624] hover:underline">View All</Link>
                    </div>
                    {/* Tap thumbnail → open inline modal */}
                    <button className="block w-full text-left" onClick={() => setShowLiveModal(true)}>
                        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-md group">
                            <img src={getFullImageUrl(temple.image)} alt="Live Darshan" className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-20 h-20 bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-2xl group-active:scale-110 transition-transform duration-300">
                                    <Play className="h-10 w-10 fill-white ml-1.5" />
                                </div>
                            </div>
                            <div className="absolute top-4 left-4 bg-red-600 text-white font-black text-xs uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Live
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <h4 className="font-bold text-base drop-shadow-md">{getLocalized(temple, "name", language)}</h4>
                                <p className="text-xs opacity-80 mt-0.5">Tap to watch live</p>
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* ───── Popular Poojas & Sevas ───── */}

              {canBookPooja && safePoojas.length > 0 && (
            <div id="mobile-poojas-section" className="mt-4 px-3">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-serif font-bold text-2xl text-[#5c3a21] flex items-center gap-2">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-400/20" /> Popular Poojas & Sevas
                    </h3>
                    <button onClick={handleBookPooja} className="text-sm font-bold text-[#7c4624] hover:underline">View All</button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
                    {safePoojas.map((pooja: any, idx: number) => (
                        <div
                            key={pooja.id || idx}
                            className="w-[180px] bg-white rounded-3xl p-4 border border-orange-50/50 shadow-sm flex flex-col justify-between shrink-0 snap-start active:scale-[0.98] transition-transform cursor-pointer"
                            onClick={() => router.push(`/poojas/${pooja.slug || pooja.id}`)}
                        >
                            <div>
                                <div className="h-32 rounded-2xl bg-orange-50 overflow-hidden mb-3">
                                    {pooja.image ? (
                                        <img src={getFullImageUrl(pooja.image)} alt={getLocalized(pooja, "name", language)} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={getFullImageUrl(temple.image)} alt={getLocalized(pooja, "name", language)} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <h4 className="font-bold text-base text-[#3c2a21] leading-snug line-clamp-2 min-h-[2.5rem]">
                                    {getLocalized(pooja, "name", language)}
                                </h4>
                            </div>
                            <div className="mt-3 pt-3 border-t border-orange-50 flex items-center justify-between">
                                <span className="font-serif font-black text-base text-[#7c4624] flex items-center gap-0.5">
                                    <IndianRupee className="h-4 w-4" />{pooja.price}
                                </span>
                                <Button
                                    size="sm"
                                    className="h-8 px-4 text-xs font-bold rounded-full bg-[#7c4624] hover:bg-[#5c3a21] text-white"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/poojas/${pooja.slug || pooja.id}`); }}
                                >
                                    Book
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
  )}
            {/* ───── Donation Fast Action ───── */}
            {canDonate && (
            <div id="mobile-donation-section" className="mt-4 px-3">
                <div className="bg-[#fcede4] rounded-3xl p-4 shadow-sm border border-orange-100">
                    <h3 className="font-serif font-bold text-2xl text-[#5c3a21] mb-2">Donations</h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                        Support annadaan, gau seva and upkeep of this sacred temple.
                    </p>
                    <div className="flex gap-3 mb-4 overflow-x-auto scrollbar-none pb-1">
                        {[101, 251, 501, 1101].map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setDonationAmount(amt)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 ${
                                    donationAmount === amt ? "bg-[#7c4624] text-white shadow-sm" : "bg-white text-[#7c4624] border border-orange-100"
                                }`}
                            >
                                ₹{amt}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                const custom = prompt("Enter donation amount:", "2000");
                                if (custom && !isNaN(Number(custom)) && Number(custom) > 0) setDonationAmount(Number(custom));
                            }}
                            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 bg-white text-[#7c4624] border border-orange-100"
                        >
                            Other
                        </button>
                    </div>
                    <Button onClick={handleDonation} className="w-full h-14 rounded-2xl bg-[#7c4624] hover:bg-[#5c3a21] text-white text-sm font-bold gap-2 shadow-sm">
                        <Heart className="h-5 w-5 fill-white" />
                        Donate ₹{donationAmount} Now
                    </Button>
                </div>
            </div>
            )}

            {/* ───── Upcoming Events — DYNAMIC: only show when events exist ───── */}
            {upcomingEvents.length > 0 && (
                <div className="mt-4 px-3">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-serif font-bold text-2xl text-[#5c3a21]">Upcoming Events</h3>
                        {upcomingEvents.length > 3 && (
                            <button onClick={() => setShowAllEvents(!showAllEvents)} className="text-sm font-bold text-[#7c4624] hover:underline">
                                {showAllEvents ? "Show Less" : "View All"}
                            </button>
                        )}
                    </div>
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50/50 space-y-3">
                        {displayedEvents.map((event: any, idx: number) => (
                            <div
                                key={event.id || idx}
                                className="flex justify-between items-start py-3 border-b border-orange-50 last:border-none last:pb-0 cursor-pointer hover:bg-orange-50/20 rounded-xl px-2 transition-colors"
                                onClick={() => setSelectedEvent(event)}
                            >
                                <div className="flex-1 min-w-0 pr-3">
                                    <h4 className="font-bold text-base text-[#3c2a21] leading-snug">
                                        {getLocalized(event, "name", language)}
                                        {!event.templeId && (
                                            <span className="ml-2 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-tight">Global</span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 shrink-0" />
                                        {event.date || "Coming Soon"}
                                    </p>
                                </div>
                                <Badge className="bg-[#7c4624]/10 text-[#7c4624] border-none text-[10px] font-black px-3 py-1 rounded-full hover:bg-[#7c4624]/10 shrink-0 uppercase tracking-wider">
                                    {event.date ? new Date(event.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "TBD"}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ───── Temple Information ───── */}
            {(activeOperatingHours.length > 0 || temple.openTime || temple.mapUrl || (temple.phone && temple.showPhone !== false) || getLocalized(temple, "description", language)) && (
                <div className="mt-4 px-3">
                    <h3 className="font-serif font-bold text-2xl text-[#5c3a21] mb-3">Temple Information</h3>
                    <div className="space-y-4">

                        {/* Darshan Timings — DYNAMIC: only show if timings exist */}
                        {(activeOperatingHours.length > 0 || temple.openTime) && (
                            <div className="bg-white rounded-3xl p-5 border border-orange-50/50 shadow-sm flex items-start gap-4">
                                <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Darshan Timings</h4>
                                    {activeOperatingHours.length > 0 ? (
                                        <div className="space-y-1.5 mt-2">
                                            {activeOperatingHours.map((slot: any, idx: number) => (
                                                <p key={idx} className="text-base text-foreground">
                                                    <span className="font-bold">{slot.label}: </span>
                                                    <span className="font-medium text-[#7c4624]">{slot.start} – {slot.end}</span>
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-[#7c4624] mt-2 uppercase">{temple.openTime}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Directions */}
                        {temple.mapUrl && (
                            <a href={temple.mapUrl} target="_blank" rel="noopener noreferrer" className="bg-white rounded-3xl p-5 border border-orange-50/50 shadow-sm flex items-start gap-4 active:bg-orange-50/20">
                                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Directions</h4>
                                    <p className="text-base font-bold text-foreground mt-1.5 truncate">{getLocalized(temple, "fullAddress", language)}</p>
                                    <span className="text-sm text-[#7c4624] font-bold mt-1.5 flex items-center gap-1">Open in Google Maps <ArrowRight className="h-4 w-4" /></span>
                                </div>
                            </a>
                        )}

                        {/* Contact */}
                        {(temple.phone && temple.showPhone !== false) && (
                            <a href={`tel:${temple.phone}`} className="bg-white rounded-3xl p-5 border border-orange-50/50 shadow-sm flex items-start gap-4 active:bg-green-50/10">
                                <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shrink-0">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Contact</h4>
                                    <p className="text-base font-bold text-foreground mt-1.5">{temple.phone}</p>
                                </div>
                            </a>
                        )}

                        {/* About Temple */}
                        {getLocalized(temple, "description", language) && (
                            <div className="bg-white rounded-3xl p-5 border border-orange-50/50 shadow-sm flex items-start gap-4">
                                <div className="h-12 w-12 bg-[#7c4624]/10 rounded-2xl flex items-center justify-center text-[#7c4624] shrink-0 mt-0.5">
                                    <Info className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-1.5">About Temple</h4>
                                    <div
                                        className={`text-base text-muted-foreground leading-relaxed prose prose-base max-w-none transition-all duration-300 ${
                                            showFullDesc ? "" : "line-clamp-4"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: getLocalized(temple, "description", language) || "" }}
                                    />
                                    <button
                                        onClick={() => setShowFullDesc((prev) => !prev)}
                                        className="mt-2 flex items-center gap-1 text-sm font-bold text-[#7c4624] hover:text-[#5c3a21] transition-colors"
                                    >
                                        {showFullDesc ? (
                                            <>
                                                <span>Show less</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                                            </>
                                        ) : (
                                            <>
                                                <span>Read more</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ————— Social Media Links ————— */}
            {(temple.instagramUrl || temple.facebookUrl || temple.youtubeUrl) && (
                <div className="mt-4 px-3">
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-orange-50/50">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Follow Us</h3>
                        <div className="flex gap-3">
                            {temple.instagramUrl && (
                                <a
                                    href={temple.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100 active:scale-95 transition-transform"
                                >
                                    <FaInstagram className="h-6 w-6 text-pink-500" />
                                    <span className="text-[10px] font-bold text-pink-600">Instagram</span>
                                </a>
                            )}
                            {temple.facebookUrl && (
                                <a
                                    href={temple.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-blue-50 border border-blue-100 active:scale-95 transition-transform"
                                >
                                    <FaFacebook className="h-6 w-6 text-blue-600" />
                                    <span className="text-[10px] font-bold text-blue-700">Facebook</span>
                                </a>
                            )}
                            {temple.youtubeUrl && (
                                <a
                                    href={temple.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-red-50 border border-red-100 active:scale-95 transition-transform"
                                >
                                    <FaYoutube className="h-6 w-6 text-red-500" />
                                    <span className="text-[10px] font-bold text-red-600">YouTube</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ───── Gallery ───── */}
            {safeGalleryMedia.length > 0 && (
                <div className="mt-4 px-3">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-serif font-bold text-2xl text-[#5c3a21]">Gallery</h3>
                        <button onClick={() => { setActiveImageIndex(0); setIsFullViewOpen(true); }} className="text-sm font-bold text-[#7c4624] hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {safeGalleryMedia.slice(0, 4).map((item, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    if (item.type === "video") { setVideoPlayUrl(item.url); }
                                    else { setActiveImageIndex(index); setIsFullViewOpen(true); }
                                }}
                                className="aspect-square rounded-2xl overflow-hidden relative shadow-sm border border-orange-50 bg-white cursor-pointer"
                            >
                                {item.type === "image" ? (
                                    <img src={getFullImageUrl(item.url)} alt="Gallery" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                                        <img src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/default.jpg`} alt="Video" className="w-full h-full object-cover opacity-60" />
                                        <Play className="absolute h-6 w-6 text-white fill-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ───── Temple Shop — DYNAMIC (products from this temple) ───── */}
            {safeProducts.length > 0 && (
                <div id="mobile-shop-section" className="mt-4 px-3">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-serif font-bold text-2xl text-[#5c3a21] flex items-center gap-2">
                            <ShoppingBag className="w-6 h-6 text-[#7c4624]" /> Temple Shop
                        </h3>
                        <button onClick={() => router.push(`/marketplace?templeId=${temple.id}`)} className="text-base font-bold text-[#7c4624] hover:underline">View All</button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
                        {safeProducts.map((product: any) => {
                            const price = product.variants?.[0]?.price;
                            const outOfStock = product.variants?.every((v: any) => v.stock === 0);
                            return (
                                <div
                                    key={product.id}
                                    className="w-[165px] bg-white rounded-3xl p-4 border border-orange-50/50 shadow-sm snap-start shrink-0 cursor-pointer"
                                    onClick={() => router.push(`/marketplace/product/${product.id}`)}
                                >
                                    <div className="h-28 rounded-2xl bg-orange-50 overflow-hidden mb-3 relative">
                                        {product.image ? (
                                            <img src={getProductImageUrl(product.image)} alt={getLocalized(product, "name", language)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                <ShoppingBag className="h-10 w-10" />
                                            </div>
                                        )}
                                        {outOfStock && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                                                <span className="text-white text-xs font-black uppercase tracking-wider">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-base text-[#3c2a21] leading-tight line-clamp-2 min-h-[2.5rem]">
                                        {getLocalized(product, "name", language)}
                                    </h4>
                                    <div className="mt-3 flex items-center justify-between">
                                        {price !== undefined ? (
                                            <span className="font-bold text-base text-[#7c4624] flex items-center gap-0.5">
                                                <IndianRupee className="h-4 w-4" />{price}
                                            </span>
                                        ) : (
                                            <span className="text-base text-muted-foreground">—</span>
                                        )}
                                        <button
                                            disabled={outOfStock}
                                            onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                            className="h-8 w-8 rounded-full bg-[#7c4624]/10 hover:bg-[#7c4624]/20 flex items-center justify-center text-[#7c4624] disabled:opacity-30 transition-colors"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ───── In the News ───── */}
            {temple.newsCuttings && Array.isArray(temple.newsCuttings) && (temple.newsCuttings as any[]).length > 0 && (
                <div className="mt-4 px-3">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-serif font-bold text-2xl text-[#5c3a21] flex items-center gap-2">
                            <FileText className="w-6 h-6 text-[#7c4624]" /> In the News
                        </h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
                        {(temple.newsCuttings as any[]).map((item: any, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedNews(item)}
                                className="w-[200px] shrink-0 snap-start rounded-3xl overflow-hidden relative border border-orange-50 shadow-sm block active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="aspect-[4/3] bg-orange-50 overflow-hidden relative">
                                    <img
                                        src={getFullImageUrl(item.image)}
                                        alt={`Press cutting ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full">
                                            <Maximize2 className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* ───── DevBhakti App Banner ───── */}
            <div className="mt-6 px-4 mb-8">
                <div className="relative bg-gradient-to-r from-[#3c2a21] via-[#5c3a21] to-[#7c4624] text-white rounded-3xl p-6 flex items-center gap-5 shadow-xl overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                    <div className="absolute -left-4 -bottom-6 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

                    <div className="flex-1 relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                                {isIOS ? "App Store" : "Play Store"}
                            </span>
                        </div>
                        <h4 className="font-bold text-base leading-snug">Get the DevBhakti App</h4>
                        <p className="text-xs text-white/70 mt-1 leading-normal">Pooja booking, reminders, live darshan & more.</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-bold text-amber-400">4.8</span>
                            <span className="text-amber-400 text-xs">★★★★★</span>
                            <span className="text-[10px] text-white/50">(25K+)</span>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-2 relative z-10">
                        <a
                            href={appStoreUrl}
                            onClick={handleDownloadApp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white text-[#3c2a21] px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-orange-50 active:scale-95 transition-all whitespace-nowrap"
                        >
                            <Download className="h-4 w-4 shrink-0" />
                            {isIOS ? "App Store" : "Play Store"}
                        </a>
                        <span className="text-[9px] text-white/40">
                            {isIOS ? "iOS 14+" : "Android 6+"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ───── Floating Download App Button ───── */}
            {showDownloadBanner && (
                <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-50">
                    <div className="relative flex items-center gap-3 bg-gradient-to-r from-[#5c3a21] to-[#7c4624] text-white pl-4 pr-2 py-2.5 rounded-full shadow-2xl border border-white/10">
                        {/* Glow ring */}
                        <span className="absolute -inset-0.5 rounded-full bg-amber-500/20 blur-sm animate-pulse pointer-events-none" />

                        <div className="h-8 w-8 bg-white/15 rounded-full flex items-center justify-center shrink-0">
                            <Download className="h-4 w-4 text-white" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-xs font-black whitespace-nowrap">Download DevBhakti</p>
                            <p className="text-[10px] text-white/70 whitespace-nowrap">
                                {isIOS ? "Available on App Store" : "Available on Play Store"}
                            </p>
                        </div>
                        <a
                            href={appStoreUrl}
                            onClick={handleDownloadApp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 bg-white text-[#5c3a21] text-xs font-black px-3 py-1.5 rounded-full shadow active:scale-95 transition-transform whitespace-nowrap"
                        >
                            {isIOS ? "App Store" : "Play Store"}
                        </a>
                        <button
                            onClick={() => setShowDownloadBanner(false)}
                            className="ml-1 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shrink-0"
                            aria-label="Dismiss download banner"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ───── Sticky Bottom Action Bar with all sections ───── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-orange-50 py-3 px-6 flex justify-around items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {/* Book Pooja - Scroll to poojas section */}
                {canBookPooja && (
                    <button 
                        onClick={() => scrollToSection("mobile-poojas-section")} 
                        className="flex flex-col items-center gap-1 text-sm font-bold active:scale-95 transition-transform text-[#7c4624]"
                    >
                        <Calendar className="h-6 w-6" />
                        <span>Book Pooja</span>
                    </button>
                )}

                {/* Donate - Scroll to donation section */}
                {canDonate && (
                    <button 
                        onClick={() => scrollToSection("mobile-donation-section")} 
                        className="flex flex-col items-center gap-1 text-sm font-bold active:scale-95 transition-transform text-red-500"
                    >
                        <Heart className="h-6 w-6" />
                        <span>Donate</span>
                    </button>
                )}

                {/* Live Darshan - Scroll to live section if live, else navigate */}
                {temple.liveStatus ? (
                    <button 
                        onClick={() => scrollToSection("mobile-live-section")} 
                        className="flex flex-col items-center gap-1 text-sm font-bold text-red-600 active:scale-95 transition-transform"
                    >
                        <Video className="h-6 w-6" />
                        <span>Live Darshan</span>
                    </button>
                ) : (
                    <Link href={getLiveDarshanUrl(temple)} className="flex flex-col items-center gap-1 text-sm font-bold text-gray-400 active:scale-95 transition-transform">
                        <Video className="h-6 w-6" />
                        <span>Live Darshan</span>
                    </Link>
                )}

                {/* Shop - Scroll to shop section */}
                <button 
                    onClick={() => scrollToSection("mobile-shop-section")} 
                    className="flex flex-col items-center gap-1 text-sm font-bold text-[#7c4624] active:scale-95 transition-transform"
                >
                    <ShoppingBag className="h-6 w-6" />
                    <span>Shop</span>
                </button>
            </div>

            {/* ═══ Live Darshan Inline Modal ═══ */}
            <Dialog open={showLiveModal} onOpenChange={(open) => !open && setShowLiveModal(false)}>
                <DialogContent className="max-w-[97vw] w-full p-0 border-none bg-black overflow-hidden rounded-2xl shadow-2xl">
                    <DialogTitle className="sr-only">Live Darshan</DialogTitle>

                    {/* Header bar */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-700 to-red-600">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                            </span>
                            <span className="text-white font-black text-xs uppercase tracking-widest">Live Darshan</span>
                            <span className="text-white/70 text-xs font-medium">&mdash; {getLocalized(temple, "name", language)}</span>
                        </div>
                        <button
                            onClick={() => setShowLiveModal(false)}
                            className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4 text-white" />
                        </button>
                    </div>

                    {/* Video */}
                    <div className="w-full aspect-video bg-black">
                        {(() => {
                            const liveUrl = temple.liveUrl || temple.channelId || "";
                            const ytId = extractYouTubeId(liveUrl);

                            if (ytId) {
                                // YouTube live embed
                                return (
                                    <iframe
                                        key={ytId}
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                                        title="Live Darshan"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                        allowFullScreen
                                        className="w-full h-full"
                                    />
                                );
                            }

                            if (liveUrl && (liveUrl.startsWith("http") || liveUrl.startsWith("/"))) {
                                // Generic iframe (HLS / other stream)
                                return (
                                    <iframe
                                        key={liveUrl}
                                        width="100%"
                                        height="100%"
                                        src={liveUrl}
                                        title="Live Darshan"
                                        frameBorder="0"
                                        allow="autoplay; fullscreen"
                                        allowFullScreen
                                        className="w-full h-full"
                                    />
                                );
                            }

                            // Fallback — no playable URL, show thumbnail + link
                            return (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-white">
                                    <img
                                        src={getFullImageUrl(temple.image)}
                                        alt={getLocalized(temple, "name", language)}
                                        className="w-full h-full absolute inset-0 object-cover opacity-30"
                                    />
                                    <div className="relative z-10 text-center space-y-3">
                                        <p className="text-sm text-white/80">Live stream not available in-app.</p>
                                        <Link
                                            href={getLiveDarshanUrl(temple)}
                                            className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-full font-bold text-sm"
                                            onClick={() => setShowLiveModal(false)}
                                        >
                                            <Play className="h-4 w-4 fill-white" /> Open Full Page
                                        </Link>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
                        <div>
                            <p className="text-white font-bold text-sm">{getLocalized(temple, "name", language)}</p>
                            <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{getLocalized(temple, "fullAddress", language)}
                            </p>
                        </div>
                        <Link
                            href={getLiveDarshanUrl(temple)}
                            onClick={() => setShowLiveModal(false)}
                            className="text-xs font-bold text-amber-400 flex items-center gap-1 hover:text-amber-300"
                        >
                            Full Page <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════
                Photography Permission Booking Dialog
            ═══════════════════════════════════════ */}
            <Dialog open={isPhotoDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    if (photoStep === 5) return;
                    resetPhotoFlow();
                }
            }}>
                <DialogContent 
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                    className="max-w-md w-[92vw] p-0 border-none bg-white overflow-hidden rounded-3xl shadow-2xl"
                >
                    <DialogTitle className="sr-only">Photography Permission</DialogTitle>

                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#7c4624] to-[#5c3a21] text-white p-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-serif font-bold text-lg">Photography Permission</h3>
                            <p className="text-xs text-white/70 mt-0.5">{getLocalized(temple, "name", language)}</p>
                        </div>
                        <button onClick={resetPhotoFlow} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Step progress */}
                    <div className="px-5 py-3 bg-orange-50/50 border-b border-orange-50 flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[1, 2, 3, 4, 5, 6].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${photoStep >= step ? "bg-[#7c4624] text-white" : "bg-gray-200 text-gray-400"}`}>
                                    {step}
                                </div>
                                {step < 6 && <div className={`w-5 h-0.5 shrink-0 mx-0.5 ${photoStep > step ? "bg-[#7c4624]" : "bg-gray-200"}`} />}
                            </div>
                        ))}
                        <span className="text-xs font-bold text-[#7c4624] uppercase ml-auto">Step {photoStep}/6</span>
                    </div>

                    {/* Step content */}
                    <div className="p-5 max-h-[55vh] overflow-y-auto">
                        {photoStep === 1 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Select Type</h4>
                                {photoPackages.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-gray-400">No photography packages configured.</div>
                                ) : (
                                    photoPackages.map((opt) => (
                                        <div
                                            key={opt.id}
                                            onClick={() => setSelectedPackage(opt)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${selectedPackage?.id === opt.id ? "bg-orange-50/50 border-[#7c4624] shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                                        >
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-[#3c2a21]">{getLocalized(opt, 'name', language)}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.duration} mins duration</p>
                                            </div>
                                            <span className="font-serif font-black text-sm text-[#7c4624] shrink-0">₹{opt.price}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {photoStep === 2 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Select Date</h4>
                                <input
                                    type="date"
                                    value={selectedPhotoDate}
                                    onChange={(e) => setSelectedPhotoDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="w-full p-4 rounded-2xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#7c4624]"
                                />
                                <p className="text-xs text-muted-foreground leading-normal">Dates subject to local scheduling & festival restrictions.</p>
                            </div>
                        )}

                        {photoStep === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Select Time Slot</h4>
                                    {loadingSlots ? (
                                        <div className="text-center py-2 text-xs text-gray-400">Loading availability...</div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-center py-2 text-xs text-gray-400">No active slots configured for this temple.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    disabled={!slot.available}
                                                    onClick={() => setSelectedPhotoSlot(slot)}
                                                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed ${selectedPhotoSlot?.id === slot.id ? "bg-[#7c4624] text-white border-transparent" : "bg-white border-gray-200 hover:bg-gray-50 text-[#3c2a21]"}`}
                                                >
                                                    {slot.slotName}
                                                    <span className="block text-[9px] font-normal opacity-85 mt-0.5">({slot.maxBookings - slot.bookedBookings} left)</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Select Area</h4>
                                    {allowedAreas.length === 0 ? (
                                        <div className="text-xs text-gray-400">All areas inside temple grounds.</div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {allowedAreas.map((area) => (
                                                <button
                                                    key={area}
                                                    onClick={() => setSelectedPhotoArea(area)}
                                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedPhotoArea === area ? "bg-[#7c4624] text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
                                                >
                                                    {area}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {photoStep === 4 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Rules & Info</h4>
                                <div className="bg-orange-50/50 p-5 rounded-2xl space-y-3 text-sm text-[#5c3a21]/90 leading-relaxed border border-orange-100">
                                    {getLocalizedArray(temple, 'photographyRules', language).length > 0 ? (
                                        <ul className="list-disc pl-4 space-y-2 text-xs">
                                            {getLocalizedArray(temple, 'photographyRules', language).map((rule, idx) => (
                                                <li key={idx} className="whitespace-pre-line">{rule}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <>
                                            <div className="flex gap-2"><Camera className="h-5 w-5 text-[#7c4624] shrink-0 mt-0.5" /><span>Photography only in allowed areas. Sanctum strictly restricted.</span></div>
                                            <div className="flex gap-2"><Info className="h-5 w-5 text-[#7c4624] shrink-0 mt-0.5" /><span>No tripod or flash inside the sanctum. Respect prayer hours.</span></div>
                                            <div className="flex gap-2"><FileText className="h-5 w-5 text-[#7c4624] shrink-0 mt-0.5" /><span>Permission is non-transferable & valid only for the selected slot.</span></div>
                                        </>
                                    )}
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer p-1 mt-2">
                                    <input type="checkbox" checked={agreedToRules} onChange={(e) => setAgreedToRules(e.target.checked)} className="h-5 w-5 rounded accent-[#7c4624]" />
                                    <span className="text-sm font-bold text-[#3c2a21]">I agree to the above rules</span>
                                </label>
                            </div>
                        )}

                        {photoStep === 5 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Secure Payment</h4>
                                <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100/50 text-center">
                                    <span className="text-xs text-muted-foreground uppercase font-black tracking-widest">Amount Payable</span>
                                    <h2 className="font-serif font-black text-4xl text-[#7c4624] mt-1">₹{(selectedPackage?.price || 0) + 25}</h2>
                                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-center gap-1">
                                        <span>₹{selectedPackage?.price} Package Price</span>
                                        <span className="opacity-60">+</span>
                                        <span>₹25 Platform Fee</span>
                                    </p>
                                </div>
                                {bookingError && (
                                    <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl text-center font-semibold">{bookingError}</div>
                                )}
                                <div className="space-y-2">
                                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Pay via Razorpay Gateway</p>
                                    <p className="text-center text-xs text-muted-foreground mt-2">Cards / UPI / Net Banking / Wallet supported</p>
                                </div>
                            </div>
                        )}

                        {photoStep === 6 && bookingDetails && (
                            <div className="text-center py-6 space-y-5">
                                <div className="h-20 w-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <CheckCircle className="h-12 w-12" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-2xl text-[#5c3a21]">🎉 Pass Confirmed!</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Your photography pass is ready. Show it at temple entry.</p>
                                </div>
                                
                                {/* QR Pass Card */}
                                <div className="bg-white p-4 rounded-2xl border-2 border-[#7c4624] shadow-md max-w-xs mx-auto">
                                    <div className="bg-gradient-to-b from-[#7c4624] to-[#5c3a21] text-white p-3 rounded-lg mb-3">
                                        <p className="text-xs font-semibold">Photography Pass</p>
                                        <p className="text-lg font-mono font-black">{bookingDetails.displayId}</p>
                                    </div>
                                    <div className="bg-[#f8f4f1] p-3 rounded-lg mb-3 flex justify-center">
                                        {qrCodeUrl ? (
                                            <img src={qrCodeUrl} alt="QR Code" className="h-32 w-32 object-contain" />
                                        ) : (
                                            <div className="h-32 w-32 bg-white border-2 border-[#7c4624] rounded flex items-center justify-center">
                                                <Camera className="h-8 w-8 text-[#7c4624]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left text-xs space-y-1 bg-orange-50 p-2 rounded">
                                        <p><span className="font-bold text-[#5c3a21]">Package:</span> {bookingDetails.packageName}</p>
                                        <p><span className="font-bold text-[#5c3a21]">Date:</span> {bookingDetails.bookingDate}</p>
                                        <p><span className="font-bold text-[#5c3a21]">Slot:</span> {bookingDetails.timeSlot}</p>
                                        <p><span className="font-bold text-[#5c3a21]">Area:</span> {selectedPhotoArea}</p>
                                    </div>
                                </div>
                                
                                {/* Booking Details */}
                                <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100 text-left max-w-xs mx-auto text-sm space-y-2">
                                    <div className="flex justify-between py-1 border-b border-orange-100">
                                        <span className="font-bold">Package Price:</span>
                                        <span className="text-muted-foreground">₹{bookingDetails.packagePrice}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-orange-100">
                                        <span className="font-bold">Platform Fee:</span>
                                        <span className="text-muted-foreground">₹{bookingDetails.platformFee}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-bold">Total Amount:</span>
                                        <span className="text-[#7c4624] font-black text-lg">₹{bookingDetails.totalAmount}</span>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="pt-2 space-y-2 max-w-xs mx-auto">
                                    <Button 
                                        onClick={() => {
                                            // Download receipt
                                            const token = localStorage.getItem("token");
                                            if (token && bookingDetails.bookingId) {
                                                toast({ title: "Downloading...", description: "Preparing your receipt." });
                                                fetch(`${BASE_URL}/api/bookings/${bookingDetails.bookingId}/receipt`, {
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                })
                                                .then(res => res.blob())
                                                .then(blob => {
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `Photography-Pass-${bookingDetails.displayId}.pdf`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    window.URL.revokeObjectURL(url);
                                                    toast({ title: "Receipt Downloaded", description: "Your pass has been downloaded successfully." });
                                                })
                                                .catch(err => {
                                                    console.error(err);
                                                    toast({ title: "Download Failed", description: "Failed to download receipt.", variant: "destructive" });
                                                });
                                            }
                                        }}
                                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Pass
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            setPhotoStep(1);
                                            setIsPhotoDialogOpen(false);
                                            router.push(`/profile/bookings`);
                                        }}
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl"
                                    >
                                        View in Profile
                                    </Button>
                                    <Button 
                                        onClick={resetPhotoFlow}
                                        variant="outline"
                                        className="w-full h-11 text-[#7c4624] border-[#7c4624] text-sm font-bold rounded-xl"
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {photoStep < 6 && (
                        <div className="p-5 border-t border-orange-50/60 bg-gray-50/50 flex justify-end">
                            <Button
                                onClick={handlePhotoSubmit}
                                disabled={photoStep === 4 && !agreedToRules}
                                className="h-12 px-10 bg-[#7c4624] hover:bg-[#5c3a21] disabled:opacity-50 text-white rounded-xl text-sm font-bold uppercase tracking-wider"
                            >
                                {photoStep === 5 ? "Pay Now" : "Continue"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ Event Detail Dialog ═══ */}
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="max-w-md w-[92vw] p-0 border-none bg-white overflow-hidden rounded-3xl shadow-2xl">
                    <DialogTitle className="sr-only">Event Details</DialogTitle>
                    {selectedEvent && (
                        <div>
                            <div className="h-32 bg-gradient-to-br from-[#7c4624] via-[#a05a2c] to-[#5c3a21] p-6 flex flex-col justify-end">
                                <h2 className="text-2xl font-black text-white leading-tight">{getLocalized(selectedEvent, "name", language)}</h2>
                                <div className="flex items-center gap-2 text-white/80 text-sm mt-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{selectedEvent.date || "Date TBD"}</span>
                                    {!selectedEvent.templeId && <Badge className="bg-white/20 text-white text-[10px] border-white/30 ml-1">Global</Badge>}
                                </div>
                            </div>
                            <div className="p-6 space-y-5">
                                {selectedEvent.description && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">About the Event</h3>
                                        <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedEvent.description }} />
                                    </div>
                                )}
                                {recommendedPoojas.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Recommended Poojas</h3>
                                        {recommendedPoojas.map((pooja: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-orange-50/30 border border-orange-50">
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{getLocalized(pooja, "name", language)}</p>
                                                    <p className="text-xs text-[#7c4624] font-bold flex items-center gap-0.5 mt-0.5"><IndianRupee className="h-4 w-4" />{pooja.price}</p>
                                                </div>
                                                <Button size="sm" className="rounded-full bg-[#7c4624] text-xs font-black px-5 h-8" onClick={() => { setSelectedEvent(null); router.push(`/poojas/${pooja.slug || pooja.id}?temple=${temple.id}`); }}>
                                                    Book Now
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ Video Play Dialog ═══ */}
            <Dialog open={!!videoPlayUrl} onOpenChange={(open) => !open && setVideoPlayUrl(null)}>
                <DialogContent className="max-w-4xl w-[95vw] p-0 border-none bg-black overflow-hidden rounded-2xl">
                    <DialogTitle className="sr-only">Temple Video</DialogTitle>
                    {videoPlayUrl && (
                        <div className="aspect-video w-full">
                            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYouTubeId(videoPlayUrl)}?autoplay=1`} title="Temple Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ Full Gallery Lightbox ═══ */}
            <Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
                <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center overflow-hidden">
                    <DialogTitle className="sr-only">Gallery</DialogTitle>
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        {galleryMedia[activeImageIndex]?.type === "image" ? (
                            <img src={getFullImageUrl(galleryMedia[activeImageIndex].url)} alt="Temple view" className="max-w-full max-h-full object-contain rounded-lg" />
                        ) : (
                            <div className="w-[95vw] max-w-4xl aspect-video rounded-2xl overflow-hidden border border-white/10">
                                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYouTubeId(galleryMedia[activeImageIndex].url)}?autoplay=1`} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </div>
                        )}
                        {galleryMedia.length > 1 && (
                            <>
                                <button className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full backdrop-blur-md" onClick={(e) => { e.stopPropagation(); goToPrev(); }}>
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full backdrop-blur-md" onClick={(e) => { e.stopPropagation(); goToNext(); }}>
                                    <ChevronLeft className="h-6 w-6 rotate-180" />
                                </button>
                            </>
                        )}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-xs font-bold tracking-widest">
                            {activeImageIndex + 1} / {galleryMedia.length}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ═══ News Cutting Modal ═══ */}
            <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DialogContent className="max-w-[95vw] w-full p-4 border-none bg-black/95 flex flex-col items-center justify-center overflow-hidden h-[90vh]">
                    <DialogTitle className="sr-only">News Cutting</DialogTitle>
                    {selectedNews && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                            <img
                                src={getFullImageUrl(selectedNews.image)}
                                alt="News Cutting"
                                className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg"
                            />
                            {selectedNews.link && (
                                <Button 
                                    asChild
                                    size="lg"
                                    className="bg-primary hover:bg-[#a05a2c] text-white font-bold tracking-wide rounded-full px-8 shadow-xl mt-2 w-full max-w-xs"
                                >
                                    <a href={selectedNews.link} target="_blank" rel="noopener noreferrer">
                                        Navigate to news
                                        <ExternalLink className="ml-2 w-4 h-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

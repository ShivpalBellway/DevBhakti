"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { fetchPublicTempleById, fetchRatingsSettings, fetchPublicProducts } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";
import { getLocalized, getLocalizedArray } from "@/utils/localization";

import DesktopTempleDetail from "./DesktopTempleDetail";
import MobileTempleDetail from "./MobileTempleDetail";

export interface TempleDetailProps {
    temple: any;
    loading: boolean;
    isFavorite: boolean;
    activeImageIndex: number;
    setActiveImageIndex: React.Dispatch<React.SetStateAction<number>>;
    isAutoScrolling: boolean;
    setIsAutoScrolling: React.Dispatch<React.SetStateAction<boolean>>;
    user: any;
    isFullViewOpen: boolean;
    setIsFullViewOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedPurposes: string[];
    setSelectedPurposes: React.Dispatch<React.SetStateAction<string[]>>;
    showRatings: boolean;
    selectedEvent: any;
    setSelectedEvent: React.Dispatch<React.SetStateAction<any>>;
    selectedNews: any | null;
    setSelectedNews: React.Dispatch<React.SetStateAction<any | null>>;
    videoPlayUrl: string | null;
    setVideoPlayUrl: React.Dispatch<React.SetStateAction<string | null>>;
    showAllEvents: boolean;
    setShowAllEvents: React.Dispatch<React.SetStateAction<boolean>>;
    purposes: string[];
    recommendedPoojas: any[];
    galleryMedia: any[];
    products: any[];
    goToNext: () => void;
    goToPrev: () => void;
    goToMedia: (index: number) => void;
    toggleFavorite: () => Promise<void>;
    handleDonation: () => void;
    handleBookPooja: () => void;
    getYouTubeId: (url: string) => string | null;
    getFullImageUrl: (path: string) => string;
    language: Language;
    t: (key: string) => string;
    router: any;
    params: any;
}

export default function TempleDetail() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { language, t } = useLanguage();

    // MediaQuery state
    const isMobile = useMediaQuery("(max-width: 768px)");
    
    // Hydration guard state
    const [isMounted, setIsMounted] = useState(false);

    // Business Logic state variables
    const [temple, setTemple] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isFullViewOpen, setIsFullViewOpen] = useState(false);
    const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
    const [showRatings, setShowRatings] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedNews, setSelectedNews] = useState<any | null>(null);
    const [videoPlayUrl, setVideoPlayUrl] = useState<string | null>(null);
    const [showAllEvents, setShowAllEvents] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const purposes = useMemo(() => {
        if (!temple?.poojas) return [];
        const allCategories = temple.poojas.flatMap((p: any) => {
            const cat = getLocalized(p, "category", language);
            return cat ? cat.split(",").map((s: string) => s.trim()) : [];
        });
        const unique = Array.from(new Set(allCategories.filter(Boolean))) as string[];
        return unique.sort();
    }, [temple, language]);

    useEffect(() => {
        if (purposes.length > 0 && selectedPurposes.length === 0) {
            setSelectedPurposes([purposes[0]]);
        }
    }, [purposes, selectedPurposes.length]);

    const recommendedPoojas = useMemo(() => {
        if (!selectedEvent) return [];
        if (selectedEvent.Pooja && selectedEvent.Pooja.length > 0) {
            const explicitPoojaIds = selectedEvent.Pooja.map((p: any) => p.id);
            const explicitPoojas = temple?.poojas?.filter((p: any) => explicitPoojaIds.includes(p.id)) || [];
            return explicitPoojas.length > 0 ? explicitPoojas : selectedEvent.Pooja;
        }
        return [];
    }, [selectedEvent, temple]);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            checkIfFavorite();
        }
    }, [params?.id, params?.subdomain]);

    const checkIfFavorite = async () => {
        const templeId = params?.id || params?.subdomain;
        try {
            const res = await fetchUserFavorites();
            if (res.success) {
                const isFav = res.data.some((f: any) => f.templeId === templeId);
                setIsFavorite(isFav);
            }
        } catch (error) {
            console.error("Error checking favorite status:", error);
        }
    };

    useEffect(() => {
        const loadTempleAndSettings = async () => {
            const templeSlugOrId = params?.id || params?.subdomain;
            if (templeSlugOrId) {
                setLoading(true);
                // Step 1: fetch temple first to get its real UUID (slug may be in URL)
                const [templeData, settingsData] = await Promise.all([
                    fetchPublicTempleById(templeSlugOrId as string, language),
                    fetchRatingsSettings(),
                ]);
                setTemple(templeData);
                if (settingsData && settingsData.settings) {
                    setShowRatings(settingsData.settings.temple.details);
                }
                // Step 2: use the real temple UUID for product query
                // params.id could be a slug (e.g. "kashi-vishwanath-temple") but
                // products store the actual UUID as templeId in the DB.
                const realTempleId = templeData?.id || templeSlugOrId;
                const productsData = await fetchPublicProducts({
                    templeId: realTempleId as string,
                    lang: language,
                    limit: 20
                });
                if (productsData && productsData.products) {
                    setProducts(productsData.products);
                }
                setLoading(false);
            }
        };
        loadTempleAndSettings();
    }, [params?.id, params?.subdomain, language]);

    const getFullImageUrl = (path: string) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith("http")) return path;
        return `${API_URL.replace("/api", "")}${path}`;
    };

    // Auto-scroll hero banner - pause when lightbox is open
    useEffect(() => {
        if (!temple) return;
        if (isFullViewOpen) return;
        const images = [temple.image, ...(temple.heroImages || [])].filter((img, idx, self) => img && self.indexOf(img) === idx);
        const heroImagesCount = images.length;

        if (heroImagesCount <= 1 || !isAutoScrolling) return;

        const interval = setInterval(() => {
            setActiveImageIndex((prev) => (prev + 1) % heroImagesCount);
        }, 3000);

        return () => clearInterval(interval);
    }, [temple, isAutoScrolling, isFullViewOpen]);

    // Unified media for gallery (Images + YouTube)
    const galleryMedia = useMemo(() => {
        if (!temple) return [];
        const images = [temple.image, ...(temple.heroImages || []), ...(temple.gallery || [])]
            .filter((img, idx, self) => img && self.indexOf(img) === idx)
            .map((img: any) => ({ type: "image", url: img }));
        
        const videos: { type: string; url: string }[] = [];

        (temple.youtubeLinks || []).forEach((url: string) => {
            if (url && !videos.some(v => v.url === url)) {
                videos.push({ type: "video", url });
            }
        });
        
        return [...images, ...videos];
    }, [temple]);

    const goToNext = () => {
        setActiveImageIndex((prev) => (prev + 1) % galleryMedia.length);
    };

    const goToPrev = () => {
        setActiveImageIndex((prev) => (prev - 1 + galleryMedia.length) % galleryMedia.length);
    };

    const goToMedia = (index: number) => {
        setActiveImageIndex(index);
    };

    // Keyboard navigation for Full View Modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFullViewOpen) return;
            if (e.key === "ArrowRight") {
                goToNext();
            } else if (e.key === "ArrowLeft") {
                goToPrev();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullViewOpen, galleryMedia.length]);

    const toggleFavorite = async () => {
        const templeId = params?.id || params?.subdomain;
        if (!user) {
            toast({
                title: "Please Login",
                description: "You need to login as a devotee to add favourites.",
                variant: "destructive",
            });
            return;
        }

        try {
            if (isFavorite) {
                await removeFavorite({ templeId: templeId as string });
                setIsFavorite(false);
                toast({ title: "Removed from Favourites", description: "Temple removed from your favourites.", variant: "success" });
            } else {
                await addFavorite({ templeId: templeId as string });
                setIsFavorite(true);
                toast({ title: "❤️ Added to Favourites", description: "Temple added to your favourites!", variant: "success" });
            }
        } catch (error: any) {
            toast({
                title: t("common.error"),
                description: error.response?.data?.message || error.message || t("common.failed_to_update_favorites"),
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    const handleDonation = () => {
        if (temple?.canDonate === false) {
            toast({
                title: "Donations Disabled",
                description: "Donations are enabled only for verified and active temples.",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        const donationUrl = `/donation?temple=${temple.id}`;
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;

        if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
            router.push(`/auth?redirect=${encodeURIComponent(donationUrl)}`);
            return;
        }
        router.push(donationUrl);
    };

    const handleBookPooja = () => {
        if (temple?.canBookPooja === false) {
            toast({
                title: "Bookings Disabled",
                description: "Pooja bookings are enabled only for verified and active temples.",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        const bookingUrl = `/booking?temple=${temple.id}`;
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
            router.push(`/auth?redirect=${encodeURIComponent(bookingUrl)}`);
            return;
        }
        router.push(bookingUrl);
    };

    const handleGalleryClick = () => {
        if (!user) {
            router.push(`/auth?redirect=/temples/${params?.id || params?.subdomain}`);
            return;
        }
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Render loading indicator before mounting is finished to avoid hydration errors
    if (!isMounted || loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!temple) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-20">
                    <p className="text-xl text-muted-foreground">{t("temple_detail.not_found")}</p>
                </div>
                <Footer />
            </div>
        );
    }

    const sharedProps: TempleDetailProps = {
        temple,
        loading,
        isFavorite,
        activeImageIndex,
        setActiveImageIndex,
        isAutoScrolling,
        setIsAutoScrolling,
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
    };

    return isMobile ? (
        <MobileTempleDetail {...sharedProps} />
    ) : (
        <DesktopTempleDetail {...sharedProps} />
    );
}

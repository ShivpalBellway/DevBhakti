"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin,
    Star,
    Clock,
    Video,
    Calendar,
    Heart,
    Share2,
    ChevronLeft,
    ChevronRight,
    IndianRupee,
    Maximize2,
    X,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";

// Local temple images for hero banner & gallery

import { fetchPublicTempleById, fetchRatingsSettings } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getLiveDarshanUrl } from "@/lib/utils/templeUtils";

export default function TempleDetail() {
    const params = useParams();
    const [temple, setTemple] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isFullViewOpen, setIsFullViewOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
    const [showRatings, setShowRatings] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const purposes = React.useMemo(() => {
        if (!temple?.poojas) return [];
        const allCategories = temple.poojas.flatMap((p: any) =>
            p.category ? p.category.split(',').map((s: string) => s.trim()) : []
        );
        const unique = Array.from(new Set(allCategories.filter(Boolean))) as string[];
        return unique.sort();
    }, [temple]);

    useEffect(() => {
        if (purposes.length > 0 && selectedPurposes.length === 0) {
            setSelectedPurposes([purposes[0]]);
        }
    }, [purposes]);

    const recommendedPoojas = React.useMemo(() => {
        if (!selectedEvent || !temple?.poojas) return [];
        // Recommendation logic:    
        // Try to match pooja benefits or category with event name
        const eventNameLower = selectedEvent.name?.toLowerCase() || "";
        const filtered = temple.poojas.filter((p: any) =>
            p.category?.toLowerCase().includes(eventNameLower) ||
            p.name?.toLowerCase().includes(eventNameLower) ||
            p.benefits?.some((b: string) => eventNameLower.includes(b.toLowerCase()))
        );
        return filtered.length > 0 ? filtered.slice(0, 3) : temple.poojas.slice(0, 3);
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
            const templeId = params?.id || params?.subdomain;
            if (templeId) {
                setLoading(true);
                const [templeData, settingsData] = await Promise.all([
                    fetchPublicTempleById(templeId as string),
                    fetchRatingsSettings()
                ]);
                setTemple(templeData);
                if (settingsData && settingsData.settings) {
                    setShowRatings(settingsData.settings.temple.details);
                }
                setLoading(false);
            }
        };
        loadTempleAndSettings();
    }, [params?.id, params?.subdomain]);

    const getFullImageUrl = (path: string) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    // Auto-scroll hero banner
    useEffect(() => {
        if (!temple) return;
        const images = [temple.image, ...(temple.heroImages || [])].filter((img, idx, self) => img && self.indexOf(img) === idx);
        const heroImagesCount = images.length;

        if (heroImagesCount <= 1 || !isAutoScrolling) return;

        const interval = setInterval(() => {
            setActiveImageIndex((prev) => (prev + 1) % heroImagesCount);
        }, 3000);

        return () => clearInterval(interval);
    }, [temple, isAutoScrolling]);

    if (loading) {
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
                    <p className="text-xl text-muted-foreground">Temple not found or not verified.</p>
                </div>
                <Footer />
            </div>
        );
    }

    const heroImages = temple ? [temple.image, ...(temple.heroImages || [])].filter((img, idx, self) => img && self.indexOf(img) === idx) : [];

    // Navigation functions
    const goToNext = () => {
        setIsAutoScrolling(false);
        setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    };

    const goToPrev = () => {
        setIsAutoScrolling(false);
        setActiveImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    };

    const goToImage = (index: number) => {
        setIsAutoScrolling(false);
        setActiveImageIndex(index);
    };

    const toggleFavorite = async () => {
        const templeId = params?.id || params?.subdomain;
        if (!user) {
            router.push("/auth");
            return;
        }

        try {
            if (isFavorite) {
                await removeFavorite({ templeId: templeId as string });
                setIsFavorite(false);
                toast({ title: "Removed from favorites", variant: "success" });
            } else {
                await addFavorite({ templeId: templeId as string });
                setIsFavorite(true);
                toast({ title: "Added to favorites", variant: "success" });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || error.message || "Failed to update favorites",
                variant: "destructive",
            });
        }
    };

    const handleDonation = () => {
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

    return (
        <div className="min-h-screen bg-background">
            <Navbar isSolid={true} />

            {/* Hero Image Carousel */}
            <section className="relative h-[70vh] md:h-[80vh] overflow-hidden mt-26">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeImageIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        <img
                            src={getFullImageUrl(heroImages[activeImageIndex])}
                            alt={temple.name}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Carousel Dots - Top center Position */}
                {heroImages.length > 1 && (
                    <div className="absolute top-28 left-1/2 -translate-x-1/2 flex gap-2 z-[110] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg">
                        {heroImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === index
                                    ? "bg-primary w-8"
                                    : "bg-white/40 hover:bg-white w-2"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="absolute top-28 right-4 md:right-8 flex gap-2 z-20">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setIsFullViewOpen(true)}
                    >
                        <Maximize2 className="h-5 w-5" />
                    </Button>
                    {/* <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm"
                        onClick={toggleFavorite}
                    >
                        <Heart
                            className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                        />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm"
                    >
                        <Share2 className="h-5 w-5" />
                    </Button> */}
                </div>

                {/* Left/Right Navigation Arrows */}
                {heroImages.length > 1 && (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors z-20"
                            onClick={goToPrev}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors z-20"
                            onClick={goToNext}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </>
                )}

                {/* Live Badge */}
                {/* {temple.liveStatus && (
                    <Badge className="absolute bottom-24 md:bottom-28 left-4 md:left-8 bg-red-500 text-white animate-pulse text-base px-4 py-2 z-20">
                        <span className="w-2 h-2 bg-white rounded-full mr-2" />
                        LIVE NOW
                    </Badge>
                )} */}
            </section>

            {/* Content */}
            <section className="container mx-auto px-4 -mt-16 relative z-10 pb-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-border/50">
                            <CardContent className="p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                                    <div>
                                        <Badge variant="secondary" className="mb-2">
                                            {temple.category}
                                        </Badge>
                                        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                                            {temple.name}
                                        </h1>
                                    </div>
                                    {showRatings && (
                                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                            <span className="font-bold text-foreground">{temple.rating}</span>
                                            <span className="text-muted-foreground text-sm">
                                                ({(temple.reviewsCount || 0).toLocaleString()} reviews)
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>{temple.fullAddress}</span>
                                    </div>
                                    {/* {temple.openTime && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span>Operating Hours: {temple.openTime}</span>
                                        </div>
                                    )} */}
                                </div>

                                <div className="flex flex-wrap gap-3">

                                    <span className="font-bold">Description</span>
                                    <span>{temple.description}</span>

                                    {/* <span className="font-bold">History</span>
                                    <span>{temple.history}</span> */}
                                </div>

                                {/* <div className="flex flex-wrap gap-3">
                                    <Button variant="gold" className="gap-2" asChild>
                                        <Link href={`/booking?temple=${numericId}`}>
                                            <Calendar className="h-4 w-4" />
                                            Book Pooja
                                        </Link>
                                    </Button>

                                    <Button variant="outline" className="gap-2">
                                        <Video className="h-4 w-4" />
                                        Watch Live Darshan
                                    </Button>
                                </div> */}


                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs defaultValue="poojas" className="w-full">
                            <TabsList className="w-full justify-start bg-white text-black p-2 rounded-lg gap-2 border border-primary/10 shadow-sm">
                                <TabsTrigger value="poojas" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-md px-6 font-bold">Poojas & Seva</TabsTrigger>
                                <TabsTrigger value="filter" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-md px-6 font-bold">Filter by Purpose</TabsTrigger>
                            </TabsList>

                            <TabsContent value="about" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-xl font-display font-semibold mb-3">Description</h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {temple.description}
                                            </p>
                                        </div>
                                        {temple.history && (
                                            <div>
                                                <h3 className="text-xl font-display font-semibold mb-3">History</h3>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {temple.history}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="poojas" className="mt-6">
                                <Card className="border-border/50">
                                    <div className="p-4 bg-primary/5 border-b border-primary/10">
                                        <h3 className="font-serif font-bold text-primary flex items-center gap-2">
                                            <Star className="w-4 h-4" />
                                            Available Poojas & Rituals
                                        </h3>
                                    </div>
                                    <CardContent className="p-0">
                                        {temple.poojas && temple.poojas.length > 0 ? (
                                            <div className="divide-y divide-primary/5">
                                                {temple.poojas.map((pooja: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-primary/[0.02] transition-colors"
                                                    >
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-lg text-foreground mb-2">{pooja.name}</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {pooja.benefits?.map((benefit: string, bIdx: number) => (
                                                                    <span
                                                                        key={bIdx}
                                                                        className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider"
                                                                    >
                                                                        {benefit}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                                                            <div className="flex items-center text-primary font-bold text-lg">
                                                                <IndianRupee className="h-4 w-4" />
                                                                {pooja.price}
                                                            </div>
                                                            <Button
                                                                className="rounded-full px-6 shadow-soft hover:shadow-warm transition-all"
                                                                onClick={() => router.push(`/poojas/${pooja.id}`)}
                                                            >
                                                                Know More
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center text-muted-foreground italic">
                                                Detailed pooja schedule will be available soon.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="filter" className="mt-3">
                                <div className="space-y-6">
                                    {/* Purpose Grid - Multi-select Support */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Select a purpose:
                                            </p>
                                        </div>
                                        <div className="border-[1.5px] border-primary/10 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                                                {purposes.map((purpose) => {
                                                    const isSelected = selectedPurposes.includes(purpose);
                                                    return (
                                                        <button
                                                            key={purpose}
                                                            onClick={() => {
                                                                setSelectedPurposes([purpose]);
                                                            }}
                                                            className={`p-4 text-[11px] font-bold uppercase tracking-wider transition-all border-[0.5px] border-primary/10 flex items-center justify-center text-center h-12 leading-tight relative
                                                                ${isSelected
                                                                    ? "bg-primary text-white z-10 scale-[1.01] shadow-inner"
                                                                    : "bg-white text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                            )}
                                                            {purpose}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filtered Poojas - Premium Glassmorphism List */}
                                    {selectedPurposes.length > 0 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-start gap-3 px-2">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse mt-2" />
                                                <h3 className="font-serif text-lg font-bold text-foreground leading-tight">
                                                    Showing rituals for <span className="text-primary italic">{selectedPurposes.join(", ")}</span>
                                                </h3>
                                            </div>

                                            <div className="grid gap-3">
                                                {temple.poojas
                                                    ?.filter((p: any) =>
                                                        selectedPurposes.some(purpose =>
                                                            p.category?.split(',').map((s: string) => s.trim()).includes(purpose)
                                                        )
                                                    )
                                                    .map((pooja: any, index: number) => (
                                                        <Card key={index} className="group border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-sm border border-primary/5">
                                                            <div className="flex items-center justify-between p-4 gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight truncate">{pooja.name}</h4>
                                                                </div>

                                                                <div className="flex items-center gap-6 shrink-0">
                                                                    <div className="font-black text-lg text-primary flex items-center">
                                                                        <IndianRupee className="h-4 w-4" />
                                                                        {pooja.price}
                                                                    </div>
                                                                    <Button
                                                                        className="rounded-lg px-8 h-10 shadow-sm hover:shadow-md group-hover:scale-105 transition-all bg-primary font-bold text-xs"
                                                                        onClick={() => router.push(`/poojas/${pooja.id}`)}
                                                                    >
                                                                        Know More
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>



                            <TabsContent value="gallery" className="mt-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {temple.gallery?.map((img, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                            <img
                                                src={(img as any).src || img}
                                                alt={`${temple.name} gallery ${index + 1}`}
                                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar Actions & Info */}
                    <div className="space-y-6">
                        <Card className="border-border/50 sticky top-24 overflow-hidden shadow-warm bg-white/80 backdrop-blur-md">
                            <CardContent className="p-5 space-y-6">
                                {/* Primary Actions */}
                                <div className="space-y-3">
                                    <div className={`grid ${temple.liveStatus ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                                        <Button
                                            variant="gold"
                                            className="w-full gap-2 h-12 text-base font-bold shadow-sm group transition-all"
                                            onClick={handleBookPooja}
                                        >
                                            <Calendar className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
                                            <span className="truncate">Book Pooja</span>
                                        </Button>

                                        {temple.liveStatus && (
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2 h-12 text-sm font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all shadow-sm group px-2"
                                                asChild
                                            >
                                                <Link href={getLiveDarshanUrl(temple)}>
                                                    <div className="relative shrink-0">
                                                        <Video className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                                        </span>
                                                    </div>
                                                    <span className="truncate">Live Darshan</span>
                                                </Link>
                                            </Button>
                                        )}
                                    </div>

                                    {/* Prominent Donation Button */}
                                    <div className="space-y-4">
                                        {((temple.operatingHours && Array.isArray(temple.operatingHours) && temple.operatingHours.filter((s: any) => s.active).length > 0) || temple.openTime) && (
                                            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                <div className="h-8 w-8 shrink-0 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-primary/60 leading-tight mb-1">Operating Hours</p>
                                                    {temple.operatingHours && Array.isArray(temple.operatingHours) && temple.operatingHours.filter((s: any) => s.active).length > 0 ? (
                                                        <div className="space-y-1">
                                                            {temple.operatingHours.filter((s: any) => s.active).map((slot: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                                    <span className="text-muted-foreground font-medium">{slot.label}:</span>
                                                                    <span className="font-bold text-foreground">{slot.start} - {slot.end}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="font-bold text-foreground text-sm uppercase">{temple.openTime}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/* <Button
                                            className="w-full gap-3 h-14 text-lg font-black shadow-lg group bg-gradient-to-r from-[#7c4624] to-[#a05a2c] hover:from-[#a05a2c] hover:to-[#7c4624] text-white border-none transition-all duration-500 rounded-xl"
                                            onClick={handleDonation}
                                        >
                                            <Heart className="h-6 w-6 fill-white animate-pulse group-hover:scale-125 transition-transform" />
                                            <span>Donate to Temple</span>
                                        </Button> */}

                                    </div>
                                </div>

                                {/* Creative Location Integration */}
                                {temple.mapUrl && (
                                    <div className="space-y-3 pt-2">
                                        <a
                                            href={temple.mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-all duration-300 group"
                                        >
                                            <div className="h-11 w-11 shrink-0 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                                <MapPin className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary/60 leading-tight">Sacred Location</p>
                                                <p className="font-bold text-foreground text-sm mt-0.5">Explore on Maps</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-primary/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </a>

                                        {/* <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl border-dashed border-primary/30 text-primary hover:bg-primary/5 font-bold gap-2"
                                            onClick={handleDonation}
                                        >
                                            <Heart className="h-4 w-4" />
                                            Contribute to Temple Development
                                        </Button> */}
                                    </div>
                                )}

                                {/* Compact Upcoming Events */}
                                {temple.events && temple.events.length > 0 && (
                                    <div className="pt-2 space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1 w-8 bg-primary/20 rounded-full" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Upcoming Events</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {temple.events.slice(0, 3).map((event: any, index: number) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="relative pl-4 border-l-2 border-primary/10 hover:border-primary/40 transition-all py-1 group cursor-pointer hover:bg-primary/5 rounded-r-lg"
                                                >
                                                    <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                    <h4 className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">{event.name}</h4>
                                                    <p className="text-[11px] font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" />
                                                        {event.date}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Full View Modal */}
            <Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
                <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center overflow-hidden">
                    <DialogTitle className="sr-only">Full Image View</DialogTitle>
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50 rounded-full"
                            onClick={() => setIsFullViewOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        <motion.img
                            key={activeImageIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={getFullImageUrl(heroImages[activeImageIndex])}
                            alt={temple.name}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        />

                        {heroImages.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToPrev();
                                    }}
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToNext();
                                    }}
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </button>
                            </>
                        )}

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                            {heroImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToImage(index)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === index
                                        ? "bg-primary w-10"
                                        : "bg-white/30 hover:bg-white/60 w-3"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Event Detail Modal with Recommended Poojas */}
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="max-w-lg overflow-hidden p-0 border-none bg-white rounded-2xl shadow-2xl">
                    <DialogTitle className="sr-only">Event Details</DialogTitle>
                    {selectedEvent && (
                        <div className="relative">
                            {/* Header Gradient */}
                            <div className="h-32 bg-gradient-to-br from-primary via-[#a05a2c] to-[#7c4624] p-6 flex flex-col justify-end">
                                <h2 className="text-2xl font-black text-white leading-tight">{selectedEvent.name}</h2>
                                <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">{selectedEvent.date}</span>
                                </div>
                            </div>

                            {/* Close Button Overlay */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                                onClick={() => setSelectedEvent(null)}
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            <div className="p-6 space-y-6">
                                {/* Event Description (if any) */}
                                {selectedEvent.description && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">About the Event</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {selectedEvent.description}
                                        </p>
                                    </div>
                                )}

                                {/* Recommended Poojas Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-6 bg-primary rounded-full" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Recommended Poojas</h3>
                                    </div>

                                    <div className="grid gap-3">
                                        {recommendedPoojas.map((pooja: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="group p-4 rounded-xl bg-primary/[0.03] border border-primary/5 hover:border-primary/20 hover:bg-primary/[0.06] transition-all duration-300 flex items-center justify-between gap-4"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                                        {pooja.name}
                                                    </h4>
                                                    <div className="flex items-center text-primary font-black text-xs mt-1">
                                                        <IndianRupee className="h-3 w-3" />
                                                        {pooja.price}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="rounded-full bg-primary hover:bg-[#a05a2c] text-[10px] font-black uppercase tracking-wider px-4 h-8 shadow-sm"
                                                    onClick={() => {
                                                        const bookingUrl = `/booking?temple=${temple.id}&pooja=${encodeURIComponent(pooja.name)}`;
                                                        const token = localStorage.getItem("token");
                                                        const savedUser = localStorage.getItem("user");
                                                        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
                                                        if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
                                                            router.push(`/auth?redirect=${encodeURIComponent(bookingUrl)}`);
                                                            return;
                                                        }
                                                        router.push(bookingUrl);
                                                    }}
                                                >
                                                    Book Now
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full text-xs font-bold py-6 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-xl text-primary"
                                        onClick={() => {
                                            setSelectedEvent(null);
                                            // Scroll to poojas tab
                                            const element = document.getElementById("poojas-tab");
                                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        View All Poojas
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

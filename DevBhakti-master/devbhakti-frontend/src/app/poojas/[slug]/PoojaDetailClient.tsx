"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Clock,
    IndianRupee,
    ArrowRight,
    CheckCircle2,
    Info,
    MapPin,
    Star,
    HelpCircle,
    PlayCircle,
    Loader2,
    MessageSquare,
    Sparkle,
    ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchPublicPoojaById, fetchRatingsSettings } from "@/api/publicController";
import { API_URL } from "@/config/apiConfig";
import { toast } from "@/hooks/use-toast";
import { getTempleUrl } from "@/lib/utils/templeUtils";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized, getLocalizedArray } from "@/utils/localization";

interface PoojaDetailClientProps {
    id: string;
}

// Removed hardcoded STANDARD_FAQS as they are now fetched from the backend


const PoojaDetailClient = ({ id }: PoojaDetailClientProps) => {
    const [pooja, setPooja] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("about");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showRatings, setShowRatings] = useState(false);
    const [showAllFaqs, setShowAllFaqs] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const templeIdFromUrl = searchParams.get("temple");
    const { language, t } = useLanguage();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        setIsLoggedIn(!!token);
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const getFullImageUrl = (path: string) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const getLowestPrice = (pooja: any) => {
        let prices: number[] = [pooja.price];

        if (pooja.packages) {
            try {
                const pkgs = typeof pooja.packages === 'string' ? JSON.parse(pooja.packages) : pooja.packages;
                if (Array.isArray(pkgs)) {
                    pkgs.forEach((p: any) => p.price && prices.push(p.price));
                }
            } catch (e) { }
        }

        if (pooja.templeCopies && Array.isArray(pooja.templeCopies)) {
            pooja.templeCopies.forEach((copy: any) => {
                if (copy.price) prices.push(copy.price);
                if (copy.packages) {
                    try {
                        const pkgs = typeof copy.packages === 'string' ? JSON.parse(copy.packages) : copy.packages;
                        if (Array.isArray(pkgs)) {
                            pkgs.forEach((p: any) => p.price && prices.push(p.price));
                        }
                    } catch (e) { }
                }
            });
        }

        const validPrices = prices.filter(p => p > 0);
        return validPrices.length > 0 ? Math.min(...validPrices) : pooja.price;
    };

    useEffect(() => {
        const loadPoojaAndSettings = async () => {
            try {
                const [poojaData, settingsData] = await Promise.all([
                    fetchPublicPoojaById(id, language),
                    fetchRatingsSettings()
                ]);
                setPooja(poojaData);
                if (settingsData && settingsData.settings) {
                    setShowRatings(settingsData.settings.pooja.details);
                }
            } catch (error) {
                console.error("Failed to fetch pooja or settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadPoojaAndSettings();
    }, [id, language]);



    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="mt-4 text-primary font-serif italic text-lg tracking-wide">{t('pooja_detail.loading')}</p>
            </div>
        );
    }

    if (!pooja) {
        return (
            <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center">
                <h1 className="text-3xl font-serif font-bold text-primary mb-6">{t('pooja_detail.not_found')}</h1>
                <Button asChild variant="default" className="rounded-full px-8">
                    <Link href="/">{t('pooja_detail.return_home')}</Link>
                </Button>
            </div>
        );
    }

    const validTempleCopies = pooja.templeCopies ? pooja.templeCopies.filter((copy: any) => copy.temple !== null) : [];

    return (
        <div className="min-h-screen bg-[#FFF8F0] selection:bg-primary/20">
            <Navbar />

            <main className="pt-28 pb-20">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#794A05]/60 mb-8 overflow-x-auto whitespace-nowrap">
                        <Link href="/" className="hover:text-[#794A05] transition-colors">
                            {t('common.home') || "Home"}
                        </Link>
                        <span className="opacity-30">/</span>
                        <Link href="/poojas" className="hover:text-[#794A05] transition-colors">
                            {t('navbar.poojas') || "Poojas"}
                        </Link>
                        <span className="opacity-30">/</span>
                        <span className="text-[#4A2c01]">{getLocalized(pooja, 'name', language)}</span>
                    </nav>

                    {/* Hero Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
                        {/* Left: Image Card */}
                        <div className="lg:col-span-5 relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white shadow-primary/10"
                            >
                                <img
                                    src={getFullImageUrl(pooja.image)}
                                    alt={getLocalized(pooja, 'name', language)}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-6 left-6">
                                    <Badge className="bg-primary/90 text-white backdrop-blur-md px-5 py-2 text-sm font-bold rounded-xl border border-white/20">
                                        {getLocalized(pooja, 'category', language) || t('pooja_detail.ritual')}
                                    </Badge>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: Info Section */}
                        <div className="lg:col-span-7 flex flex-col py-2">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col h-full"
                            >
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1a1a1a] mb-6 leading-tight">
                                    {getLocalized(pooja, 'name', language)}
                                </h1>
                                <div 
                                    className="prose prose-orange max-w-none text-[#555] leading-relaxed mb-8
                                        prose-headings:text-[#1a1a1a] prose-headings:font-bold
                                        prose-strong:text-[#1a1a1a] prose-p:text-[#555]
                                        prose-ul:text-[#555] prose-ol:text-[#555]"
                                    dangerouslySetInnerHTML={{ __html: pooja.about || '' }}
                                />

                                {/* Booking Bar */}
                                <div className="bg-[#FFEAD1] py-3 px-4 rounded-[2rem] border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-primary/5 mt-auto">
                                    <div className="px-4">
                                        <div className="text-primary/70 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{t('pooja_detail.starting_from')}</div>
                                        <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                            <IndianRupee className="w-5 h-5 stroke-[2.5]" />
                                            <span>{getLowestPrice(pooja)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="lg"
                                        onClick={() => {
                                            const token = localStorage.getItem("token");
                                            const savedUser = localStorage.getItem("user");
                                            const parsedUser = savedUser ? JSON.parse(savedUser) : null;

                                            const effectiveTempleId = templeIdFromUrl || pooja.temple?.id || null;
                                            const institutionParam = pooja.mandalId ? `mandal=${pooja.mandalId}` : effectiveTempleId ? `temple=${effectiveTempleId}` : '';
                                            const bookingUrl = `/booking?pooja=${id}${institutionParam ? `&${institutionParam}` : ''}`;

                                            if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
                                                toast({ title: t('common.login_required'), variant: "destructive" });
                                                router.push(`/auth?redirect=${encodeURIComponent(bookingUrl)}`);
                                                return;
                                            }

                                            if (effectiveTempleId || pooja.isMaster || pooja.mandalId) {
                                                router.push(bookingUrl);
                                            } else {
                                                document.getElementById('temple-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                        className="bg-primary text-white hover:bg-primary/90 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out rounded-full px-8 py-4 text-base font-bold shadow-md group"
                                    >
                                        {t('common.book_now')} <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Temple/Mandal Section */}
                    <div id="temple-section" className="mt-20">
                        <div className="w-full">

                            <div className="text-center">
                                <h2 className="text-4xl font-serif font-bold mb-2 text-primary">{t('pooja_detail.participating_temples')}</h2>
                                <p className="text-[#888] mt-4 mb-16 italic font-serif">{t('pooja_detail.sacred_locations_performed')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Any Location (Global) Booking Card */}
                                {!pooja.temple && !pooja.mandal && (
                                <div className="bg-[#FFF8F0] p-6 rounded-[2.5rem] border-2 border-primary/20 shadow-xl w-full group overflow-hidden relative text-center">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/20 transition-colors" />
                                        <div className="relative w-full h-52 mx-auto mb-4 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <Sparkle className="w-20 h-20 text-primary stroke-[1.5]" />
                                        </div>
                                        <h3 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-1">{t('pooja_detail.any_location') || "Any Location"}</h3>
                                        <p className="flex items-center justify-center gap-2 text-[#777] text-sm mb-6 font-medium">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            {t('pooja_detail.global_booking') || "Global Service"}
                                        </p>
                                        <div className="space-y-3">
                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 font-bold flex items-center justify-center gap-2 transition-all group/btn shadow-md"
                                                onClick={() => {
                                                    const bookingUrl = `/booking?pooja=${id}`;
                                                    const token = localStorage.getItem("token");
                                                    const savedUser = localStorage.getItem("user");
                                                    const parsedUser = savedUser ? JSON.parse(savedUser) : null;
                                                    if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
                                                        toast({ title: t('common.login_required'), variant: "destructive" });
                                                        router.push(`/auth?redirect=${encodeURIComponent(bookingUrl)}`);
                                                        return;
                                                    }
                                                    router.push(bookingUrl);
                                                }}
                                            >
                                                {t('common.book_now')} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Master Temple or Mandal */}
                                {(pooja.temple || pooja.mandal) && (
                                    <div className="bg-white p-6 rounded-[2.5rem] border border-primary/10 shadow-xl w-full group overflow-hidden relative text-center">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                                        <div className="relative w-full h-52 mx-auto mb-4 rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                                            <img
                                                src={getFullImageUrl((pooja.temple || pooja.mandal).image)}
                                                alt={getLocalized(pooja.temple || pooja.mandal, 'name', language)}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-1">{getLocalized(pooja.temple || pooja.mandal, 'name', language)}</h3>
                                            <p className="flex items-center justify-center gap-2 text-[#777] text-sm mb-6 font-medium">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {getLocalized(pooja.temple || pooja.mandal, 'location', language)}
                                            </p>
                                            <div className="space-y-3">
                                                <Button
                                                    className="w-full bg-[#5d4037] hover:bg-black text-white rounded-full h-12 font-bold flex items-center justify-center gap-2 transition-all group/btn"
                                                    onClick={() => {
                                                        const instParam = pooja.mandalId ? `mandal=${pooja.mandalId}` : `temple=${pooja.temple?.id}`;
                                                        const bookingUrl = `/booking?pooja=${id}&${instParam}`;
                                                        const token = localStorage.getItem("token");
                                                        const savedUser = localStorage.getItem("user");
                                                        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
                                                        if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
                                                            toast({ title: t('common.login_required'), variant: "destructive" });
                                                            router.push(`/auth?redirect=${encodeURIComponent(bookingUrl)}`);
                                                            return;
                                                        }
                                                        router.push(bookingUrl);
                                                    }}
                                                >
                                                    {t('common.book_pooja')} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                                {pooja.temple && (
                                                    <Button variant="outline" className="w-full border-primary/5 text-[#5d4037] bg-[#FFF8F0]/30 hover:bg-[#FFF8F0]/50 rounded-full h-12 font-bold transition-all" asChild>
                                                        <Link href={getTempleUrl(pooja.temple)}>{t('pooja_detail.explore_temple')}</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Associated Temples (Copies) - First 6 */}
                                {validTempleCopies.slice(0, 6).map((copy: any) => (
                                    <div key={copy.temple.id} className="bg-white p-6 rounded-[2.5rem] border border-primary/10 shadow-xl w-full group overflow-hidden relative text-center">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                                        <div className="relative w-full h-52 mx-auto mb-4 rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                                            <img
                                                src={getFullImageUrl(copy.temple.image)}
                                                alt={getLocalized(copy.temple, 'name', language)}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-1">{getLocalized(copy.temple, 'name', language)}</h3>
                                            <p className="flex items-center justify-center gap-2 text-[#777] text-sm mb-6 font-medium">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {getLocalized(copy.temple, 'location', language)}
                                            </p>
                                            <div className="space-y-3">
                                                <Button
                                                    className="w-full bg-[#5d4037] hover:bg-black text-white rounded-full h-12 font-bold flex items-center justify-center gap-2 transition-all group/btn"
                                                    onClick={() => {
                                                        const bookingUrl = `/booking?pooja=${id}&temple=${copy.temple.id}`;
                                                        const token = localStorage.getItem("token");
                                                        const savedUser = localStorage.getItem("user");
                                                        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
                                                        if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
                                                            toast({ title: t('common.login_required'), variant: "destructive" });
                                                            router.push(`/auth?redirect=${encodeURIComponent(bookingUrl)}`);
                                                            return;
                                                        }
                                                        router.push(bookingUrl);
                                                    }}
                                                >
                                                    {t('common.book_pooja')} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                                <Button variant="outline" className="w-full border-primary/5 text-[#5d4037] bg-[#FFF8F0]/30 hover:bg-[#FFF8F0]/50 rounded-full h-12 font-bold transition-all" asChild>
                                                    <Link href={getTempleUrl(copy.temple)}>{t('pooja_detail.explore_temple')}</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {validTempleCopies.length > 6 && (
                                <div className="text-center mt-12">
                                    <Button
                                        variant="outline"
                                        className="bg-white border-primary/20 text-primary hover:bg-primary hover:text-white rounded-full px-8 py-4 font-bold transition-all"
                                        onClick={() => {
                                            // Show all temples or load more logic
                                            const allTemples = document.getElementById('all-temples');
                                            if (allTemples) {
                                                allTemples.style.display = 'grid';
                                            }
                                        }}
                                    >
                                        Load More Temples ({validTempleCopies.length - 6} more)
                                    </Button>
                                </div>
                            )}

                            {/* Hidden Temples (More than 6) */}
                            {validTempleCopies.length > 6 && (
                                <div id="all-temples" className="hidden mt-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {validTempleCopies.slice(6).map((copy: any) => (
                                            <div key={copy.temple.id} className="bg-white p-6 rounded-[2.5rem] border border-primary/10 shadow-xl w-full group overflow-hidden relative text-center">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                                                <div className="relative w-full h-52 mx-auto mb-4 rounded-2xl overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform">
                                                    <img
                                                        src={getFullImageUrl(copy.temple.image)}
                                                        alt={getLocalized(copy.temple, 'name', language)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-1">{getLocalized(copy.temple, 'name', language)}</h3>
                                                    <p className="flex items-center justify-center gap-2 text-[#777] text-sm mb-6 font-medium">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        {getLocalized(copy.temple, 'location', language)}
                                                    </p>
                                                    <div className="space-y-3">
                                                 {(() => {
                                                     const isCopyVerified = copy.temple?.user?.isVerified ?? copy.temple?.isVerified ?? false;
                                                     return (
                                                         <Button
                                                             className="w-full bg-[#5d4037] hover:bg-black text-white rounded-full h-12 font-bold flex items-center justify-center gap-2 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                             disabled={!isCopyVerified}
                                                             onClick={() => {
                                                                 if (!isCopyVerified) {
                                                                     toast({
                                                                         title: "Bookings Disabled",
                                                                         description: "Pooja bookings are currently disabled for this temple as it is pending verification.",
                                                                         variant: "destructive"
                                                                     });
                                                                     return;
                                                                 }
                                                                 const bookingUrl = `/booking?pooja=${id}&temple=${copy.temple.id}`;
                                                                 const token = localStorage.getItem("token");
                                                                 const savedUser = localStorage.getItem("user");
                                                                 const parsedUser = savedUser ? JSON.parse(savedUser) : null;
                                                                 if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
                                                                     toast({ title: t('common.login_required'), variant: "destructive" });
                                                                     router.push(`/auth?redirect=${encodeURIComponent(bookingUrl)}`);
                                                                     return;
                                                                 }
                                                                 router.push(bookingUrl);
                                                             }}
                                                         >
                                                             {!isCopyVerified ? "Bookings Disabled" : t('common.book_pooja')} {!isCopyVerified ? null : <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                                                         </Button>
                                                     );
                                                 })()}
                                                        <Button variant="outline" className="w-full border-primary/5 text-[#5d4037] bg-[#FFF8F0]/30 hover:bg-[#FFF8F0]/50 rounded-full h-12 font-bold transition-all" asChild>
                                                            <Link href={getTempleUrl(copy.temple)}>{t('pooja_detail.explore_temple')}</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}


                        </div>
                    </div>

                    {/* FAQs Section (Direct Content) */}
                    <div className="mt-20">
                        <div className="w-full">

                            <h2 className="text-4xl font-serif font-bold mb-12 text-center text-primary text-gradient-sacred pb-2">{t('pooja_detail.questions_answers_title')}</h2>
                            <div className="space-y-6">
                                {(() => {
                                    const allFaqs = [...(pooja.standardFaqs || []), ...(pooja.faqs && Array.isArray(pooja.faqs) ? pooja.faqs : [])];
                                    const displayedFaqs = showAllFaqs ? allFaqs : allFaqs.slice(0, 3);
                                    
                                    return (
                                        <>
                                            {displayedFaqs.map((faq: any, idx: number) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={idx} 
                                                    className="p-8 rounded-[2rem] border border-primary/5 bg-[#FFF8F0]/30 hover:bg-white transition-all duration-500 hover:shadow-lg"
                                                >
                                                    <h4 className="text-xl font-serif font-bold text-[#1a1a1a] mb-4 flex items-start gap-4">
                                                        <HelpCircle className="w-6 h-6 text-primary mt-0.5 shrink-0 opacity-50" />
                                                        {faq.question || faq.q}
                                                    </h4>
                                                    <div 
                                                        className="text-[#666] leading-relaxed pl-10 italic prose prose-sm max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: faq.answer || faq.a }}
                                                    />
                                                </motion.div>
                                            ))}
                                            
                                            {allFaqs.length > 3 && (
                                                <div className="text-center mt-8">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setShowAllFaqs(!showAllFaqs)}
                                                        className="text-primary hover:text-primary/80 font-bold flex items-center gap-2 mx-auto"
                                                    >
                                                        {showAllFaqs ? (
                                                            <>Show Less <ArrowRight className="w-4 h-4 rotate-[-90deg]" /></>
                                                        ) : (
                                                            <>Read More <ArrowRight className="w-4 h-4 rotate-90" /></>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />


        </div>
    );
};

export default PoojaDetailClient;

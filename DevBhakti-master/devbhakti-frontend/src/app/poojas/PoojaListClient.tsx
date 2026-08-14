"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Filter,
    ArrowRight,
    MapPin,
    Clock,
    Sparkles,
    Star,
    ChevronRight,
    Zap,
    Users,
    Heart,
    IndianRupee
} from "lucide-react";
import { fetchPublicPoojas, fetchRatingsSettings, fetchPublicFilters } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized } from "@/utils/localization";
import { getDeduplicatedPoojas, stripHtml } from "@/utils/textUtils";



const PoojaListClient: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [poojas, setPoojas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<any[]>([]);
    const router = useRouter();
    const { toast } = useToast();
    const { language, t } = useLanguage();
    const [user, setUser] = useState<any>(null);
    const [showRatings, setShowRatings] = useState(false);
    const [filters, setFilters] = useState<{ locations: string[], temples: any[], poojaCategories: any[] }>({ locations: [], temples: [], poojaCategories: [] });
    const [selectedLocation, setSelectedLocation] = useState("All");
    const [selectedTemple, setSelectedTemple] = useState("All");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const categories = React.useMemo(() => {
        return [{ id: "All", name: t('poojas_list.all') || "All" }, ...filters.poojaCategories];
    }, [filters.poojaCategories, language, t]);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            loadFavorites();
        }
        loadFilters();
        loadRatingsSettings();

        // Handle search query from URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get("search");
        if (searchParam) {
            setSearchQuery(searchParam);
        }
    }, [language]);

    useEffect(() => {
        loadPoojas();
    }, [language, selectedLocation, selectedTemple, selectedCategory]);

    const loadFilters = async () => {
        try {
            const data = await fetchPublicFilters(language);
            setFilters({
                locations: data.locations || [],
                temples: data.temples || [],
                poojaCategories: data.poojaCategories || []
            });
        } catch (error) {
            console.error("Error loading filters:", error);
        }
    };

    const loadRatingsSettings = async () => {
        try {
            const data = await fetchRatingsSettings();
            if (data && data.settings) {
                setShowRatings(data.settings.pooja.home);
            }
        } catch (error) {
            console.error("Error loading ratings settings:", error);
        }
    };

    const loadFavorites = async () => {
        try {
            const res = await fetchUserFavorites();
            if (res.success) {
                setFavorites(res.data);
            }
        } catch (error) {
            console.error("Error loading favorites:", error);
        }
    };

    const loadPoojas = async () => {
        setLoading(true);
        const params: any = { 
            lang: language,
            location: selectedLocation !== "All" ? selectedLocation : undefined,
            templeId: selectedTemple !== "All" ? selectedTemple : undefined,
            categoryId: selectedCategory !== "All" ? selectedCategory : undefined
        };
        const data = await fetchPublicPoojas(params);

        // Sort poojas by lowest price
        const sortedData = [...data].sort((a, b) => {
            return getLowestPrice(a) - getLowestPrice(b);
        });

        // Deduplicate poojas by name, preferring Master poojas
        const deduplicatedPoojas = getDeduplicatedPoojas(sortedData, 'en');

        setPoojas(deduplicatedPoojas);
        setLoading(false);
    };

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

    // Levenshtein Distance Helper for Fuzzy Search
    const getLevenshteinDistance = (a: string, b: string): number => {
        const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    const toggleFavorite = async (e: React.MouseEvent, poojaId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast({
                title: "Please Login",
                description: "You need to login as a devotee to add favourites.",
                variant: "destructive",
            });
            return;
        }

        const isFav = favorites.some((f) => f.poojaId === poojaId);
        try {
            if (isFav) {
                await removeFavorite({ poojaId });
                setFavorites(favorites.filter((f) => f.poojaId !== poojaId));
                toast({ title: "Removed from Favourites", description: "Pooja removed from your favourites.", variant: "success" });
            } else {
                await addFavorite({ poojaId });
                setFavorites([...favorites, { poojaId }]);
                toast({ title: "❤️ Added to Favourites", description: "Pooja added to your favourites!", variant: "success" });
            }
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || error.message || t('marketplace.cart.failed'),
                variant: "destructive",
            });
        }
    };

    const filteredPoojas = poojas.filter((pooja) => {
        const poojaName = (getLocalized(pooja, 'name', language) || "").toLowerCase();
        const poojaCat = (getLocalized(pooja, 'category', language) || "").toLowerCase();
        const matchesSearch =
            poojaName.includes(searchQuery.toLowerCase()) ||
            poojaCat.includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getFuzzySuggestions = (query: string) => {
        if (query.length < 2) return [];
        const matches: any[] = [];
        poojas.forEach(pooja => {
            const name = getLocalized(pooja, 'name', language) || "";
            const queryLower = query.toLowerCase();
            const nameLower = name.toLowerCase();
            const distance = getLevenshteinDistance(queryLower, nameLower);
            
            if (nameLower === queryLower) return;

            if (distance < 3 || nameLower.includes(queryLower)) {
                matches.push({
                    title: name,
                    category: getLocalized(pooja, 'category', language)
                });
            }
        });
        return Array.from(new Set(matches.map(m => m.title)))
            .map(title => matches.find(m => m.title === title))
            .slice(0, 5);
    };

    useEffect(() => {
        if (searchQuery.trim() && isSearchFocused) {
            setSuggestions(getFuzzySuggestions(searchQuery));
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, isSearchFocused, poojas]);

    const suggestion = React.useMemo(() => {
        if (searchQuery.length < 2 || filteredPoojas.length > 0) return null;

        let minDistance = Infinity;
        let bestMatch = "";

        poojas.forEach(pooja => {
            const poojaName = (getLocalized(pooja, 'name', language) || "");
            const distance = getLevenshteinDistance(searchQuery.toLowerCase(), poojaName.toLowerCase());
            if (distance < minDistance && distance < 3) {
                minDistance = distance;
                bestMatch = poojaName;
            }
        });

        return bestMatch;
    }, [searchQuery, filteredPoojas, poojas]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB]">
                <Navbar />
                <div className="pt-32 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/sacred_poojas_list_hero_bg.png"
                        alt="Sacred Poojas"
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
                </div>

                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
                </div>

                <div className="container mx-auto px-4 pt-30 pb-12 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full bg-white/50 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 mr-2 fill-primary" />
                            {t('poojas.sacred_rituals')}
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4 leading-tight tracking-tight">
                            {t('poojas.auspicious')}
                            <span className="text-primary italic"> {t('poojas.title')}</span>
                        </h1>
                        <p className="text-base md:text-lg text-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                            {t('poojas.subtitle')}
                        </p>

                        {/* Premium Search Bar */}
                        <div className="relative max-w-2xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                                <Search className="absolute left-5 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={t('poojas.search_placeholder_long')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    className="w-full pl-14 pr-32 py-5 text-lg outline-none bg-transparent text-zinc-800"
                                />
                                <Button className="absolute right-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 hidden sm:flex font-bold">
                                    {t('marketplace.explore')}
                                </Button>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filter Chips */}
            <section className="relative py-4 bg-white border-y border-zinc-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">

                        <div className="flex items-center gap-2 mr-4 border-r border-zinc-200 pr-4">
                            {/* <span className="text-sm font-semibold text-zinc-700 whitespace-nowrap">
                                Categories
                            </span> */}
                        </div>

                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedCategory === category.id
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}

                        <div className="flex items-center gap-3 ml-auto">
                            <Select value={selectedLocation} onValueChange={(val) => { setSelectedLocation(val); setSelectedTemple("All"); }}>
                                <SelectTrigger className="w-[160px] h-9 rounded-full bg-zinc-100 border-none text-xs font-medium focus:ring-1 focus:ring-primary">
                                    <MapPin className="w-3 h-3 mr-2 text-primary" />
                                    <SelectValue placeholder={t('temples.location')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{t('poojas_list.all_locations') || "All Locations"}</SelectItem>
                                    {filters.locations.map((loc) => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedTemple} onValueChange={setSelectedTemple}>
                                <SelectTrigger className="w-[180px] h-9 rounded-full bg-zinc-100 border-none text-xs font-medium focus:ring-1 focus:ring-primary">
                                    <Sparkles className="w-3 h-3 mr-2 text-primary" />
                                    <SelectValue placeholder={t('temples.title')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{t('poojas_list.all_temples') || "All Temples"}</SelectItem>
                                    {filters.temples
                                        .filter(t => selectedLocation === "All" || t.location === selectedLocation)
                                        .map((temple) => (
                                            <SelectItem key={temple.id} value={temple.id}>{temple.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                </div>
            </section>


            {/* Pooja Grid */}
            <section className="py-2">
                <div className="container mx-auto px-4">
                    {filteredPoojas.length > 0 && (
                        <div className="mb-8 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-dark">
                                {t('poojas_list.available')}
                                {selectedCategory === 'All' ? '' : categories.find(c => c.id === selectedCategory)?.name}
                                {t('poojas_list.poojas_sevas')}
                            </h2>
                            <div className="text-sm text-dark-800">
                                {t('poojas_list.showing')} 
                                {filteredPoojas.length} 
                                {t('poojas_list.poojas_sevas')}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredPoojas.map((pooja, index) => (
                                <motion.div
                                    layout
                                    key={pooja.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="relative group/card bg-white rounded-[2rem] p-3 shadow-md hover:shadow-2xl transition-all duration-500 border border-orange-100 h-full flex flex-col hover:-translate-y-2">
                                        <Link href={`/poojas/${pooja.slug || pooja.id}`}>
                                            <div className="relative aspect-video overflow-hidden rounded-[2rem] mb-4">
                                                <img
                                                    src={getFullImageUrl(pooja.image)}
                                                    alt={getLocalized(pooja, 'name', language)}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 left-4 flex gap-2">
                                                    <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 border-none shadow-lg">
                                                        {getLocalized(pooja, 'category', language)}
                                                    </Badge>
                                                    {pooja.price > 1000 && (
                                                        <Badge className="bg-primary/95 text-white border-none shadow-lg animate-pulse">
                                                            <Zap className="w-3 h-3 mr-1 fill-white" />
                                                            {t('poojas_list.popular')}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                    <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-sm font-medium border border-white/20 flex items-center gap-1">
                                                        <span className="text-[10px] text-zinc-300 uppercase font-bold mr-1">
                                                            {t('poojas_list.starts_from')}
                                                        </span>
                                                        <IndianRupee className="w-3.5 h-3.5" />
                                                        <span>{getLowestPrice(pooja)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-3 flex-grow">
                                                {showRatings && (
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star key={star} className={`w-3.5 h-3.5 ${star <= 4 ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-zinc-400 font-medium">(4.8/5)</span>
                                                    </div>
                                                )}

                                                <h3 className="text-xl font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors">
                                                    {getLocalized(pooja, 'name', language)}
                                                </h3>

                                                <p className="text-zinc-600 mb-2 leading-relaxed line-clamp-2 text-sm font-medium">
                                                    {stripHtml(pooja.about || getLocalized(pooja, 'description', language))}
                                                </p>

                                                {(pooja.temple || pooja.mandal) && (
                                                    <div className="flex items-center gap-2 mb-3 text-zinc-500">
                                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-xs font-semibold truncate">
                                                            {getLocalized(pooja.temple || pooja.mandal, 'name', language)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="space-y-3 mb-4">
                                                </div>
                                            </div>

                                            <div className="mt-auto px-3 pb-1">
                                                <div className="flex items-center justify-between gap-4 pt-4 border-t border-orange-50">
                                                    <div className="flex flex-col gap-3 w-full">
                                                        <Button
                                                            className="w-full rounded-2xl bg-[#794A05] hover:bg-[#5d3804] text-white group/book transition-all duration-300 font-bold h-12 shadow-md shadow-orange-900/10"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const institutionParam = pooja.mandalId ? `mandal=${pooja.mandalId}` : pooja.temple?.id ? `temple=${pooja.temple.id}` : '';
                                                                const bookingUrl = `/booking?${institutionParam ? `${institutionParam}&` : ''}pooja=${pooja.id}`;
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
                                                            {t('common.book_now')}
                                                            <Zap className="w-4 h-4 ml-2 fill-white" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            className="w-full rounded-2xl bg-[#FFF9F0] hover:bg-[#F5EAD6] text-[#794A05] border border-[#794A05]/10 transition-all duration-300 font-bold h-12"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                router.push(`/poojas/${pooja.slug || pooja.id}`);
                                                            }}
                                                        >
                                                            {t('poojas_list.more_details')}
                                                            <ChevronRight className="w-4 h-4 ml-2" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Favorite Button - Outside Link */}
                                        <button
                                            onClick={(e) => toggleFavorite(e, pooja.id)}
                                            className="absolute top-4 right-4 z-40 p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40 transition-all group/fav"
                                        >
                                            <Heart
                                                className={`w-5 h-5 transition-all ${favorites.some((f) => f.poojaId === pooja.id)
                                                    ? "fill-red-500 text-red-500"
                                                    : "text-white group-hover/fav:text-red-200"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredPoojas.length === 0 && (
                        <div className="text-center py-20">
                            <div className="max-w-md mx-auto">
                                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-serif text-foreground mb-2">
                                    {t('poojas.no_ritual_found') || "No Rituals Found"}
                                </h3>
                                <p className="text-muted-foreground mb-8">
                                    {t('landing.landing_search.no_results_for')} "{searchQuery}". {t('landing.landing_search.try_another')}
                                </p>
                                
                                {/* Fuzzy Suggestion for results area */}
                                {searchQuery.length >= 2 && getFuzzySuggestions(searchQuery).length > 0 && (
                                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 animate-in fade-in slide-in-from-bottom-4">
                                        <p className="text-foreground font-bold mb-4">{t('landing.landing_search.did_you_mean')}?</p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {getFuzzySuggestions(searchQuery).map((s: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setSearchQuery(s.title);
                                                    }}
                                                    className="px-5 py-2 rounded-full bg-white border border-primary/20 hover:bg-primary hover:text-white transition-all font-serif italic text-sm text-primary"
                                                >
                                                    {s.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    className="mt-8 rounded-full"
                                    onClick={() => { 
                                        setSearchQuery(""); 
                                        setSelectedCategory("All"); 
                                        setSelectedLocation("All"); 
                                        setSelectedTemple("All"); 
                                    }}
                                >
                                    {t('poojas_list.reset_search')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Related Search Footer - Always show for better discovery */}
                    {/* <div className="mt-20 pt-10 border-t border-zinc-100/60 max-w-4xl mx-auto">
                        <div className="flex flex-col items-center text-center">
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-6">Explore Devotional Rituals</h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["Maha Mrityunjaya", "Rudra Abhishek", "Shanti Puja", "Ganesh Seva", "Aarti", "Satyanarayan Puja", "Durga Sapthashati", "Havan"].map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => setSearchQuery(term)}
                                        className="px-5 py-2 rounded-2xl bg-zinc-50 border border-zinc-200/50 text-zinc-500 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div> */}
                </div>
            </section>

            {/* Featured Benefit Section */}
            <section className="py-24 bg-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="container mx-auto px-4 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <Badge className="bg-primary/20 text-primary border-none mb-6">
                                {t('poojas_list.experience_divine')}
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 leading-tight">
                                {t('poojas_list.why_book_through')}
                                <span className="text-primary italic mr-2 ">DevBhakti</span>
                                {t('poojas_list.why_book_suffix')}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {[
                                    {
                                        title: t('poojas_list.verified_temples_title'),
                                        desc: t('poojas_list.verified_temples_desc')
                                    },
                                    {
                                        title: t('poojas_list.authentic_poojaris_title'),
                                        desc: t('poojas_list.authentic_poojaris_desc')
                                    },
                                    {
                                        title: t('poojas_list.proof_of_service_title'),
                                        desc: t('poojas_list.proof_of_service_desc')
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                                            <Sparkles className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-black font-bold mb-1">{item.title}</h4>
                                            <p className="text-black/70 text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>




                        </div>
                        <div className="relative">
                            <div className="aspect-square rounded-[3rem] overflow-hidden">
                                <img
                                    src="/images/sacred_temple_ritual.png"
                                    alt="Sacred Temple Ritual"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-[2rem] shadow-2xl max-w-xs animate-in slide-in-from-left-4 duration-1000">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-zinc-900">10k+</div>
                                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Happy Devotees</div>
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-600 font-medium">Joined us in finding spiritual peace through sacred rituals.</p>
                            </div> */}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PoojaListClient;

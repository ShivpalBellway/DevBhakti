"use client";

import React, { useState } from "react";
import Link from "next/link";
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
import { fetchPublicPoojas, fetchRatingsSettings } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";



const PoojaListClient: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [poojas, setPoojas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<any[]>([]);
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [showRatings, setShowRatings] = useState(false);

    const categories = React.useMemo(() => {
        const uniqueCategories = Array.from(new Set(poojas.map(p => p.category?.trim()).filter(Boolean)));
        return ["All", ...uniqueCategories];
    }, [poojas]);

    React.useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            loadFavorites();
        }
        loadPoojas();
        loadRatingsSettings();
    }, []);

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
        const data = await fetchPublicPoojas();

        // Sort poojas by lowest price
        const sortedData = [...data].sort((a, b) => {
            return getLowestPrice(a) - getLowestPrice(b);
        });

        setPoojas(sortedData);
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
            router.push("/auth");
            return;
        }

        const isFav = favorites.some((f) => f.poojaId === poojaId);
        try {
            if (isFav) {
                await removeFavorite({ poojaId });
                setFavorites(favorites.filter((f) => f.poojaId !== poojaId));
                toast({ title: "Removed from favorites", variant: "success" });
            } else {
                await addFavorite({ poojaId });
                setFavorites([...favorites, { poojaId }]);
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

    const filteredPoojas = poojas.filter((pooja) => {
        const matchesSearch =
            (pooja.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            (pooja.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        const matchesCategory =
            selectedCategory === "All" || pooja.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const suggestion = React.useMemo(() => {
        if (searchQuery.length < 2 || filteredPoojas.length > 0) return null;

        let minDistance = Infinity;
        let bestMatch = "";

        poojas.forEach(pooja => {
            if (pooja.name) {
                const distance = getLevenshteinDistance(searchQuery.toLowerCase(), pooja.name.toLowerCase());
                if (distance < minDistance && distance < 3) { // Threshold of 3 characters
                    minDistance = distance;
                    bestMatch = pooja.name;
                }
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
            <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden">
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
                            Sacred Rituals
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4 leading-tight tracking-tight">
                            Auspicious <span className="text-primary italic">Poojas & Sevas</span>
                        </h1>
                        <p className="text-base md:text-lg text-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                            Book authentic Poojas & Sevas, performed by experienced priests at verified temples across India. Experience divine blessings from anywhere in the world.
                        </p>

                        {/* Premium Search Bar */}
                        <div className="relative max-w-2xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                                <Search className="absolute left-5 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search for pooja, aarti or seva..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-32 py-5 text-lg outline-none bg-transparent"
                                />
                                <Button className="absolute right-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 hidden sm:flex">
                                    Explore
                                </Button>
                            </div>

                            {/* Related Search Suggestions */}
                            {/* <div className="mt-4 flex flex-wrap items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-700">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mr-1">Related Search:</span>
                                {["Maha Mrityunjaya", "Rudra Abhishek", "Shanti Puja", "Ganesh Seva", "Aarti"].map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => setSearchQuery(term)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div> */}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filter Section */}
            <section className="relative py-6 bg-white border-y border-zinc-200">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                                <Filter className="w-5 h-5 text-[#794A05]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-[#794A05] italic leading-none">Filter by Category</h3>
                                <p className="text-[10px] text-[#794A05]/70 uppercase font-bold tracking-[0.2em] mt-1">Discover Sacred Rituals</p>
                            </div>
                        </div>

                        <div className="w-full md:w-72">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full rounded-xl border-orange-100 bg-white hover:bg-orange-50/30 transition-all duration-300 h-10 shadow-sm font-semibold text-slate-700">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-orange-50 shadow-xl max-h-72">
                                    {categories.map((category) => (
                                        <SelectItem 
                                            key={category} 
                                            value={category}
                                            className="focus:bg-orange-50 focus:text-primary cursor-pointer py-2.5 rounded-lg mx-1"
                                        >
                                            {category === 'All' ? 'All Rituals' : category}
                                        </SelectItem>
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
                                Available <span className="text-dark">{selectedCategory === 'All' ? '' : selectedCategory}</span> Poojas & Sevas
                            </h2>
                            <div className="text-sm text-dark-800">
                                Showing {filteredPoojas.length} Poojas & Sevas
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
                                        <Link href={`/poojas/${pooja.id}`}>
                                            <div className="relative aspect-video overflow-hidden rounded-[2rem] mb-4">
                                                <img
                                                    src={getFullImageUrl(pooja.image)}
                                                    alt={pooja.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                                    <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 border-none shadow-lg">
                                                        {pooja.category}
                                                    </Badge>
                                                    {pooja.temple?.name && (
                                                        <Badge className="bg-white/40 backdrop-blur-md text-slate-800 border-none shadow-lg">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {pooja.temple.name}
                                                        </Badge>
                                                    )}
                                                    {pooja.price > 1000 && (
                                                        <Badge className="bg-primary/95 text-white border-none shadow-lg animate-pulse">
                                                            <Zap className="w-3 h-3 mr-1 fill-white" />
                                                            Popular
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                    <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-sm font-medium border border-white/20 flex items-center gap-1">
                                                        <span className="text-[10px] text-zinc-300 uppercase font-bold mr-1">Starts from</span>
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
                                                    {pooja.name}
                                                </h3>

                                                <p className="text-zinc-600 mb-3 leading-relaxed line-clamp-3 text-md font-medium">
                                                    {pooja.about || (Array.isArray(pooja.description) ? pooja.description.join(' ') : pooja.description)}
                                                </p>

                                                <div className="space-y-3 mb-4">
                                                    {/* <div className="flex items-center gap-2 text-zinc-600">
                                                        <Clock className="w-4 h-4 text-primary" />
                                                        <span className="text-sm font-medium">{pooja.duration || pooja.time}</span>
                                                    </div> */}
                                                    {/* {pooja.bullets && pooja.bullets.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {pooja.bullets.slice(0, 3).map((bullet, idx) => (
                                                                <span key={idx} className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-2 py-1 bg-zinc-50 rounded-md">
                                                                    {bullet}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>

                                            <div className="mt-auto px-3 pb-1">
                                                <div className="flex items-center justify-between gap-4 pt-4 border-t border-orange-50">
                                                    {/* <div className="flex flex-col">
                                                        <span className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Start From</span>
                                                        <span className="text-2xl font-bold text-zinc-900 font-display">₹{pooja.price}</span>
                                                    </div> */}
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <Button
                                                            className="w-full rounded-xl bg-primary hover:bg-primary/90 group/book transition-all duration-300"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const token = localStorage.getItem("token");
                                                                if (!token) {
                                                                    toast({ title: "Please login to book pooja", variant: "destructive" });
                                                                    router.push("/auth");
                                                                    return;
                                                                }
                                                                router.push(`/booking?pooja=${pooja.id}`);
                                                            }}
                                                        >
                                                            Book Now
                                                            <Zap className="w-4 h-4 ml-2 fill-white animate-pulse" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full rounded-xl border-orange-100 hover:bg-orange-50 transition-all duration-300"
                                                        >
                                                            More Details
                                                            <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
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
                        <div className="text-center py-32 bg-orange-50/30 rounded-[3rem] border-2 border-dashed border-orange-100">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 mb-2">No rituals found</h3>
                            <p className="text-zinc-500 max-w-md mx-auto line-clamp-2">
                                {suggestion ? (
                                    <>
                                        No results for "<span className="font-semibold">{searchQuery}</span>".
                                        Did you mean <button
                                            onClick={() => setSearchQuery(suggestion)}
                                            className="text-primary font-bold hover:underline"
                                        >
                                            {suggestion}
                                        </button>?
                                    </>
                                ) : (
                                    "Try adjusting your filters or search terms"
                                )}
                            </p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-full"
                                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                            >
                                Reset Search
                            </Button>
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
                            <Badge className="bg-primary/20 text-primary border-none mb-6">Experience the Divine</Badge>
                            <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 leading-tight">
                                Why book your rituals through <span className="text-primary italic">DevBhakti?</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {[
                                    {
                                        title: "Verified Temples",
                                        desc: "A curated network of legitimate temples across India, personally vetted for your peace of mind."
                                    },
                                    {
                                        title: "Authentic Poojaris",
                                        desc: "Experienced priests with expertise in Hindu rituals and poojas."
                                    },
                                    {
                                        title: "Proof of Service",
                                        desc: "Total transparency with personalized photo / video recordings of your poojas and sevas."
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Church, ShoppingBag, ArrowRight, Loader2, Command } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL, BASE_URL } from "@/config/apiConfig";

interface SearchResult {
    id: string;
    title: string;
    category: "Temple" | "Pooja" | "Product";
    location?: string;
    image?: string;
    type?: string;
}

export const GlobalSearch = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            setQuery("");
            setResults([]);
            setImgErrors({});
        }
    }, [isOpen]);

    // Shortcut for ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Debounced Search (including default results on open)
    useEffect(() => {
        const fetchResults = async () => {
            if (!isOpen && !query.trim()) return;

            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data.success) {
                    setResults(data.data);
                }
            } catch (error) {
                console.error("Search fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, query.trim() ? 300 : 0);
        return () => clearTimeout(timer);
    }, [query, isOpen]);

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

    const suggestion = React.useMemo(() => {
        if (query.trim().length < 2 || results.length > 0) return null;

        let minDistance = Infinity;
        let bestMatch = "";

        // Common terms across all categories
        const commonTerms = [
            "Jyotirlinga", "Rudra Abhishek", "Maha Shivratri", "Ganesh Seva", 
            "Rudraksha", "Shakti Peeth", "Varanasi", "Kedarnath", "Idols", "Incense",
            "Bhagavad Gita", "Panchamrut", "Ayodhya", "Rishikesh"
        ];

        commonTerms.forEach(term => {
            const distance = getLevenshteinDistance(query.toLowerCase(), term.toLowerCase());
            if (distance < minDistance && distance < 3) {
                minDistance = distance;
                bestMatch = term;
            }
        });

        return bestMatch;
    }, [query, results]);

    const handleItemClick = (item: SearchResult) => {
        onClose();
        if (item.category === "Temple") {
            router.push(`/temples/${item.id}`);
        } else if (item.category === "Pooja") {
            router.push(`/poojas/${item.id}`);
        } else if (item.category === "Product") {
            router.push(`/marketplace/product/${item.id}`);
        }
    };

    const getIcon = (category: string) => {
        switch (category) {
            case "Temple": return Church;
            case "Pooja": return MapPin;
            case "Product": return ShoppingBag;
            default: return Search;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
                    {/* Backdrop - High quality blur with warm tint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/60 backdrop-blur-xl"
                    />

                    {/* Search Box - Premium Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="relative w-full max-w-2xl bg-white/80 dark:bg-zinc-900/80 rounded-[2.5rem] shadow-elevated overflow-hidden border border-border/50 backdrop-blur-2xl shadow-glow"
                    >
                        {/* Decorative Gradient Line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-sacred opacity-80" />

                        <div className="p-5 flex items-center border-b border-border/50 bg-white/40 dark:bg-zinc-900/40">
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 text-primary animate-spin mr-4" />
                            ) : (
                                <Search className="w-6 h-6 text-primary/60 mr-4" />
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Discover Sacred Temples, Poojas, or Items..."
                                className="flex-1 bg-transparent border-none outline-none text-xl font-serif text-foreground placeholder:text-muted-foreground/50 transition-all"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl border border-border/50 bg-muted/30 text-[10px] text-muted-foreground font-medium shadow-sm">
                                    <Command size={10} className="mr-0.5" /> ESC
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-destructive hover:text-white rounded-full transition-all duration-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Results Area with Sacred Pattern */}
                        <div className="max-h-[60vh] overflow-y-auto p-3 premium-scrollbar pattern-sacred">
                            {results.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="px-4 py-2 text-[12px] font-bold text-primary/70 uppercase tracking-[0.2em] font-sans">
                                        {query.trim() ? "Sacred Results" : "Sacred Suggestions"}
                                    </div>
                                    {results.map((item, idx) => {
                                        const Icon = getIcon(item.category);
                                        const resultKey = `${item.category}-${item.id}`;
                                        const hasImgError = imgErrors[resultKey];

                                        return (
                                            <motion.button
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={resultKey}
                                                onClick={() => handleItemClick(item)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/60 dark:hover:bg-zinc-800/60 rounded-[1.8rem] transition-all duration-300 group border border-transparent hover:border-primary/20 hover:shadow-warm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-warm flex items-center justify-center text-primary overflow-hidden shadow-soft border border-border/50 group-hover:scale-105 transition-transform duration-500">
                                                        {item.image && !hasImgError ? (
                                                            <img
                                                                src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                                onError={() => setImgErrors(prev => ({ ...prev, [resultKey]: true }))}
                                                            />
                                                        ) : (
                                                            <Icon className="w-6 h-6" />
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="text-lg font-serif text-foreground font-semibold group-hover:text-primary transition-colors">
                                                                {item.title}
                                                            </h4>
                                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider border border-primary/5">
                                                                {item.category}
                                                            </span>
                                                        </div>
                                                        {item.location ? (
                                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 font-sans font-medium opacity-70">
                                                                <MapPin size={14} className="text-primary/60" /> {item.location}
                                                            </div>
                                                        ) : item.type ? (
                                                            <div className="text-muted-foreground text-sm font-sans font-medium opacity-70">
                                                                {item.type}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className="flex items-center translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors border border-primary/10">
                                                        <ArrowRight size={18} />
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ) : query.trim() !== "" && !isLoading ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft border border-border/50">
                                        <Search className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                    <h3 className="text-xl font-serif text-foreground mb-2">No Sacred Match Found</h3>
                                    <p className="text-muted-foreground font-sans">
                                        {suggestion ? (
                                            <>
                                                No results for "{query}". Did you mean <button 
                                                    onClick={() => setQuery(suggestion)}
                                                    className="text-primary font-bold hover:underline"
                                                >
                                                    {suggestion}
                                                </button>?
                                            </>
                                        ) : (
                                            `We couldn't find any results for "${query}". Try another search term.`
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/10">
                                        <Command className="w-10 h-10 text-primary/20" />
                                    </div>
                                    <h3 className="text-xl font-serif text-foreground mb-2">Omnipresent Search</h3>
                                    <p className="text-muted-foreground/60 font-sans max-w-sm mx-auto">
                                        Start typing to navigate through our sacred temples, divine poojas, and spiritual items.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer - Premium Info Bar */}
                        <div className="p-5 bg-muted/10 dark:bg-zinc-800/20 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50">
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2 font-medium"><ArrowRight size={12} className="rotate-90 text-primary" /> Select</span>
                                <span className="flex items-center gap-2 font-medium"><ArrowRight size={12} className="rotate-180 text-primary" /> Navigate</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                DevBhakti Sacred Search Engine v2.5
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

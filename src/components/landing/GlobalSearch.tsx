"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Church, ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
    id: string;
    title: string;
    category: "Temple" | "Pooja" | "Product";
    location?: string;
    icon: any;
}

const mockResults: SearchResult[] = [
    { id: "1", title: "Kashi Vishwanath Temple", category: "Temple", location: "Varanasi", icon: Church },
    { id: "2", title: "Somnath Jyotirlinga", category: "Temple", location: "Gujarat", icon: Church },
    { id: "3", title: "Special Rudrabhishek", category: "Pooja", icon: MapPin },
    { id: "4", title: "Online Aarti Booking", category: "Pooja", icon: MapPin },
    { id: "5", title: "Pure Charnamrit", category: "Product", icon: ShoppingBag },
    { id: "6", title: "Rudraksha Mala", category: "Product", icon: ShoppingBag },
];

export const GlobalSearch = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [query, setQuery] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    // Shortcut for Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                onClose(); // Toggle mechanism can be added if needed
            }
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const filteredResults = query
        ? mockResults.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
        )
        : mockResults.slice(0, 4); // Show "Recent" or "Trending" when empty

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Search Box */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-orange-100 dark:border-zinc-80 zinc-800"
                    >
                        <div className="p-4 flex items-center border-b border-zinc-100 dark:border-zinc-800">
                            <Search className="w-5 h-5 text-zinc-400 mr-3" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search Temples, Poojas, or Products..."
                                className="flex-1 bg-transparent border-none outline-none text-lg text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-400 font-mono">
                                    ESC
                                </span>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
                            {filteredResults.length > 0 ? (
                                <div className="space-y-1">
                                    <div className="px-3 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                        {query ? "Search Results" : "Trending Searches"}
                                    </div>
                                    {filteredResults.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                onClose();
                                                router.push(`/${item.category.toLowerCase()}s/${item.id}`);
                                            }}
                                            className="w-full flex items-center justify-between p-3 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-2xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-zinc-800 dark:text-zinc-200 font-medium group-hover:text-orange-700">
                                                        {item.title}
                                                    </div>
                                                    {item.location && (
                                                        <div className="text-zinc-400 text-xs flex items-center gap-1">
                                                            <MapPin size={12} /> {item.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-orange-600 font-medium">View {item.category}</span>
                                                <ArrowRight size={14} className="text-orange-600" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <h3 className="text-zinc-800 dark:text-zinc-200 font-medium">No results found</h3>
                                    <p className="text-zinc-400 text-sm">We couldn't find anything matching "{query}"</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1"><ArrowRight size={10} className="rotate-90" /> Select</span>
                                <span className="flex items-center gap-1"><ArrowRight size={10} className="rotate-180" /> Navigate</span>
                            </div>
                            <div>DevBhakti Search v1.0</div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

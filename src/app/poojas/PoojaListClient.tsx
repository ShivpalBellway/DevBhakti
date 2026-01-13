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
    Users
} from "lucide-react";
import { poojas } from "@/data/poojas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const categories = ["All", "Aarti", "Pooja", "Abhishekam", "Special Puja"];

const PoojaListClient: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const filteredPoojas = poojas.filter((pooja) => {
        const matchesSearch =
            pooja.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pooja.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "All" || pooja.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/p6.png')] opacity-10" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-orange-100/50 to-transparent -z-10" />

                <div className="container mx-auto px-4 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full bg-white/50 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 mr-2 fill-primary" />
                            Sacred Rituals
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-zinc-900 mb-6 tracking-tight">
                            Auspicious <span className="text-primary italic">Poojas & Sevas</span>
                        </h1>
                        <p className="text-lg text-zinc-600 mb-10 leading-relaxed">
                            Book authentic Vedic rituals performed by experienced priests at India's most sacred temples. Experience divine blessings from anywhere in the world.
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
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filter Chips */}
            <section className="sticky top-20 z-30 py-4 bg-white/80 backdrop-blur-xl border-y border-orange-100/50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                        <div className="flex items-center gap-2 mr-4 border-r border-orange-100 pr-4">
                            <Filter className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-zinc-500 whitespace-nowrap">Categories</span>
                        </div>
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedCategory === category
                                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                                    : "bg-orange-50/50 text-zinc-600 hover:bg-orange-100/50 border border-orange-100/30"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pooja Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-zinc-900">
                            Available <span className="text-primary">{selectedCategory === 'All' ? '' : selectedCategory}</span> Services
                        </h2>
                        <div className="text-sm text-zinc-500">
                            Showing {filteredPoojas.length} rituals
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                    <Link href={`/poojas/${pooja.id}`}>
                                        <div className="group bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-2xl transition-all duration-500 border border-orange-50/50 h-full flex flex-col hover:-translate-y-2">
                                            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] mb-6">
                                                <Image
                                                    src={pooja.image}
                                                    alt={pooja.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 left-4 flex gap-2">
                                                    <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 border-none shadow-lg">
                                                        {pooja.category}
                                                    </Badge>
                                                    {pooja.price > 1000 && (
                                                        <Badge className="bg-primary/95 text-white border-none shadow-lg animate-pulse">
                                                            <Zap className="w-3 h-3 mr-1 fill-white" />
                                                            Popular
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                    <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-sm font-medium border border-white/20">
                                                        Starts from ₹{pooja.price}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-3 flex-grow">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star key={star} className={`w-3.5 h-3.5 ${star <= 4 ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-zinc-400 font-medium">(4.8/5)</span>
                                                </div>

                                                <h3 className="text-2xl font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors">
                                                    {pooja.name}
                                                </h3>

                                                <p className="text-zinc-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                                    {Array.isArray(pooja.description) ? pooja.description[0] : pooja.description}
                                                </p>

                                                <div className="space-y-3 mb-8">
                                                    <div className="flex items-center gap-2 text-zinc-600">
                                                        <Clock className="w-4 h-4 text-primary" />
                                                        <span className="text-sm font-medium">{pooja.duration || pooja.time}</span>
                                                    </div>
                                                    {pooja.bullets && pooja.bullets.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {pooja.bullets.slice(0, 3).map((bullet, idx) => (
                                                                <span key={idx} className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-2 py-1 bg-zinc-50 rounded-md">
                                                                    {bullet}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-auto px-3 pb-2">
                                                <div className="flex items-center justify-between gap-4 pt-6 border-t border-orange-50">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Dakshina</span>
                                                        <span className="text-2xl font-bold text-zinc-900 font-display">₹{pooja.price}</span>
                                                    </div>
                                                    <Button className="rounded-2xl px-6 bg-zinc-900 hover:bg-primary group/btn transition-all duration-300">
                                                        Book Now
                                                        <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
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
                            <p className="text-zinc-500">Try adjusting your filters or search terms</p>
                            <Button
                                variant="outline"
                                className="mt-8 rounded-full"
                                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                            >
                                Reset Search
                            </Button>
                        </div>
                    )}
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
                                    { title: "Authentic Rituals", desc: "Performed exactly as per Vedic scriptures by certified priests." },
                                    { title: "Sacred Kshetras", desc: "Select from India's most powerful and historic temples." },
                                    { title: "Live Streaming", desc: "Watch your puja live from anywhere in the world." },
                                    { title: "Holy Prasad", desc: "Receive sanctified prasad delivered to your doorstep." }
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
                                    src="https://images.unsplash.com/photo-1609347744403-2306e8a9ae27?q=80&w=2070&auto=format&fit=crop"
                                    alt="Temple Aarti"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-[2rem] shadow-2xl max-w-xs animate-in slide-in-from-left-4 duration-1000">
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
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PoojaListClient;

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    MapPin,
    Star,
    Clock,
    ArrowRight,
    Zap,
    Trash2,
    Search,
    Church,
    Flame
} from "lucide-react";
import { fetchUserFavorites, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const FavoritesPage: React.FC = () => {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchUserFavorites();
            if (res.success) {
                setFavorites(res.data);
            }
        } catch (error) {
            console.error("Error loading favorites:", error);
            toast({
                title: "Error",
                description: "Failed to load favorites",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (e: React.MouseEvent, type: 'temple' | 'pooja', id: string) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const data = type === 'temple' ? { templeId: id } : { poojaId: id };
            const res = await removeFavorite(data);
            if (res.success) {
                setFavorites(favorites.filter(f =>
                    type === 'temple' ? f.templeId !== id : f.poojaId !== id
                ));
                toast({ title: "Removed from favorites" });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to remove favorite",
                variant: "destructive",
            });
        }
    };

    const getFullImageUrl = (path: string) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const favoriteTemples = favorites.filter(f => f.temple).map(f => f.temple);
    const favoritePoojas = favorites.filter(f => f.pooja).map(f => f.pooja);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB]">
                <Navbar />
                <div className="pt-40 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-zinc-500 font-medium">Loading your sacred favorites...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Navbar />

            <div className="pt-32 pb-20 container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1 rounded-full bg-white/50 backdrop-blur-sm">
                            <Heart className="w-3 h-3 mr-2 fill-primary" />
                            Personal Sanctuary
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 leading-tight">
                            My <span className="text-primary italic">Favorites</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 max-w-xl text-lg">
                            Your curated list of divine temples and sacred rituals that resonate with your soul.
                        </p>
                    </div>

                    <div className="flex bg-white rounded-3xl p-1.5 shadow-sm border border-zinc-100">
                        <div className="flex items-center gap-6 px-4 py-2">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-primary">{favoriteTemples.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Temples</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-100" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-orange-500">{favoritePoojas.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Poojas</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="temples" className="w-full">
                    <TabsList className="bg-orange-50/50 p-1.5 rounded-2xl h-auto mb-10 w-full md:w-auto overflow-x-auto justify-start inline-flex">
                        <TabsTrigger value="temples" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <Church className="w-4 h-4" />
                                <span>Favorite Temples</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="poojas" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4" />
                                <span>Saved Poojas</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="temples" className="focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {favoriteTemples.length > 0 ? (
                                    favoriteTemples.map((temple, index) => (
                                        <motion.div
                                            key={temple.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="group relative bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-2xl transition-all duration-500 border border-orange-50/50 h-full flex flex-col">
                                                <Link href={`/temples/${temple.id}`}>
                                                    <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] mb-6">
                                                        <NextImage
                                                            src={getFullImageUrl(temple.image)}
                                                            alt={temple.name}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                        <Badge variant="secondary" className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-zinc-900 border-none">
                                                            {temple.category}
                                                        </Badge>
                                                    </div>

                                                    <div className="px-3 pb-4">
                                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors">
                                                            {temple.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-zinc-500 mb-4">
                                                            <MapPin className="w-4 h-4 text-primary" />
                                                            <span className="text-sm font-medium">{temple.location}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                                <span className="font-bold text-zinc-900">{temple.rating}</span>
                                                            </div>
                                                            <div className="text-primary font-bold text-sm flex items-center gap-1">
                                                                View Details
                                                                <ArrowRight className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>

                                                <button
                                                    onClick={(e) => handleRemove(e, 'temple', temple.id)}
                                                    className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                                                    title="Remove from favorites"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-zinc-200 text-center">
                                        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search className="w-10 h-10 text-zinc-300" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">No favorite temples yet</h3>
                                        <p className="text-zinc-500 mb-8">Start exploring and save temples you'd like to visit.</p>
                                        <Button asChild className="rounded-2xl px-8 h-12">
                                            <Link href="/temples">Discover Temples</Link>
                                        </Button>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </TabsContent>

                    <TabsContent value="poojas" className="focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {favoritePoojas.length > 0 ? (
                                    favoritePoojas.map((pooja, index) => (
                                        <motion.div
                                            key={pooja.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="group relative bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-2xl transition-all duration-500 border border-orange-50/50 h-full flex flex-col">
                                                <Link href={`/poojas/${pooja.id}`}>
                                                    <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] mb-6">
                                                        <NextImage
                                                            src={getFullImageUrl(pooja.image)}
                                                            alt={pooja.name}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                        <div className="absolute top-4 left-4 flex gap-2">
                                                            <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 border-none">
                                                                {pooja.category}
                                                            </Badge>
                                                            {pooja.price > 1000 && (
                                                                <Badge className="bg-primary/95 text-white border-none animate-pulse">
                                                                    <Zap className="w-3 h-3 mr-1 fill-white" />
                                                                    Special
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-4 right-4">
                                                            <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-sm font-medium border border-white/20">
                                                                ₹{pooja.price}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="px-3 pb-4 flex-grow">
                                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2 group-hover:text-primary transition-colors">
                                                            {pooja.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-zinc-500 mb-4">
                                                            <Clock className="w-4 h-4 text-primary" />
                                                            <span className="text-sm font-medium">{pooja.duration || pooja.time}</span>
                                                        </div>
                                                        <p className="text-zinc-500 text-sm line-clamp-2 mb-6">
                                                            {Array.isArray(pooja.description) ? pooja.description[0] : pooja.description}
                                                        </p>
                                                    </div>

                                                    <div className="mt-auto px-3 border-t border-zinc-50 pt-4 flex items-center justify-between">
                                                        <div className="text-2xl font-bold text-zinc-900">₹{pooja.price}</div>
                                                        <Button size="sm" className="rounded-xl">Book Now</Button>
                                                    </div>
                                                </Link>

                                                <button
                                                    onClick={(e) => handleRemove(e, 'pooja', pooja.id)}
                                                    className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg"
                                                    title="Remove from favorites"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-zinc-200 text-center">
                                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Flame className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">No saved rituals</h3>
                                        <p className="text-zinc-500 mb-8">Save sacred poojas and sevas that you wish to perform.</p>
                                        <Button asChild className="rounded-2xl px-8 h-12 bg-primary">
                                            <Link href="/poojas">Explore Poojas</Link>
                                        </Button>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <Footer />
        </div>
    );
};

export default FavoritesPage;

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
    Flame,
    Users,
    ShoppingBag,
    ShoppingCart
} from "lucide-react";
import { fetchUserFavorites, removeFavorite } from "@/api/userController";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import { getTempleUrl } from "@/lib/utils/templeUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { parseLocalizedValue } from '@/utils/textUtils';

const FavoritesPage: React.FC = () => {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { t } = useLanguage();

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
                title: t("favorites.error_title"),
                description: t("favorites.error_load"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (e: React.MouseEvent, type: 'temple' | 'pooja' | 'product' | 'mandal', id: string) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const data = type === 'temple' ? { templeId: id } : 
                         type === 'pooja' ? { poojaId: id } : 
                         type === 'mandal' ? { mandalId: id } : 
                         { productId: id };
            const res = await removeFavorite(data);
            if (res.success) {
                setFavorites(favorites.filter(f =>
                    type === 'temple' ? f.templeId !== id : 
                    type === 'pooja' ? f.poojaId !== id : 
                    type === 'mandal' ? f.mandalId !== id : 
                    f.productId !== id
                ));
                toast({ title: t("favorites.removed_title") });
            }
        } catch (error: any) {
            toast({
                title: t("favorites.error_title"),
                description: error.response?.data?.message || t("favorites.remove_error"),
                variant: "destructive",
            });
        }
    };

    const getFullImageUrl = (path: string) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith('http')) return path;
        return `${BASE_URL}${path}`;
    };

    const getProductPrice = (product: any) => {
        const variants = product.variants || [];
        if (variants.length === 0) return "₹0";
        
        const prices = variants.map((v: any) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        
        if (min === max) return `₹${min}`;
        return `₹${min} - ₹${max}`;
    };

    const getProductStartingPrice = (product: any) => {
        const variants = product.variants || [];
        if (variants.length === 0) return 0;
        return Math.min(...variants.map((v: any) => v.price));
    };

    const favoriteTemples = favorites.filter(f => f.temple).map(f => f.temple);
    const favoritePoojas = favorites.filter(f => f.pooja).map(f => f.pooja);
    const favoriteProducts = favorites.filter(f => f.product).map(f => f.product);
    const favoriteMandals = favorites.filter(f => f.mandal).map(f => f.mandal);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB]">
                <Navbar />
                <div className="pt-40 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-zinc-500 font-medium">{t("favorites.loading_text")}</p>
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
                            {t("favorites.page_badge")}
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 leading-tight">
                            {t("favorites.page_title_prefix")}<span className="text-primary italic">{t("favorites.page_title_highlight")}</span>
                        </h1>
                        <p className="text-zinc-500 mt-2 max-w-xl text-lg">
                            {t("favorites.page_subtitle")}
                        </p>
                    </div>

                    <div className="flex bg-white rounded-3xl p-1.5 shadow-sm border border-zinc-100">
                        <div className="flex items-center gap-6 px-4 py-2">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-primary">{favoriteTemples.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">{t("favorites.stat_temples")}</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-100" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-orange-500">{favoritePoojas.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">{t("favorites.stat_poojas")}</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-100" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-blue-500">{favoriteProducts.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">{t("favorites.stat_products")}</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-100" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-amber-600">{favoriteMandals.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Mandals</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="temples" className="w-full">
                    <TabsList className="bg-orange-50/50 p-1.5 rounded-2xl h-auto mb-10 w-full md:w-auto overflow-x-auto justify-start inline-flex">
                        <TabsTrigger value="temples" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <Church className="w-4 h-4" />
                                <span>{t("favorites.tab_temples")}</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="poojas" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <Flame className="w-4 h-4" />
                                <span>{t("favorites.tab_poojas")}</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="products" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                <span>{t("favorites.tab_products")}</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="mandals" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                <span>Mandals</span>
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
                                            <div className="group relative bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-orange-50/50 h-full flex flex-col">
                                                <Link href={getTempleUrl(temple)}>
                                                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] mb-4">
                                                        <NextImage
                                                            src={getFullImageUrl(temple.image)}
                                                            alt={temple.name}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                        <Badge variant="secondary" className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-zinc-900 border-none text-[10px]">
                                                            {parseLocalizedValue(temple.category)}
                                                        </Badge>
                                                    </div>

                                                    <div className="px-2 pb-3">
                                                        <h3 className="text-xl font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                                            {parseLocalizedValue(temple.name)}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-zinc-500 mb-3">
                                                            <MapPin className="w-3.5 h-3.5 text-primary" />
                                                            <span className="text-[11px] font-medium truncate">{parseLocalizedValue(temple.location)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                                <span className="font-bold text-zinc-900 text-sm">{temple.rating}</span>
                                                            </div>
                                                            <div className="text-primary font-bold text-[11px] flex items-center gap-1 uppercase tracking-wider">
                                                                {t("favorites.details")}
                                                                <ArrowRight className="w-3 h-3" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>

                                                <button
                                                    onClick={(e) => handleRemove(e, 'temple', temple.id)}
                                                    className="absolute top-5 right-5 z-20 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md transform hover:scale-110"
                                                    title={t("favorites.remove_title")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-zinc-200 text-center">
                                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search className="w-10 h-10 text-primary-300" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">{t("favorites.no_temples_title")}</h3>
                                        <p className="text-zinc-500 mb-8">{t("favorites.no_temples_subtitle")}</p>
                                        <Button asChild className="rounded-2xl px-8 h-12">
                                            <Link href="/temples">{t("favorites.no_temples_cta")}</Link>
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
                                            <div className="group relative bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-orange-50/50 h-full flex flex-col">
                                                <Link href={`/poojas/${pooja.slug || pooja.id}`}>
                                                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] mb-4">
                                                        <NextImage
                                                            src={getFullImageUrl(pooja.image)}
                                                            alt={parseLocalizedValue(pooja.name)}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                        <div className="absolute top-3 left-3 flex gap-2">
                                                            <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 border-none text-[10px]">
                                                                {parseLocalizedValue(pooja.category)}
                                                            </Badge>
                                                        </div>
                                                        <div className="absolute bottom-3 right-3">
                                                            <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/20">
                                                                ₹{pooja.price}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="px-2 pb-3 flex-grow">
                                                        <h3 className="text-xl font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                                            {parseLocalizedValue(pooja.name)}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-zinc-500 mb-3">
                                                            <Clock className="w-3.5 h-3.5 text-primary" />
                                                            <span className="text-[11px] font-medium">{pooja.duration || pooja.time}</span>
                                                        </div>
                                                        <p className="text-zinc-500 text-[11px] line-clamp-2 mb-4">
                                                            {parseLocalizedValue(pooja.description)}
                                                        </p>
                                                    </div>

                                                    <div className="mt-auto px-2 border-t border-zinc-50 pt-3 flex items-center justify-between">
                                                        <div className="text-xl font-bold text-zinc-900">₹{pooja.price}</div>
                                                        <Button size="sm" className="rounded-xl h-8 text-xs px-4 capitalize">{t("common.know_more")}</Button>
                                                    </div>
                                                </Link>

                                                <button
                                                    onClick={(e) => handleRemove(e, 'pooja', pooja.id)}
                                                    className="absolute top-5 right-5 z-20 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md transform hover:scale-110"
                                                    title={t("favorites.remove_title")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-zinc-200 text-center">
                                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Flame className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">{t("favorites.no_poojas_title")}</h3>
                                        <p className="text-zinc-500 mb-8">{t("favorites.no_poojas_subtitle")}</p>
                                        <Button asChild className="rounded-2xl px-8 h-12 bg-primary">
                                            <Link href="/poojas">{t("favorites.no_poojas_cta")}</Link>
                                        </Button>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </TabsContent>
                    <TabsContent value="products" className="focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {favoriteProducts.length > 0 ? (
                                    favoriteProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="group relative bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-orange-50/50 h-full flex flex-col">
                                                <Link href={`/marketplace/product/${product.id}`}>
                                                    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] mb-4 bg-zinc-50">
                                                        <NextImage
                                                            src={getFullImageUrl(product.image)}
                                                            alt={parseLocalizedValue(product.name)}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                            onError={(e: any) => { e.currentTarget.src = '/placeholder.jpg' }}
                                                        />
                                                        
                                                        {/* Out of Stock Label */}
                                                        {product.variants?.every((v: any) => v.stock === 0) && (
                                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                                                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                                                                    {t('marketplace.out_of_stock')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="absolute top-3 left-3 flex gap-2">
                                                            <Badge className="bg-white/90 backdrop-blur-md text-zinc-900 border-none text-[10px]">
                                                                {parseLocalizedValue(product.category) || "Sacred Item"}
                                                            </Badge>
                                                        </div>
                                                        <div className="absolute bottom-3 right-3">
                                                            <div className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
                                                                {getProductPrice(product)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="px-2 pb-2 flex-grow">
                                                        <h3 className="text-lg font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                                            {parseLocalizedValue(product.name)}
                                                        </h3>
                                                        <p className="text-zinc-500 text-[11px] line-clamp-2 mb-4">
                                                            {parseLocalizedValue(product.description)}
                                                        </p>
                                                    </div>
                                                    <div className="mt-auto px-2 border-t border-zinc-50 pt-3 flex items-center justify-between">
                                                        <div className="text-xl font-extrabold text-zinc-900">
                                                            {getProductPrice(product)}
                                                        </div>
                                                        <Button 
                                                            size="icon" 
                                                            className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                            disabled={product.variants?.every((v: any) => v.stock === 0)}
                                                        >
                                                            <ShoppingCart className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={(e) => handleRemove(e, 'product', product.id)}
                                                    className="absolute top-5 right-5 z-20 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md transform hover:scale-110"
                                                    title={t("favorites.remove_title")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-zinc-200 text-center">
                                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ShoppingBag className="w-10 h-10 text-primary-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">{t("favorites.no_products_title")}</h3>
                                        <p className="text-primary-500 mb-8">{t("favorites.no_products_subtitle")}</p>
                                        <Button asChild className="rounded-2xl px-8 h-12">
                                            <Link href="/marketplace">{t("favorites.no_products_cta")}</Link>
                                        </Button>
                                    </div>






                                )}
                            </AnimatePresence>
                        </div>
                    </TabsContent>

                    <TabsContent value="mandals" className="focus-visible:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {favoriteMandals.length > 0 ? (
                                    favoriteMandals.map((mandal, index) => (
                                        <motion.div
                                            key={mandal.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="group relative bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-orange-50/50 h-full flex flex-col">
                                                <Link href={`/mandals`}>
                                                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] mb-4">
                                                        <NextImage
                                                            src={getFullImageUrl(mandal.image)}
                                                            alt={parseLocalizedValue(mandal.name)}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                        <Badge variant="secondary" className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-zinc-900 border-none text-[10px]">
                                                            {mandal.mandalType || "Mandal"}
                                                        </Badge>
                                                    </div>

                                                    <div className="px-2 pb-3">
                                                        <h3 className="text-xl font-bold text-zinc-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                                            {parseLocalizedValue(mandal.name)}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-zinc-500 mb-3">
                                                            <MapPin className="w-3.5 h-3.5 text-primary" />
                                                            <span className="text-[11px] font-medium truncate">{mandal.city || "India"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                                <span className="font-bold text-zinc-900 text-sm">{mandal.mandalType || "Devotee"}</span>
                                                            </div>
                                                            <div className="text-primary font-bold text-[11px] flex items-center gap-1 uppercase tracking-wider">
                                                                {t("favorites.details")}
                                                                <ArrowRight className="w-3 h-3" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>

                                                <button
                                                    onClick={(e) => handleRemove(e, 'mandal', mandal.id)}
                                                    className="absolute top-5 right-5 z-20 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md transform hover:scale-110"
                                                    title="Remove from favorites"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-zinc-200 text-center">
                                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Heart className="w-10 h-10 text-primary-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">No Saved Mandals</h3>
                                        <p className="text-zinc-500 mb-8">Save mandals to easily track and support them later.</p>
                                        <Button asChild className="rounded-2xl px-8 h-12">
                                            <Link href="/mandals">Explore Mandals</Link>
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

"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin,
    Star,
    Clock,
    Video,
    Calendar,
    Heart,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    IndianRupee,
    Maximize2,
    Play,
    Phone,
    Camera,
    Info,
     Globe,
    ExternalLink,
    FileText,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";

import { getLiveDarshanUrl } from "@/lib/utils/templeUtils";
import { getLocalized, getLocalizedArray } from "@/utils/localization";
import { parseLocalizedValue } from "@/utils/textUtils";
import { TempleDetailProps } from "./TempleDetail";

export default function DesktopTempleDetail({
    temple,
    isFavorite,
    activeImageIndex,
    setActiveImageIndex,
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
}: TempleDetailProps) {
    const canBookPooja = temple.canBookPooja !== false;
    const canDonate = temple.canDonate !== false;
    const primaryActionCount = [canBookPooja, temple.liveStatus].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-background">
            <Navbar isSolid={true} />

            {/* Premium Single Image Hero with Ken Burns Effect */}
            <section className="relative h-[70vh] md:h-[80vh] overflow-hidden mt-26">
                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.1 }}
                    transition={{ 
                        duration: 20, 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        ease: "linear" 
                    }}
                    className="absolute inset-0"
                >
                    <img
                        src={getFullImageUrl(temple.image)}
                        alt={getLocalized(temple, "name", language)}
                        className="w-full h-full object-cover"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Actions */}
                <div className="absolute top-6 right-4 md:right-8 flex gap-2 z-20">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-background/80 backdrop-blur-sm pointer-events-auto hover:bg-white transition-all shadow-lg"
                        onClick={() => {
                            setActiveImageIndex(0);
                            setIsFullViewOpen(true);
                        }}
                    >
                        <Maximize2 className="h-5 w-5" />
                    </Button>
                </div>
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
                                            {getLocalized(temple, "category", language)}
                                        </Badge>
                                        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                                            {getLocalized(temple, "name", language)}
                                        </h1>
                                    </div>
                                    {showRatings && (
                                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                            <span className="font-bold text-foreground">{temple.rating}</span>
                                            <span className="text-muted-foreground text-sm">
                                                ({(temple.reviewsCount || 0).toLocaleString()} {t("temple_detail.reviews")})
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {temple.mapUrl ? (
                                            <a href={temple.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">
                                                {getLocalized(temple, "fullAddress", language)}
                                            </a>
                                        ) : (
                                            <span>{getLocalized(temple, "fullAddress", language)}</span>
                                        )}
                                    </div>
                                    {(temple.phone && temple.showPhone !== false) && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary" />
                                            <span>{temple.phone}</span>
                                        </div>
                                    )}
                                    {temple.website && temple.showWebsite !== false && (
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-primary" />
                                            <a href={temple.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">
                                                Official Website
                                            </a>
                                        </div>
                                    )}
                                    {temple.mapUrl && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <a href={temple.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">
                                                Google Maps Location
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <span className="font-bold">{t("temple_detail.description")}</span>
                                    <div
                                        className="prose prose-sm max-w-none text-muted-foreground
                                            prose-headings:text-foreground prose-headings:font-bold
                                            prose-strong:text-foreground prose-p:text-muted-foreground
                                            prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                                            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
                                        dangerouslySetInnerHTML={{ __html: getLocalized(temple, "description", language) || "" }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs defaultValue="poojas" className="w-full">
                            <TabsList className="w-full justify-start bg-white text-black p-2 rounded-lg gap-2 border border-primary/10 shadow-sm">
                                <TabsTrigger value="poojas" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-md px-6 font-bold">{t("temple_detail.poojas_seva")}</TabsTrigger>
                                <TabsTrigger value="filter" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-md px-6 font-bold">{t("temple_detail.filter_by_purpose")}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="about" className="mt-6">
                                <Card className="border-border/50">
                                    <CardContent className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-xl font-display font-semibold mb-3">{t("temple_detail.description")}</h3>
                                            <div className="flex items-center gap-2 text-[#794A05] bg-[#794A05]/5 px-3 py-1.5 rounded-full w-fit mb-4">
                                                <Info className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Divine History</span>
                                            </div>
                                            <div
                                                className="prose prose-orange max-w-none
                                                    prose-headings:text-foreground prose-headings:font-bold
                                                    prose-strong:text-foreground prose-p:text-foreground/80
                                                    prose-ul:text-foreground/80 prose-ol:text-foreground/80
                                                    prose-blockquote:border-l-primary"
                                                dangerouslySetInnerHTML={{ __html: getLocalized(temple, "description", language) || "" }}
                                            />
                                        </div>
                                        {temple.history && (
                                            <div>
                                                <h3 className="text-xl font-display font-semibold mb-3">{t("temple_detail.history")}</h3>
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
                                            {t("temple_detail.available_poojas")}
                                        </h3>
                                    </div>
                                    <CardContent className="p-0">
                                        {temple.poojas && temple.poojas.length > 0 ? (
                                            <div className="divide-y divide-primary/5">
                                                {temple.poojas.map((pooja: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-primary/[0.02] transition-colors cursor-pointer"
                                                        onClick={() => router.push(`/poojas/${pooja.slug || pooja.id}`)}
                                                    >
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-lg text-foreground mb-2">{getLocalized(pooja, "name", language)}</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {getLocalizedArray(pooja, "benefits", language)?.map((benefit: string, bIdx: number) => (
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
                                                                className="rounded-full px-6 shadow-soft hover:shadow-warm transition-all capitalize"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/poojas/${pooja.slug || pooja.id}`);
                                                                }}
                                                            >
                                                                {t("common.know_more")}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center text-muted-foreground italic">
                                                {t("temple_detail.pooja_schedule_soon")}
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
                                                {t("temple_detail.select_purpose")}
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
                                                    {t("temple_detail.showing_rituals_for")}{" "}
                                                    <span className="text-primary italic">{selectedPurposes.join(", ")}</span>
                                                </h3>
                                            </div>

                                            <div className="grid gap-3">
                                                {temple.poojas
                                                    ?.filter((p: any) =>
                                                        selectedPurposes.some(purpose =>
                                                            getLocalized(p, "category", language)?.split(",").map((s: string) => s.trim()).includes(purpose)
                                                        )
                                                    )
                                                    .map((pooja: any, index: number) => (
                                                        <Card key={index} className="group border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-sm border border-primary/5">
                                                            <div className="flex items-center justify-between p-4 gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight truncate">{getLocalized(pooja, "name", language)}</h4>
                                                                </div>

                                                                <div className="flex items-center gap-6 shrink-0">
                                                                    <div className="font-black text-lg text-primary flex items-center">
                                                                        <IndianRupee className="h-4 w-4" />
                                                                        {pooja.price}
                                                                    </div>
                                                                    <Button
                                                                        className="rounded-lg px-8 h-10 shadow-sm hover:shadow-md group-hover:scale-105 transition-all bg-primary font-bold text-xs capitalize"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            router.push(`/poojas/${pooja.id}`);
                                                                        }}
                                                                    >
                                                                        {t("common.know_more")}
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

                            <TabsContent value="gallery" className="mt-6 space-y-8">
                                {/* Media Grid (Images + Videos) */}
                                {galleryMedia.length > 0 ? (
                                    <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                                        {galleryMedia.map((item, index) => (
                                            <div 
                                                key={index} 
                                                className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative shadow-md hover:shadow-xl transition-all duration-300 border border-primary/5"
                                                onClick={() => {
                                                    if (!user) {
                                                        router.push(`/auth?redirect=/temples/${params?.id || params?.subdomain}`);
                                                        return;
                                                    }
                                                    if (item.type === "video") {
                                                        setVideoPlayUrl(item.url);
                                                    } else {
                                                        setActiveImageIndex(index);
                                                        setIsFullViewOpen(true);
                                                    }
                                                }}
                                            >
                                                {item.type === "image" ? (
                                                    <div className="relative">
                                                        <img
                                                            src={getFullImageUrl(item.url)}
                                                            alt={`${getLocalized(temple, "name", language)} gallery ${index + 1}`}
                                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                                                                <Maximize2 className="h-5 w-5 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative aspect-video bg-black flex items-center justify-center">
                                                        <img
                                                            src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/hqdefault.jpg`}
                                                            alt="Video thumbnail"
                                                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                <Play className="w-6 h-6 text-white fill-white ml-1" />
                                                            </div>
                                                        </div>
                                                        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                                                            <Video className="w-3 h-3 text-white" />
                                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Video</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center text-muted-foreground">
                                        <p className="text-sm italic">No media available yet.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar Actions & Info */}
                    <div className="space-y-6">
                        <Card className="border-border/50 sticky top-24 overflow-hidden shadow-warm bg-white/80 backdrop-blur-md">
                            <CardContent className="p-5 space-y-6">
                                {/* Primary Actions */}
                                <div className="space-y-3">
                                    <div className={`grid ${primaryActionCount > 1 ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                                        {canBookPooja && (
                                            <Button
                                                variant="gold"
                                                className="w-full gap-2 h-12 text-base font-bold shadow-sm group transition-all"
                                                onClick={handleBookPooja}
                                            >
                                                <Calendar className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
                                                <span className="truncate">{t("temple_detail.book_pooja")}</span>
                                            </Button>
                                        )}

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
                                                    <span className="truncate">{t("temple_detail.live_darshan")}</span>
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {/* Secondary Action Grid (Darshan & Photography) */}
                                    {(temple.isDarshanActive || temple.photographyEnabled) && (
                                        <div className={`grid ${temple.isDarshanActive && temple.photographyEnabled ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                                            {temple.isDarshanActive && (
                                                <Button
                                                    variant="gold"
                                                    className="w-full gap-2 h-12 text-base font-bold shadow-sm group transition-all"
                                                    onClick={() => {
                                                        if (!user) {
                                                            router.push(`/auth?redirect=/darshan/${temple.id}`);
                                                            return;
                                                        }
                                                        router.push(`/darshan/${temple.id}`);
                                                    }}
                                                >
                                                    <MapPin className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
                                                    <span className="truncate">Darshan Ticket</span>
                                                </Button>
                                            )}
                                            {temple.photographyEnabled && (
                                                <Button
                                                    variant="gold"
                                                    className="w-full gap-2 h-12 text-base font-bold shadow-sm group transition-all"
                                                    onClick={() => {
                                                        if (!user) {
                                                            router.push(`/auth?redirect=/temples/${temple.id}/photography`);
                                                            return;
                                                        }
                                                        router.push(`/temples/${temple.id}/photography`);
                                                    }}
                                                >
                                                    <Camera className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
                                                    <span className="truncate">Photography</span>
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Prominent Donation Button */}
                                    {canDonate && (
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl border-dashed border-primary/30 text-primary hover:bg-primary/5 font-bold gap-2"
                                            onClick={handleDonation}
                                        >
                                            <Heart className="h-4 w-4" />
                                            Donation
                                        </Button>
                                    )}

                                    {/* Operating Hours */}
                                    <div className="space-y-4">
                                        {((temple.operatingHours && Array.isArray(temple.operatingHours) && temple.operatingHours.filter((s: any) => s.active).length > 0) || temple.openTime) && (
                                            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                <div className="h-8 w-8 shrink-0 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-primary/60 leading-tight mb-1">{t("temple_detail.operating_hours")}</p>
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
                                    </div>
                                </div>

                                {/* Sidebar: Gallery Grid */}
                                {galleryMedia.length > 0 && (
                                    <div className="pt-4 space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-8 bg-primary/20 rounded-full" />
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">GALLERY</h3>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {galleryMedia.slice(0, 6).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative shadow-sm hover:shadow-md transition-all border border-primary/5"
                                                    onClick={() => {
                                                        if (item.type === "video") {
                                                            setVideoPlayUrl(item.url);
                                                        } else {
                                                            setActiveImageIndex(idx);
                                                            setIsFullViewOpen(true);
                                                        }
                                                    }}
                                                >
                                                    {item.type === "image" ? (
                                                        <img
                                                            src={getFullImageUrl(item.url)}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            alt="Gallery thumbnail"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-black flex items-center justify-center relative">
                                                            <img
                                                                src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/default.jpg`}
                                                                className="w-full h-full object-cover opacity-50"
                                                                alt="Video thumbnail"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* In the News — News Cuttings */}
                                {temple.newsCuttings && Array.isArray(temple.newsCuttings) && temple.newsCuttings.length > 0 && (
                                    <div className="pt-4 space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1 w-8 bg-primary/20 rounded-full" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                                                <FileText className="w-3 h-3" /> In the News
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(temple.newsCuttings as any[]).map((item: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedNews(item)}
                                                    className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm block aspect-[4/3] cursor-pointer"
                                                >
                                                    <img
                                                        src={getFullImageUrl(item.image)}
                                                        alt={`News cutting ${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full">
                                                            <Maximize2 className="h-4 w-4 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Compact Upcoming Events */}
                                {temple.events && temple.events.length > 0 && (
                                    <div className="pt-2 space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1 w-8 bg-primary/20 rounded-full" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("temple_detail.upcoming_events")}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {temple.events.slice(0, showAllEvents ? undefined : 3).map((event: any, index: number) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="relative pl-4 border-l-2 border-primary/10 hover:border-primary/40 transition-all py-1 group cursor-pointer hover:bg-primary/5 rounded-r-lg"
                                                >
                                                    <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">{getLocalized(event, "name", language)}</h4>
                                                        {!event.templeId && (
                                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none text-[8px] px-1.5 h-4 font-black uppercase tracking-tighter">
                                                                Global
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" />
                                                        {event.date}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        {temple.events.length > 3 && (
                                            <button 
                                                onClick={() => setShowAllEvents(!showAllEvents)}
                                                className="w-full mt-2 text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
                                            >
                                                {showAllEvents ? (
                                                    <>Show Less <ChevronUp className="w-3 h-3" /></>
                                                ) : (
                                                    <>+ {temple.events.length - 3} More Events <ChevronDown className="w-3 h-3" /></>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Social Media Links */}
                                {(temple.instagramUrl || temple.facebookUrl || temple.youtubeUrl) && (
                                    <div className="pt-2 space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1 w-8 bg-primary/20 rounded-full" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Follow Us</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {temple.instagramUrl && (
                                                <a
                                                    href={temple.instagramUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100 hover:border-pink-300 transition-all group"
                                                >
                                                    <FaInstagram className="h-5 w-5 text-pink-500 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold text-pink-600">Instagram</span>
                                                </a>
                                            )}
                                            {temple.facebookUrl && (
                                                <a
                                                    href={temple.facebookUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all group"
                                                >
                                                    <FaFacebook className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold text-blue-700">Facebook</span>
                                                </a>
                                            )}
                                            {temple.youtubeUrl && (
                                                <a
                                                    href={temple.youtubeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 hover:border-red-300 transition-all group"
                                                >
                                                    <FaYoutube className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold text-red-600">YouTube</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Video Play Modal */}
            <Dialog open={!!videoPlayUrl} onOpenChange={(open) => !open && setVideoPlayUrl(null)}>
                <DialogContent className="max-w-6xl w-[95vw] p-0 border-none bg-black overflow-hidden rounded-2xl">
                    <DialogTitle className="sr-only">YouTube Video</DialogTitle>
                    {videoPlayUrl && (
                        <div className="aspect-video w-full">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${getYouTubeId(videoPlayUrl)}?autoplay=1`}
                                title="Temple Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Full View Modal */}
            <Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
                <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center overflow-hidden">
                    <DialogTitle className="sr-only">Full Image View</DialogTitle>
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {galleryMedia[activeImageIndex]?.type === "image" ? (
                                <motion.img
                                    key={activeImageIndex}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    src={getFullImageUrl(galleryMedia[activeImageIndex].url)}
                                    alt={getLocalized(temple, "name", language)}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                />
                            ) : (
                                <motion.div
                                    key={activeImageIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-[90vw] max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                                >
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${getYouTubeId(galleryMedia[activeImageIndex].url)}?autoplay=1`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </motion.div>
                            )}

                            {galleryMedia.length > 1 && (
                                <>
                                    <button
                                        className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 shadow-xl border border-white/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToPrev();
                                        }}
                                    >
                                        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                                    </button>
                                    <button
                                        className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 shadow-xl border border-white/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToNext();
                                        }}
                                    >
                                        <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Media Counter/Label */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-xs font-bold tracking-widest z-50">
                            {activeImageIndex + 1} / {galleryMedia.length} 
                            {galleryMedia[activeImageIndex]?.type === "video" && " • VIDEO"}
                        </div>

                        {/* Thumbnail Navigation (Desktop) */}
                        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 gap-3 z-50 max-w-[80vw] overflow-x-auto p-2 scrollbar-hide">
                            {galleryMedia.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToMedia(index)}
                                    className={`h-12 w-16 md:h-16 md:w-24 rounded-lg overflow-hidden shrink-0 transition-all border-2 ${
                                        activeImageIndex === index
                                            ? "border-primary scale-110 shadow-lg"
                                            : "border-transparent opacity-50 hover:opacity-100"
                                    }`}
                                >
                                    {item.type === "image" ? (
                                        <img src={getFullImageUrl(item.url)} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full bg-black flex items-center justify-center relative">
                                            <img src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/default.jpg`} className="w-full h-full object-cover opacity-60" alt="" />
                                            <Play className="absolute h-4 w-4 text-white fill-white" />
                                        </div>
                                    )}
                                </button>
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
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-black text-white leading-tight">{getLocalized(selectedEvent, "name", language)}</h2>
                                    {!selectedEvent.templeId && (
                                        <Badge className="bg-white/20 text-white backdrop-blur-md border-white/30 text-[10px] font-black uppercase tracking-wider">
                                            Global Event
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">{selectedEvent.date}</span>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Event Description (if any) */}
                                {selectedEvent.description && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">About the Event</h3>
                                        <div 
                                            className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                                        />
                                    </div>
                                )}

                                {/* Recommended Poojas Section */}
                                {recommendedPoojas.length > 0 && (
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
                                                            {parseLocalizedValue(pooja.name)}
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
                                                            setSelectedEvent(null);
                                                            router.push(`/poojas/${pooja.slug || pooja.id}?temple=${temple.id}`);
                                                        }}
                                                    >
                                                        Book Now
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* News Cutting Modal */}
            <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
                <DialogContent className="max-w-4xl w-full p-4 border-none bg-black/95 flex flex-col items-center justify-center overflow-hidden h-[90vh]">
                    <DialogTitle className="sr-only">News Cutting</DialogTitle>
                    {selectedNews && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={getFullImageUrl(selectedNews.image)}
                                alt="News Cutting"
                                className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-lg"
                            />
                            {selectedNews.link && (
                                <Button 
                                    asChild
                                    size="lg"
                                    className="bg-primary hover:bg-[#a05a2c] text-white font-bold tracking-wide rounded-full px-8 shadow-xl mt-2"
                                >
                                    <a href={selectedNews.link} target="_blank" rel="noopener noreferrer">
                                        Navigate to news
                                        <ExternalLink className="ml-2 w-4 h-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

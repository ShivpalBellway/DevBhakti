"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin,
    Star,
    Clock,
    Calendar,
    IndianRupee,
    Building2,
} from "lucide-react";
import { API_URL } from "@/config/apiConfig";

interface TemplePreviewProps {
    temple: any;
}

export default function TemplePreview({ temple }: TemplePreviewProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    if (!temple) return null;

    const getFullImageUrl = (path: string) => {
        if (!path) return "https://placehold.co/1200x600?text=No+Image";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const heroImages = temple.heroImages && temple.heroImages.length > 0 ? temple.heroImages : [temple.image];

    return (
        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar bg-slate-50/50 rounded-xl">
            {/* Hero Image Carousel Simplified */}
            <div className="relative h-64 md:h-80 overflow-hidden rounded-t-xl">
                <img
                    src={getFullImageUrl(heroImages[activeImageIndex])}
                    alt={temple.templeName || temple.name}
                    className="w-full h-full object-cover"
                />

                {/* Image Indicators */}
                {heroImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/30 p-2 rounded-lg backdrop-blur-sm">
                        {heroImages.map((img: any, index: number) => (
                            <button
                                key={index}
                                onClick={() => setActiveImageIndex(index)}
                                className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${index === activeImageIndex ? "border-primary" : "border-transparent opacity-70"
                                    }`}
                            >
                                <img
                                    src={getFullImageUrl(img)}
                                    alt="thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 -mt-12 relative z-10">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-md">
                            <CardContent className="p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                    <div>
                                        <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-none">
                                            {temple.category || "Temple"}
                                        </Badge>
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                            {temple.templeName || temple.name}
                                        </h1>
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                        <span className="font-bold text-slate-900">{temple.rating || "4.5"}</span>
                                        <span className="text-slate-500 text-xs">
                                            ({(temple.reviewsCount || 0).toLocaleString()} reviews)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 text-slate-600 mb-6">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{temple.fullAddress || temple.templeLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{temple.openTime || "6:00 AM - 9:00 PM"}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">About</h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {temple.description || "No description provided."}
                                        </p>
                                    </div>
                                    {temple.history && (
                                        <div>
                                            <h3 className="font-semibold text-slate-900 mb-1">History</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {temple.history}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="poojas" className="w-full">
                            <TabsList className="w-full justify-start bg-slate-100 p-1 rounded-lg">
                                <TabsTrigger value="poojas" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Poojas & Aartis</TabsTrigger>
                                <TabsTrigger value="events" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Events</TabsTrigger>
                            </TabsList>

                            <TabsContent value="poojas" className="mt-4">
                                <Card className="border-none shadow-md">
                                    <CardContent className="p-4">
                                        {temple.poojas && temple.poojas.length > 0 ? (
                                            <div className="space-y-3">
                                                {temple.poojas.map((pooja: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                                                    >
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-slate-900 text-sm mb-1">{pooja.name}</h4>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {pooja.benefits?.map((benefit: string, bIndex: number) => (
                                                                    <span
                                                                        key={bIndex}
                                                                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10"
                                                                    >
                                                                        {benefit}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center text-primary font-bold ml-4">
                                                            <IndianRupee className="h-3.5 w-3.5" />
                                                            <span>{pooja.price}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 py-4 text-center">
                                                No poojas listed yet.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="events" className="mt-4">
                                <Card className="border-none shadow-md">
                                    <CardContent className="p-4">
                                        {temple.upcomingEvents && temple.upcomingEvents.length > 0 ? (
                                            <div className="space-y-3">
                                                {temple.upcomingEvents.map((event: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                                                    >
                                                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                            <Calendar className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900 text-sm">{event.name}</h4>
                                                            <p className="text-xs text-slate-500">{event.date}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 py-4 text-center">
                                                No upcoming events.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar Preview */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-md sticky top-6">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                            <Building2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Managed By</p>
                                            <p className="text-sm font-semibold text-slate-900">{temple.userName || "N/A"}</p>
                                        </div>
                                    </div>

                                    {temple.mapUrl && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                                <MapPin className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Map Location</p>
                                                <a
                                                    href={temple.mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-blue-600 hover:underline"
                                                >
                                                    View on Google Maps
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {temple.gallery && temple.gallery.length > 0 && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-xs font-semibold text-slate-900 mb-3">Gallery Preview</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {temple.gallery.slice(0, 6).map((img: any, index: number) => (
                                                    <div key={index} className="aspect-square rounded-md overflow-hidden bg-slate-100">
                                                        <img
                                                            src={getFullImageUrl(img.src || img)}
                                                            alt="Gallery"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}


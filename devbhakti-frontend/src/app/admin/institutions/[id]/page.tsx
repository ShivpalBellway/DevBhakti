"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Edit2,
    Building2,
    MapPin,
    Globe,
    Phone,
    Clock,
    Eye,
    Calendar,
    History,
    FileText,
    Star,
    Layout,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAllInstitutionsAdmin } from "@/api/adminController";
import { API_URL } from "@/config/apiConfig";
import { Card, CardContent } from "@/components/ui/card";

export default function ViewInstitutionPage() {
    const router = useRouter();
    const params = useParams();
    const instId = params.id as string;
    const [inst, setInst] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allInst = await fetchAllInstitutionsAdmin();
            const found = allInst.find((i: any) => i.id === instId);
            setInst(found);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFullImageUrl = (path: string) => {
        if (!path) return "https://via.placeholder.com/800x400?text=No+Image";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!inst) return <div className="text-center py-20">Institution not found.</div>;

    const temple = inst.temple;
    const heroImages = temple?.heroImages && temple.heroImages.length > 0 ? temple.heroImages : [temple?.image];

    const nextSlide = () => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    };

    const prevSlide = () => {
        setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Main Header Area */}
            <div className="relative">
                {/* Hero Slider */}
                <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden shadow-lg bg-slate-900 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>

                    <div className="w-full h-full relative">
                        {heroImages.map((img: string, i: number) => (
                            <div
                                key={i}
                                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${i === currentHeroIndex ? "opacity-100" : "opacity-0"
                                    }`}
                            >
                                <img
                                    src={getFullImageUrl(img)}
                                    className="w-full h-full object-cover"
                                    alt={`Hero ${i + 1}`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Navigation Arrows */}
                    {heroImages.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>

                            {/* Dot Indicators */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                                {heroImages.map((_: any, i: number) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all ${i === currentHeroIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 z-30 bg-black/20 hover:bg-black/40 text-white rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </div>

                {/* Profile Overlap Info */}
                <div className="px-8 -mt-12 relative z-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
                            {/* Main (Profile) Image */}
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
                                <img
                                    src={getFullImageUrl(temple?.image)}
                                    className="w-full h-full object-cover"
                                    alt={temple?.name}
                                />
                            </div>

                            <div className="space-y-2 pb-2 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <Badge className="bg-primary hover:bg-primary border-none">{temple?.category}</Badge>
                                    {temple?.liveStatus && <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none">Verified Live</Badge>}
                                </div>
                                <h1 className="text-4xl font-bold text-slate-800 font-serif">{temple?.name}</h1>
                                <div className="flex items-center justify-center md:justify-start text-slate-500 gap-4 text-sm mt-1">
                                    <span className="flex items-center gap-1 font-medium"><MapPin className="w-4 h-4 text-primary" /> {temple?.location}</span>
                                    <span className="flex items-center gap-1 font-medium"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {temple?.rating} ({temple?.reviewsCount} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="pb-4 flex justify-center w-full md:w-auto">
                            <Button onClick={() => router.push(`/admin/institutions/edit/${instId}`)} variant="sacred" className="bg-primary text-white shadow-md hover:bg-primary/90">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* About & Description */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                    <FileText className="w-6 h-6 text-primary" />
                                    Temple Overview
                                </h2>
                                <p className="text-slate-600 leading-relaxed italic border-l-4 border-primary/20 pl-4">
                                    {temple?.description}
                                </p>
                            </div>

                            {temple?.history && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                        <History className="w-6 h-6 text-primary" />
                                        Spiritual History
                                    </h2>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                        {temple?.history}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Linked Poojas */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                <Building2 className="w-6 h-6 text-primary" />
                                Poojas Performed
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {temple?.poojas?.map((p: any) => (
                                    <div key={p.id} className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between group hover:border-primary transition-all">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{p.name}</span>
                                            <span className="text-sm text-slate-500">{p.category} • {p.duration}</span>
                                        </div>
                                        <Badge variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">₹{p.price}</Badge>
                                    </div>
                                ))}
                                {(!temple?.poojas || temple.poojas.length === 0) && <p className="text-muted-foreground text-sm col-span-2">No poojas linked yet.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Events */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                <Calendar className="w-6 h-6 text-primary" />
                                Upcoming Festivals & Events
                            </h2>
                            <div className="space-y-4">
                                {temple?.events?.map((ev: any) => (
                                    <div key={ev.id} className="p-4 rounded-xl border bg-slate-50 flex items-center gap-4">
                                        <div className="bg-primary/10 text-primary p-3 rounded-lg flex flex-col items-center min-w-[70px]">
                                            <span className="text-xs font-bold uppercase">{ev.date.split(' ')[0]}</span>
                                            <span className="text-xl font-bold">{ev.date.split(' ')[1]?.replace(',', '') || ev.date}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{ev.name}</h4>
                                            <p className="text-sm text-slate-500">{ev.description || "Divine celebration at the temple."}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!temple?.events || temple.events.length === 0) && <p className="text-muted-foreground text-sm">No events scheduled.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Sidebar Info */}
                <div className="space-y-6">
                    {/* Key Info Card */}
                    <Card className="border-none shadow-sm bg-slate-50">
                        <CardContent className="p-6 space-y-6">
                            <h3 className="font-bold text-slate-900 border-b pb-2">Institutional Details</h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Eye className="w-4 h-4 text-primary mt-1" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Viewers</p>
                                        <p className="text-sm font-semibold">{temple?.viewers || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-primary mt-1" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Opening Hours</p>
                                        <p className="text-sm font-semibold">{temple?.openTime || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-primary mt-1" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Full Address</p>
                                        <p className="text-sm font-semibold">{temple?.fullAddress || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                {temple?.website && (
                                    <a href={temple.website} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                        <Globe className="w-4 h-4" /> Official Website <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {temple?.mapUrl && (
                                    <a href={temple.mapUrl} target="_blank" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                                        <MapPin className="w-4 h-4" /> Open in Google Maps <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="w-4 h-4" /> {temple?.phone || "No Contact"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Info */}
                    <Card className="border-none shadow-sm bg-primary/5">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Layout className="w-4 h-4 text-primary" />
                                Admin Account
                            </h3>
                            <div className="space-y-2">
                                <p className="text-sm font-bold">{inst.name}</p>
                                <p className="text-xs text-muted-foreground">{inst.email}</p>
                                <p className="text-xs text-muted-foreground">{inst.phone}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ExternalLink({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
    )
}

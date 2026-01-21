"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Clock, IndianRupee, Tag, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMyPoojas } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function TempleViewPoojaPage() {
    const router = useRouter();
    const params = useParams();
    const poojaId = params.id as string;
    const { toast } = useToast();
    const [pooja, setPooja] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPooja();
    }, []);

    const loadPooja = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyPoojas();
            const found = (response.data || []).find((p: any) => p.id === poojaId);
            if (found) {
                setPooja(found);
            } else {
                toast({ title: "Error", description: "Pooja not found", variant: "destructive" });
                router.push('/temples/dashboard/poojas');
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load pooja", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return "https://via.placeholder.com/800x400";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 border-4 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading ritual profile...</p>
            </div>
        );
    }

    if (!pooja) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100">
                        <ArrowLeft className="w-5 h-5 text-[#7b4623]" />
                    </Button>
                    <h1 className="text-3xl font-serif font-bold text-[#7b4623]">{pooja.name}</h1>
                </div>
                <Button onClick={() => router.push(`/temples/dashboard/poojas/edit/${pooja.id}`)} className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-lg shadow-orange-900/20 rounded-xl px-6">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="aspect-video rounded-3xl overflow-hidden border bg-slate-50 shadow-sm">
                        <img
                            src={getImageUrl(pooja.image)}
                            alt={pooja.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <Card className="rounded-2xl border-none shadow-sm bg-card/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-[#7b4623] font-serif">
                                <Info className="w-5 h-5" />
                                Ritual Significance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {pooja.about || "No detailed description provided."}
                            </p>
                        </CardContent>
                    </Card>

                    {pooja.benefits && pooja.benefits.length > 0 && (
                        <Card className="rounded-2xl border-none shadow-sm bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-[#7b4623] font-serif">Divine Benefits</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {pooja.benefits.map((benefit: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="rounded-2xl border-none bg-[#7b4623] text-white overflow-hidden relative shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Tag className="w-24 h-24 rotate-12" />
                        </div>
                        <CardContent className="p-6 space-y-6 relative z-10">
                            <div>
                                <p className="text-orange-200/70 text-xs uppercase tracking-widest font-bold">Standard Offering</p>
                                <div className="flex items-center text-4xl font-bold mt-1">
                                    <IndianRupee className="w-6 h-6 mr-1" />
                                    {pooja.price}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10 text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-[10px] uppercase">Expected Duration</p>
                                        <p className="font-semibold">{pooja.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-white/60 text-[10px] uppercase">Service Category</p>
                                        <p className="font-semibold">{pooja.category}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {pooja.packages && pooja.packages.length > 0 && (
                        <Card className="rounded-2xl border-none shadow-sm bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-[#7b4623]">Pricing Packages</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {pooja.packages.map((pkg: any, i: number) => (
                                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:border-orange-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{pkg.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tight">{pkg.description}</p>
                                        </div>
                                        <div className="text-[#7b4623] font-bold">
                                            ₹{pkg.price}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

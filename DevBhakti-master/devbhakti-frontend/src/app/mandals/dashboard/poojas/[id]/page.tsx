"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Clock, IndianRupee, Tag, Info, Loader2, Languages, Calendar, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMyMandalPoojas } from "@/api/mandalAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { parseLocalizedValue } from '@/utils/textUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ViewLanguage = 'en' | 'hi' | 'mr';

export default function MandalViewPoojaPage() {
    const router = useRouter();
    const params = useParams();
    const poojaId = params.id as string;
    const { toast } = useToast();
    const [pooja, setPooja] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewLanguage, setViewLanguage] = useState<ViewLanguage>('en');

    useEffect(() => {
        loadPooja();
    }, []);

    const loadPooja = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyMandalPoojas();
            const poojasList = response.data || response || [];
            const found = Array.isArray(poojasList) ? poojasList.find((p: any) => p.id === poojaId) : null;

            if (found) {
                setPooja(found);
                window.dispatchEvent(new CustomEvent('updateBreadcrumb', { detail: parseLocalizedValue(found.name, 'en') || "Pooja Details" }));
            } else {
                toast({ title: "Error", description: "Pooja not found", variant: "destructive" });
                router.push('/mandals/dashboard/poojas');
            }
        } catch (error: any) {
            console.error("Failed to load pooja:", error);
            toast({ 
                title: "Error", 
                description: "Failed to load pooja details", 
                variant: "destructive" 
            });
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

    // Safety checks for parsed arrays
    const descriptions = pooja.description ? (typeof pooja.description === 'string' ? JSON.parse(pooja.description) : pooja.description) : [];
    const benefits = pooja.benefits ? (typeof pooja.benefits === 'string' ? JSON.parse(pooja.benefits) : pooja.benefits) : [];
    const bullets = pooja.bullets ? (typeof pooja.bullets === 'string' ? JSON.parse(pooja.bullets) : pooja.bullets) : [];
    const packages = pooja.packages ? (typeof pooja.packages === 'string' ? JSON.parse(pooja.packages) : pooja.packages) : [];
    const faqs = pooja.faqs ? (typeof pooja.faqs === 'string' ? JSON.parse(pooja.faqs) : pooja.faqs) : [];
    const processSteps = pooja.processSteps ? (typeof pooja.processSteps === 'string' ? JSON.parse(pooja.processSteps) : pooja.processSteps) : [];

    const localizedDesc = descriptions[viewLanguage === 'en' ? 0 : viewLanguage === 'hi' ? 1 : 2] || descriptions[0] || '';
    const localizedBenefits = benefits[viewLanguage === 'en' ? 0 : viewLanguage === 'hi' ? 1 : 2] || benefits[0] || '';
    const localizedBullets = bullets[viewLanguage === 'en' ? 0 : viewLanguage === 'hi' ? 1 : 2] || bullets[0] || '';

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100 shrink-0">
                        <ArrowLeft className="w-5 h-5 text-[#7b4623]" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#7b4623]">{parseLocalizedValue(pooja.name, viewLanguage)}</h1>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                             Quick view of ritual details and pricing
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button 
                        onClick={() => router.push(`/mandals/dashboard/poojas/edit/${pooja.id}`)} 
                        className="flex-1 sm:flex-none bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-lg shadow-orange-900/20 rounded-xl px-6 h-11"
                    >
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Media Card */}
                    <Card className="overflow-hidden border-slate-100 rounded-3xl shadow-sm">
                        <div className="relative aspect-[21/9] w-full bg-slate-100">
                            <img 
                                src={getImageUrl(pooja.image)} 
                                alt={parseLocalizedValue(pooja.name, viewLanguage)} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <Badge className="bg-white/95 text-orange-800 hover:bg-white/100 border-none font-bold rounded-lg px-3 py-1 text-xs shadow-md">
                                    {parseLocalizedValue(pooja.category, viewLanguage)}
                                </Badge>
                                <Badge variant={pooja.status ? "success" : "destructive"} className="font-bold rounded-lg px-3 py-1 text-xs shadow-md">
                                    {pooja.status ? "Active" : "Paused"}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Language Selector and Details Tabs */}
                    <div className="flex items-center justify-between border-b pb-4">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Languages className="w-4 h-4" /> Multi-lingual Previews
                        </span>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                            {(['en', 'hi', 'mr'] as ViewLanguage[]).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setViewLanguage(l)}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${viewLanguage === l ? 'bg-white text-[#7b4623] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'मराठी'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Tabs defaultValue="about" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1 rounded-2xl h-12 border border-slate-100">
                            <TabsTrigger value="about" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-[#7b4623] data-[state=active]:shadow-sm">About & Details</TabsTrigger>
                            <TabsTrigger value="process" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-[#7b4623] data-[state=active]:shadow-sm">Process Steps</TabsTrigger>
                            <TabsTrigger value="faqs" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-[#7b4623] data-[state=active]:shadow-sm">FAQs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="about" className="space-y-6 mt-6">
                            <Card className="rounded-3xl border-slate-100/80 shadow-sm p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-orange-600" /> About this Seva
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                        {parseLocalizedValue(pooja.about, viewLanguage) || "No translation added."}
                                    </p>
                                </div>

                                {localizedDesc && localizedDesc.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-3">Ritual Description</h3>
                                        <ul className="space-y-2">
                                            {localizedDesc.map((desc: string, idx: number) => (
                                                <li key={idx} className="text-slate-600 text-sm flex items-start gap-2">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                                                    <span>{desc}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {localizedBenefits && localizedBenefits.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-3">Benefits of Pooja</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {localizedBenefits.map((benefit: string, idx: number) => (
                                                <div key={idx} className="p-3 bg-green-50/50 border border-green-100/50 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2">
                                                    ✨ {benefit}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </TabsContent>

                        <TabsContent value="process" className="space-y-6 mt-6">
                            <Card className="rounded-3xl border-slate-100/80 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-[#7b4623] mb-4">Steps of Performance</h3>
                                {processSteps.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No specific steps defined for this ritual.</p>
                                ) : (
                                    <div className="relative border-l-2 border-orange-100 pl-6 ml-3 space-y-8">
                                        {processSteps.map((step: any, idx: number) => (
                                            <div key={idx} className="relative">
                                                <span className="absolute -left-[35px] top-0.5 bg-orange-500 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white">
                                                    {idx + 1}
                                                </span>
                                                <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                                                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{step.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </TabsContent>

                        <TabsContent value="faqs" className="space-y-6 mt-6">
                            <Card className="rounded-3xl border-slate-100/80 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Frequently Asked Questions</h3>
                                {faqs.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No FAQs added for this offering.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {faqs.map((faq: any, idx: number) => (
                                            <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                                                <h4 className="font-bold text-slate-800 text-sm">Q: {faq.question}</h4>
                                                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">A: {faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Info Panels */}
                <div className="space-y-8">
                    {/* Price and Duration */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm p-6 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Starts From</p>
                                <h2 className="text-3xl font-serif font-black text-slate-900 mt-1 flex items-center">
                                    <IndianRupee className="w-6 h-6 mr-0.5 text-[#7b4623]" /> {pooja.price}
                                </h2>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Time/Duration</p>
                                <h3 className="text-sm font-bold text-slate-700 mt-2 flex items-center justify-end gap-1.5">
                                    <Clock className="w-4 h-4 text-orange-600" /> {parseLocalizedValue(pooja.duration, viewLanguage) || pooja.time}
                                </h3>
                            </div>
                        </div>



                        {/* Package Options */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5" /> Bookable Packages ({packages.length})
                            </h4>
                            {packages.length === 0 ? (
                                <p className="text-slate-500 text-xs">No specific package tiers configured.</p>
                            ) : (
                                <div className="space-y-2">
                                    {packages.map((pkg: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
                                            <div>
                                                <span className="font-bold text-slate-700">{pkg.name}</span>
                                                {pkg.description && (
                                                    <span className="block text-[10px] text-slate-400 mt-0.5">{pkg.description}</span>
                                                )}
                                            </div>
                                            <span className="font-extrabold text-slate-900">₹{pkg.price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Metadata summary */}
                    <Card className="rounded-3xl border-slate-100 shadow-sm p-6 space-y-4">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Summary</CardTitle>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Pooja ID</span>
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{pooja.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Slug URL</span>
                                <span className="font-semibold text-slate-700">{pooja.slug || "None"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Created At</span>
                                <span className="font-semibold text-slate-700">{new Date(pooja.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

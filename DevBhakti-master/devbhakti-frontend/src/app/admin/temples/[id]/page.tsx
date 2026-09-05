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
    ChevronRight,
    Package,
    Store,
    Video,
    ExternalLink as ExternalLinkIcon,
    Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useLanguage, Language } from "@/context/LanguageContext";
import { fetchAllTemplesAdmin, fetchCommissionSlabsAdmin, fetchProductsByTempleAdmin, toggleShowPhoneAdmin, toggleShowWebsiteAdmin } from "@/api/adminController";
import { API_URL } from "@/config/apiConfig";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stripHtml } from "@/utils/textUtils";

export default function ViewTemplePage() {
    const router = useRouter();
    const params = useParams();
    const instId = params.id as string;
    const [inst, setInst] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [marketplaceSlabs, setMarketplaceSlabs] = useState<any[]>([]);
    const [poojaSlabs, setPoojaSlabs] = useState<any[]>([]);
    const [donationSlabs, setDonationSlabs] = useState<any[]>([]);
    
    const [offlineMarketplaceSlabs, setOfflineMarketplaceSlabs] = useState<any[]>([]);
    const [offlinePoojaSlabs, setOfflinePoojaSlabs] = useState<any[]>([]);
    const [offlineDonationSlabs, setOfflineDonationSlabs] = useState<any[]>([]);

    const [isCustomMarketplace, setIsCustomMarketplace] = useState(false);
    const [isCustomPooja, setIsCustomPooja] = useState(false);
    const [isCustomDonation, setIsCustomDonation] = useState(false);

    const [isCustomOfflineMarketplace, setIsCustomOfflineMarketplace] = useState(false);
    const [isCustomOfflinePooja, setIsCustomOfflinePooja] = useState(false);
    const [isCustomOfflineDonation, setIsCustomOfflineDonation] = useState(false);

    const [commTab, setCommTab] = useState<"online" | "offline">("online");

    const [products, setProducts] = useState<any[]>([]);
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState<Language>("en");

    const handleTogglePhone = async (checked: boolean) => {
        try {
            await toggleShowPhoneAdmin(instId, checked);
            setInst({
                ...inst,
                temple: {
                    ...inst.temple,
                    showPhone: checked
                }
            });
        } catch (error) {
            console.error("Failed to toggle phone visibility", error);
            alert("Failed to update phone visibility.");
        }
    };

    const handleToggleWebsite = async (checked: boolean) => {
        try {
            await toggleShowWebsiteAdmin(instId, checked);
            setInst({
                ...inst,
                temple: {
                    ...inst.temple,
                    showWebsite: checked
                }
            });
        } catch (error) {
            console.error("Failed to toggle website visibility", error);
            alert("Failed to update website visibility.");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allInst = await fetchAllTemplesAdmin({ lang: 'raw' });
            const found = allInst.find((i: any) => i.id === instId);
            setInst(found);

            if (found) {
                const nameStr = found.temple?.name;
                let displayName = "Temple Details";
                
                if (nameStr) {
                    if (typeof nameStr === 'object') {
                        displayName = nameStr.en || nameStr.hi || nameStr.mr || "Temple Details";
                    } else if (typeof nameStr === 'string' && nameStr.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(nameStr);
                            displayName = parsed.en || parsed.hi || parsed.mr || nameStr;
                        } catch (e) {
                            displayName = nameStr;
                        }
                    } else {
                        displayName = String(nameStr);
                    }
                }
                
                window.dispatchEvent(new CustomEvent('updateBreadcrumb', { detail: displayName }));
            }

            if (found?.temple?.id) {
                const tId = found.temple.id;

                // Load Online Marketplace Slabs
                const mSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', tId, 'MARKETPLACE', false);
                if (mSlabsResponse.success && mSlabsResponse.data.length > 0) {
                    setMarketplaceSlabs(mSlabsResponse.data);
                    setIsCustomMarketplace(true);
                } else {
                    const globalM = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE', false);
                    if (globalM.success) setMarketplaceSlabs(globalM.data);
                    setIsCustomMarketplace(false);
                }

                // Load Offline Marketplace Slabs
                const omSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', tId, 'MARKETPLACE', true);
                if (omSlabsResponse.success && omSlabsResponse.data.length > 0) {
                    setOfflineMarketplaceSlabs(omSlabsResponse.data);
                    setIsCustomOfflineMarketplace(true);
                } else {
                    const globalOM = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE', true);
                    if (globalOM.success) setOfflineMarketplaceSlabs(globalOM.data);
                    setIsCustomOfflineMarketplace(false);
                }

                // Load Online Pooja Slabs
                const pSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', tId, 'POOJA', false);
                if (pSlabsResponse.success && pSlabsResponse.data.length > 0) {
                    setPoojaSlabs(pSlabsResponse.data);
                    setIsCustomPooja(true);
                } else {
                    const globalP = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA', false);
                    if (globalP.success) setPoojaSlabs(globalP.data);
                    setIsCustomPooja(false);
                }

                // Load Offline Pooja Slabs
                const opSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', tId, 'POOJA', true);
                if (opSlabsResponse.success && opSlabsResponse.data.length > 0) {
                    setOfflinePoojaSlabs(opSlabsResponse.data);
                    setIsCustomOfflinePooja(true);
                } else {
                    const globalOP = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA', true);
                    if (globalOP.success) setOfflinePoojaSlabs(globalOP.data);
                    setIsCustomOfflinePooja(false);
                }

                // Load Online Donation Slabs
                const dSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', tId, 'DONATION', false);
                if (dSlabsResponse.success && dSlabsResponse.data.length > 0) {
                    setDonationSlabs(dSlabsResponse.data);
                    setIsCustomDonation(true);
                } else {
                    const globalD = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'DONATION', false);
                    if (globalD.success) setDonationSlabs(globalD.data);
                    setIsCustomDonation(false);
                }

                // Load Offline Donation Slabs
                const odSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', tId, 'DONATION', true);
                if (odSlabsResponse.success && odSlabsResponse.data.length > 0) {
                    setOfflineDonationSlabs(odSlabsResponse.data);
                    setIsCustomOfflineDonation(true);
                } else {
                    const globalOD = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'DONATION', true);
                    if (globalOD.success) setOfflineDonationSlabs(globalOD.data);
                    setIsCustomOfflineDonation(false);
                }

                // Load Products
                const templeProducts = await fetchProductsByTempleAdmin(found.temple.id);
                setProducts(templeProducts || []);
            }
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

    // Safe multilingual extractor WITHOUT fallback (used inside tab content)
    // defined here so it's fresh for every render with current 'language'
    const parseL = (field: any, lang: string = "en"): string => {
        if (!field) return "";
        if (typeof field === "object") return field[lang] || field.en || field.hi || field.mr || "";
        try {
            const parsed = JSON.parse(field);
            if (typeof parsed === "object" && parsed !== null) {
                return parsed[lang] || parsed.en || parsed.hi || parsed.mr || "";
            }
        } catch (e) { /* plain string */ }
        return field;
    };

    const parseLStrict = (field: any, lang: string): string => {
        if (!field) return "";
        if (typeof field === "object") return field[lang] || "";
        try {
            const parsed = JSON.parse(field);
            if (typeof parsed === "object" && parsed !== null) {
                return parsed[lang] || "";
            }
        } catch (e) { /* plain string */ }
        return lang === "en" ? field : "";
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!inst) return <div className="text-center py-20">Temple not found.</div>;

    const temple = inst.temple;
    
    // Extract localized values based on global language (for header/title only)
    const name = parseL(temple?.name, language);
    const category = parseL(temple?.category, language);
    const location = parseL(temple?.location, language);
    const description = parseL(temple?.description, language);
    const history = parseL(temple?.history, language);
    const fullAddress = parseL(temple?.fullAddress, language);
    const adminName = parseL(inst.name, language);

    const extractYoutubeId = (url: string): string | null => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
        return match ? match[1] : null;
    };

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
                                    <Badge className="bg-primary hover:bg-primary border-none">{category}</Badge>
                                    {temple?.liveStatus && <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none">Verified Live</Badge>}
                                </div>
                                <h1 className="text-4xl font-bold text-slate-800 font-serif">{name}</h1>
                                <div className="flex items-center justify-center md:justify-start text-slate-500 gap-4 text-sm mt-1">
                                    <span className="flex items-center gap-1 font-medium"><MapPin className="w-4 h-4 text-primary" /> {location}</span>
                                    <span className="flex items-center gap-1 font-medium"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {temple?.rating} ({temple?.reviewsCount} reviews)</span>
                                </div>
                            </div>
                        </div>
                    <div className="pb-4 flex justify-center w-full md:w-auto gap-3">
    {/* View Ledger Button - USE temple?.id */}
    <Button 
        onClick={() => router.push(`/admin/finance/merchant/${temple?.id}`)} 
        variant="outline" 
        className="bg-primary text-white border-primary shadow-md hover:bg-primary hover:text-white transition-none">
        <History className="w-4 h-4 mr-2" />
        View Ledger
    </Button>
    
    {/* Edit Profile Button - USE instId */}
    <Button 
        onClick={() => router.push(`/admin/temples/edit/${instId}`)} 
        variant="sacred" 
        className="bg-primary text-white shadow-md hover:bg-primary/90"
    >
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Profile
    </Button>
</div>
                    </div>
                </div>
            </div>
            
            {/* Multilingual View Switcher */}
            <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 px-2 text-slate-500 font-bold text-sm">
                    <Languages className="w-4 h-4" /> Localized Content View
                </div>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Language)} className="w-auto">
                    <TabsList className="bg-white border">
                        <TabsTrigger value="en">English</TabsTrigger>
                        <TabsTrigger value="hi">हिंदी</TabsTrigger>
                        <TabsTrigger value="mr">मराठी</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Detailed Info with Tabs Support */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Language)} className="w-full">
                        {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                            <TabsContent key={l} value={l} className="space-y-8 mt-0">
                                {/* Display Name Preview Card */}
                                <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-r from-orange-50/50 to-transparent">
                                    <CardContent className="p-6">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Display Name ({l.toUpperCase()})</h3>
                                        <h2 className="text-2xl font-bold text-slate-800 font-serif">
                                            {parseLStrict(temple?.name, l) || (
                                                <span className="text-slate-400 italic text-base font-normal">No translation available for {l.toUpperCase()}</span>
                                            )}
                                        </h2>
                                    </CardContent>
                                </Card>

                                {/* About & Description */}
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-4">
                                            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                                <FileText className="w-6 h-6 text-primary" />
                                                Temple Overview ({l.toUpperCase()})
                                            </h2>
                                            {parseLStrict(temple?.description, l) ? (
                                                <div
                                                    className="prose prose-sm max-w-none text-slate-600 leading-relaxed border-l-4 border-primary/20 pl-4
                                                        prose-headings:text-slate-800 prose-headings:font-bold
                                                        prose-strong:text-slate-900 prose-p:text-slate-600
                                                        prose-ul:text-slate-600 prose-ol:text-slate-600
                                                        prose-blockquote:border-l-[#88542b] prose-blockquote:text-slate-500"
                                                    dangerouslySetInnerHTML={{ __html: parseLStrict(temple?.description, l) }}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200">
                                                    <span className="text-xs text-slate-400 italic">No description available in {l.toUpperCase()}. Please add a translation in the Edit form.</span>
                                                </div>
                                            )}
                                        </div>

                                        {parseLStrict(temple?.history, l) && (
                                            <div className="space-y-4 pt-4 border-t">
                                                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                                    <History className="w-6 h-6 text-primary" />
                                                    Spiritual History ({l.toUpperCase()})
                                                </h2>
                                                <div
                                                    className="prose prose-sm max-w-none text-slate-600 leading-relaxed
                                                        prose-headings:text-slate-800 prose-headings:font-bold
                                                        prose-strong:text-slate-900 prose-p:text-slate-600
                                                        prose-ul:text-slate-600 prose-ol:text-slate-600
                                                        prose-blockquote:border-l-[#88542b] prose-blockquote:text-slate-500"
                                                    dangerouslySetInnerHTML={{ __html: parseLStrict(temple?.history, l) }}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* Left Column - Details (Remaining Non-Tabs Sections) */}

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
                                            <span className="font-bold text-slate-800">{parseL(p.name, activeTab)}</span>
                                            {p.duration && <span className="text-sm text-slate-500">{p.duration}</span>}
                                        </div>
                                        <Badge variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">₹{p.price}</Badge>
                                    </div>
                                ))}
                                {(!temple?.poojas || temple.poojas.length === 0) && <p className="text-muted-foreground text-sm col-span-2">No poojas linked yet.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Products Offered */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                <Package className="w-6 h-6 text-primary" />
                                Products Offered
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {products?.map((p: any) => (
                                    <div key={p.id} className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between group hover:border-primary transition-all">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{parseL(p.name, activeTab)}</span>
                                        </div>
                                        <Badge variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors">
                                            ₹{p.variants?.[0]?.price || 0}
                                        </Badge>
                                    </div>
                                ))}
                                {(!products || products.length === 0) && <p className="text-muted-foreground text-sm col-span-2">No products linked yet.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Commission Slabs */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                <History className="w-6 h-6 text-primary" />
                                Commission Slabs
                            </h2>

                            {/* Online / Offline Tab Selector */}
                            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCommTab("online")}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        commTab === "online" 
                                            ? "bg-white text-slate-900 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    🌐 Online Commission
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCommTab("offline")}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        commTab === "offline" 
                                            ? "bg-white text-slate-900 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-900"
                                    }`}
                                >
                                    🏢 Offline Commission
                                </button>
                            </div>
                        </div>

                        {commTab === "online" ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Online Pooja Slabs */}
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="font-bold text-base text-slate-800 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-orange-600" />
                                                Pooja Booking
                                            </span>
                                            <Badge variant={isCustomPooja ? 'default' : 'outline'} className="text-[9px] uppercase">
                                                {isCustomPooja ? 'Custom' : 'Global Default'}
                                            </Badge>
                                        </h3>
                                        {poojaSlabs.length > 0 ? (
                                            <div className="rounded-lg border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow>
                                                            <TableHead className="text-[10px] uppercase font-bold">Range (₹)</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">Fee</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {poojaSlabs.sort((a, b) => a.minAmount - b.minAmount).map((slab, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-xs font-medium">
                                                                    ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : "∞"}
                                                                </TableCell>
                                                                <TableCell className="text-xs">₹{slab.platformFee ?? 0}</TableCell>
                                                                <TableCell className="text-xs">{slab.percentage ?? 0}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">No slabs configured.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Online Marketplace Slabs */}
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="font-bold text-base text-slate-800 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Store className="w-4 h-4 text-blue-600" />
                                                Marketplace
                                            </span>
                                            <Badge variant={isCustomMarketplace ? 'default' : 'outline'} className="text-[9px] uppercase">
                                                {isCustomMarketplace ? 'Custom' : 'Global Default'}
                                            </Badge>
                                        </h3>
                                        {marketplaceSlabs.length > 0 ? (
                                            <div className="rounded-lg border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow>
                                                            <TableHead className="text-[10px] uppercase font-bold">Range (₹)</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">Fee</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {marketplaceSlabs.sort((a, b) => a.minAmount - b.minAmount).map((slab, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-xs font-medium">
                                                                    ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : "∞"}
                                                                </TableCell>
                                                                <TableCell className="text-xs">₹{slab.platformFee ?? 0}</TableCell>
                                                                <TableCell className="text-xs">{slab.percentage ?? 0}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">No slabs configured.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Online Donation Slabs */}
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="font-bold text-base text-slate-800 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-emerald-600" />
                                                Donation
                                            </span>
                                            <Badge variant={isCustomDonation ? 'default' : 'outline'} className="text-[9px] uppercase">
                                                {isCustomDonation ? 'Custom' : 'Global Default'}
                                            </Badge>
                                        </h3>
                                        {donationSlabs.length > 0 ? (
                                            <div className="rounded-lg border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow>
                                                            <TableHead className="text-[10px] uppercase font-bold">Range (₹)</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">Fee</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {donationSlabs.sort((a, b) => a.minAmount - b.minAmount).map((slab, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-xs font-medium">
                                                                    ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : "∞"}
                                                                </TableCell>
                                                                <TableCell className="text-xs">₹{slab.platformFee ?? 0}</TableCell>
                                                                <TableCell className="text-xs">{slab.percentage ?? 0}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">No slabs configured.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Offline Pooja Slabs */}
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="font-bold text-base text-slate-800 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-orange-600" />
                                                Offline Pooja Booking
                                            </span>
                                            <Badge variant={isCustomOfflinePooja ? 'default' : 'outline'} className="text-[9px] uppercase">
                                                {isCustomOfflinePooja ? 'Custom' : 'Global Default'}
                                            </Badge>
                                        </h3>
                                        {offlinePoojaSlabs.length > 0 ? (
                                            <div className="rounded-lg border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow>
                                                            <TableHead className="text-[10px] uppercase font-bold">Range (₹)</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">Fee</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {offlinePoojaSlabs.sort((a, b) => a.minAmount - b.minAmount).map((slab, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-xs font-medium">
                                                                    ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : "∞"}
                                                                </TableCell>
                                                                <TableCell className="text-xs">₹{slab.platformFee ?? 0}</TableCell>
                                                                <TableCell className="text-xs">{slab.percentage ?? 0}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">No slabs configured.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Offline Marketplace Slabs */}
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="font-bold text-base text-slate-800 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Store className="w-4 h-4 text-blue-600" />
                                                Offline Marketplace
                                            </span>
                                            <Badge variant={isCustomOfflineMarketplace ? 'default' : 'outline'} className="text-[9px] uppercase">
                                                {isCustomOfflineMarketplace ? 'Custom' : 'Global Default'}
                                            </Badge>
                                        </h3>
                                        {offlineMarketplaceSlabs.length > 0 ? (
                                            <div className="rounded-lg border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow>
                                                            <TableHead className="text-[10px] uppercase font-bold">Range (₹)</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">Fee</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {offlineMarketplaceSlabs.sort((a, b) => a.minAmount - b.minAmount).map((slab, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-xs font-medium">
                                                                    ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : "∞"}
                                                                </TableCell>
                                                                <TableCell className="text-xs">₹{slab.platformFee ?? 0}</TableCell>
                                                                <TableCell className="text-xs">{slab.percentage ?? 0}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">No slabs configured.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Offline Donation Slabs */}
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="font-bold text-base text-slate-800 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-emerald-600" />
                                                Offline Donation
                                            </span>
                                            <Badge variant={isCustomOfflineDonation ? 'default' : 'outline'} className="text-[9px] uppercase">
                                                {isCustomOfflineDonation ? 'Custom' : 'Global Default'}
                                            </Badge>
                                        </h3>
                                        {offlineDonationSlabs.length > 0 ? (
                                            <div className="rounded-lg border overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow>
                                                            <TableHead className="text-[10px] uppercase font-bold">Range (₹)</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">Fee</TableHead>
                                                            <TableHead className="text-[10px] uppercase font-bold">%</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {offlineDonationSlabs.sort((a, b) => a.minAmount - b.minAmount).map((slab, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-xs font-medium">
                                                                    ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : "∞"}
                                                                </TableCell>
                                                                <TableCell className="text-xs">₹{slab.platformFee ?? 0}</TableCell>
                                                                <TableCell className="text-xs">{slab.percentage ?? 0}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">No slabs configured.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Festivals & Events */}
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
                                            <span className="text-xs font-bold uppercase">{ev.date?.split(' ')[0]}</span>
                                            <span className="text-xl font-bold">{ev.date?.split(' ')[1]?.replace(',', '') || ev.date}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{parseL(ev.name, activeTab)}</h4>
                                            <p className="text-sm text-slate-500">{stripHtml(parseL(ev.description, activeTab)) || "Divine celebration at the temple."}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!temple?.events || temple.events.length === 0) && <p className="text-muted-foreground text-sm">No events scheduled.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* YouTube Videos Section */}
                    {temple?.youtubeLinks && temple.youtubeLinks.length > 0 && (
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-8 space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                    <Video className="w-6 h-6 text-red-600" />
                                    Sacred Video Gallery
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {temple.youtubeLinks.map((link: string, idx: number) => {
                                        const videoId = extractYoutubeId(link);
                                        if (!videoId) return null;
                                        return (
                                            <div key={idx} className="group relative">
                                                <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md border-2 border-white transition-all hover:shadow-xl hover:scale-[1.02] bg-black">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                        title={`Temple video ${idx + 1}`}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                                                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Sidebar Info */}
                <div className="space-y-6">
                    {/* Key Info Card */}
                    <Card className="border-none shadow-sm bg-slate-50">
                        <CardContent className="p-6 space-y-6">
                            <h3 className="font-bold text-slate-900 border-b pb-2">Temple Details</h3>

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
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Operating Hours</p>
                                        <div className="space-y-1 mt-1">
                                            {temple?.operatingHours && Array.isArray(temple.operatingHours) && temple.operatingHours.filter((s: any) => s.active).length > 0 ? (
                                                temple.operatingHours.filter((s: any) => s.active).map((slot: any, idx: number) => (
                                                    <div key={idx} className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{slot.label}</span>
                                                        <span className="text-sm font-semibold text-slate-900">{slot.start} - {slot.end}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm font-semibold">{temple?.openTime || "N/A"}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-primary mt-1" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Full Address</p>
                                        <p className="text-sm font-semibold">{fullAddress || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                {temple?.website && (
                                    <div className="flex items-center justify-between text-sm text-slate-600">
                                        <a href={temple.website} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                            <Globe className="w-4 h-4" /> Official Website <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Visible</span>
                                            <Switch 
                                                checked={temple.showWebsite ?? true} 
                                                onCheckedChange={handleToggleWebsite} 
                                            />
                                        </div>
                                    </div>
                                )}
                                {temple?.mapUrl && (
                                    <a href={temple.mapUrl} target="_blank" className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                                        <MapPin className="w-4 h-4" /> Open in Google Maps <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                <div className="flex items-center justify-between text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> {temple?.phone || "No Contact"}
                                    </div>
                                    {temple?.phone && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Visible</span>
                                            <Switch 
                                                checked={temple.showPhone ?? true} 
                                                onCheckedChange={handleTogglePhone} 
                                            />
                                        </div>
                                    )}
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
                                <p className="text-sm font-bold">{adminName}</p>
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

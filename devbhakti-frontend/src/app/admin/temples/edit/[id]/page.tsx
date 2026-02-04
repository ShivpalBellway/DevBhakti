"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    Trash2,
    Calendar,
    Image as ImageIcon,
    Layout,
    Building2,
    MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    updateTempleAdmin,
    fetchAllTemplesAdmin,
    fetchAllPoojasAdmin,
    fetchCommissionSlabsAdmin
} from "@/api/adminController";
import { API_URL } from "@/config/apiConfig";

export default function EditTemplePage() {
    const router = useRouter();
    const params = useParams();
    const instId = params.id as string;
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [allPoojas, setAllPoojas] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        templeName: "",
        location: "",
        fullAddress: "",
        category: "",
        openTime: "",
        description: "",
        history: "",
        viewers: "",
        templePhone: "",
        website: "",
        mapUrl: "",
        rating: "0",
        reviewsCount: "0",
        slug: "",
        subdomain: "",
        urlType: "slug",
        liveStatus: "false",
        productCommissionRate: "10.0",
        poojaCommissionRate: "5.0"
    });

    // relationships and slabs
    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [inlineEvents, setInlineEvents] = useState<any[]>([]);
    const [marketplaceSlabs, setMarketplaceSlabs] = useState<any[]>([]);
    const [poojaSlabs, setPoojaSlabs] = useState<any[]>([]);

    // Images State
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>("");
    const [existingMainImage, setExistingMainImage] = useState<string>("");

    const [heroImages, setHeroImages] = useState<File[]>([]);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
    const [existingHeroImages, setExistingHeroImages] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsFetching(true);
        try {
            // Load master poojas for selection
            const poojasResponse = await fetchAllPoojasAdmin({ isMaster: true });
            setAllPoojas(poojasResponse);

            // Load temple account data
            const allInst = await fetchAllTemplesAdmin();
            const inst = allInst.find((i: any) => i.id === instId);

            if (inst) {
                setFormData({
                    name: inst.name || "",
                    email: inst.email || "",
                    phone: inst.phone || "",
                    templeName: inst.temple?.name || "",
                    location: inst.temple?.location || "",
                    fullAddress: inst.temple?.fullAddress || "",
                    category: inst.temple?.category || "",
                    openTime: inst.temple?.openTime || "",
                    description: inst.temple?.description || "",
                    history: inst.temple?.history || "",
                    viewers: inst.temple?.viewers || "",
                    templePhone: inst.temple?.phone || "",
                    website: inst.temple?.website || "",
                    mapUrl: inst.temple?.mapUrl || "",
                    rating: String(inst.temple?.rating || "0"),
                    reviewsCount: String(inst.temple?.reviewsCount || "0"),
                    slug: inst.temple?.slug || "",
                    subdomain: inst.temple?.subdomain || "",
                    urlType: inst.temple?.urlType || "slug",
                    liveStatus: String(inst.temple?.liveStatus || "false"),
                    productCommissionRate: String(inst.temple?.productCommissionRate || "10.0"),
                    poojaCommissionRate: String(inst.temple?.poojaCommissionRate || "5.0")
                });

                setExistingMainImage(inst.temple?.image || "");
                setExistingHeroImages(inst.temple?.heroImages || []);

                if (inst.temple?.poojas) {
                    setSelectedPoojaIds(inst.temple.poojas.map((p: any) => p.id));
                }

                if (inst.temple?.events) {
                    setInlineEvents(inst.temple.events.map((ev: any) => ({
                        name: ev.name,
                        date: ev.date,
                        description: ev.description || ""
                    })));
                }

                // Fetch existing slabs for this temple
                if (inst.temple?.id) {
                    try {
                        // Load Marketplace Slabs
                        const mSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', inst.temple.id, 'MARKETPLACE');
                        if (mSlabsResponse.success && mSlabsResponse.data?.length > 0) {
                            setMarketplaceSlabs(mSlabsResponse.data);
                        } else {
                            // Fallback to Global Marketplace structure
                            const globalMSlabs = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE');
                            if (globalMSlabs.success) setMarketplaceSlabs(globalMSlabs.data);
                        }

                        // Load Pooja Slabs
                        const pSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', inst.temple.id, 'POOJA');
                        if (pSlabsResponse.success && pSlabsResponse.data?.length > 0) {
                            setPoojaSlabs(pSlabsResponse.data);
                        } else {
                            // Fallback to Global Pooja structure
                            const globalPSlabs = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA');
                            if (globalPSlabs.success) setPoojaSlabs(globalPSlabs.data);
                        }
                    } catch (slabErr) {
                        console.error("Error fetching slabs:", slabErr);
                    }
                }
            }
        } catch (error) {
            console.error("Final load error:", error);
            toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
        } finally {
            setIsFetching(false);
        }
    };

    const getFullImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    // Handlers
    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMainImage(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setHeroImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setHeroPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeHeroImage = (index: number, isExisting: boolean) => {
        if (isExisting) {
            setExistingHeroImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setHeroImages(prev => prev.filter((_, i) => i !== index));
            setHeroPreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const togglePooja = (id: string) => {
        setSelectedPoojaIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleRemoveMarketplaceSlab = (index: number) => {
        setMarketplaceSlabs(marketplaceSlabs.filter((_, i) => i !== index));
    };

    const handleRemovePoojaSlab = (index: number) => {
        setPoojaSlabs(poojaSlabs.filter((_, i) => i !== index));
    };

    const handleMarketplaceSlabChange = (index: number, field: string, value: any) => {
        const newSlabs = [...marketplaceSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setMarketplaceSlabs(newSlabs);
    };

    const handlePoojaSlabChange = (index: number, field: string, value: any) => {
        const newSlabs = [...poojaSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setPoojaSlabs(newSlabs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                fd.append(key, value);
            });

            fd.append("poojaIds", JSON.stringify(selectedPoojaIds));
            fd.append("inlineEvents", JSON.stringify(inlineEvents));

            // Combine both slab types for backend
            const combinedSlabs = [
                ...marketplaceSlabs.map(s => ({ ...s, category: 'MARKETPLACE' })),
                ...poojaSlabs.map(s => ({ ...s, category: 'POOJA' }))
            ];
            fd.append("commissionSlabs", JSON.stringify(combinedSlabs));

            if (mainImage) fd.append("image", mainImage);
            heroImages.forEach(file => {
                fd.append("heroImages", file);
            });
            fd.append("existingHeroImages", JSON.stringify(existingHeroImages));

            await updateTempleAdmin(instId, fd);
            toast({ title: "Success", description: "Temple updated successfully" });
            router.push('/admin/temples');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update temple",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Edit Temple</h1>
                    <p className="text-muted-foreground">Modify administrator account and temple profile details.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Account Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Layout className="w-5 h-5" />
                        <h2 className="text-xl">Account Identity</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Owner Name *</label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email</label>
                            <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Phone *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold border-r border-slate-300 pr-2">+91</span>
                                <Input
                                    type="tel"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setFormData({ ...formData, phone: val });
                                    }}
                                    placeholder="Enter 10-digit number"
                                    className="pl-14"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Temple Profile */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Building2 className="w-5 h-5" />
                        <h2 className="text-xl">Temple Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Temple Name *</label>
                            <Input value={formData.templeName} onChange={e => setFormData({ ...formData, templeName: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Location *</label>
                            <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Category *</label>
                            <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Operating Hours</label>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 max-w-[140px]">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={formData.openTime.split(' - ')[0]?.replace(' AM', '') || ''}
                                        onChange={e => {
                                            const amTime = e.target.value;
                                            const pmTime = formData.openTime.split(' - ')[1] || '11 PM';
                                            setFormData({ ...formData, openTime: `${amTime} AM - ${pmTime}` });
                                        }}
                                        placeholder="6"
                                        className="text-center w-16"
                                    />
                                    <span className="text-sm font-bold text-slate-600 whitespace-nowrap">AM</span>
                                </div>
                                <span className="text-slate-400 font-bold">to</span>
                                <div className="flex items-center gap-2 max-w-[140px]">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={formData.openTime.split(' - ')[1]?.replace(' PM', '') || ''}
                                        onChange={e => {
                                            const pmTime = e.target.value;
                                            const amTime = formData.openTime.split(' - ')[0] || '6 AM';
                                            setFormData({ ...formData, openTime: `${amTime} - ${pmTime} PM` });
                                        }}
                                        placeholder="10"
                                        className="text-center w-16"
                                    />
                                    <span className="text-sm font-bold text-slate-600 whitespace-nowrap">PM</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">Example: 6 AM to 10 PM</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Viewers Count</label>
                            <Input value={formData.viewers} onChange={e => setFormData({ ...formData, viewers: e.target.value })} />
                        </div>

                        {/* URL Configuration Section */}
                        <div className="space-y-4 md:col-span-2 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">🌐 Public URL Configuration</label>

                            {/* URL Type Selection */}
                            <div className="flex items-center gap-6 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="urlType"
                                        value="slug"
                                        checked={formData.urlType === "slug"}
                                        onChange={e => setFormData({ ...formData, urlType: e.target.value })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Path-based URL</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="urlType"
                                        value="subdomain"
                                        checked={formData.urlType === "subdomain"}
                                        onChange={e => setFormData({ ...formData, urlType: e.target.value })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Subdomain URL</span>
                                </label>
                            </div>

                            {/* Slug Field (Path-based) */}
                            {formData.urlType === "slug" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">URL Slug *</label>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-l-md border border-r-0 font-mono">devbhakti.in/temples/</span>
                                        <Input
                                            value={formData.slug}
                                            onChange={e => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                setFormData({ ...formData, slug: val, subdomain: val });
                                            }}
                                            placeholder="kashi-vishwanath"
                                            className="rounded-l-none font-mono"
                                            required={formData.urlType === "slug"}
                                        />
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                                        <p className="text-xs text-slate-500 mb-1">Preview:</p>
                                        <p className="text-sm font-mono text-blue-600">
                                            https://devbhakti.in/temples/{formData.slug || "your-temple-slug"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Subdomain Field */}
                            {formData.urlType === "subdomain" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Subdomain *</label>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            value={formData.subdomain}
                                            onChange={e => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                setFormData({ ...formData, subdomain: val, slug: val });
                                            }}
                                            placeholder="kashi-vishwanath"
                                            className="rounded-r-none font-mono"
                                            required={formData.urlType === "subdomain"}
                                        />
                                        <span className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-r-md border border-l-0 font-mono">.devbhakti.in</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                                        <p className="text-xs text-slate-500 mb-1">Preview:</p>
                                        <p className="text-sm font-mono text-blue-600">
                                            https://{formData.subdomain || "your-temple"}.devbhakti.in
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Address</label>
                        <Input value={formData.fullAddress} onChange={e => setFormData({ ...formData, fullAddress: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">History</label>
                        <Textarea value={formData.history} onChange={e => setFormData({ ...formData, history: e.target.value })} rows={3} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Description</label>
                        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                    </div>
                </div>

                {/* Media assets */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <ImageIcon className="w-5 h-5" />
                        <h2 className="text-xl">Media Assets</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700">Main Image</label>
                            <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer relative group">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMainImageChange} />
                                {(mainImagePreview || existingMainImage) ? (
                                    <div className="aspect-video rounded-lg overflow-hidden">
                                        <img src={mainImagePreview || getFullImageUrl(existingMainImage)} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="py-8 text-muted-foreground"><Upload className="w-10 h-10 mx-auto mb-2" /> Upload</div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700">Hero Banners</label>
                            <div className="grid grid-cols-3 gap-2">
                                {existingHeroImages.map((url, i) => (
                                    <div key={`ex-${i}`} className="relative aspect-square rounded-lg overflow-hidden border group">
                                        <img src={getFullImageUrl(url)} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeHeroImage(i, true)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1"><X className="w-3 h-3 text-destructive" /></button>
                                    </div>
                                ))}
                                {heroPreviews.map((url, i) => (
                                    <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border group border-blue-200">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeHeroImage(i, false)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1"><X className="w-3 h-3 text-destructive" /></button>
                                    </div>
                                ))}
                                <div className="border-2 border-dashed rounded-lg flex items-center justify-center aspect-square relative cursor-pointer">
                                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleHeroImagesChange} />
                                    <Plus className="w-6 h-6 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <MapPin className="w-5 h-5" />
                        <h2 className="text-xl">Contact & Online</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Temple Phone</label>
                            <Input value={formData.templePhone} onChange={e => setFormData({ ...formData, templePhone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Website</label>
                            <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Map URL</label>
                            <Input value={formData.mapUrl} onChange={e => setFormData({ ...formData, mapUrl: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Poojas Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Layout className="w-5 h-5 text-primary" /> Available Poojas</h2>
                    <div className="flex flex-wrap gap-2">
                        {allPoojas.map(pooja => (
                            <button
                                key={pooja.id}
                                type="button"
                                onClick={() => togglePooja(pooja.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedPoojaIds.includes(pooja.id)
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-600"
                                    }`}
                            >
                                {pooja.name} {selectedPoojaIds.includes(pooja.id) && "✓"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Financial Settings - REPLACED WITH SLABS */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Layout className="w-5 h-5" />
                        <h2 className="text-xl">Marketplace Commission Slabs</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">Define amount-based commission rates for Marketplace Products for this temple.</p>
                        </div>

                        {marketplaceSlabs.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-400">
                                Loading product slab structure...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {marketplaceSlabs.map((slab, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Min Amount</label>
                                            <Input
                                                type="number"
                                                value={slab.minAmount}
                                                readOnly
                                                className="h-9 bg-slate-100 cursor-not-allowed border-dashed"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Max Amount</label>
                                            <Input
                                                type="number"
                                                value={slab.maxAmount || ''}
                                                placeholder="∞"
                                                readOnly
                                                className="h-9 bg-slate-100 cursor-not-allowed border-dashed"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Fixed Fee (₹)</label>
                                            <Input
                                                type="number"
                                                value={slab.platformFee}
                                                onChange={e => handleMarketplaceSlabChange(index, 'platformFee', e.target.value)}
                                                className="h-9 text-[#794A05] font-bold bg-white border-primary/20 focus:border-primary shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Percentage (%)</label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={slab.percentage}
                                                onChange={e => handleMarketplaceSlabChange(index, 'percentage', e.target.value)}
                                                className="h-9 bg-white border-primary/20 focus:border-primary shadow-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMarketplaceSlab(index)}
                                            className="absolute -right-2 -top-2 bg-white rounded-full p-1 border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-xl">Pooja Booking Commission Slabs</h2>
                        </div>
                        <p className="text-sm text-slate-500">Define amount-based commission rates for Pooja Bookings for this temple.</p>

                        {poojaSlabs.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-400">
                                Loading pooja slab structure...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {poojaSlabs.map((slab, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100/50 relative group">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Min Amount</label>
                                            <Input
                                                type="number"
                                                value={slab.minAmount}
                                                readOnly
                                                className="h-9 bg-slate-100/50 cursor-not-allowed border-dashed"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Max Amount</label>
                                            <Input
                                                type="number"
                                                value={slab.maxAmount || ''}
                                                placeholder="∞"
                                                readOnly
                                                className="h-9 bg-slate-100/50 cursor-not-allowed border-dashed"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Fixed Fee (₹)</label>
                                            <Input
                                                type="number"
                                                value={slab.platformFee}
                                                onChange={e => handlePoojaSlabChange(index, 'platformFee', e.target.value)}
                                                className="h-9 text-[#794A05] font-bold bg-white border-primary/20 focus:border-primary shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400">Percentage (%)</label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={slab.percentage}
                                                onChange={e => handlePoojaSlabChange(index, 'percentage', e.target.value)}
                                                className="h-9 bg-white border-primary/20 focus:border-primary shadow-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePoojaSlab(index)}
                                            className="absolute -right-2 -top-2 bg-white rounded-full p-1 border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                    <input type="checkbox" checked={formData.liveStatus === "true"} onChange={e => setFormData({ ...formData, liveStatus: e.target.checked ? "true" : "false" })} className="w-5 h-5 rounded accent-emerald-600" />
                    <div>
                        <p className="text-sm font-bold text-emerald-900">Mark as Live & Verified</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t pb-10">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="px-12 bg-[#794A05] hover:bg-[#5d3804]">
                        {isLoading ? "Saving..." : "Update Temple Account"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

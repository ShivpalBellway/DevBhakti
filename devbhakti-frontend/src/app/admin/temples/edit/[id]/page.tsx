"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    MapPin,
    CheckCircle,
    ZoomIn,
    ZoomOut,
    Crop,
    Clock
} from "lucide-react";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
    updateTempleAdmin,
    fetchAllTemplesAdmin,
    fetchAllPoojasAdmin,
    createPoojaAdmin,
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
    const [newPoojaName, setNewPoojaName] = useState("");
    const [isAddingPooja, setIsAddingPooja] = useState(false);

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
        poojaCommissionRate: "5.0",
        operatingHours: [
            { label: "Morning", start: "07:00 AM", end: "01:00 PM", active: true },
            { label: "Evening", start: "05:00 PM", end: "10:00 PM", active: true }
        ],
    });

    // relationships and slabs
    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [inlineEvents, setInlineEvents] = useState<any[]>([]);
    const [marketplaceSlabs, setMarketplaceSlabs] = useState<any[]>([]);
    const [poojaSlabs, setPoojaSlabs] = useState<any[]>([]);

    // Rate Customization State
    const [marketplaceRateType, setMarketplaceRateType] = useState<"DEFAULT" | "CUSTOM">("DEFAULT");
    const [poojaRateType, setPoojaRateType] = useState<"DEFAULT" | "CUSTOM">("DEFAULT");

    // Images State
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>("");
    const [existingMainImage, setExistingMainImage] = useState<string>("");

    const [heroImages, setHeroImages] = useState<File[]>([]);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
    const [existingHeroImages, setExistingHeroImages] = useState<string[]>([]);

    // Crop State
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [cropType, setCropType] = useState<"main" | "hero">("main");
    const [cropTitle, setCropTitle] = useState("Edit Temple Image");
    const [initialAspect, setInitialAspect] = useState(16 / 9);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsFetching(true);
        try {
            // Load unique rituals (Masters + Standalones)
            const poojasResponse = await fetchAllPoojasAdmin();
            setAllPoojas(poojasResponse);

            // Load temple account data
            const allInst = await fetchAllTemplesAdmin();
            const inst = allInst.find((i: any) => i.id === instId);

            if (inst?.temple?.name) {
                window.dispatchEvent(new CustomEvent('updateBreadcrumb', { detail: `Edit ${inst.temple.name}` }));
            }

            if (inst) {
                const stripPrefix = (ph: string) => {
                    if (!ph) return "";
                    let clean = ph.replace(/\D/g, '');
                    if (clean.length === 12 && clean.startsWith('91')) return clean.substring(2);
                    return clean;
                };

                setFormData({
                    name: inst.name || "",
                    email: inst.email || "",
                    phone: stripPrefix(inst.phone || ""),
                    templeName: inst.temple?.name || "",
                    location: inst.temple?.location || "",
                    fullAddress: inst.temple?.fullAddress || "",
                    category: inst.temple?.category || "",
                    openTime: inst.temple?.openTime || "",
                    description: inst.temple?.description || "",
                    viewers: inst.temple?.viewers || "",

                    templePhone: stripPrefix(inst.temple?.phone || ""),
                    website: inst.temple?.website || "",
                    mapUrl: inst.temple?.mapUrl || "",
                    rating: String(inst.temple?.rating || "0"),
                    reviewsCount: String(inst.temple?.reviewsCount || "0"),
                    slug: inst.temple?.slug || "",
                    subdomain: inst.temple?.subdomain || "",
                    urlType: inst.temple?.urlType || "slug",
                    liveStatus: String(inst.temple?.liveStatus || "false"),
                    productCommissionRate: String(inst.temple?.productCommissionRate || "10.0"),
                    poojaCommissionRate: String(inst.temple?.poojaCommissionRate || "5.0"),
                    operatingHours: inst.temple?.operatingHours || [
                        { label: "Morning", start: "07:00 AM", end: "01:00 PM", active: true },
                        { label: "Evening", start: "05:00 PM", end: "10:00 PM", active: true }
                    ],
                });

                setExistingMainImage(inst.temple?.image || "");
                setExistingHeroImages(inst.temple?.heroImages || []);

                if (inst.temple?.poojas) {
                    setSelectedPoojaIds(inst.temple.poojas.map((p: any) => p.masterPoojaId || p.id));
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
                            const dedupe = (list: any[]) => list.filter((s, i, self) => i === self.findIndex(t => t.minAmount === s.minAmount));
                            setMarketplaceSlabs(dedupe(mSlabsResponse.data));
                            setMarketplaceRateType("CUSTOM");
                        } else {
                            // Fallback to Global Marketplace structure
                            const globalMSlabs = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE');
                            if (globalMSlabs.success) setMarketplaceSlabs(globalMSlabs.data);
                        }

                        // Load Pooja Slabs
                        const pSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', inst.temple.id, 'POOJA');
                        if (pSlabsResponse.success && pSlabsResponse.data?.length > 0) {
                            const dedupe = (list: any[]) => list.filter((s, i, self) => i === self.findIndex(t => t.minAmount === s.minAmount));
                            setPoojaSlabs(dedupe(pSlabsResponse.data));
                            setPoojaRateType("CUSTOM");
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

    const handleCropComplete = (croppedFile: File) => {
        if (cropType === "main") {
            setMainImage(croppedFile);
            setMainImagePreview(URL.createObjectURL(croppedFile));
        } else {
            setHeroImages(prev => [...prev, croppedFile]);
            setHeroPreviews(prev => [...prev, URL.createObjectURL(croppedFile)]);
        }
        setShowCropper(false);
        setTempImage(null);
    };

    // Handlers
    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB for initial upload (will be compressed after crop)

        if (file) {
            if (file.size > MAX_SIZE) {
                toast({
                    title: "File Too Large",
                    description: `Image "${file.name}" exceeds 5MB limit. Please select a smaller file.`,
                    variant: "destructive"
                });
                e.target.value = ''; // Reset input
                return;
            }

            // Open crop modal
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setCropType("main");
                setCropTitle("Adjust Temple Profile Image");
                setInitialAspect(16 / 9);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset input
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        if (files.length > 0) {
            const largeFiles = files.filter(f => f.size > MAX_SIZE);
            if (largeFiles.length > 0) {
                toast({
                    title: "Files Too Large",
                    description: `${largeFiles.length} file(s) exceed the 5MB limit. None of those were added.`,
                    variant: "destructive"
                });
            }

            const validFiles = files.filter(f => f.size <= MAX_SIZE);
            if (validFiles.length > 0) {
                // Process first valid file for cropping
                const reader = new FileReader();
                reader.onload = () => {
                    setTempImage(reader.result as string);
                    setCropType("hero");
                    setCropTitle("Adjust Temple Banner Image");
                    setInitialAspect(1920 / 800);
                    setShowCropper(true);
                };
                reader.readAsDataURL(validFiles[0]);
            }
            e.target.value = ''; // Reset input
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

    const handleAddNewPooja = async () => {
        if (!newPoojaName.trim()) return;
        setIsAddingPooja(true);
        try {
            const fd = new FormData();
            fd.append("name", newPoojaName.trim());
            fd.append("isMaster", "true");
            fd.append("category", "General"); // Default category
            fd.append("price", "0");
            fd.append("status", "APPROVED");

            const res = await createPoojaAdmin(fd);
            if (res.success || res.id) {
                toast({ title: "Success", description: "New pooja added to master list", variant: "success" });
                setNewPoojaName("");
                // Refresh poojas list
                const poojasResponse = await fetchAllPoojasAdmin({ isMaster: true });
                setAllPoojas(poojasResponse);

                // Automatically select the new pooja
                const newId = res.data?.id || res.id;
                if (newId) {
                    setSelectedPoojaIds(prev => [...prev, newId]);
                }
            }
        } catch (error) {
            console.error("Add pooja error:", error);
            toast({ title: "Error", description: "Failed to create new pooja", variant: "destructive" });
        } finally {
            setIsAddingPooja(false);
        }
    };

    const handleRemoveMarketplaceSlab = (index: number) => {
        setMarketplaceSlabs(marketplaceSlabs.filter((_, i) => i !== index));
    };

    const handleRemovePoojaSlab = (index: number) => {
        setPoojaSlabs(poojaSlabs.filter((_, i) => i !== index));
    };

    const handleMarketplaceSlabChange = (index: number, field: string, value: any) => {
        if (marketplaceRateType === "DEFAULT") return;
        const newSlabs = [...marketplaceSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setMarketplaceSlabs(newSlabs);
    };

    const handlePoojaSlabChange = (index: number, field: string, value: any) => {
        if (poojaRateType === "DEFAULT") return;
        const newSlabs = [...poojaSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setPoojaSlabs(newSlabs);
    };

    const handleMarketplaceRateTypeChange = async (checked: boolean) => {
        const newType = checked ? "CUSTOM" : "DEFAULT";
        setMarketplaceRateType(newType);

        if (newType === "DEFAULT") {
            try {
                const response = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE');
                if (response.success) {
                    setMarketplaceSlabs(response.data);
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to reset Marketplace rates", variant: "destructive" });
            }
        }
    };

    const handlePoojaRateTypeChange = async (checked: boolean) => {
        const newType = checked ? "CUSTOM" : "DEFAULT";
        setPoojaRateType(newType);

        if (newType === "DEFAULT") {
            try {
                const response = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA');
                if (response.success) {
                    setPoojaSlabs(response.data);
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to reset Pooja rates", variant: "destructive" });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Phone Number Validation
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            toast({
                title: "Invalid Phone Number",
                description: "Account phone must be exactly 10 digits.",
                variant: "destructive"
            });
            return;
        }

        // 2. Hero Images Count Validation (Existing + New)
        const totalHeroImages = existingHeroImages.length + heroImages.length;
        if (totalHeroImages > 5) {
            toast({
                title: "Too Many Banners",
                description: `Maximum 5 banners allowed. You have ${existingHeroImages.length} existing and added ${heroImages.length} new.`,
                variant: "destructive"
            });
            return;
        }

        // 3. Image Size Validation (Max 2MB for NEW uploads)
        const MAX_SIZE = 2 * 1024 * 1024;
        const newFiles = [
            ...(mainImage ? [mainImage] : []),
            ...heroImages
        ];

        for (const file of newFiles) {
            if (file.size > MAX_SIZE) {
                toast({
                    title: "File Too Large",
                    description: `Image "${file.name}" exceeds 2MB limit.`,
                    variant: "destructive"
                });
                return;
            }
        }

        setIsLoading(true);
        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    fd.append(key, JSON.stringify(value));
                } else {
                    fd.append(key, value as string);
                }
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
            toast({ title: "Success", description: "Temple updated successfully", variant: "success" });
            router.push('/admin/temples');
        } catch (error: any) {
            console.error("Update error detail:", error.response?.data);
            const errMsg = error.response?.data?.error || error.message || "Failed to update temple";
            toast({
                title: "Update Failed",
                description: errMsg,
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
        <>
            {/* Crop Modal */}
            {showCropper && tempImage && (
                <ImageCropper
                    image={tempImage}
                    title={cropTitle}
                    initialAspect={initialAspect}
                    lockAspect={true}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        setTempImage(null);
                    }}
                />
            )}

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
                                <label className="text-sm font-semibold text-slate-700">Trustee / Management Name *</label>
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
                                <label className="text-sm font-semibold text-slate-700">Primary Deity/God *</label>
                                <Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                            </div>
                            <div className="col-span-full space-y-4">
                                <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px] flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    Daily Operating Hours
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.operatingHours.map((slot, index) => {
                                        const updateTime = (type: 'start' | 'end', val: string) => {
                                            const newHours = [...formData.operatingHours];
                                            newHours[index][type] = val;
                                            setFormData({ ...formData, operatingHours: newHours });
                                        };

                                        return (
                                            <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 mr-4">
                                                        <Input
                                                            value={slot.label}
                                                            onChange={(e) => {
                                                                const newHours = [...formData.operatingHours];
                                                                newHours[index].label = e.target.value;
                                                                setFormData({ ...formData, operatingHours: newHours });
                                                            }}
                                                            className="h-7 py-0 px-2 text-xs font-bold text-primary border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary bg-transparent hover:bg-white transition-colors"
                                                            placeholder="Slot Name (e.g. Morning Aarti)"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={slot.active}
                                                            onChange={(e) => {
                                                                const newHours = [...formData.operatingHours];
                                                                newHours[index].active = e.target.checked;
                                                                setFormData({ ...formData, operatingHours: newHours });
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-xs font-medium text-slate-500">Active</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Opening</p>
                                                        <Input
                                                            value={slot.start}
                                                            onChange={(e) => updateTime('start', e.target.value)}
                                                            placeholder="07:00 AM"
                                                            className="h-9 border-slate-200 focus:border-primary rounded-lg text-xs"
                                                            disabled={!slot.active}
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Closing</p>
                                                        <Input
                                                            value={slot.end}
                                                            onChange={(e) => updateTime('end', e.target.value)}
                                                            placeholder="01:00 PM"
                                                            className="h-9 border-slate-200 focus:border-primary rounded-lg text-xs"
                                                            disabled={!slot.active}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Approx monthly visitor count</label>
                                <Input value={formData.viewers} onChange={e => setFormData({ ...formData, viewers: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Rating (0-5)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={formData.rating}
                                    onChange={e => setFormData({ ...formData, rating: e.target.value })}
                                    placeholder="4.5"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Total Reviews</label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.reviewsCount}
                                    onChange={e => setFormData({ ...formData, reviewsCount: e.target.value })}
                                    placeholder="100"
                                />
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

                        {/* <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">History</label>
                            <Textarea value={formData.history} onChange={e => setFormData({ ...formData, history: e.target.value })} rows={3} />
                        </div> */}

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
                                        <div className="aspect-[16/9] rounded-lg overflow-hidden">
                                            <img src={mainImagePreview || getFullImageUrl(existingMainImage)} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="py-8 text-muted-foreground">
                                            <Upload className="w-10 h-10 mx-auto mb-2" />
                                            <p className="font-bold">Upload Profile Image</p>
                                            <p className="text-[10px] uppercase font-bold tracking-widest mt-1">Aspect Ratio: 16:9 (1200x675 px)</p>
                                        </div>
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
                                    <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center aspect-square relative cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleHeroImagesChange} />
                                        <Plus className="w-6 h-6 text-muted-foreground" />
                                        <p className="text-[8px] font-bold uppercase mt-1">Add Banner</p>
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
                                <label className="text-sm font-semibold text-slate-700">Temple Contact Number</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold border-r border-slate-300 pr-2">+91</span>
                                    <Input
                                        type="tel"
                                        maxLength={10}
                                        value={formData.templePhone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, templePhone: val });
                                        }}
                                        placeholder="Enter 10-digit number"
                                        className="pl-14"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Website</label>
                                <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Map Location Link</label>
                                <Input value={formData.mapUrl} onChange={e => setFormData({ ...formData, mapUrl: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Poojas Section */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-dark" /> Available Poojas
                                </h2>
                                <p className="text-sm text-slate-500">Select which poojas this temple offers or add a new one to the master list.</p>
                            </div>

                            {/* <div className="flex items-center gap-2">
                                <Input
                                    placeholder="New Pooja Name..."
                                    value={newPoojaName}
                                    onChange={(e) => setNewPoojaName(e.target.value)}
                                    className="max-w-[200px] h-9"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAddNewPooja}
                                    disabled={isAddingPooja || !newPoojaName.trim()}
                                >
                                    {isAddingPooja ? "Adding..." : <><Plus className="w-4 h-4 mr-1" /> Add</>}
                                </Button>
                            </div> */}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                            {allPoojas.map(pooja => {
                                const isSelected = selectedPoojaIds.includes(pooja.id);
                                return (
                                    <div
                                        key={pooja.id}
                                        className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none group ${isSelected
                                            ? "bg-primary/5 border-primary shadow-sm"
                                            : "bg-white border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                                            }`}
                                        onClick={() => togglePooja(pooja.id)}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected
                                            ? "bg-primary border-primary text-white scale-110 shadow-sm"
                                            : "bg-white border-slate-200 group-hover:border-primary/30"
                                            }`}>
                                            {isSelected ? (
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-100 group-hover:bg-primary/20 transition-colors" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[13px] font-semibold truncate transition-colors ${isSelected ? "text-primary" : "text-slate-600"}`}>
                                                {pooja.name}
                                            </p>
                                            {pooja.temple?.name && (
                                                <p className="text-[10px] text-orange-600 font-medium truncate">
                                                    {pooja.temple.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {allPoojas.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed rounded-xl border-slate-200">
                                <p className="text-slate-400 text-sm italic">No poojas found in master list. Add your first one above.</p>
                            </div>
                        )}
                    </div>

                    {/* Financial Settings - REPLACED WITH SLABS */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Layout className="w-5 h-5" />
                                <h2 className="text-xl">Marketplace Commission Slabs</h2>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                                <Label className={`text-[10px] font-bold uppercase transition-colors ${marketplaceRateType === 'DEFAULT' ? 'text-primary' : 'text-slate-400'}`}>Default Rates</Label>
                                <Switch
                                    checked={marketplaceRateType === "CUSTOM"}
                                    onCheckedChange={handleMarketplaceRateTypeChange}
                                />
                                <Label className={`text-[10px] font-bold uppercase transition-colors ${marketplaceRateType === 'CUSTOM' ? 'text-primary' : 'text-slate-400'}`}>Custom Rates</Label>
                            </div>
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
                                                    disabled={marketplaceRateType === "DEFAULT"}
                                                    className={`h-9 font-bold shadow-sm ${marketplaceRateType === "DEFAULT" ? "bg-slate-100/50 cursor-not-allowed text-slate-500" : "text-[#794A05] bg-white border-primary/20 focus:border-primary"}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Percentage (%)</label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={slab.percentage}
                                                    onChange={e => handleMarketplaceSlabChange(index, 'percentage', e.target.value)}
                                                    disabled={marketplaceRateType === "DEFAULT"}
                                                    className={`h-9 shadow-sm ${marketplaceRateType === "DEFAULT" ? "bg-slate-100/50 cursor-not-allowed text-slate-500" : "bg-white border-primary/20 focus:border-primary"}`}
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
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Calendar className="w-5 h-5" />
                                    <h2 className="text-xl">Pooja Booking Commission Slabs</h2>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                                    <Label className={`text-[10px] font-bold uppercase transition-colors ${poojaRateType === 'DEFAULT' ? 'text-primary' : 'text-slate-400'}`}>Default Rates</Label>
                                    <Switch
                                        checked={poojaRateType === "CUSTOM"}
                                        onCheckedChange={handlePoojaRateTypeChange}
                                    />
                                    <Label className={`text-[10px] font-bold uppercase transition-colors ${poojaRateType === 'CUSTOM' ? 'text-primary' : 'text-slate-400'}`}>Custom Rates</Label>
                                </div>
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
                                                    disabled={poojaRateType === "DEFAULT"}
                                                    className={`h-9 font-bold shadow-sm ${poojaRateType === "DEFAULT" ? "bg-slate-100/50 cursor-not-allowed text-slate-500" : "text-[#794A05] bg-white border-primary/20 focus:border-primary"}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Percentage (%)</label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={slab.percentage}
                                                    onChange={e => handlePoojaSlabChange(index, 'percentage', e.target.value)}
                                                    disabled={poojaRateType === "DEFAULT"}
                                                    className={`h-9 shadow-sm ${poojaRateType === "DEFAULT" ? "bg-slate-100/50 cursor-not-allowed text-slate-500" : "bg-white border-primary/20 focus:border-primary"}`}
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
                    {/* <div className="flex items-center gap-3 p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                        <input type="checkbox" checked={formData.liveStatus === "true"} onChange={e => setFormData({ ...formData, liveStatus: e.target.checked ? "true" : "false" })} className="w-5 h-5 rounded accent-emerald-600" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Mark as Live & Verified</p>
                        </div>
                    </div> */}

                    <div className="flex justify-end gap-3 pt-6 border-t pb-10">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="px-12 bg-[#794A05] hover:bg-[#5d3804]">
                            {isLoading ? "Saving..." : "Update Temple Account"}
                        </Button>
                    </div>
                </form>
            </div >
        </>
    );
}

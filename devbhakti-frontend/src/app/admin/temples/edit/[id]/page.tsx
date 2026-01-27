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
import { useToast } from "@/hooks/use-toast";
import {
    updateTempleAdmin,
    fetchAllTemplesAdmin,
    fetchAllPoojasAdmin
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
        liveStatus: "false"
    });

    // Relationships State
    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [inlineEvents, setInlineEvents] = useState<any[]>([]);

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
            // Load poojas for selection
            const poojasData = await fetchAllPoojasAdmin();
            setAllPoojas(poojasData);

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
                    liveStatus: String(inst.temple?.liveStatus || "false")
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
            }
        } catch (error) {
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

    const addEvent = () => {
        setInlineEvents(prev => [...prev, { name: "", date: "", description: "" }]);
    };

    const removeEvent = (index: number) => {
        setInlineEvents(prev => prev.filter((_, i) => i !== index));
    };

    const updateEvent = (index: number, field: string, value: string) => {
        setInlineEvents(prev => {
            const newEvents = [...prev];
            newEvents[index] = { ...newEvents[index], [field]: value };
            return newEvents;
        });
    };

    const togglePooja = (id: string) => {
        setSelectedPoojaIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
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
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
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
                            <label className="text-sm font-semibold text-slate-700">Open Time</label>
                            <Input value={formData.openTime} onChange={e => setFormData({ ...formData, openTime: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Viewers Count</label>
                            <Input value={formData.viewers} onChange={e => setFormData({ ...formData, viewers: e.target.value })} />
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

                {/* Events Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Upcoming Events</h2>
                        <Button type="button" variant="outline" size="sm" onClick={addEvent}><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
                    </div>
                    <div className="space-y-4">
                        {inlineEvents.map((ev, i) => (
                            <div key={i} className="p-4 border rounded-xl bg-slate-50 relative">
                                <button type="button" onClick={() => removeEvent(i)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input value={ev.name} onChange={e => updateEvent(i, 'name', e.target.value)} placeholder="Event Name" />
                                    <Input value={ev.date} onChange={e => updateEvent(i, 'date', e.target.value)} placeholder="Date" />
                                    <Input className="md:col-span-2" value={ev.description} onChange={e => updateEvent(i, 'description', e.target.value)} placeholder="Description" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                    <input type="checkbox" checked={formData.liveStatus === "true"} onChange={e => setFormData({ ...formData, liveStatus: e.target.checked ? "true" : "false" })} className="w-5 h-5 rounded accent-emerald-600" />
                    <div>
                        <p className="text-sm font-bold text-emerald-900">Mark as Live & Verified</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="px-12">
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

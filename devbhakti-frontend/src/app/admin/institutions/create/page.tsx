"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { createInstitutionAdmin, fetchAllPoojasAdmin } from "@/api/adminController";
import { Badge } from "@/components/ui/badge";

export default function CreateInstitutionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [allPoojas, setAllPoojas] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        // Auth
        name: "",
        email: "",
        phone: "",
        password: "",
        // Temple Basic
        templeName: "",
        location: "",
        fullAddress: "",
        category: "",
        openTime: "",
        // Details
        description: "",
        history: "",
        viewers: "",
        // Contact
        templePhone: "",
        website: "",
        mapUrl: "",
        // Stats
        rating: "0",
        reviewsCount: "0",
        liveStatus: "true"
    });

    // Relationships State
    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [inlineEvents, setInlineEvents] = useState<any[]>([]);

    // Images State
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>("");
    const [heroImages, setHeroImages] = useState<File[]>([]);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);

    useEffect(() => {
        loadPoojas();
    }, []);

    const loadPoojas = async () => {
        try {
            const data = await fetchAllPoojasAdmin();
            setAllPoojas(data);
        } catch (error) {
            console.error("Failed to load poojas");
        }
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

    const removeHeroImage = (index: number) => {
        setHeroImages(prev => prev.filter((_, i) => i !== index));
        setHeroPreviews(prev => prev.filter((_, i) => i !== index));
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

            // Append basic fields
            Object.entries(formData).forEach(([key, value]) => {
                fd.append(key, value);
            });

            // Append relationships
            fd.append("poojaIds", JSON.stringify(selectedPoojaIds));
            fd.append("inlineEvents", JSON.stringify(inlineEvents));

            // Append images
            if (mainImage) fd.append("image", mainImage);
            heroImages.forEach(file => {
                fd.append("heroImages", file);
            });

            await createInstitutionAdmin(fd);
            toast({ title: "Success", description: "Institution and Temple created successfully" });
            router.push('/admin/institutions');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create institution. Ensure unique email/phone.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Add New Temple Institution</h1>
                    <p className="text-muted-foreground">Create a new institutional account and link it to a temple profile.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Account Identity Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Layout className="w-5 h-5" />
                        <h2 className="text-xl">Account Identity</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Owner/Admin Name *</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full Name of Trustee or Administrator"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Account Email</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="institution@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Account Phone *</label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Login Phone Number"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Initial Password</label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Default: 123456"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Temple Profile Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Building2 className="w-5 h-5" />
                        <h2 className="text-xl">Temple Profile</h2>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Temple Official Name *</label>
                            <Input
                                value={formData.templeName}
                                onChange={e => setFormData({ ...formData, templeName: e.target.value })}
                                placeholder="e.g. Shri Kashi Vishwanath Temple"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Location (City, State) *</label>
                            <Input
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Varanasi, Uttar Pradesh"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Category / Deity *</label>
                            <Input
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Shiva, Vishnu, Shakti, etc."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Operating Hours</label>
                            <Input
                                value={formData.openTime}
                                onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                                placeholder="4:00 AM - 11:30 PM"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Viewers Count (Social Proof)</label>
                            <Input
                                value={formData.viewers}
                                onChange={e => setFormData({ ...formData, viewers: e.target.value })}
                                placeholder="e.g. 10K+"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Address</label>
                        <Input
                            value={formData.fullAddress}
                            onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                            placeholder="Complete street address, pin code"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Temple History</label>
                        <Textarea
                            value={formData.history}
                            onChange={e => setFormData({ ...formData, history: e.target.value })}
                            placeholder="Describe the ancient origin and historical significance..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="General information about the temple..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* 3. Media & Assets Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <ImageIcon className="w-5 h-5" />
                        <h2 className="text-xl">Media & Assets</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Main Image */}
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700">Main Profile Image</label>
                            <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleMainImageChange}
                                />
                                {mainImagePreview ? (
                                    <div className="relative aspect-video rounded-lg overflow-hidden">
                                        <img src={mainImagePreview} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Upload className="text-white w-8 h-8" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center">
                                        <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Click or drag profile image</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hero Images (Multiple) */}
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700">Hero Banners (Multiple)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {heroPreviews.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeHeroImage(i)}
                                            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3 text-destructive" />
                                        </button>
                                    </div>
                                ))}
                                <div className="border-2 border-dashed rounded-lg flex items-center justify-center aspect-square hover:bg-slate-50 cursor-pointer transition-colors relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleHeroImagesChange}
                                    />
                                    <Plus className="w-6 h-6 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Contact & Online Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <MapPin className="w-5 h-5" />
                        <h2 className="text-xl">Contact & Online</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Temple Contact Number</label>
                            <Input
                                value={formData.templePhone}
                                onChange={e => setFormData({ ...formData, templePhone: e.target.value })}
                                placeholder="+91 000 000 0000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Website URL</label>
                            <Input
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://temple-name.org"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Google Maps URL</label>
                            <Input
                                value={formData.mapUrl}
                                onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                                placeholder="https://maps.google.com/..."
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Poojas Management (Multiple Select) */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Layout className="w-5 h-5" />
                            <h2 className="text-xl">Available Poojas</h2>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Select poojas that are performed at this temple.</p>
                    <div className="flex flex-wrap gap-2">
                        {allPoojas.map(pooja => (
                            <button
                                key={pooja.id}
                                type="button"
                                onClick={() => togglePooja(pooja.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedPoojaIds.includes(pooja.id)
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {pooja.name}
                                {selectedPoojaIds.includes(pooja.id) && " ✓"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 6. Inline Events Section */}
                <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-xl">Upcoming Events</h2>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addEvent}>
                            <Plus className="w-4 h-4 mr-2" /> Add Event
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {inlineEvents.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dotted rounded-lg">No events added yet. Add festivals or special programs.</p>
                        )}
                        {inlineEvents.map((ev, i) => (
                            <div key={i} className="p-4 border rounded-xl bg-slate-50 relative animate-in fade-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={() => removeEvent(i)}
                                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Event Name</label>
                                        <Input
                                            value={ev.name}
                                            onChange={e => updateEvent(i, 'name', e.target.value)}
                                            placeholder="e.g. Maha Shivratri"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Date</label>
                                        <Input
                                            value={ev.date}
                                            onChange={e => updateEvent(i, 'date', e.target.value)}
                                            placeholder="e.g. March 12, 2025"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Brief Detail (Optional)</label>
                                        <Input
                                            value={ev.description}
                                            onChange={e => updateEvent(i, 'description', e.target.value)}
                                            placeholder="What happens during this event?"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3 p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-pointer">
                        <input
                            type="checkbox"
                            id="liveStatus"
                            className="sr-only peer"
                            checked={formData.liveStatus === "true"}
                            onChange={e => setFormData({ ...formData, liveStatus: e.target.checked ? "true" : "false" })}
                        />
                        <label
                            htmlFor="liveStatus"
                            className="w-11 h-6 bg-slate-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
                        ></label>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-900">Mark as Live & Verified</p>
                        <p className="text-xs text-emerald-700">Visible to all devotees on the platform immediately.</p>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={isLoading} className="px-10">
                        {isLoading ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Creating...</>
                        ) : "Create Institution"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

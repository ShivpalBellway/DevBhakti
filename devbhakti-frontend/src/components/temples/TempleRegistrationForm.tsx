"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Upload,
    Plus,
    Trash2,
    Calendar,
    Image as ImageIcon,
    Layout,
    Building2,
    MapPin,
    Sparkles,
    ArrowRight,
    History,
    FileText,
    Key,
    User,
    Mail,
    Phone,
    Globe,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { registerTemple, fetchAllPoojasPublic } from "@/api/templeAdminController";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function TempleRegistrationForm({ onClose }: { onClose?: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [allPoojas, setAllPoojas] = useState<any[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Auth / Owner Info
        name: "",
        email: "",
        phone: "",
        password: "",
        // Temple Basic
        templeName: "",
        location: "", // City, State
        fullAddress: "",
        category: "",
        openTime: "",
        // Details
        description: "",
        history: "",
        viewers: "",
        // Contact & Social
        templePhone: "",
        website: "",
        mapUrl: "",
        // Fixed stats for reg
        rating: "0",
        reviewsCount: "0"
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
            const data = await fetchAllPoojasPublic();
            setAllPoojas(Array.isArray(data) ? data : data.data || []);
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

            // Normalize Phone numbers
            let normalizedPhone = formData.phone;
            if (normalizedPhone.length === 10) {
                normalizedPhone = `+91${normalizedPhone}`;
            }

            // Append basic fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'phone') {
                    fd.append(key, normalizedPhone);
                } else {
                    fd.append(key, value);
                }
            });

            // Append relationships
            fd.append("poojaIds", JSON.stringify(selectedPoojaIds));
            fd.append("inlineEvents", JSON.stringify(inlineEvents));

            // Append images
            if (mainImage) fd.append("image", mainImage);
            heroImages.forEach(file => {
                fd.append("heroImages", file);
            });

            await registerTemple(fd);
            setShowSuccess(true);
            toast({ title: "Success", description: "Temple registration submitted successfully" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to submit registration. Ensure unique phone number.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                    <Check className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900">Registration Successful!</h2>
                <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Your temple registration has been submitted and is currently <strong>Pending Admin Approval</strong>.
                    You will receive a notification once your account is activated.
                </p>
                <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full shadow-lg">
                    Back to Home
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] overflow-hidden shadow-2xl relative border border-slate-100 font-sans flex flex-col max-h-[90vh]">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-[#88542b] to-[#88542b] p-8 md:p-10 text-white relative shrink-0">
                <div className="absolute inset-0 pattern-sacred opacity-10 pointer-events-none" />
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">Register Your Temple</h2>
                        <p className="text-orange-50 font-medium">Join our community and reach thousands of devotees.</p>
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full h-10 w-10 shrink-0"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar">
                {/* 1. Account Identity */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Administrator Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Admin/Owner Name *</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full Name of Trustee"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Contact Phone *</label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Registered Mobile Number"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Email Address</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="admin@temple.org"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                        {/* <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Choose Password *</label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Minimum 6 characters"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                required
                            />
                        </div> */}
                    </div>
                </section>

                {/* 2. Temple Profile */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Temple Profile</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Temple Official Name *</label>
                            <Input
                                value={formData.templeName}
                                onChange={e => setFormData({ ...formData, templeName: e.target.value })}
                                placeholder="e.g. Somnath Mahadev Temple"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">Location (City, State) *</label>
                                <Input
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Varanasi, UP"
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">Main Deity / Category *</label>
                                <Input
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g. Shiva, Ganesha"
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">Opening Hours</label>
                                <Input
                                    value={formData.openTime}
                                    onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                                    placeholder="4 AM - 10 PM"
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">Visitor Count (Approx daily)</label>
                                <Input
                                    value={formData.viewers}
                                    onChange={e => setFormData({ ...formData, viewers: e.target.value })}
                                    placeholder="e.g. 5,000+"
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Full Physical Address *</label>
                            <Input
                                value={formData.fullAddress}
                                onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                                placeholder="Street, Landmark, Pincode"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Sacred History</label>
                            <Textarea
                                value={formData.history}
                                onChange={e => setFormData({ ...formData, history: e.target.value })}
                                placeholder="Describe the ancient origin and legends..."
                                className="min-h-[100px] border-slate-200 focus:border-orange-500 rounded-xl resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Description / Overview</label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="General amenities and visitor info..."
                                className="min-h-[100px] border-slate-200 focus:border-orange-500 rounded-xl resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* 3. Media Assets */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Divine Media</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-600 ml-1">Main Profile Image</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 hover:bg-slate-50 transition-all group relative cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleMainImageChange}
                                />
                                {mainImagePreview ? (
                                    <div className="aspect-video rounded-xl overflow-hidden relative shadow-sm">
                                        <img src={mainImagePreview} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="text-white w-8 h-8" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center space-y-2">
                                        <Upload className="w-10 h-10 text-slate-300 mx-auto group-hover:text-[#88542b] transition-colors" />
                                        <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-wider">Select Main Photo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-600 ml-1">Hero Banners (Max 5)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {heroPreviews.slice(0, 5).map((url, i) => (
                                    <div key={url} className="aspect-square rounded-xl overflow-hidden relative border border-slate-100 group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeHeroImage(i)}
                                            className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {heroPreviews.length < 5 && (
                                    <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer relative group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleHeroImagesChange}
                                        />
                                        <Plus className="w-6 h-6 text-slate-300 group-hover:text-[#88542b]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Poojas */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Performed Poojas</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allPoojas.map(pooja => (
                            <button
                                key={pooja.id}
                                type="button"
                                onClick={() => togglePooja(pooja.id)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${selectedPoojaIds.includes(pooja.id)
                                    ? "bg-[#88542b] text-white border-[#88542b] shadow-md shadow-[#88542b]/20"
                                    : "bg-slate-50 text-slate-600 border-slate-100 hover:border-[#88542b]/20"
                                    }`}
                            >
                                {pooja.name}
                                {selectedPoojaIds.includes(pooja.id) && " ✓"}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 5. Online Presence */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Online & Contact</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Official Website</label>
                            <Input
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://temple-name.org"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Google Maps URL</label>
                            <Input
                                value={formData.mapUrl}
                                onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                                placeholder="Share location link"
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                    </div>
                </section>

                {/* 6. Inline Events */}
                <section className="space-y-6 pb-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        {/* <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Major Festivals / Events</h3>
                        </div> */}
                        <Button type="button" variant="outline" size="sm" onClick={addEvent} className="rounded-lg border-slate-200 hover:border-orange-400 hover:bg-orange-50">
                            <Plus className="w-4 h-4 mr-2" /> Add Festival
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {inlineEvents.map((ev, i) => (
                            <div key={i} className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm relative group animate-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={() => removeEvent(i)}
                                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Event Name</label>
                                        <Input
                                            value={ev.name}
                                            onChange={e => updateEvent(i, 'name', e.target.value)}
                                            placeholder="e.g. Maha Shivratri"
                                            className="h-11 bg-slate-50 border-transparent focus:bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Probable Date/Month</label>
                                        <Input
                                            value={ev.date}
                                            onChange={e => updateEvent(i, 'date', e.target.value)}
                                            placeholder="e.g. February/March"
                                            className="h-11 bg-slate-50 border-transparent focus:bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Event Significance</label>
                                        <Input
                                            value={ev.description}
                                            onChange={e => updateEvent(i, 'description', e.target.value)}
                                            placeholder="Divine rituals and celebrations"
                                            className="h-11 bg-slate-50 border-transparent focus:bg-white rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {inlineEvents.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-slate-400 text-sm font-medium italic">No events listed. Share your major festivals.</p>
                            </div>
                        )}
                    </div>
                </section>
            </form>

            {/* Footer Actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="h-14 px-8 text-slate-500 font-bold hover:bg-slate-200"
                >
                    Discard
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="h-14 px-12 bg-gradient-to-r from-[#88542b] to-[#794a05] hover:from-[#794a05] hover:to-[#88542b] text-white rounded-2xl text-lg font-bold shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Registering...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            Register Temple
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}

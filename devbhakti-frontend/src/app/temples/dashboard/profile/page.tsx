"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Camera,
    MapPin,
    Globe,
    Phone,
    Mail,
    History,
    FileText,
    Save,
    Loader2,
    Image as ImageIcon,
    X,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchMyTempleProfile, updateMyTempleProfile } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function TempleProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const { toast } = useToast();

    // File refs
    const mainImageRef = useRef<HTMLInputElement>(null);
    const heroImagesRef = useRef<HTMLInputElement>(null);

    // Form states
    const [formData, setFormData] = useState<any>({
        name: "",
        category: "",
        openTime: "",
        description: "",
        history: "",
        location: "",
        fullAddress: "",
        phone: "",
        website: "",
        mapUrl: "",
        viewers: "",
    });

    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
    const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
    const [selectedHeroFiles, setSelectedHeroFiles] = useState<File[]>([]);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyTempleProfile();
            if (response.success) {
                const data = response.data;
                setProfile(data);
                setFormData({
                    name: data.name || "",
                    category: data.category || "",
                    openTime: data.openTime || "",
                    description: data.description || "",
                    history: data.history || "",
                    location: data.location || "",
                    fullAddress: data.fullAddress || "",
                    phone: data.phone || "",
                    website: data.website || "",
                    mapUrl: data.mapUrl || "",
                    viewers: data.viewers || "",
                });
                if (data.image) setMainImagePreview(getImageUrl(data.image));
                if (data.heroImages && Array.isArray(data.heroImages)) {
                    setHeroPreviews(data.heroImages.map(img => getImageUrl(img)));
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load profile",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedMainFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setMainImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedHeroFiles(prev => [...prev, ...files]);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => setHeroPreviews(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const removeHeroImage = (index: number) => {
        setHeroPreviews(prev => prev.filter((_, i) => i !== index));
        // Note: This only handles UI removal for now. Actual backend update will depend on how you handle existing vs new images.
        // For simplicity, we'll just send the new files if added.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                fd.append(key, formData[key]);
            });

            if (selectedMainFile) {
                fd.append('image', selectedMainFile);
            }

            selectedHeroFiles.forEach(file => {
                fd.append('heroImages', file);
            });

            const response = await updateMyTempleProfile(fd);
            if (response.success) {
                toast({ title: "Success", description: "Profile updated successfully" });
                loadProfile(); // Refresh
                setSelectedMainFile(null);
                setSelectedHeroFiles([]);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#7b4623]" />
                <p className="text-[#7b4623] font-medium">Loading your temple profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold font-serif text-[#7b4623]">Temple Profile</h1>
                    <p className="text-slate-500">Manage your temple's public information and media assets.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => loadProfile()}
                        className="border-[#7b4623] text-[#7b4623] hover:bg-[#7b4623]/5"
                    >
                        Reset Changes
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-[#7b4623] hover:bg-[#5d351a] text-white px-8"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Profile
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Media */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Main Image */}
                    <Card className="overflow-hidden border-none shadow-md rounded-2xl">
                        <CardHeader className="bg-[#7b4623]/5 border-b pb-4">
                            <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Main Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 group">
                                {mainImagePreview ? (
                                    <>
                                        <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => mainImageRef.current?.click()}
                                            >
                                                Change Image
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer" onClick={() => mainImageRef.current?.click()}>
                                        <Camera className="w-10 h-10" />
                                        <span className="text-sm font-medium">Upload Temple Image</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={mainImageRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleMainImageChange}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hero Banners */}
                    <Card className="border-none shadow-md rounded-2xl">
                        <CardHeader className="bg-[#7b4623]/5 border-b pb-4">
                            <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Hero Banners
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-3">
                                {heroPreviews.map((preview, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border bg-slate-50">
                                        <img src={preview} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeHeroImage(idx)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <div
                                    onClick={() => heroImagesRef.current?.click()}
                                    className="aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <Plus className="w-6 h-6" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={heroImagesRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleHeroImagesChange}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Details */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-md rounded-2xl">
                        <CardHeader className="bg-[#7b4623]/5 border-b pb-4">
                            <CardTitle className="text-xl font-serif text-[#7b4623] flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-600">Temple Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600">Category</Label>
                                    <Input
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600">Opening Hours</Label>
                                    <Input
                                        value={formData.openTime}
                                        onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                                        placeholder="e.g. 6:00 AM - 9:00 PM"
                                        className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600">Phone Number</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-600">Temple Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[120px] border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-600 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Temple History
                                </Label>
                                <Textarea
                                    value={formData.history}
                                    onChange={e => setFormData({ ...formData, history: e.target.value })}
                                    className="min-h-[120px] border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md rounded-2xl">
                        <CardHeader className="bg-[#7b4623]/5 border-b pb-4">
                            <CardTitle className="text-xl font-serif text-[#7b4623] flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Location & Presence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-600">City / Location</Label>
                                    <Input
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600">Website</Label>
                                    <Input
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Full Address</Label>
                                <Input
                                    value={formData.fullAddress}
                                    onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                                    className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Google Maps URL</Label>
                                <Input
                                    value={formData.mapUrl}
                                    onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                                    className="h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}

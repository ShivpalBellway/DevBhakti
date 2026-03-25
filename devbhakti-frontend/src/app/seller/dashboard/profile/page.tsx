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
    Plus,
    Store,
    Info,
    CheckCircle2,
    TrendingUp,
    Truck
} from "lucide-react";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import { fetchSellerProfile, updateSellerProfile } from "@/api/sellerController";

export default function SellerProfilePage() {
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
        location: "",
        fullAddress: "",
        phone: "",
        website: "",
        shiprocketPickupNickname: "",
    });

    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
    const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
    const [selectedHeroFiles, setSelectedHeroFiles] = useState<File[]>([]);

    // Crop states
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [cropType, setCropType] = useState<"main" | "hero">("main");
    const [cropTitle, setCropTitle] = useState("Adjust Image");
    const [initialAspect, setInitialAspect] = useState(16 / 9);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const response = await fetchSellerProfile();
            if (response.success) {
                const data = response.data;
                setProfile(data);
                setFormData({
                    name: data.name || "",
                    category: data.category || "",
                    openTime: data.openTime || "",
                    description: data.description || "",
                    location: data.location || "",
                    fullAddress: data.fullAddress || "",
                    phone: data.phone || data.user?.phone || "",
                    website: data.website || "",
                    shiprocketPickupNickname: data.shiprocketPickupNickname || "",
                });

                if (data.image) setMainImagePreview(`${BASE_URL}${data.image}`);
                if (data.heroImages && Array.isArray(data.heroImages)) {
                    setHeroPreviews(data.heroImages.map(img => `${BASE_URL}${img}`));
                }
            }
        } catch (error) {
            console.error("Failed to load seller profile", error);
            // toast({
            //     title: "Profile Notice",
            //     description: "Setup your store profile to go live.",
            // });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setCropType("main");
                setCropTitle("Adjust Store Logo");
                setInitialAspect(16 / 9);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setCropType("hero");
                setCropTitle("Adjust Showcase Image");
                setInitialAspect(1920 / 800);
                setShowCropper(true);
            };
            reader.readAsDataURL(files[0]);
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        if (cropType === "main") {
            setSelectedMainFile(croppedFile);
            setMainImagePreview(URL.createObjectURL(croppedFile));
        } else {
            setSelectedHeroFiles(prev => [...prev, croppedFile]);
            setHeroPreviews(prev => [...prev, URL.createObjectURL(croppedFile)]);
        }
        setShowCropper(false);
        setTempImage(null);
    };

    const removeHeroImage = (index: number) => {
        setHeroPreviews(prev => prev.filter((_, i) => i !== index));
        // Logic for backend subset removal would go here
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

            const response = await updateSellerProfile(fd);
            if (response.success) {
                toast({ title: "Success", description: "Profile updated successfully" });
                loadProfile(); // Refresh data
                setSelectedMainFile(null);
                setSelectedHeroFiles([]);
            }
        } catch (error: any) {
            console.error("Update Profile Error:", error);
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
                <p className="text-[#7b4623] font-medium font-serif">Loading Store Identity...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 overflow-x-hidden">
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

            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold font-serif text-[#7b4623] drop-shadow-sm">
                        Store Presence
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Professional identity and storefront management for DevBhakti Marketplace.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => loadProfile()}
                        className="text-slate-500 hover:text-[#7b4623] hover:bg-[#7b4623]/5 rounded-2xl font-bold"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-[#7b4623] hover:bg-[#5d351a] text-white px-10 h-12 rounded-2xl shadow-lg shadow-[#7b4623]/20 transition-all active:scale-95"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Save Profile
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Visual Identity Section */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Store Banner/Logo */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden bg-white/70 backdrop-blur-sm">
                        <CardHeader className="bg-[#7b4623]/5 border-b pb-4 px-8">
                            <CardTitle className="text-sm font-extrabold text-[#7b4623] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Brand Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="relative aspect-[16/9] rounded-[1.5rem] overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50/50 group flex items-center justify-center">
                                {mainImagePreview ? (
                                    <>
                                        <img src={mainImagePreview} alt="Storefront" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="rounded-xl font-bold"
                                                onClick={() => mainImageRef.current?.click()}
                                            >
                                                Update Logo
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3 cursor-pointer p-8 text-center" onClick={() => mainImageRef.current?.click()}>
                                        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
                                            <Store className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900">Upload Store Logo</p>
                                            <p className="text-[10px] uppercase font-bold tracking-widest mt-1">Aspect Ratio: 16:9 (1200x675 px)</p>
                                            <p className="text-[10px] text-slate-500 font-medium lowercase italic">Supported: JPG, PNG, WEBP</p>
                                        </div>
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

                    {/* Verification & Commission Status */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] bg-gradient-to-br from-[#7b4623] to-[#a65d2e] text-white p-8">
                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold font-serif">Verified Partner</h3>
                                    <p className="text-white/70 text-sm font-medium">Your store is active on DevBhakti</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-1">Products</p>
                                    <p className="text-2xl font-black">{profile?.productCommissionRate || 10}%</p>
                                    <p className="text-[10px] text-white/50 font-bold mt-1">Fee per sale</p>
                                </div>
                                {/* <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-1">Services</p>
                                    <p className="text-2xl font-black">{profile?.poojaCommissionRate || 5}%</p>
                                    <p className="text-[10px] text-white/50 font-bold mt-1">Fee per pooja</p>
                                </div> */}
                            </div>

                            <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-widest pt-2">
                                Platform fee is automatically deducted
                            </p>
                        </div>
                    </Card>

                    {/* Store Showcase */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden bg-white/70 backdrop-blur-sm">
                        <CardHeader className="bg-[#7b4623]/5 border-b pb-4 px-8">
                            <CardTitle className="text-sm font-extrabold text-[#7b4623] uppercase tracking-[0.2em] flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Store Showcase
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-2 gap-4">
                                {heroPreviews.map((preview, idx) => (
                                    <div key={idx} className="relative aspect-[2.4/1] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                                        <img src={preview} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <button
                                            type="button"
                                            onClick={() => removeHeroImage(idx)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => heroImagesRef.current?.click()}
                                    className="aspect-[2.4/1] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-[#7b4623] hover:text-[#7b4623] transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Photo</span>
                                    <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Aspect Ratio: 2.4:1 (1920x800 px)</span>
                                </button>
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

                {/* Information Controls Section */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Basic Store info */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b pb-5 px-10 pt-8">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold font-serif text-slate-900 flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-[#7b4623]" />
                                    Store Details
                                </CardTitle>
                                <Badge variant="outline" className="rounded-full border-[#7b4623]/20 bg-[#7b4623]/5 text-[#7b4623] font-bold px-4 py-1">
                                    Public Profile
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Store Legal Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-14 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 text-slate-900 rounded-2xl text-base font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Store Category</Label>
                                    <div className="relative">
                                        <Plus className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="h-14 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 text-slate-900 rounded-2xl text-base font-bold transition-all"
                                            placeholder="e.g. Pooja Essentials, Idols"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Business Hours</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7b4623]/40" />
                                        <Input
                                            value={formData.openTime}
                                            onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                                            placeholder="e.g. 10:00 AM - 8:00 PM"
                                            className="h-14 pl-12 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 text-slate-900 rounded-2xl text-base font-bold transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Official Website</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7b4623]/40" />
                                        <Input
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="www.yourstore.com"
                                            className="h-14 pl-12 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 text-slate-900 rounded-2xl text-base font-bold transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Store Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    maxLength={500}
                                    className="min-h-[160px] border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-3xl p-6 text-base font-medium leading-relaxed resize-none"
                                    placeholder="Tell devotees about your legacy, products, and specialties..."
                                />
                                <div className="flex justify-end pr-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formData.description.length}/500 Characters</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Info */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b pb-5 px-10 pt-8">
                            <CardTitle className="text-xl font-bold font-serif text-slate-900 flex items-center gap-3">
                                <MapPin className="w-6 h-6 text-[#7b4623]" />
                                Physical Presence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Operating City</Label>
                                    <Input
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="h-14 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-2xl text-base font-bold transition-all"
                                        placeholder="City, State"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Store Hot line</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7b4623]/40" />
                                        <Input
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="h-14 pl-12 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 text-slate-900 rounded-2xl text-base font-bold transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-extrabold text-slate-400 tracking-widest uppercase ml-1">Pickup / Warehouse Address</Label>
                                <Input
                                    value={formData.fullAddress}
                                    onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                                    className="h-14 border-slate-100 bg-slate-50 focus:bg-white focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-2xl text-base font-bold transition-all"
                                    placeholder="Enter complete building, street, and area details"
                                />
                            </div>

                            <div className="p-6 bg-[#0070F3]/5 rounded-3xl border border-dashed border-[#0070F3]/20 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-[#0070F3]/10 flex items-center justify-center shrink-0 shadow-inner">
                                        <Truck className="w-5 h-5 text-[#0070F3]" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 text-sm">Shiprocket Integration</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                                            Enter the exact <b>Pickup Location Nickname</b> from your Shiprocket Dashboard.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-extrabold text-[#0070F3] tracking-widest uppercase ml-1">Shiprocket Pickup Nickname *</Label>
                                    <Input
                                        value={formData.shiprocketPickupNickname}
                                        onChange={e => setFormData({ ...formData, shiprocketPickupNickname: e.target.value })}
                                        className="h-12 border-[#0070F3]/10 bg-white focus:border-[#0070F3] focus:ring-[#0070F3]/10 text-slate-900 rounded-2xl text-sm font-bold transition-all"
                                        placeholder="e.g. PRIMARY_WAREHOUSE"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}

const Badge = ({ children, variant, className }: any) => {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
            {children}
        </span>
    );
};

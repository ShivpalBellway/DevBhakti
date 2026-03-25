"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    MapPin,
    Globe,
    Badge,
    Phone,
    Mail,
    History,
    FileText,
    Save,
    Loader2,
    Image as ImageIcon,
    X,
    Plus,
    Truck,
    User,
    ShieldCheck,
    ArrowUpRight,
    Sparkles,
    Eye,
    AlertCircle,
    CheckCircle2,
    Settings2,
    Link2,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fetchMyTempleProfile, updateMyTempleProfile } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { ImageCropper } from "@/components/admin/ImageCropper";

export default function TempleProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const { toast } = useToast();

    // Cropping states
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [croppingTarget, setCroppingTarget] = useState<{ type: 'main' | 'hero' } | null>(null);
    const [cropTitle, setCropTitle] = useState("");
    const [initialAspect, setInitialAspect] = useState(16 / 9);

    // File refs
    const mainImageRef = useRef<HTMLInputElement>(null);
    const heroImagesRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

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
        isLive: false,
        liveUrl: "",
        pickupLocation: "",
        // Admin Info (from User)
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        // Technical Info
        slug: "",
        subdomain: "",
        urlType: "slug",
        operatingHours: [
            { label: "Morning", start: "07:00 AM", end: "01:00 PM", active: true },
            { label: "Evening", start: "05:00 PM", end: "10:00 PM", active: true }
        ],
    });

    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
    const [selectedHeroFiles, setSelectedHeroFiles] = useState<File[]>([]);
    const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);

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
                    isLive: data.isLive || false,
                    liveUrl: data.liveUrl || "",
                    pickupLocation: data.pickupLocation || "",
                    // Admin Info
                    adminName: data.user?.name || "",
                    adminEmail: data.user?.email || "",
                    adminPhone: data.user?.phone || "",
                    // Technical Info
                    slug: data.slug || "",
                    subdomain: data.subdomain || "",
                    urlType: data.urlType || "slug",
                    operatingHours: data.operatingHours || [
                        { label: "Morning", start: "07:00 AM", end: "01:00 PM", active: true },
                        { label: "Evening", start: "05:00 PM", end: "10:00 PM", active: true }
                    ],
                });
                if (data.image) setMainImagePreview(getImageUrl(data.image));
                if (data.heroImages && Array.isArray(data.heroImages)) {
                    setHeroPreviews(data.heroImages.map(img => getImageUrl(img)));
                }
                if (data.gallery && Array.isArray(data.gallery)) {
                    setGalleryPreviews(data.gallery.map(img => getImageUrl(img)));
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

    const calculateCompleteness = () => {
        const fields = [
            'name', 'category', 'openTime', 'description', 'history',
            'location', 'fullAddress', 'phone', 'website', 'mapUrl'
        ];
        const filled = fields.filter(f => !!formData[f]).length;
        const mainImg = mainImagePreview ? 1 : 0;
        const heros = heroPreviews.length > 0 ? 1 : 0;
        const total = fields.length + 2;
        return Math.round(((filled + mainImg + heros) / total) * 100);
    };

    const completeness = useMemo(calculateCompleteness, [formData, mainImagePreview, heroPreviews]);

    const getImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "image.jpg", { type: "image/jpeg" });
        const reader = new FileReader();
        reader.onloadend = () => {
            if (croppingTarget?.type === 'main') {
                setSelectedMainFile(file);
                setMainImagePreview(reader.result as string);
            } else if (croppingTarget?.type === 'hero') {
                setSelectedHeroFiles(prev => [...prev, file]);
                setHeroPreviews(prev => [...prev, reader.result as string]);
            }
        };
        reader.readAsDataURL(file);
        setShowCropper(false);
        setTempImage(null);
        setCroppingTarget(null);
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB for initial upload
        if (file) {
            if (file.size > MAX_SIZE) {
                toast({
                    title: "File Too Large",
                    description: `Image "${file.name}" exceeds 5MB limit.`,
                    variant: "destructive"
                });
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setCroppingTarget({ type: 'main' });
                setCropTitle("Crop Profile Image");
                setInitialAspect(16 / 9);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (files.length > 0) {
            const validFiles = files.filter(f => f.size <= MAX_SIZE);
            if (validFiles.length > 0) {
                const reader = new FileReader();
                reader.onload = () => {
                    setTempImage(reader.result as string);
                    setCroppingTarget({ type: 'hero' });
                    setCropTitle("Crop Banner Image");
                    setInitialAspect(1920 / 800);
                    setShowCropper(true);
                };
                reader.readAsDataURL(validFiles[0]);
            } else {
                toast({
                    title: "Files Too Large",
                    description: "Selected files exceed 5MB limit.",
                    variant: "destructive"
                });
            }
            e.target.value = '';
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (files.length > 0) {
            const largeFiles = files.filter(f => f.size > MAX_SIZE);
            if (largeFiles.length > 0) {
                toast({
                    title: "Files Too Large",
                    description: `${largeFiles.length} file(s) exceed the 2MB limit. Those were skipped.`,
                    variant: "destructive"
                });
            }

            const validFiles = files.filter(f => f.size <= MAX_SIZE);
            if (validFiles.length > 0) {
                setSelectedGalleryFiles(prev => [...prev, ...validFiles]);
                validFiles.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => setGalleryPreviews(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                });
            }
            e.target.value = ''; // Reset input
        }
    };

    const removeHeroImage = (index: number) => {
        setHeroPreviews(prev => prev.filter((_, i) => i !== index));
        // Note: This only handles UI removal for now. Actual backend update will depend on how you handle existing vs new images.
        // For simplicity, we'll just send the new files if added.
    };

    const removeGalleryImage = (index: number) => {
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Phone Number Validation
        const phoneValue = formData.phone || "";
        const phoneDigits = phoneValue.replace(/\D/g, '');
        const isValidPhone = !phoneValue ||
            phoneDigits.length === 10 ||
            (phoneDigits.length === 11 && phoneDigits.startsWith('0')) ||
            (phoneDigits.length === 12 && phoneDigits.startsWith('91'));

        if (!isValidPhone) {
            toast({
                title: "Invalid Phone Number",
                description: "Official phone must be a valid 10-digit number (prefix with 91 or 0 is allowed).",
                variant: "destructive"
            });
            return;
        }

        // 2. Hero Images Count Validation (Total)
        // Calculating total based on previews which include existing + newly added
        if (heroPreviews.length > 5) {
            toast({
                title: "Too Many Banners",
                description: `Maximum 5 banners allowed. You have ${heroPreviews.length} selected.`,
                variant: "destructive"
            });
            return;
        }

        // 3. Image Size Validation (Max 2MB for NEW files)
        const MAX_SIZE = 2 * 1024 * 1024;
        const newFiles = [
            ...(selectedMainFile ? [selectedMainFile] : []),
            ...selectedHeroFiles,
            ...selectedGalleryFiles
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

        setIsSaving(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'operatingHours') {
                    fd.append(key, JSON.stringify(formData[key]));
                } else {
                    fd.append(key, formData[key]);
                }
            });

            if (selectedMainFile) {
                fd.append('image', selectedMainFile);
            }

            selectedHeroFiles.forEach(file => {
                fd.append('heroImages', file);
            });

            selectedGalleryFiles.forEach(file => {
                fd.append('gallery', file);
            });

            const response = await updateMyTempleProfile(fd);
            if (response.success) {
                if (response.pendingApproval) {
                    toast({
                        title: "Update Pending",
                        description: "Your changes to sensitive fields have been submitted for admin approval. They will be visible on the public profile once approved.",
                        className: "bg-amber-50 border-amber-200 text-amber-900 shadow-lg border-2"
                    });
                } else {
                    toast({ title: "Success", description: "Profile updated successfully" });
                }
                loadProfile(); // Refresh
                setSelectedMainFile(null);
                setSelectedHeroFiles([]);
                setSelectedGalleryFiles([]);
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1440px] mx-auto space-y-6 pb-20 relative px-4"
        >
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -z-10 opacity-5 pointer-events-none">
                <Sparkles className="w-96 h-96 text-[#7b4623]" />
            </div>

            {/* Profile Completeness Indicator */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/40 backdrop-blur-md border border-white/20 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="28"
                                cy="28"
                                r="25"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <motion.circle
                                cx="28"
                                cy="28"
                                r="25"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={157}
                                initial={{ strokeDashoffset: 157 }}
                                animate={{ strokeDashoffset: 157 * (1 - completeness / 100) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-[#7b4623]"
                            />
                        </svg>
                        <span className="absolute text-xs font-bold text-[#7b4623]">{completeness}%</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Profile Completeness</h3>
                        <p className="text-xs text-slate-500">Your temple profile is {completeness}% complete.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {completeness === 100 ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Fully Complete
                        </Badge>
                    ) : (
                        <div className="text-[10px] font-bold text-[#7b4623]/60 uppercase tracking-widest bg-[#7b4623]/5 px-3 py-1 rounded-full">
                            {100 - completeness}% TO GO
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-[#7b4623]">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Profile</span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Temple Settings</h1>
                </div>
                <div className="flex gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/40 shadow-sm">
                    <Button
                        variant="ghost"
                        onClick={() => loadProfile()}
                        className="text-slate-600 hover:bg-slate-100 rounded-xl px-4 h-10 text-sm"
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-[#7b4623] hover:bg-[#5d351a] text-white px-8 h-10 rounded-xl shadow-lg shadow-[#7b4623]/20 active:scale-95 transition-all text-sm font-bold"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Profile
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Media & Live */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Main Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Card className="overflow-hidden border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] group">
                            <CardHeader className="bg-gradient-to-br from-[#7b4623]/10 to-transparent border-b border-white/20 p-6">
                                <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white/80 rounded-xl shadow-sm">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        Profile Image
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div
                                    className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50/50 group/img cursor-pointer transition-all hover:border-[#7b4623]/30"
                                    onClick={() => mainImageRef.current?.click()}
                                >
                                    {mainImagePreview ? (
                                        <>
                                            <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 text-center px-4">
                                            <Plus className="w-8 h-8" />
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold uppercase tracking-widest block">Upload Photo</span>
                                                <span className="text-[10px] opacity-60">Aspect Ratio: 16:9 (1200x675)</span>
                                            </div>
                                        </div>
                                    )}
                                    <input type="file" ref={mainImageRef} className="hidden" accept="image/*" onChange={handleMainImageChange} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Banner Showcase */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-[#7b4623]/10 to-transparent border-b border-white/20 p-6">
                                <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white/80 rounded-xl shadow-sm">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        Banners
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{heroPreviews.length}/5</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {heroPreviews.map((preview, idx) => (
                                            <motion.div
                                                layout
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                key={preview}
                                                className="relative aspect-video rounded-xl overflow-hidden shadow-md group/banner"
                                            >
                                                <img src={preview} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeHeroImage(idx)}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/banner:opacity-100 transition-all shadow-lg"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {heroPreviews.length < 5 && (
                                        <div
                                            onClick={() => heroImagesRef.current?.click()}
                                            className="aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-white/40 flex flex-col items-center justify-center text-slate-400 hover:bg-white/80 hover:border-[#7b4623]/30 transition-all cursor-pointer group/add"
                                        >
                                            <Plus className="w-6 h-6 group-hover/add:text-[#7b4623]" />
                                            <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-center px-2">Add Banner<br /><span className="text-[7px] italic">Aspect Ratio: 2.4:1</span></span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={heroImagesRef} className="hidden" accept="image/*" multiple onChange={handleHeroImagesChange} />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Live Stream */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-red-500/10 to-transparent border-b border-white/20 p-6">
                                <CardTitle className="text-lg font-serif text-slate-800 flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${formData.isLive ? 'bg-red-600 animate-pulse' : 'bg-slate-300'}`} />
                                    Live Stream
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/40 shadow-inner">
                                    <Label className="text-sm font-bold text-slate-700">Go Live Visibility</Label>
                                    <Switch
                                        checked={formData.isLive}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isLive: checked })}
                                    />
                                </div>
                                {formData.isLive && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Live URL / Channel ID</Label>
                                        <Input
                                            value={formData.liveUrl}
                                            onChange={e => setFormData({ ...formData, liveUrl: e.target.value })}
                                            placeholder="Enter Channel ID"
                                            className="h-12 border-white/40 bg-white/40 focus:bg-white rounded-xl focus:ring-[#7b4623]/10"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Logistic Harmony - Moved here */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#0070F3]/5 border-dashed border-[#0070F3]/30 backdrop-blur-sm">
                            <CardHeader className="border-b border-[#0070F3]/10 p-6">
                                <CardTitle className="text-lg font-serif text-[#0070F3] flex items-center gap-2">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    Logistic Harmony
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0070F3] ml-1">Pickup Nickname</Label>
                                    <Input
                                        value={formData.pickupLocation}
                                        onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })}
                                        className="h-12 border-[#0070F3]/20 bg-white border-2 focus:border-[#0070F3] rounded-xl font-bold px-4 text-sm"
                                        placeholder="e.g. TEMPLE_MAIN_PICKUP"
                                    />
                                </div>
                                <div className="p-3 bg-white/40 rounded-xl border border-[#0070F3]/10 text-[9px] text-[#0070F3]/70 font-bold leading-relaxed">
                                    Must match Shiprocket Dashboard setting exactly for automated fulfillment.
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Right Column: Information Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Trustee Identity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-[#7b4623]/10 to-transparent border-b border-white/20 p-8">
                                <CardTitle className="text-2xl font-serif text-[#7b4623] flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-2xl shadow-sm">
                                        <User className="w-6 h-6" />
                                    </div>
                                    Trustee Identity
                                </CardTitle>
                                <CardDescription className="ml-14 font-medium text-slate-500 italic">Verified administrator details from registration</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-slate-400 ml-1">Authorized Name</Label>
                                        <div className="h-14 px-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3 text-slate-600 font-bold">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            {formData.adminName}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-slate-400 ml-1">Contact Phone</Label>
                                        <div className="h-14 px-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3 text-slate-600 font-bold">
                                            <Phone className="w-5 h-5 text-[#7b4623]/30" />
                                            {formData.adminPhone}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-slate-400 ml-1">Official Email</Label>
                                        <div className="h-14 px-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3 text-slate-600 font-bold">
                                            <Mail className="w-5 h-5 text-[#7b4623]/30" />
                                            {formData.adminEmail}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3 items-center">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <p className="text-xs text-emerald-800 font-medium italic">Identity credentials are locked for verification. Contact support for updates.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Sacred Knowledge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-[#7b4623]/10 to-transparent border-b border-white/20 p-8">
                                <CardTitle className="text-2xl font-serif text-[#7b4623] flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-2xl shadow-sm">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    Sacred Knowledge
                                </CardTitle>
                                <CardDescription className="ml-14 font-medium text-slate-500 italic">Descriptive details about the temple's history and purpose</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-[#7b4623]/60 ml-1">Temple Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="h-14 px-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl focus:ring-[#7b4623]/10 text-lg font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-[#7b4623]/60 ml-1">Category</Label>
                                        <Input
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="h-14 px-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl focus:ring-[#7b4623]/10 text-lg font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-sm font-bold text-[#7b4623] flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                Operating Hours
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const newHours = [...formData.operatingHours, { label: "New Slot", start: "09:00 AM", end: "05:00 PM", active: true }];
                                                    setFormData({ ...formData, operatingHours: newHours });
                                                }}
                                                className="h-8 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add Slot
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {formData.operatingHours.map((slot: any, index: number) => (
                                                <div key={index} className={`p-4 rounded-2xl border-2 transition-all ${slot.active ? 'bg-white border-[#7b4623]/20 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <Input
                                                            value={slot.label}
                                                            onChange={e => {
                                                                const newHours = [...formData.operatingHours];
                                                                newHours[index].label = e.target.value;
                                                                setFormData({ ...formData, operatingHours: newHours });
                                                            }}
                                                            className="h-8 w-32 font-bold text-xs uppercase tracking-wider bg-transparent border-none focus-visible:ring-0 p-0"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={slot.active}
                                                                onCheckedChange={checked => {
                                                                    const newHours = [...formData.operatingHours];
                                                                    newHours[index].active = checked;
                                                                    setFormData({ ...formData, operatingHours: newHours });
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    const newHours = formData.operatingHours.filter((_: any, i: number) => i !== index);
                                                                    setFormData({ ...formData, operatingHours: newHours });
                                                                }}
                                                                className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Open</Label>
                                                            <Input
                                                                value={slot.start}
                                                                onChange={e => {
                                                                    const newHours = [...formData.operatingHours];
                                                                    newHours[index].start = e.target.value;
                                                                    setFormData({ ...formData, operatingHours: newHours });
                                                                }}
                                                                className="h-10 text-sm font-bold rounded-xl border-slate-100"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Close</Label>
                                                            <Input
                                                                value={slot.end}
                                                                onChange={e => {
                                                                    const newHours = [...formData.operatingHours];
                                                                    newHours[index].end = e.target.value;
                                                                    setFormData({ ...formData, operatingHours: newHours });
                                                                }}
                                                                className="h-10 text-sm font-bold rounded-xl border-slate-100"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-[#7b4623]/60 ml-1">Official Phone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="h-14 px-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-[#7b4623]/60 ml-1">Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="min-h-[140px] p-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl leading-relaxed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-[#7b4623]/60 ml-1">Historical Narrative</Label>
                                        <Textarea
                                            value={formData.history}
                                            onChange={e => setFormData({ ...formData, history: e.target.value })}
                                            className="min-h-[140px] p-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Divine Presence */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-[#7b4623]/10 to-transparent border-b border-white/20 p-8">
                                <CardTitle className="text-2xl font-serif text-[#7b4623] flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-2xl shadow-sm">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    Divine Presence
                                </CardTitle>
                                <CardDescription className="ml-14 font-medium text-slate-500 italic">Geographical location and digital navigation</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-slate-400 ml-1">City / Region</Label>
                                        <Input
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="h-14 px-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-slate-400 ml-1">Website</Label>
                                        <Input
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            className="h-14 px-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-slate-400 ml-1">Full Address</Label>
                                        <Input
                                            value={formData.fullAddress}
                                            onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                                            className="h-14 px-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold tracking-widest text-slate-400 ml-1">Maps Navigation</Label>
                                        <Input
                                            value={formData.mapUrl}
                                            onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                                            className="h-14 px-5 border-white/40 bg-white/40 focus:bg-white rounded-2xl text-blue-600 font-medium"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </form>

            <AnimatePresence>
                {showCropper && tempImage && (
                    <ImageCropper
                        image={tempImage}
                        onCropComplete={handleCropComplete}
                        onCancel={() => {
                            setShowCropper(false);
                            setTempImage(null);
                            setCroppingTarget(null);
                        }}
                        initialAspect={initialAspect}
                        lockAspect={true}
                        title={cropTitle}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

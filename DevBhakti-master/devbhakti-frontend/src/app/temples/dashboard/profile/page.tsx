"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    MapPin,
    Globe,
    Badge as BadgeIcon,
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
    Clock,
    Video,
    ExternalLink,
    Play,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Languages,
    Star,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs";
import { fetchMyTempleProfile, updateMyTempleProfile } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { parseLocalizedValue } from "@/utils/textUtils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useLanguage } from "@/context/LanguageContext";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import TempleQrDialog from "@/components/admin/TempleQrDialog";
import { FaFacebook ,FaYoutube , FaInstagram} from "react-icons/fa";

// Types for news cuttings
interface NewsCutting {
    image: string;
    link: string;
    preview?: string;
    file?: File;
}

interface NewNewsCutting {
    file: File;
    link: string;
    preview: string;
}

export default function TempleProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const { toast } = useToast();
    const { language, t } = useLanguage();
    const { hasPermission } = useAdminAuth();
    const canManage = hasPermission('temple.profile.manage');

    // Cropping states
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [croppingTarget, setCroppingTarget] = useState<{ type: 'main' | 'hero' } | null>(null);
    const [cropTitle, setCropTitle] = useState("");
    const [initialAspect, setInitialAspect] = useState(16 / 9);

    // File refs
    const mainImageRef = useRef<HTMLInputElement>(null);
    const heroImagesRef = useRef<HTMLInputElement>(null);

    // News Cuttings state
    const [existingNewsCuttings, setExistingNewsCuttings] = useState<NewsCutting[]>([]);
    const [newNewsCuttings, setNewNewsCuttings] = useState<NewNewsCutting[]>([]);

    // Form states
    const [formData, setFormData] = useState<any>({
        name_en: "",
        name_hi: "",
        name_mr: "",
        category_en: "",
        category_hi: "",
        category_mr: "",
        description_en: "",
        description_hi: "",
        description_mr: "",
        history_en: "",
        history_hi: "",
        history_mr: "",
        location_en: "",
        location_hi: "",
        location_mr: "",
        fullAddress_en: "",
        fullAddress_hi: "",
        fullAddress_mr: "",
        phone: "",
        website: "",
        mapUrl: "",
        viewers: "",
        isLive: false,
        liveUrl: "",
        youtubeLinks: [],
        pickupLocation: "",
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        slug: "",
        subdomain: "",
        urlType: "slug",
        operatingHours: [],
        instagramUrl: "",
        facebookUrl: "",
        youtubeUrl: "",
    });

    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
    const [selectedHeroFiles, setSelectedHeroFiles] = useState<File[]>([]);
    const [newYoutubeUrl, setNewYoutubeUrl] = useState("");

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

                const getL = (field: any, lang: string, fallback: any = "") => {
                    const result = parseLocalizedValue(field, lang);
                    return result === "N/A" ? fallback : result;
                };

                setFormData({
                    name_en: getL(data.name, 'en'),
                    name_hi: getL(data.name, 'hi'),
                    name_mr: getL(data.name, 'mr'),
                    category_en: getL(data.category, 'en'),
                    category_hi: getL(data.category, 'hi'),
                    category_mr: getL(data.category, 'mr'),
                    description_en: getL(data.description, 'en'),
                    description_hi: getL(data.description, 'hi'),
                    description_mr: getL(data.description, 'mr'),
                    history_en: getL(data.history, 'en'),
                    history_hi: getL(data.history, 'hi'),
                    history_mr: getL(data.history, 'mr'),
                    location_en: getL(data.location, 'en'),
                    location_hi: getL(data.location, 'hi'),
                    location_mr: getL(data.location, 'mr'),
                    fullAddress_en: getL(data.fullAddress, 'en'),
                    fullAddress_hi: getL(data.fullAddress, 'hi'),
                    fullAddress_mr: getL(data.fullAddress, 'mr'),
                    phone: data.phone || "",
                    website: data.website || "",
                    mapUrl: data.mapUrl || "",
                    viewers: data.viewers || "",
                    isLive: data.isLive || false,
                    liveUrl: data.liveUrl || "",
                    youtubeLinks: data.youtubeLinks || [],
                    instagramUrl: data.instagramUrl || "",
                    facebookUrl: data.facebookUrl || "",
                    youtubeUrl: data.youtubeUrl || "",
                    pickupLocation: parseLocalizedValue(data.pickupLocation, 'en'),
                    adminName: parseLocalizedValue(data.user?.name, 'en'),
                    adminEmail: data.user?.email || "",
                    adminPhone: (data.user?.phone || "").replace(/\D/g, "").slice(-10),
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
                // Load existing news cuttings
                if (data.newsCuttings && Array.isArray(data.newsCuttings)) {
                    setExistingNewsCuttings(data.newsCuttings.map((item: any) => ({
                        image: item.image,
                        link: item.link || ""
                    })));
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
        if (!formData) return 0;
        const fields = [
            'name_en', 'category_en', 'description_en', 
            'location_en', 'fullAddress_en', 'phone'
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
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file) {
            if (file.size > MAX_SIZE) {
                toast({ title: "File Too Large", description: `Image "${file.name}" exceeds 5MB limit.`, variant: "destructive" });
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
        const MAX_SIZE = 5 * 1024 * 1024;
        const remaining = 10 - heroPreviews.length;
        if (remaining <= 0) {
            toast({ title: "Gallery Full", description: "Maximum 10 gallery images allowed. Remove some to add more.", variant: "destructive" });
            e.target.value = '';
            return;
        }
        if (files.length > 0) {
            const validFiles = files.filter(f => f.size <= MAX_SIZE).slice(0, remaining);
            if (validFiles.length > 0) {
                setSelectedHeroFiles(prev => [...prev, ...validFiles]);
                const newPreviews = validFiles.map(file => URL.createObjectURL(file));
                setHeroPreviews(prev => [...prev, ...newPreviews]);
            } else if (files.length > 0) {
                toast({ title: "Files Too Large", description: "Selected files exceed 5MB limit.", variant: "destructive" });
            }
            e.target.value = '';
        }
    };

    const removeHeroImage = (index: number) => {
        setHeroPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeGalleryImage = (index: number) => {
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const extractYoutubeId = (url: string): string | null => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
        return match ? match[1] : null;
    };

    const addYoutubeLink = () => {
        const trimmed = newYoutubeUrl.trim();
        if (!trimmed) return;
        const id = extractYoutubeId(trimmed);
        if (!id) {
            toast({ title: "Invalid URL", description: "Please enter a valid YouTube link", variant: "destructive" });
            return;
        }
        if (formData.youtubeLinks.includes(trimmed)) return;
        setFormData({ ...formData, youtubeLinks: [...formData.youtubeLinks, trimmed] });
        setNewYoutubeUrl("");
    };

    const removeYoutubeLink = (index: number) => {
        setFormData({ ...formData, youtubeLinks: formData.youtubeLinks.filter((_: any, i: number) => i !== index) });
    };

    const addOperatingHour = () => {
        setFormData((prev: any) => ({
            ...prev,
            operatingHours: [
                ...prev.operatingHours,
                { label: t("temple_dashboard.profile.new_slot_default") || "New Slot", start: "09:00 AM", end: "05:00 PM", active: true }
            ]
        }));
    };

    const removeOperatingHour = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            operatingHours: prev.operatingHours.filter((_: any, i: number) => i !== index)
        }));
    };

    // News Cutting functions
    const addNewsCutting = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setNewNewsCuttings(prev => [...prev, { file, link: "", preview }]);
            e.target.value = '';
        }
    };

    const removeNewNewsCutting = (index: number) => {
        setNewNewsCuttings(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingNewsCutting = (index: number) => {
        setExistingNewsCuttings(prev => prev.filter((_, i) => i !== index));
    };

    const updateNewNewsCuttingLink = (index: number, link: string) => {
        setNewNewsCuttings(prev => prev.map((item, i) => i === index ? { ...item, link } : item));
    };

    const updateExistingNewsCuttingLink = (index: number, link: string) => {
        setExistingNewsCuttings(prev => prev.map((item, i) => i === index ? { ...item, link } : item));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const fd = new FormData();
            
            Object.keys(formData).forEach(key => {
                if (['operatingHours', 'youtubeLinks'].includes(key)) {
                    fd.append(key, JSON.stringify(formData[key]));
                } else if (!['instagramUrl', 'facebookUrl', 'youtubeUrl'].includes(key)) {
                    fd.append(key, formData[key]);
                }
            });

            // Append social media URLs explicitly
            fd.append('instagramUrl', formData.instagramUrl || '');
            fd.append('facebookUrl', formData.facebookUrl || '');
            fd.append('youtubeUrl', formData.youtubeUrl || '');

            if (selectedMainFile) fd.append('image', selectedMainFile);
            selectedHeroFiles.forEach(file => fd.append('heroImages', file));

            // Handle news cuttings
            fd.append('existingNewsCuttings', JSON.stringify(existingNewsCuttings));
            const newsCuttingLinks = newNewsCuttings.map(n => n.link);
            fd.append('newsCuttingLinks', JSON.stringify(newsCuttingLinks));
            newNewsCuttings.forEach(n => fd.append('newsCuttingImages', n.file));

            const response = await updateMyTempleProfile(fd);
            if (response.success) {
                toast({ 
                    title: "Success", 
                    description: response.pendingApproval ? "Profile saved. Sensitive changes are pending admin approval." : "Profile updated successfully",
                    variant: "success"
                });
                loadProfile();
                setIsEditing(false);
                setSelectedMainFile(null);
                setSelectedHeroFiles([]);
                setNewNewsCuttings([]); // Clear new cuttings after successful save
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
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

            {/* Header / Actions */}
            <div className="flex flex-col gap-4 bg-white/40 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl">
                <div className="flex items-center gap-3 md:gap-6">
                    {/* Completion ring */}
                    <div className="relative w-14 h-14 md:w-20 md:h-20 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8%" fill="transparent" className="text-slate-100" />
                            <motion.circle
                                cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8%" fill="transparent"
                                strokeDasharray={226}
                                initial={{ strokeDashoffset: 226 }}
                                animate={{ strokeDashoffset: 226 * (1 - completeness / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="text-[#7b4623]"
                            />
                        </svg>
                        <span className="absolute text-[11px] md:text-sm font-black text-[#7b4623]">{completeness}%</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 text-[#7b4623] mb-1">
                            <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em]">Verified Temple Profile</span>
                            {JSON.parse(localStorage.getItem('user') || '{}').isStaff && (
                                <Badge variant="outline" className="border-[#7b4623]/20 bg-[#7b4623]/5 text-[#7b4623] text-[8px] font-black tracking-widest px-1.5 py-0">STAFF</Badge>
                            )}
                        </div>
                        <h1 className="text-lg md:text-3xl font-bold font-serif text-slate-900 tracking-tight truncate">{formData.name_en || "Your Temple"}</h1>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium hidden sm:block">{t('admin.temples.list.desc') || "Manage your temple's public identity and information"}</p>
                    </div>
                </div>

                {/* Action buttons - wrap on mobile */}
                <div className="flex flex-wrap items-center gap-2">
                    {!canManage && (
                        <Badge className="bg-slate-100 text-slate-500 border-slate-200 uppercase font-black tracking-widest px-3 py-1.5 rounded-xl text-[9px]">View Only</Badge>
                    )}
                    {!isEditing ? (
                        <>
                            <TempleQrDialog
                                temple={{
                                    id: profile?.id || "",
                                    slug: profile?.slug,
                                    subdomain: profile?.subdomain,
                                    urlType: profile?.urlType,
                                    name: formData.name_en || profile?.name
                                }}
                                buttonLabel="QR Code"
                            />
                            <Button
                                variant="outline"
                                onClick={() => window.open(`${window.location.origin}/temples/${formData.slug || profile?.id}`, '_blank')}
                                className="rounded-xl md:rounded-2xl border-[#7b4623]/20 text-[#7b4623] hover:bg-[#7b4623]/5 shadow-sm px-3 md:px-6 h-9 md:h-10 text-xs md:text-sm"
                            >
                                <Eye className="w-3.5 h-3.5 mr-1 md:mr-2" /> <span className="hidden sm:inline">View Public </span>Profile
                            </Button>
                            {canManage && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-[#7b4623] hover:bg-[#5d351a] text-white px-4 md:px-8 rounded-xl md:rounded-2xl shadow-lg shadow-[#7b4623]/20 transition-all font-bold h-9 md:h-10 text-xs md:text-sm"
                                >
                                    <Settings2 className="w-3.5 h-3.5 mr-1 md:mr-2" /> Edit Profile
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => { setIsEditing(false); loadProfile(); }}
                                className="rounded-xl md:rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 px-4 md:px-8 font-bold h-9 md:h-10 text-xs md:text-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="bg-[#7b4623] hover:bg-[#5d351a] text-white px-5 md:px-10 rounded-xl md:rounded-2xl shadow-lg shadow-[#7b4623]/20 font-bold h-9 md:h-10 text-xs md:text-sm"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 md:mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1 md:mr-2" />}
                                Save Profile
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.form
                        key="edit-form"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
                    >
                        {/* EDIT MODE CONTENT */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Images Section */}
                            <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-[#7b4623]/10 to-transparent p-6 border-b border-white/20">
                                    <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" /> Media Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-8">
                                    {/* Main Image Edit */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Main Profile Photo</Label>
                                        <div 
                                            className="relative aspect-video max-w-sm mx-auto rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50/50 cursor-pointer hover:border-[#7b4623]/30 transition-all group"
                                            onClick={() => mainImageRef.current?.click()}
                                        >
                                            {mainImagePreview ? (
                                                <img src={mainImagePreview} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <Plus className="w-8 h-8" />
                                                    <span className="text-[10px] font-bold">16:9 Ratio</span>
                                                </div>
                                            )}
                                            <input type="file" ref={mainImageRef} className="hidden" accept="image/*" onChange={handleMainImageChange} />
                                        </div>
                                    </div>

                                    {/* Temple Gallery Edit */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex justify-between">
                                            Temple Gallery <span className={heroPreviews.length >= 10 ? "text-red-500" : ""}>{heroPreviews.length}/10</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {heroPreviews.map((p, i) => (
                                                <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
                                                    <img src={p} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeHeroImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {heroPreviews.length < 10 && (
                                                <div 
                                                    onClick={() => heroImagesRef.current?.click()}
                                                    className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-white/80 transition-all"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    <span className="text-[9px] font-bold mt-1">Add Photo</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={heroImagesRef} className="hidden" multiple accept="image/*" onChange={handleHeroImagesChange} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Social & Live */}
                            <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-red-50 to-transparent p-6 border-b border-white/20">
                                    <CardTitle className="text-lg font-serif text-red-600 flex items-center gap-2">
                                        <Play className="w-5 h-5" /> Live & Social
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/40">
                                        <Label className="text-sm font-bold text-slate-700">Live Darshan</Label>
                                        <Switch checked={formData.isLive} onCheckedChange={v => setFormData({...formData, isLive: v})} />
                                    </div>
                                    {formData.isLive && (
                                        <Input value={formData.liveUrl} onChange={e => setFormData({...formData, liveUrl: e.target.value})} placeholder="Streaming URL" className="h-12 rounded-xl" />
                                    )}
                                    <div className="space-y-4 pt-4 border-t">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Social Media & YouTube Gallery</Label>
                                        <div className="space-y-3 pb-3">
                                            <Input 
                                                value={formData.instagramUrl} 
                                                onChange={e => setFormData({...formData, instagramUrl: e.target.value})} 
                                                placeholder="Instagram URL" 
                                                className="h-10 rounded-xl" 
                                            />
                                            <Input 
                                                value={formData.facebookUrl} 
                                                onChange={e => setFormData({...formData, facebookUrl: e.target.value})} 
                                                placeholder="Facebook URL" 
                                                className="h-10 rounded-xl" 
                                            />
                                            <Input 
                                                value={formData.youtubeUrl} 
                                                onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} 
                                                placeholder="YouTube Channel URL" 
                                                className="h-10 rounded-xl" 
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input value={newYoutubeUrl} onChange={e => setNewYoutubeUrl(e.target.value)} placeholder="YouTube Link" className="h-10 rounded-xl" />
                                            <Button type="button" onClick={addYoutubeLink} size="icon" className="bg-red-500 hover:bg-red-600"><Plus className="w-4 h-4"/></Button>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.youtubeLinks.map((link: string, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                                                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">{link}</span>
                                                    <button type="button" onClick={() => removeYoutubeLink(i)} className="text-red-400"><Trash2 className="w-3 h-3"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* News Cuttings */}
                            <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-blue-50 to-transparent p-6 border-b border-white/20">
                                    <CardTitle className="text-lg font-serif text-blue-600 flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> News & Press
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">News Cuttings</Label>
                                    <div className="space-y-3">
                                        {existingNewsCuttings.map((item, i) => (
                                            <div key={i} className="flex gap-2 items-start bg-white/50 p-2 rounded-xl border border-white/40">
                                                <img src={getImageUrl(item.image)} className="w-16 h-16 object-cover rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Input 
                                                        value={item.link} 
                                                        onChange={e => updateExistingNewsCuttingLink(i, e.target.value)} 
                                                        placeholder="External Link" 
                                                        className="h-8 text-xs" 
                                                    />
                                                    <Button type="button" variant="destructive" size="sm" className="h-6 text-[10px] px-2" onClick={() => removeExistingNewsCutting(i)}>Remove</Button>
                                                </div>
                                            </div>
                                        ))}
                                        {newNewsCuttings.map((item, i) => (
                                            <div key={`new-${i}`} className="flex gap-2 items-start bg-white/50 p-2 rounded-xl border border-white/40">
                                                <img src={item.preview} className="w-16 h-16 object-cover rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Input 
                                                        value={item.link} 
                                                        onChange={e => updateNewNewsCuttingLink(i, e.target.value)} 
                                                        placeholder="External Link" 
                                                        className="h-8 text-xs" 
                                                    />
                                                    <Button type="button" variant="destructive" size="sm" className="h-6 text-[10px] px-2" onClick={() => removeNewNewsCutting(i)}>Remove</Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="relative">
                                            <Input type="file" accept="image/*" onChange={addNewsCutting} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-2 bg-transparent hover:bg-slate-50"><Plus className="w-4 h-4" /> Add News Cutting</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column Inputs */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-[#7b4623]/10 to-transparent p-8 border-b border-white/20">
                                    <CardTitle className="text-2xl font-serif text-[#7b4623] flex items-center gap-3">
                                        <User className="w-6 h-6" /> Trustee Identity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Authorized Name</Label>
                                            <Input 
                                                value={formData.adminName} 
                                                onChange={e => setFormData({...formData, adminName: e.target.value})} 
                                                className="h-12 rounded-xl font-bold" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contact Phone</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold border-r border-slate-300 pr-2">+91</span>
                                                <Input 
                                                    value={formData.adminPhone} 
                                                    onChange={e => setFormData({...formData, adminPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                                                    className="h-12 pl-14 rounded-xl font-bold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Email</Label>
                                            <Input 
                                                type="email"
                                                value={formData.adminEmail} 
                                                onChange={e => setFormData({...formData, adminEmail: e.target.value})} 
                                                className="h-12 rounded-xl font-bold" 
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-[10px] font-bold text-emerald-700">
                                        <ShieldCheck className="w-4 h-4" /> Identity credentials are open for updates. Please ensure accuracy for verification.
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-[#7b4623]/10 to-transparent p-8 border-b border-white/20">
                                    <CardTitle className="text-2xl font-serif text-[#7b4623] flex items-center gap-3">
                                        <FileText className="w-6 h-6" /> Sacred Knowledge
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Technical Slug</Label>
                                            <div className="h-12 px-4 bg-white border border-slate-200 rounded-xl flex items-center text-sm font-bold text-slate-400 select-none">
                                                {formData.slug || "N/A"}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vanity Viewers</Label>
                                            <Input 
                                                value={formData.viewers} 
                                                onChange={e => setFormData({...formData, viewers: e.target.value})} 
                                                placeholder="e.g. 10,000+"
                                                className="h-12 rounded-xl font-bold"
                                            />
                                        </div>
                                    </div>

                                    {/* Name & Category */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Temple Name</Label>
                                            <Tabs defaultValue="en">
                                                <TabsList className="bg-slate-100 p-1 rounded-xl h-10 w-full mb-2">
                                                    <TabsTrigger value="en" className="flex-1 text-[10px] font-bold">English</TabsTrigger>
                                                    <TabsTrigger value="hi" className="flex-1 text-[10px] font-bold">हिंदी</TabsTrigger>
                                                    <TabsTrigger value="mr" className="flex-1 text-[10px] font-bold">मराठी</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="en"><Input value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="h-12 rounded-xl" /></TabsContent>
                                                <TabsContent value="hi"><Input value={formData.name_hi} onChange={e => setFormData({...formData, name_hi: e.target.value})} className="h-12 rounded-xl" /></TabsContent>
                                                <TabsContent value="mr"><Input value={formData.name_mr} onChange={e => setFormData({...formData, name_mr: e.target.value})} className="h-12 rounded-xl" /></TabsContent>
                                            </Tabs>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Temple Category</Label>
                                            <Tabs defaultValue="en">
                                                <TabsList className="bg-slate-100 p-1 rounded-xl h-10 w-full mb-2">
                                                    <TabsTrigger value="en" className="flex-1 text-[10px] font-bold">English</TabsTrigger>
                                                    <TabsTrigger value="hi" className="flex-1 text-[10px] font-bold">हिंदी</TabsTrigger>
                                                    <TabsTrigger value="mr" className="flex-1 text-[10px] font-bold">मराठी</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="en"><Input value={formData.category_en} onChange={e => setFormData({...formData, category_en: e.target.value})} className="h-12 rounded-xl" /></TabsContent>
                                                <TabsContent value="hi"><Input value={formData.category_hi} onChange={e => setFormData({...formData, category_hi: e.target.value})} className="h-12 rounded-xl" /></TabsContent>
                                                <TabsContent value="mr"><Input value={formData.category_mr} onChange={e => setFormData({...formData, category_mr: e.target.value})} className="h-12 rounded-xl" /></TabsContent>
                                            </Tabs>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Description / About</Label>
                                        <Tabs defaultValue="en">
                                            <TabsList className="bg-slate-100 p-1 rounded-xl h-10 w-full mb-2">
                                                <TabsTrigger value="en" className="flex-1 text-[10px] font-bold">English</TabsTrigger>
                                                <TabsTrigger value="hi" className="flex-1 text-[10px] font-bold">हिंदी</TabsTrigger>
                                                <TabsTrigger value="mr" className="flex-1 text-[10px] font-bold">मराठी</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="en">
                                                <RichTextEditor 
                                                    value={formData.description_en} 
                                                    onChange={content => setFormData({...formData, description_en: content})} 
                                                    minHeight="150px"
                                                />
                                            </TabsContent>
                                            <TabsContent value="hi">
                                                <RichTextEditor 
                                                    value={formData.description_hi} 
                                                    onChange={content => setFormData({...formData, description_hi: content})} 
                                                    minHeight="150px"
                                                />
                                            </TabsContent>
                                            <TabsContent value="mr">
                                                <RichTextEditor 
                                                    value={formData.description_mr} 
                                                    onChange={content => setFormData({...formData, description_mr: content})} 
                                                    minHeight="150px"
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    </div>

                                    {/* History */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Spiritual History</Label>
                                        <Tabs defaultValue="en">
                                            <TabsList className="bg-slate-100 p-1 rounded-xl h-10 w-full mb-2">
                                                <TabsTrigger value="en" className="flex-1 text-[10px] font-bold">English</TabsTrigger>
                                                <TabsTrigger value="hi" className="flex-1 text-[10px] font-bold">हिंदी</TabsTrigger>
                                                <TabsTrigger value="mr" className="flex-1 text-[10px] font-bold">मराठी</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="en"><Textarea value={formData.history_en} onChange={e => setFormData({...formData, history_en: e.target.value})} className="min-h-[180px] rounded-2xl" /></TabsContent>
                                            <TabsContent value="hi"><Textarea value={formData.history_hi} onChange={e => setFormData({...formData, history_hi: e.target.value})} className="min-h-[180px] rounded-2xl" /></TabsContent>
                                            <TabsContent value="mr"><Textarea value={formData.history_mr} onChange={e => setFormData({...formData, history_mr: e.target.value})} className="min-h-[180px] rounded-2xl" /></TabsContent>
                                        </Tabs>
                                    </div>

                                    {/* Location & Contact */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Location / District</Label>
                                            <Input value={formData.location_en} onChange={e => setFormData({...formData, location_en: e.target.value})} className="h-12 rounded-xl" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Temple Contact No.</Label>
                                            <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl" />
                                        </div>
                                        <div className="space-y-4 md:col-span-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Detailed Address</Label>
                                            <Input value={formData.fullAddress_en} onChange={e => setFormData({...formData, fullAddress_en: e.target.value})} className="h-12 rounded-xl" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Maps URL</Label>
                                            <Input value={formData.mapUrl} onChange={e => setFormData({...formData, mapUrl: e.target.value})} className="h-12 rounded-xl" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Website</Label>
                                            <Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="h-12 rounded-xl" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-[#7b4623]">
                                            <Clock className="w-5 h-5" />
                                            <h3 className="text-sm font-bold uppercase tracking-widest">{t("temple_dashboard.profile.divine_hours") || "Divine Operating Hours"}</h3>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={addOperatingHour}
                                            className="rounded-xl border-[#7b4623]/20 text-[#7b4623] hover:bg-[#7b4623]/5"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> {t("temple_dashboard.profile.add_slot") || "Add Slot"}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {formData.operatingHours.map((hour: any, idx: number) => (
                                            <div key={idx} className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-sm relative group">
                                                {formData.operatingHours.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOperatingHour(idx)}
                                                        className="absolute -top-2 -right-2 bg-white border border-slate-200 shadow-sm rounded-full p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-red-50 hover:scale-110"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 mr-4">
                                                        <Input 
                                                            value={hour.label} 
                                                            onChange={e => {
                                                                const newHours = [...formData.operatingHours];
                                                                newHours[idx].label = e.target.value;
                                                                setFormData({...formData, operatingHours: newHours});
                                                            }}
                                                            className="h-8 border-none bg-transparent font-bold text-slate-700 p-0 focus-visible:ring-0" 
                                                            placeholder={t("temple_dashboard.profile.slot_label") || "Slot Label"}
                                                        />
                                                    </div>
                                                    <Switch 
                                                        checked={hour.active} 
                                                        onCheckedChange={(checked) => {
                                                            const newHours = [...formData.operatingHours];
                                                            newHours[idx].active = checked;
                                                            setFormData({...formData, operatingHours: newHours});
                                                        }} 
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">{t("registration_form.labels.opening") || "Opening"}</span>
                                                        <Input 
                                                            type="time"
                                                            value={(() => {
                                                                if (!hour.start) return "";
                                                                const [time, modifier] = hour.start.split(' ');
                                                                if (!time || !modifier) return "";
                                                                let [hours, minutes] = time.split(':');
                                                                let h = parseInt(hours, 10);
                                                                if (modifier === 'PM' && h < 12) h += 12;
                                                                if (modifier === 'AM' && h === 12) h = 0;
                                                                return `${String(h).padStart(2, '0')}:${minutes}`;
                                                            })()}
                                                            onChange={e => {
                                                                const time24 = e.target.value;
                                                                if (!time24) return;
                                                                let [hours, minutes] = time24.split(':');
                                                                let h = parseInt(hours, 10);
                                                                const modifier = h >= 12 ? 'PM' : 'AM';
                                                                if (h > 12) h -= 12;
                                                                if (h === 0) h = 12;
                                                                const time12 = `${String(h).padStart(2, '0')}:${minutes} ${modifier}`;
                                                                
                                                                const newHours = [...formData.operatingHours];
                                                                newHours[idx].start = time12;
                                                                setFormData({...formData, operatingHours: newHours});
                                                            }}
                                                            className="h-10 rounded-lg text-xs" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">{t("registration_form.labels.closing") || "Closing"}</span>
                                                        <Input 
                                                            type="time"
                                                            value={(() => {
                                                                if (!hour.end) return "";
                                                                const [time, modifier] = hour.end.split(' ');
                                                                if (!time || !modifier) return "";
                                                                let [hours, minutes] = time.split(':');
                                                                let h = parseInt(hours, 10);
                                                                if (modifier === 'PM' && h < 12) h += 12;
                                                                if (modifier === 'AM' && h === 12) h = 0;
                                                                return `${String(h).padStart(2, '0')}:${minutes}`;
                                                            })()}
                                                            onChange={e => {
                                                                const time24 = e.target.value;
                                                                if (!time24) return;
                                                                let [hours, minutes] = time24.split(':');
                                                                let h = parseInt(hours, 10);
                                                                const modifier = h >= 12 ? 'PM' : 'AM';
                                                                if (h > 12) h -= 12;
                                                                if (h === 0) h = 12;
                                                                const time12 = `${String(h).padStart(2, '0')}:${minutes} ${modifier}`;
                                                                
                                                                const newHours = [...formData.operatingHours];
                                                                newHours[idx].end = time12;
                                                                setFormData({...formData, operatingHours: newHours});
                                                            }}
                                                            className="h-10 rounded-lg text-xs" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Logistics */}
                            <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#0070F3]/5 border-dashed border-[#0070F3]/30 backdrop-blur-sm">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-lg font-serif text-[#0070F3] flex items-center gap-2">
                                        <Truck className="w-5 h-5" /> Logistical Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-4 pt-0">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0070F3] ml-1">Shiprocket Pickup Nickname</Label>
                                        <Input value={formData.pickupLocation} onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })} className="h-14 border-[#0070F3]/20 bg-white border-2 focus:border-[#0070F3] rounded-2xl font-bold px-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.form>
                ) : (
                    <motion.div
                        key="view-profile"
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-8"
                    >
                        {/* VIEW MODE CONTENT */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Side: Images & Quick Stats */}
                            <div className="lg:col-span-1 space-y-8">
                                <Card className="overflow-hidden border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] max-w-sm mx-auto">
                                    <div className="relative aspect-video">
                                        <img src={mainImagePreview || "https://placehold.co/600x600?text=No+Image"} className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                            <h2 className="text-2xl font-bold text-white font-serif">{formData.name_en}</h2>
                                            <p className="text-white/80 text-xs font-medium flex items-center gap-1.5"><MapPin className="w-3 h-3 text-white"/> {formData.location_en}</p>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 grid grid-cols-2 gap-4">
                                        <div className="bg-white/50 p-4 rounded-2xl border border-white space-y-1 text-center">
                                            <Eye className="w-4 h-4 mx-auto text-[#7b4623] mb-1"/>
                                            <p className="text-[10px] font-black uppercase text-slate-400">Viewers</p>
                                            <p className="text-sm font-bold text-slate-800">{formData.viewers || "0+"}</p>
                                        </div>
                                        <div className="bg-white/50 p-4 rounded-2xl border border-white space-y-1 text-center">
                                            <ImageIcon className="w-4 h-4 mx-auto text-[#7b4623] mb-1"/>
                                            <p className="text-[10px] font-black uppercase text-slate-400">Gallery</p>
                                            <p className="text-sm font-bold text-slate-800">{heroPreviews.length} / 10</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Gallery Preview */}
                                {heroPreviews.length > 0 && (
                                    <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden p-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#7b4623] mb-4">Temple Gallery ({heroPreviews.length}/10)</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {heroPreviews.slice(0, 4).map((p, i) => (
                                                <div key={i} className="aspect-video rounded-xl overflow-hidden shadow-sm relative">
                                                    <img src={p} className="w-full h-full object-cover" />
                                                    {i === 3 && heroPreviews.length > 4 && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">+{heroPreviews.length - 4}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* YouTube Quick Links */}
                                {formData.youtubeLinks.length > 0 && (
                                    <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden p-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
                                            <Video className="w-3 h-3" /> Spiritual Videos
                                        </h3>
                                        <div className="space-y-3">
                                            {formData.youtubeLinks.slice(0, 3).map((link: string, i: number) => {
                                                const vidId = extractYoutubeId(link);
                                                return (
                                                    <div key={i} className="flex items-center gap-3 bg-white/40 p-2 rounded-xl border border-white/50">
                                                        <div className="w-12 h-8 rounded bg-black shrink-0 overflow-hidden relative group">
                                                            {vidId && <img src={`https://img.youtube.com/vi/${vidId}/0.jpg`} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-600 truncate">{link}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                )}

                                {/* Social Links in View Mode */}
                                {(formData.instagramUrl || formData.facebookUrl || formData.youtubeUrl) && (
                                    <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden p-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#7b4623] mb-4 flex items-center gap-2">
                                            <Link2 className="w-3 h-3" /> Connect With Us
                                        </h3>
                                        <div className="space-y-2">
                                            {formData.instagramUrl && (
                                                <a href={formData.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#7b4623] transition-colors p-2 rounded-xl hover:bg-white/40">
                                                    <FaInstagram className="w-4 h-4" /> Instagram
                                                </a>
                                            )}
                                            {formData.facebookUrl && (
                                                <a href={formData.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#7b4623] transition-colors p-2 rounded-xl hover:bg-white/40">
                                                    <FaFacebook className="w-4 h-4" /> Facebook
                                                </a>
                                            )}
                                            {formData.youtubeUrl && (
                                                <a href={formData.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#7b4623] transition-colors p-2 rounded-xl hover:bg-white/40">
                                                    <FaYoutube className="w-4 h-4" /> YouTube Channel
                                                </a>
                                            )}
                                        </div>
                                    </Card>
                                )}
                            </div>

                            {/* Right Side: Detailed Sections */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Commission & Platform Fee Rates Card */}
                                <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-amber-950/10 via-[#7b4623]/10 to-transparent p-6 md:p-8 border-b border-white/20">
                                        <CardTitle className="text-xl md:text-2xl font-serif text-[#7b4623] flex items-center justify-between">
                                            <span className="flex items-center gap-3">
                                                <BadgeIcon className="w-6 h-6 text-[#7b4623]" /> Commission & Platform Fee Rates
                                            </span>
                                            <Badge variant="outline" className="bg-amber-50 text-[#7b4623] border-amber-200 text-xs px-3 py-1">
                                                Active Rates
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="text-xs md:text-sm text-slate-500 mt-1">
                                            Transparent breakdown of platform commission percentages, fixed rates, and price-based slabs for your temple.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 md:p-8 space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Pooja Commission</span>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-2xl font-black text-[#7b4623]">{profile?.poojaCommissionRate ?? 5.0}%</span>
                                                    <span className="text-xs text-slate-500 font-medium">per booking</span>
                                                </div>
                                            </div>
                                            <div className="bg-orange-50/70 border border-orange-200/80 p-4 rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 block">Marketplace Commission</span>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-2xl font-black text-orange-700">{profile?.productCommissionRate ?? 10.0}%</span>
                                                    <span className="text-xs text-slate-500 font-medium">per item</span>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Prasad Fee / Price</span>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-2xl font-black text-emerald-700">₹{profile?.prasadPrice ?? 0}</span>
                                                    <span className="text-xs text-slate-500 font-medium">base fee</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                Transaction Volume Commission Slabs
                                            </h4>
                                            {(!profile?.commissionSlabs || profile.commissionSlabs.length === 0) ? (
                                                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-500 italic">
                                                    Standard platform commission slabs apply.
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                                                    <table className="w-full text-left text-xs">
                                                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                                            <tr>
                                                                <th className="p-3">Amount Range</th>
                                                                <th className="p-3">Category</th>
                                                                <th className="p-3">Commission %</th>
                                                                <th className="p-3">Platform Fee</th>
                                                                <th className="p-3">Mode</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                            {profile.commissionSlabs.map((slab: any, idx: number) => (
                                                                <tr key={slab.id || idx} className="hover:bg-slate-50/50">
                                                                    <td className="p-3 font-semibold text-slate-900">
                                                                        ₹{slab.minAmount} {slab.maxAmount ? ` - ₹${slab.maxAmount}` : '+'}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                                                            {slab.category || 'ALL'}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="p-3 font-bold text-[#7b4623]">
                                                                        {slab.percentage}%
                                                                    </td>
                                                                    <td className="p-3 font-bold text-slate-900">
                                                                        ₹{slab.platformFee || 0}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                            slab.isOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                                                        }`}>
                                                                            {slab.isOffline ? 'Offline' : 'Online'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Sacred Knowledge View */}
                                <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-[#7b4623]/10 to-transparent p-8 border-b border-white/20">
                                        <CardTitle className="text-2xl font-serif text-[#7b4623] flex items-center gap-3">
                                            <FileText className="w-6 h-6" /> Sacred Knowledge
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-10">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-[#7b4623]/40">
                                                About the Temple
                                            </h3>
                                            <div 
                                                className="text-slate-700 leading-relaxed text-lg font-serif border-l-4 border-[#7b4623]/20 pl-6 prose prose-slate max-w-none"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: formData.description_en || "No description provided yet." 
                                                }} 
                                            />
                                        </div>

                                        {formData.history_en && (
                                            <div className="space-y-4 pt-8 border-t border-slate-100">
                                                <div className="flex items-center gap-2 text-[#7b4623] mb-4">
                                                    <History className="w-5 h-5" />
                                                    <h3 className="text-lg font-bold">Spiritual History</h3>
                                                </div>
                                                <div className="text-slate-600 leading-relaxed whitespace-pre-line text-sm bg-stone-50/50 p-6 rounded-3xl border border-stone-100">
                                                    {formData.history_en}
                                                </div>
                                            </div>
                                        )}

                                        {/* News Cuttings View */}
                                        {existingNewsCuttings.length > 0 && (
                                            <div className="space-y-4 pt-8 border-t border-slate-100">
                                                <h3 className="text-lg font-bold text-[#7b4623] flex items-center gap-2">
                                                    <FileText className="w-5 h-5" /> News & Press Coverage
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {existingNewsCuttings.map((item, i) => (
                                                        <div key={i} className="group relative">
                                                            <img src={getImageUrl(item.image)} className="w-full aspect-video object-cover rounded-2xl" />
                                                            {item.link && (
                                                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white">
                                                                    <ExternalLink className="w-6 h-6" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Logistics & Admin */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Card className="border-white/20 bg-white/60 backdrop-blur-sm shadow-xl rounded-[2.5rem]">
                                        <CardContent className="p-8 space-y-6">
                                            <div className="flex items-center gap-2 font-bold text-slate-800">
                                                <User className="w-5 h-5 text-[#7b4623]" /> Trustee Identity
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><ShieldCheck className="w-5 h-5"/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-400">Main Admin</p>
                                                        <p className="text-sm font-bold">{formData.adminName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#7b4623]/5 flex items-center justify-center text-[#7b4623]"><Mail className="w-5 h-5"/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-400">Official Email</p>
                                                        <p className="text-sm font-bold truncate max-w-[180px]">{formData.adminEmail}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-[10px] font-bold text-emerald-700">
                                                <ShieldCheck className="w-4 h-4" /> Changes to Trustee info take effect immediately and notify our admin team.
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-xl bg-blue-600 rounded-[2.5rem] text-white">
                                        <CardContent className="p-8 space-y-6">
                                            <div className="flex items-center gap-2 font-bold">
                                                <Truck className="w-5 h-5" /> Fulfillment
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-white/60">Shiprocket Pickup Name</p>
                                                <p className="text-xl font-bold mt-1 tracking-wider">{formData.pickupLocation || "D-BHAKTI_TEMPLE_A1"}</p>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-2xl text-[10px] font-medium leading-relaxed italic">
                                                This identity connects your temple logistics to global shipping networks.
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Cropper */}
            <AnimatePresence>
                {showCropper && tempImage && (
                    <ImageCropper
                        image={tempImage}
                        onCropComplete={handleCropComplete}
                        onCancel={() => { setShowCropper(false); setTempImage(null); }}
                        initialAspect={initialAspect}
                        lockAspect={true}
                        title={cropTitle}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
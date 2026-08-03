"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    Layout,
    Building2,
    MapPin,
    Clock,
    ImageIcon,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Video,
    Play,
    FileText ,
    Link as LinkIcon
} from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

import axios from "axios";
import { checkPhoneGlobal, checkEmailExists, checkInstitutionPhone } from "@/api/authController";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, Language } from "@/context/LanguageContext";
import { parseLocalizedValue } from "@/utils/textUtils";
import { API_URL } from "@/config/apiConfig";
import { fetchCommissionSlabsAdmin } from "@/api/adminController";

interface TempleFormProps {
    mode: "create" | "edit";
    initialData?: any;
    onSubmit: (formData: FormData) => Promise<void>;
    isLoading: boolean;
    allPoojas: any[];
    onAddMasterPooja?: (name: string) => Promise<string | null>;
}

export function TempleForm({
    mode,
    initialData,
    onSubmit,
    isLoading,
    allPoojas,
    onAddMasterPooja
}: TempleFormProps) {
    const { t, language } = useLanguage();
    const { toast } = useToast();
    // Local language tab for the form — independent of global app language
    const [activeFormLang, setActiveFormLang] = useState<Language>('en');
    const router = useRouter();

    // Form State
    const [formData, setFormData] = useState({
        adminName_en: "",
        adminName_hi: "",
        adminName_mr: "",
        email: "",
        phone: "",
        name_en: "",
        name_hi: "",
        name_mr: "",
        location_en: "",
        location_hi: "",
        location_mr: "",
        fullAddress_en: "",
        fullAddress_hi: "",
        fullAddress_mr: "",
        category_en: "",
        category_hi: "",
        category_mr: "",

        description_en: "",
        description_hi: "",
        description_mr: "",
        history_en: "",
        history_hi: "",
        history_mr: "",
        pickupLocation_en: "",
        pickupLocation_hi: "",
        pickupLocation_mr: "",
        openTime: "",
        viewers: "",
        templePhone: "",
        website: "",
        mapUrl: "",
        rating: "0",
        reviewsCount: "0",
        slug: "",
        subdomain: "",
        urlType: "slug",
        isActive: "true",
        liveStatus: "false",
        poojaCommissionRate: "5.0",
        productCommissionRate: "10.0",
        prasadPrice: "0",
        instagramUrl: "",
        facebookUrl: "",
        youtubeUrl: "",
        operatingHours: [
            { label: "Morning", start: "07:00 AM", end: "01:00 PM", active: true },
            { label: "Evening", start: "05:00 PM", end: "10:00 PM", active: true }
        ],
    });

    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [inlineEvents, setInlineEvents] = useState<any[]>([]);
    const [marketplaceSlabs, setMarketplaceSlabs] = useState<any[]>([]);
    const [poojaSlabs, setPoojaSlabs] = useState<any[]>([]);
    const [marketplaceRateType, setMarketplaceRateType] = useState<"DEFAULT" | "CUSTOM">("DEFAULT");
    const [poojaRateType, setPoojaRateType] = useState<"DEFAULT" | "CUSTOM">("DEFAULT");

    // Inline Validation States
    const [phoneValidation, setPhoneValidation] = useState<any>({ status: "idle", message: "" });
    const [emailValidation, setEmailValidation] = useState<any>({ status: "idle", message: "" });

    // Images State
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>("");
    const [existingMainImage, setExistingMainImage] = useState<string>("");
    const [heroImages, setHeroImages] = useState<File[]>([]);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
    const [existingHeroImages, setExistingHeroImages] = useState<string[]>([]);

    // YouTube Links State
    const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
    const [existingYoutubeLinks, setExistingYoutubeLinks] = useState<string[]>([]);
    const [newYoutubeUrl, setNewYoutubeUrl] = useState("");

    // News Cuttings State
    const [existingNewsCuttings, setExistingNewsCuttings] = useState<{ image: string; link: string }[]>([]);
    const [newNewsCuttings, setNewNewsCuttings] = useState<{ file: File; preview: string; link: string }[]>([]);

    // Cropping State
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [cropType, setCropType] = useState<"main" | "hero">("main");
    const [cropTitle, setCropTitle] = useState("Crop Image");
    const [initialAspect, setInitialAspect] = useState(16 / 9);

    const [newPoojaName, setNewPoojaName] = useState("");
    const [isAddingPooja, setIsAddingPooja] = useState(false);

    useEffect(() => {
        if (mode === "edit" && initialData) {
            const stripPrefix = (ph: string) => {
                if (!ph) return "";
                let clean = ph.replace(/\D/g, '');
                if (clean.length === 12 && clean.startsWith('91')) return clean.substring(2);
                return clean;
            };

            const tData = initialData.temple || {};
            
            // Helper to get lang value safely from both old (string) and new (json) formats
            const getL = (field: any, lang: string, fallback: string = "") => {
                if (!field) return fallback;
                if (typeof field === "object") return field[lang] || fallback;
                if (typeof field === "string") {
                    try {
                        const parsed = JSON.parse(field);
                        if (typeof parsed === "object" && parsed !== null) {
                            return parsed[lang] || fallback;
                        }
                    } catch (e) {
                        // ignore JSON parse errors, treat as a normal string
                    }
                }
                if (lang === "en") return field; // Old format fallback
                return fallback;
            };

            setFormData({
                adminName_en: getL(initialData.name, "en"),
                adminName_hi: getL(initialData.name, "hi"),
                adminName_mr: getL(initialData.name, "mr"),
                email: initialData.email || "",
                phone: stripPrefix(initialData.phone || ""),
                name_en: getL(tData.name, "en"),
                name_hi: getL(tData.name, "hi"),
                name_mr: getL(tData.name, "mr"),
                location_en: getL(tData.location, "en"),
                location_hi: getL(tData.location, "hi"),
                location_mr: getL(tData.location, "mr"),
                fullAddress_en: getL(tData.fullAddress, "en"),
                fullAddress_hi: getL(tData.fullAddress, "hi"),
                fullAddress_mr: getL(tData.fullAddress, "mr"),
                category_en: getL(tData.category, "en"),
                category_hi: getL(tData.category, "hi"),
                category_mr: getL(tData.category, "mr"),
                description_en: getL(tData.description, "en"),
                description_hi: getL(tData.description, "hi"),
                description_mr: getL(tData.description, "mr"),
                history_en: getL(tData.history, "en"),
                history_hi: getL(tData.history, "hi"),
                history_mr: getL(tData.history, "mr"),
                pickupLocation_en: getL(tData.pickupLocation, "en"),
                pickupLocation_hi: getL(tData.pickupLocation, "hi"),
                pickupLocation_mr: getL(tData.pickupLocation, "mr"),
                viewers: tData.viewers || "",
                templePhone: stripPrefix(tData.phone || ""),
                website: tData.website || "",
                mapUrl: tData.mapUrl || "",
                rating: String(tData.rating || "0"),
                reviewsCount: String(tData.reviewsCount || "0"),
                slug: tData.slug || "",
                subdomain: tData.subdomain || "",
                urlType: tData.urlType || "slug",
                isActive: String(tData.isActive ?? true),
                liveStatus: String(tData.liveStatus || false),
                poojaCommissionRate: String(tData.poojaCommissionRate || "5.0"),
                productCommissionRate: String(tData.productCommissionRate || "10.0"),
                prasadPrice: String(tData.prasadPrice || "0"),
                instagramUrl: tData.instagramUrl || "",
                facebookUrl: tData.facebookUrl || "",
                youtubeUrl: tData.youtubeUrl || "",
                openTime: tData.openTime || "",
                operatingHours: tData.operatingHours || [
                    { label: "Morning", start: "07:00 AM", end: "01:00 PM", active: true },
                    { label: "Evening", start: "05:00 PM", end: "10:00 PM", active: true }
                ],
            });

            setExistingMainImage(tData.image || "");
            setExistingHeroImages(tData.heroImages || []);
            setExistingYoutubeLinks(tData.youtubeLinks || []);

            // Load existing news cuttings
            if (tData.newsCuttings && Array.isArray(tData.newsCuttings)) {
                setExistingNewsCuttings(tData.newsCuttings);
            }

            if (tData.poojas) {
                setSelectedPoojaIds(tData.poojas.map((p: any) => p.masterPoojaId || p.id));
            }

            if (tData.events) {
                setInlineEvents(tData.events.map((ev: any) => ({
                    name: ev.name,
                    date: ev.date,
                    description: ev.description || ""
                })));
            }
            
            // Load existing slabs
            if (tData.id) {
                // Slabs are usually fetched via a separate API call. 
            }
        }
    }, [mode, initialData]);

    // Fetch slabs if in edit mode
    useEffect(() => {
        if (mode === "edit" && initialData?.temple?.id) {
            loadSlabs(initialData.temple.id);
        } else if (mode === "create") {
            loadGlobalSlabs();
        }
    }, [mode, initialData]);

    const loadGlobalSlabs = async () => {
        try {
            const mRes = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE');
            if (mRes.success) setMarketplaceSlabs(mRes.data);
            const pRes = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA');
            if (pRes.success) setPoojaSlabs(pRes.data);
        } catch (e) {
            console.error("Error loading global slabs", e);
        }
    };

    const loadSlabs = async (templeId: string) => {
        try {
            const mRes = await fetchCommissionSlabsAdmin('TEMPLE', templeId, 'MARKETPLACE');
            if (mRes.success && mRes.data.length > 0) {
                const dedupe = (list: any[]) => list.filter((s, i, self) => i === self.findIndex(t => t.minAmount === s.minAmount));
                setMarketplaceSlabs(dedupe(mRes.data));
                setMarketplaceRateType("CUSTOM");
            } else {
                const globalM = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE');
                if (globalM.success) setMarketplaceSlabs(globalM.data);
            }

            const pRes = await fetchCommissionSlabsAdmin('TEMPLE', templeId, 'POOJA');
            if (pRes.success && pRes.data.length > 0) {
                const dedupe = (list: any[]) => list.filter((s, i, self) => i === self.findIndex(t => t.minAmount === s.minAmount));
                setPoojaSlabs(dedupe(pRes.data));
                setPoojaRateType("CUSTOM");
            } else {
                const globalP = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA');
                if (globalP.success) setPoojaSlabs(globalP.data);
            }
        } catch (e) {
            console.error("Error loading temple slabs", e);
        }
    };

    const handleMarketplaceRateTypeChange = async (checked: boolean) => {
        const newType = checked ? "CUSTOM" : "DEFAULT";
        setMarketplaceRateType(newType);
        if (newType === "DEFAULT") {
            const res = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE');
            if (res.success) setMarketplaceSlabs(res.data);
        }
    };

    const handlePoojaRateTypeChange = async (checked: boolean) => {
        const newType = checked ? "CUSTOM" : "DEFAULT";
        setPoojaRateType(newType);
        if (newType === "DEFAULT") {
            const res = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA');
            if (res.success) setPoojaSlabs(res.data);
        }
    };

    // -------- Validation Handlers --------
    const handlePhoneBlur = async () => {
        if (mode === "edit") return; // Skip validation in edit mode for simplicity or different logic
        if (!formData.phone || formData.phone.length < 10) return;

        setPhoneValidation({ status: "checking", message: "" });
        try {
            const response = await checkInstitutionPhone(formData.phone);
            if (response.isInstitutionRegistered) {
                setPhoneValidation({ status: "error", message: "A Temple/Institution account already exists with this phone number." });
            } else {
                setPhoneValidation({ status: "ok", message: "Number is available for Temple registration." });
            }
        } catch {
            setPhoneValidation({ status: "idle", message: "" });
        }
    };

    const handleEmailBlur = async () => {
        if (mode === "edit") return;
        if (!formData.email || !formData.email.includes("@")) return;

        setEmailValidation({ status: "checking", message: "" });
        try {
            const result = await checkEmailExists(formData.email, 'INSTITUTION');
            if (result.exists) {
                setEmailValidation({ status: "error", message: "A Temple/Institution account already exists with this email address." });
            } else {
                setEmailValidation({ status: "ok", message: "Email is available for Temple registration." });
            }
        } catch {
            setEmailValidation({ status: "idle", message: "" });
        }
    };

    const renderFieldFeedback = (validation: any) => {
        if (validation.status === "idle") return null;
        if (validation.status === "checking") return <p className="text-[10px] text-slate-500 mt-1 animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Checking...</p>;
        if (validation.status === "error") return <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {validation.message}</p>;
        if (validation.status === "ok") return <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {validation.message}</p>;
        return null;
    };

    const getFullImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setCropType("main");
                setCropTitle(t('registration_form.crop_modal.profile_title'));
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
            setHeroImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setHeroPreviews(prev => [...prev, ...newPreviews]);
            e.target.value = '';
        }
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

    const removeHeroImage = (index: number, isExisting: boolean) => {
        if (isExisting) {
            setExistingHeroImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setHeroImages(prev => prev.filter((_, i) => i !== index));
            setHeroPreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    // YouTube helpers
    const extractYoutubeId = (url: string): string | null => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
        return match ? match[1] : null;
    };

    const addYoutubeLink = () => {
        const trimmed = newYoutubeUrl.trim();
        if (!trimmed) return;
        const id = extractYoutubeId(trimmed);
        if (!id) {
            toast({ title: "Invalid YouTube URL", description: "Please enter a valid YouTube watch or share link.", variant: "destructive" });
            return;
        }
        const allLinks = [...existingYoutubeLinks, ...youtubeLinks];
        if (allLinks.some(l => extractYoutubeId(l) === id)) {
            toast({ title: "Already Added", description: "This video is already in the list.", variant: "destructive" });
            return;
        }
        setYoutubeLinks(prev => [...prev, trimmed]);
        setNewYoutubeUrl("");
    };

    const removeYoutubeLink = (index: number, isExisting: boolean) => {
        if (isExisting) {
            setExistingYoutubeLinks(prev => prev.filter((_, i) => i !== index));
        } else {
            setYoutubeLinks(prev => prev.filter((_, i) => i !== index));
        }
    };

    const togglePooja = (id: string) => {
        setSelectedPoojaIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleAddNewMasterPooja = async () => {
        if (!newPoojaName.trim() || !onAddMasterPooja) return;
        setIsAddingPooja(true);
        try {
            const newId = await onAddMasterPooja(newPoojaName.trim());
            if (newId) {
                setNewPoojaName("");
                setSelectedPoojaIds(prev => [...prev, newId]);
            }
        } finally {
            setIsAddingPooja(false);
        }
    };

    const addOperatingHour = () => {
        setFormData(prev => ({
            ...prev,
            operatingHours: [
                ...prev.operatingHours,
                { label: "New Slot", start: "09:00 AM", end: "05:00 PM", active: true }
            ]
        }));
    };

    const removeOperatingHour = (index: number) => {
        setFormData(prev => ({
            ...prev,
            operatingHours: prev.operatingHours.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        
        Object.entries(formData).forEach(([key, value]) => {
            if (Array.isArray(value) || typeof value === 'object') {
                fd.append(key, JSON.stringify(value));
            } else {
                fd.append(key, String(value));
            }
        });

        fd.append("poojaIds", JSON.stringify(selectedPoojaIds));
        fd.append("inlineEvents", JSON.stringify(inlineEvents));
        
        if (mainImage) fd.append("image", mainImage);
        heroImages.forEach(file => fd.append("heroImages", file));
        
        // YouTube links — merge existing + new
        const allYoutubeLinks = [...existingYoutubeLinks, ...youtubeLinks];
        fd.append("youtubeLinks", JSON.stringify(allYoutubeLinks));

        // News Cuttings — pass existing as JSON, new images as files
        fd.append("existingNewsCuttings", JSON.stringify(existingNewsCuttings));
        newNewsCuttings.forEach(nc => {
            fd.append("newsCuttingImages", nc.file);
            fd.append("newsCuttingLinks", nc.link || "");
        });

        if (mode === "edit") {
            fd.append("existingHeroImages", JSON.stringify(existingHeroImages));
        }

        // Combine both slab types for backend, but ONLY if they are CUSTOM
        const combinedSlabs = [
            ...(marketplaceRateType === 'CUSTOM' ? marketplaceSlabs.map(s => ({ ...s, category: 'MARKETPLACE' })) : []),
            ...(poojaRateType === 'CUSTOM' ? poojaSlabs.map(s => ({ ...s, category: 'POOJA' })) : [])
        ];
        fd.append("commissionSlabs", JSON.stringify(combinedSlabs));

        await onSubmit(fd);
    };

    return (
        <>
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

            <Tabs value={activeFormLang} onValueChange={(v) => setActiveFormLang(v as Language)} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="en">English (EN)</TabsTrigger>
                        <TabsTrigger value="hi">हिंदी (HI)</TabsTrigger>
                        <TabsTrigger value="mr">मराठी (MR)</TabsTrigger>
                    </TabsList>
                    <Button 
                        type="submit" 
                        form="temple-form"
                        size="lg" 
                        disabled={isLoading} 
                        className="px-8 rounded-full font-bold shadow-sm w-full sm:w-auto"
                    >
                        {isLoading ? "Processing..." : (mode === "create" ? "Create Temple Account" : "Save Changes")}
                    </Button>
                </div>

                <form id="temple-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Multilingual Contents */}
                    {["en", "hi", "mr"].map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-8 mt-0">
                            
                            {/* Account Identity */}
                            <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Layout className="w-5 h-5" />
                                    <h2 className="text-xl">{t('registration_form.sections.admin')}</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            {t('registration_form.labels.admin_name')} {lang === 'en' ? '' : lang === 'hi' ? '(Hindi)' : '(Marathi)'}
                                        </label>
                                        <Input
                                            value={lang === "en" ? formData.adminName_en : lang === "hi" ? formData.adminName_hi : formData.adminName_mr}
                                            onChange={e => {
                                                if (lang === "en") setFormData({ ...formData, adminName_en: e.target.value });
                                                else if (lang === "hi") setFormData({ ...formData, adminName_hi: e.target.value });
                                                else setFormData({ ...formData, adminName_mr: e.target.value });
                                            }}
                                            placeholder={`${t('registration_form.placeholders.admin_name')} (${lang.toUpperCase()})`}
                                            required={lang === "en"}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">{t('registration_form.labels.email')}</label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => {
                                                setFormData({ ...formData, email: e.target.value });
                                                if(emailValidation.status !== 'idle') setEmailValidation({status:'idle', message:''});
                                            }}
                                            onBlur={handleEmailBlur}
                                            placeholder={t('registration_form.placeholders.email')}
                                            className={emailValidation.status === 'error' ? 'border-red-300' : emailValidation.status === 'ok' ? 'border-emerald-300' : ''}
                                        />
                                        {renderFieldFeedback(emailValidation)}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">{t('registration_form.labels.phone')}</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold border-r border-slate-300 pr-2">+91</span>
                                            <Input
                                                type="tel"
                                                maxLength={10}
                                                value={formData.phone}
                                                onChange={e => {
                                                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') });
                                                    if(phoneValidation.status !== 'idle') setPhoneValidation({status:'idle', message:''});
                                                }}
                                                onBlur={handlePhoneBlur}
                                                placeholder="10-digit number"
                                                className={`pl-14 ${phoneValidation.status === 'error' ? 'border-red-300' : phoneValidation.status === 'ok' ? 'border-emerald-300' : ''}`}
                                                 required
                                            />
                                        </div>
                                        {renderFieldFeedback(phoneValidation)}
                                    </div>
                                </div>
                            </div>

                            {/* Temple Profile */}
                            <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Building2 className="w-5 h-5" />
                                    <h2 className="text-xl">{t('registration_form.sections.profile')}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            {t('registration_form.labels.temple_name')} {lang === 'en' ? '*' : '(Optional)'}
                                        </label>
                                        <Input
                                            value={(formData as any)[`name_${lang}`]}
                                            onChange={e => setFormData({ ...formData, [`name_${lang}`]: e.target.value })}
                                            placeholder={t('registration_form.placeholders.temple_name')}
                                            required={lang === 'en'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            {t('registration_form.labels.location')} {lang === 'en' ? '*' : ''}
                                        </label>
                                        <Input
                                            value={(formData as any)[`location_${lang}`]}
                                            onChange={e => setFormData({ ...formData, [`location_${lang}`]: e.target.value })}
                                            placeholder={t('registration_form.placeholders.location')}
                                            required={lang === 'en'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">
                                            {t('registration_form.labels.category')} {lang === 'en' ? '*' : ''}
                                        </label>
                                        <Input
                                            value={(formData as any)[`category_${lang}`]}
                                            onChange={e => setFormData({ ...formData, [`category_${lang}`]: e.target.value })}
                                            placeholder={t('registration_form.placeholders.category')}
                                            required={lang === 'en'}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-full">
                                        <label className="text-sm font-semibold text-slate-700">{t('registration_form.labels.address')}</label>
                                        <Input
                                            value={(formData as any)[`fullAddress_${lang}`]}
                                            onChange={e => setFormData({ ...formData, [`fullAddress_${lang}`]: e.target.value })}
                                            placeholder={t('registration_form.placeholders.address')}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-full">
                                        <label className="text-sm font-semibold text-slate-700">{t('registration_form.labels.description')}</label>
                                        <RichTextEditor
                                            value={(formData as any)[`description_${lang}`]}
                                            onChange={(html) => setFormData({ ...formData, [`description_${lang}`]: html })}
                                            placeholder={t('registration_form.placeholders.description')}
                                            minHeight="120px"
                                            maxLength={5000}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Temple Phone</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold border-r border-slate-300 pr-2">+91</span>
                                            <Input
                                                maxLength={10}
                                                value={formData.templePhone}
                                                onChange={e => setFormData({ ...formData, templePhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                                placeholder="10-digit number"
                                                className="pl-14"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Website</label>
                                        <Input
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Map URL</label>
                                        <Input
                                            value={formData.mapUrl}
                                            onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                                            placeholder="Google Maps URL"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Viewers</label>
                                        <Input
                                            value={formData.viewers}
                                            onChange={e => setFormData({ ...formData, viewers: e.target.value })}
                                            placeholder="e.g. 10000+"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Reviews Count</label>
                                        <Input
                                            type="number"
                                            value={formData.reviewsCount}
                                            onChange={e => setFormData({ ...formData, reviewsCount: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Social Media Links — only shown on English tab */}
                                    {lang === 'en' && (
                                        <>
                                            <div className="md:col-span-2">
                                                <Separator className="my-2" />
                                                <p className="text-xs font-black uppercase tracking-wider text-slate-500 mt-4 mb-3">Social Media Profiles</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <span className="text-pink-500">📸</span> Instagram URL
                                                </label>
                                                <Input
                                                    value={formData.instagramUrl}
                                                    onChange={e => setFormData({ ...formData, instagramUrl: e.target.value })}
                                                    placeholder="https://www.instagram.com/..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <span className="text-blue-600">📘</span> Facebook URL
                                                </label>
                                                <Input
                                                    value={formData.facebookUrl}
                                                    onChange={e => setFormData({ ...formData, facebookUrl: e.target.value })}
                                                    placeholder="https://www.facebook.com/..."
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <span className="text-red-500">▶️</span> YouTube Channel URL
                                                </label>
                                                <Input
                                                    value={formData.youtubeUrl}
                                                    onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })}
                                                    placeholder="https://www.youtube.com/@channel"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Available Poojas */}
                            <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Layout className="w-5 h-5" />
                                    <h2 className="text-xl">{t('registration_form.sections.available_poojas') || 'Available Poojas'}</h2>
                                </div>
                                <p className="text-sm text-slate-500">{t('registration_form.sections.available_poojas_subtitle') || 'Select poojas that are performed at this temple.'}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allPoojas && allPoojas.length > 0 ? allPoojas.map((pooja) => {
                                        const poojaId = pooja.masterPoojaId || pooja.id;
                                        const poojaName = parseLocalizedValue(pooja.name, activeFormLang) || pooja.name_en || pooja.name || "Unnamed Pooja";
                                        const poojaCategory = parseLocalizedValue(pooja.category, activeFormLang) || pooja.category || "";
                                        return (
                                            <label
                                                key={poojaId}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                    selectedPoojaIds.includes(poojaId)
                                                        ? "border-orange-500 bg-orange-50/50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="flex h-5 items-center mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                                        checked={selectedPoojaIds.includes(poojaId)}
                                                        onChange={() => togglePooja(poojaId)}
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="font-semibold text-sm text-slate-900 leading-tight">
                                                        {poojaName}
                                                    </span>
                                                    {poojaCategory && (
                                                        <span className="text-xs text-slate-500 mt-1 capitalize leading-tight">
                                                            {poojaCategory}
                                                        </span>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    }) : (
                                        <p className="text-sm text-slate-400 italic col-span-3">No master poojas found. Click "Add New Pooja" below to create one.</p>
                                    )}
                                </div>

                                {/* {onAddMasterPooja && (
                                    <div className="pt-4 mt-2 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-primary text-primary hover:bg-primary/10"
                                            onClick={() => router.push('/admin/poojas/create')}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t('registration_form.buttons.add') || 'Add New Pooja'}
                                        </Button>
                                        <p className="text-xs text-slate-500 mt-2">Click to navigate to Pooja Creation page.</p>
                                    </div>
                                )} */}
                            </div>
                        </TabsContent>
                    ))}

                    {/* Shared Sections (Images, Hours, Slugs etc) */}
                    {/* Media */}
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
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMainImageChange} />
                                    {mainImagePreview || (mode === "edit" && existingMainImage) ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden">
                                            <img src={mainImagePreview || getFullImageUrl(existingMainImage)} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                <Upload className="text-white w-8 h-8" />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setMainImage(null);
                                                    setMainImagePreview("");
                                                    setExistingMainImage("");
                                                }} 
                                                className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white transition-all"
                                            >
                                                <X className="w-4 h-4 text-destructive" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center text-muted-foreground">
                                            <Upload className="w-10 h-10 mb-2" />
                                            <p className="text-sm">Click to upload main image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hero Banners */}
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-slate-700">Hero Gallery Images (Max 10)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Existing Hero Images */}
                                    {existingHeroImages.map((url, i) => (
                                        <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border group">
                                            <img src={getFullImageUrl(url)} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeHeroImage(i, true)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100">
                                                <X className="w-3 h-3 text-destructive" />
                                            </button>
                                        </div>
                                    ))}
                                    {/* New Hero Images */}
                                    {heroPreviews.map((url, i) => (
                                        <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border group">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeHeroImage(i, false)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100">
                                                <X className="w-3 h-3 text-destructive" />
                                            </button>
                                        </div>
                                    ))}
                                    {(existingHeroImages.length + heroImages.length) < 10 && (
                                        <label className="border-2 border-dashed rounded-lg flex items-center justify-center aspect-square hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleHeroImagesChange} />
                                            <Plus className="w-6 h-6 text-muted-foreground" />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* YouTube Video Links */}
                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-red-500" />
                                <label className="text-sm font-semibold text-slate-700">YouTube Videos (Gallery)</label>
                            </div>
                            <p className="text-xs text-slate-500">Add YouTube video links — they will appear in the temple gallery alongside images.</p>

                            {/* Input row */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        value={newYoutubeUrl}
                                        onChange={e => setNewYoutubeUrl(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addYoutubeLink())}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="pl-9 text-sm font-mono"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={addYoutubeLink}
                                    disabled={!newYoutubeUrl.trim()}
                                    className="gap-1.5 shrink-0 bg-red-500 hover:bg-red-600 text-white"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </Button>
                            </div>

                            {/* Video list */}
                            {[...existingYoutubeLinks.map((url, i) => ({ url, i, isExisting: true })), ...youtubeLinks.map((url, i) => ({ url, i, isExisting: false }))].length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {existingYoutubeLinks.map((url, i) => {
                                        const ytId = extractYoutubeId(url);
                                        return (
                                            <div key={`existing-yt-${i}`} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black">
                                                <div className="aspect-video relative">
                                                    {ytId ? (
                                                        <img
                                                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                                            alt="YouTube thumbnail"
                                                            className="w-full h-full object-cover opacity-80"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                            <Play className="w-6 h-6 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-md">
                                                            <Play className="w-4 h-4 text-white fill-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeYoutubeLink(i, true)}
                                                    className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-2 py-1">
                                                    <p className="text-[10px] text-white/80 truncate font-mono">Saved</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {youtubeLinks.map((url, i) => {
                                        const ytId = extractYoutubeId(url);
                                        return (
                                            <div key={`new-yt-${i}`} className="relative group rounded-xl overflow-hidden border border-red-200 shadow-sm bg-black">
                                                <div className="aspect-video relative">
                                                    {ytId ? (
                                                        <img
                                                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                                            alt="YouTube thumbnail"
                                                            className="w-full h-full object-cover opacity-80"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                            <Play className="w-6 h-6 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-md">
                                                            <Play className="w-4 h-4 text-white fill-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeYoutubeLink(i, false)}
                                                    className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-2 py-1">
                                                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">New</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {([...existingYoutubeLinks, ...youtubeLinks].length === 0) && (
                                <div className="border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground">
                                    <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No YouTube videos added yet</p>
                                    <p className="text-xs mt-0.5 opacity-60">Paste a YouTube URL above and click Add</p>
                                </div>
                            )}
                        </div>

                        {/* News Cuttings */}
                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#7c4624]" />
                                <label className="text-sm font-semibold text-slate-700">News Cuttings (Press Coverage)</label>
                            </div>
                            <p className="text-xs text-slate-500">Upload newspaper or magazine photos of press coverage. Optionally add an external link for each item.</p>

                            {/* Existing news cuttings */}
                            {existingNewsCuttings.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {existingNewsCuttings.map((nc, i) => (
                                        <div key={i} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                                            <div className="aspect-[4/3] overflow-hidden">
                                                <img
                                                    src={getFullImageUrl(nc.image)}
                                                    alt={`News cutting ${i + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            {nc.link && (
                                                <div className="px-2 py-1 bg-slate-50 border-t border-slate-100">
                                                    <p className="text-[10px] text-slate-500 font-mono truncate">{nc.link}</p>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setExistingNewsCuttings(prev => prev.filter((_, j) => j !== i))}
                                                className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 px-2 py-1">
                                                <p className="text-[10px] text-white/80 truncate font-mono">Saved</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* New news cuttings */}
                            {newNewsCuttings.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {newNewsCuttings.map((nc, i) => (
                                        <div key={i} className="relative group rounded-xl border border-orange-200 overflow-hidden bg-white shadow-sm flex flex-col">
                                            <div className="relative aspect-[4/3] overflow-hidden">
                                                <img src={nc.preview} alt={`New cutting ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 pt-6 pb-1 px-2">
                                                    <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">New</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        URL.revokeObjectURL(nc.preview);
                                                        setNewNewsCuttings(prev => prev.filter((_, j) => j !== i));
                                                    }}
                                                    className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                            <div className="p-2 bg-slate-50 border-t border-orange-100 flex-1 flex items-end">
                                                <input
                                                    type="url"
                                                    placeholder="https://article-link..."
                                                    value={nc.link}
                                                    onChange={e => {
                                                        const updated = [...newNewsCuttings];
                                                        updated[i] = { ...updated[i], link: e.target.value };
                                                        setNewNewsCuttings(updated);
                                                    }}
                                                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 font-mono focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-shadow bg-white"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload button */}
                            <label className="border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground hover:bg-slate-50 cursor-pointer transition-colors flex flex-col items-center gap-2 block">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                        const files = Array.from(e.target.files || []);
                                        const newItems = files.map(file => ({
                                            file,
                                            preview: URL.createObjectURL(file),
                                            link: "",
                                        }));
                                        setNewNewsCuttings(prev => [...prev, ...newItems]);
                                        e.target.value = '';
                                    }}
                                />
                                <Upload className="w-8 h-8 opacity-30" />
                                <p className="text-sm">Click to upload news cutting images</p>
                                <p className="text-xs opacity-60">You can add external article links after upload</p>
                            </label>
                        </div>
                    </div>

                    {/* URL Config */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <MapPin className="w-5 h-5" />
                            <h2 className="text-xl">URL & Access Configuration</h2>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 space-y-4">
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="urlType" value="slug" checked={formData.urlType === "slug"} onChange={e => setFormData({ ...formData, urlType: e.target.value })} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-slate-700">Path-based (devbhakti.in/temples/...)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="urlType" value="subdomain" checked={formData.urlType === "subdomain"} onChange={e => setFormData({ ...formData, urlType: e.target.value })} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-slate-700">Subdomain (... .devbhakti.in)</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-1">
                                {formData.urlType === "slug" ? (
                                    <>
                                        <span className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-l-md border border-r-0 font-mono">devbhakti.in/temples/</span>
                                        <Input
                                            value={formData.slug}
                                            onChange={e => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                setFormData({ ...formData, slug: val, subdomain: val });
                                            }}
                                            placeholder="temple-slug"
                                            className="rounded-l-none font-mono"
                                            required
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Input
                                            value={formData.subdomain}
                                            onChange={e => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                setFormData({ ...formData, subdomain: val, slug: val });
                                            }}
                                            placeholder="temple-subdomain"
                                            className="rounded-r-none font-mono"
                                            required
                                        />
                                        <span className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-r-md border border-l-0 font-mono">.devbhakti.in</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Clock className="w-5 h-5" />
                                <h2 className="text-xl">Operating Hours</h2>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addOperatingHour}
                                className="border-primary text-primary hover:bg-primary/10"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Slot
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.operatingHours.map((slot, index) => (
                                <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3 relative group">
                                    {formData.operatingHours.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOperatingHour(index)}
                                            className="absolute -top-2 -right-2 bg-white border shadow-sm rounded-full p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <Input
                                            value={slot.label}
                                            onChange={e => {
                                                const newHours = [...formData.operatingHours];
                                                newHours[index].label = e.target.value;
                                                setFormData({ ...formData, operatingHours: newHours });
                                            }}
                                            className="h-7 w-2/3 text-xs font-bold bg-transparent border-none focus-visible:ring-0 px-0"
                                            placeholder="Label (e.g. Afternoon)"
                                        />
                                        <Switch
                                            checked={slot.active}
                                            onCheckedChange={checked => {
                                                const newHours = [...formData.operatingHours];
                                                newHours[index].active = checked;
                                                setFormData({ ...formData, operatingHours: newHours });
                                            }}
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Open</span>
                                            <Input 
                                                type="time"
                                                value={(() => {
                                                    if (!slot.start) return "";
                                                    const [time, modifier] = slot.start.split(' ');
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
                                                    newHours[index].start = time12;
                                                    setFormData({ ...formData, operatingHours: newHours });
                                                }} 
                                                className="text-xs h-8" 
                                                disabled={!slot.active} 
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">Close</span>
                                            <Input 
                                                type="time"
                                                value={(() => {
                                                    if (!slot.end) return "";
                                                    const [time, modifier] = slot.end.split(' ');
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
                                                    newHours[index].end = time12;
                                                    setFormData({ ...formData, operatingHours: newHours });
                                                }} 
                                                className="text-xs h-8" 
                                                disabled={!slot.active} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Configuration */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Layout className="w-5 h-5" />
                            <h2 className="text-xl">Pricing Configuration</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    Generic Prasad Price (₹)
                                </label>
                                <p className="text-xs text-slate-500">This price will be applied globally to all Poojas in this temple when a user opts for Prasad.</p>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.prasadPrice}
                                    onChange={e => setFormData({ ...formData, prasadPrice: e.target.value })}
                                    placeholder="e.g. 150"
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Commission Configuration */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Layout className="w-5 h-5" />
                            <h2 className="text-xl">Commission Configuration</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Marketplace Commission */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        Marketplace Commission
                                        <Badge variant={marketplaceRateType === 'CUSTOM' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5 rounded-full">
                                            {marketplaceRateType === 'CUSTOM' ? 'CUSTOM RATE' : 'GLOBAL DEFAULT'}
                                        </Badge>
                                    </Label>
                                    <div className="flex items-center gap-3 bg-slate-100/50 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${marketplaceRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground/60"}`}>DEFAULT</span>
                                        <Switch
                                            checked={marketplaceRateType === "CUSTOM"}
                                            onCheckedChange={handleMarketplaceRateTypeChange}
                                        />
                                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${marketplaceRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground/60"}`}>CUSTOM</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-12 gap-2 px-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="col-span-5">Amount Range (₹)</div>
                                        <div className="col-span-3">P. Fee (₹)</div>
                                        <div className="col-span-3">Comm (%)</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {marketplaceSlabs.map((slab, i) => (
                                        <div key={i} className="group relative flex items-center gap-2 p-2 bg-slate-50/50 rounded-lg border border-slate-200 transition-all hover:border-primary/30">
                                            <div className="grid grid-cols-12 gap-2 flex-1 items-center">
                                                <div className="col-span-5 flex items-center gap-1">
                                                    <Input 
                                                        type="number" 
                                                        value={slab.minAmount} 
                                                        onChange={e => {
                                                            const newSlabs = [...marketplaceSlabs];
                                                            newSlabs[i].minAmount = parseFloat(e.target.value) || 0;
                                                            setMarketplaceSlabs(newSlabs);
                                                        }}
                                                        className="h-8 text-[11px] px-1.5"
                                                        placeholder="Min"
                                                        disabled={marketplaceRateType === "DEFAULT"}
                                                    />
                                                    <span className="text-slate-400 font-bold">-</span>
                                                    <Input 
                                                        type="number" 
                                                        value={slab.maxAmount || ""} 
                                                        onChange={e => {
                                                            const newSlabs = [...marketplaceSlabs];
                                                            newSlabs[i].maxAmount = e.target.value ? parseFloat(e.target.value) : null;
                                                            setMarketplaceSlabs(newSlabs);
                                                        }}
                                                        placeholder="Max"
                                                        className="h-8 text-[11px] px-1.5"
                                                        disabled={marketplaceRateType === "DEFAULT"}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input 
                                                        type="number" 
                                                        value={slab.platformFee} 
                                                        onChange={e => {
                                                            const newSlabs = [...marketplaceSlabs];
                                                            newSlabs[i].platformFee = parseFloat(e.target.value) || 0;
                                                            setMarketplaceSlabs(newSlabs);
                                                        }}
                                                        className="h-8 text-[11px] px-1.5"
                                                        disabled={marketplaceRateType === "DEFAULT"}
                                                    />
                                                </div>
                                                <div className="col-span-4 flex items-center gap-1">
                                                    <Input 
                                                        type="number" 
                                                        value={slab.percentage} 
                                                        onChange={e => {
                                                            const newSlabs = [...marketplaceSlabs];
                                                            const val = parseFloat(e.target.value);
                                                            newSlabs[i].percentage = isNaN(val) ? 0 : val;
                                                            setMarketplaceSlabs(newSlabs);
                                                        }}
                                                        className="h-8 text-[11px] px-1.5"
                                                        disabled={marketplaceRateType === "DEFAULT"}
                                                    />
                                                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                                                </div>
                                            </div>
                                            {marketplaceRateType === 'CUSTOM' && (
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                                    onClick={() => setMarketplaceSlabs(prev => prev.filter((_, idx) => idx !== i))}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {marketplaceRateType === 'CUSTOM' && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full border-dashed text-[10px] h-8 bg-orange-50/30 hover:bg-orange-50 border-orange-200 text-orange-600"
                                            onClick={() => setMarketplaceSlabs([...marketplaceSlabs, { minAmount: 0, maxAmount: null, platformFee: 0, percentage: 0 }])}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Custom Slab
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Pooja Commission */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        Pooja Commission
                                        <Badge variant={poojaRateType === 'CUSTOM' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5 rounded-full">
                                            {poojaRateType === 'CUSTOM' ? 'CUSTOM RATE' : 'GLOBAL DEFAULT'}
                                        </Badge>
                                    </Label>
                                    <div className="flex items-center gap-3 bg-slate-100/50 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${poojaRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground/60"}`}>DEFAULT</span>
                                        <Switch
                                            checked={poojaRateType === "CUSTOM"}
                                            onCheckedChange={handlePoojaRateTypeChange}
                                        />
                                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${poojaRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground/60"}`}>CUSTOM</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-12 gap-2 px-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="col-span-5">Amount Range (₹)</div>
                                        <div className="col-span-3">P. Fee (₹)</div>
                                        <div className="col-span-3">Comm (%)</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {poojaSlabs.map((slab, i) => (
                                        <div key={i} className="group relative flex items-center gap-2 p-2 bg-slate-50/50 rounded-lg border border-slate-200 transition-all hover:border-primary/30">
                                            <div className="grid grid-cols-12 gap-2 flex-1 items-center">
                                                <div className="col-span-5 flex items-center gap-1">
                                                    <Input 
                                                        type="number" 
                                                        value={slab.minAmount} 
                                                        onChange={e => {
                                                            const newSlabs = [...poojaSlabs];
                                                            newSlabs[i].minAmount = parseFloat(e.target.value) || 0;
                                                            setPoojaSlabs(newSlabs);
                                                        }}
                                                        className="h-8 text-[11px] px-1.5"
                                                        placeholder="Min"
                                                        disabled={poojaRateType === "DEFAULT"}
                                                    />
                                                    <span className="text-slate-400 font-bold">-</span>
                                                    <Input 
                                                        type="number" 
                                                        value={slab.maxAmount || ""} 
                                                        onChange={e => {
                                                            const newSlabs = [...poojaSlabs];
                                                            newSlabs[i].maxAmount = e.target.value ? parseFloat(e.target.value) : null;
                                                            setPoojaSlabs(newSlabs);
                                                        }}
                                                        placeholder="Max"
                                                        className="h-8 text-[11px] px-1.5"
                                                        disabled={poojaRateType === "DEFAULT"}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input 
                                                        type="number" 
                                                        value={slab.platformFee} 
                                                        onChange={e => {
                                                            const newSlabs = [...poojaSlabs];
                                                            newSlabs[i].platformFee = parseFloat(e.target.value) || 0;
                                                            setPoojaSlabs(newSlabs);
                                                        }}
                                                        className="h-8 text-[11px] px-1.5"
                                                        disabled={poojaRateType === "DEFAULT"}
                                                    />
                                                </div>
                                                <div className="col-span-4 flex items-center gap-1">
                                                    <Input 
                                                        type="number" 
                                                        value={slab.percentage} 
                                                        onChange={e => {
                                                            const newSlabs = [...poojaSlabs];
                                                            const val = parseFloat(e.target.value);
                                                            newSlabs[i].percentage = isNaN(val) ? 0 : val;
                                                            setPoojaSlabs(newSlabs);
                                                        }}
                                                        className="h-8 text-[11px] px-1.5"
                                                        disabled={poojaRateType === "DEFAULT"}
                                                    />
                                                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                                                </div>
                                            </div>
                                            {poojaRateType === 'CUSTOM' && (
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                                                    onClick={() => setPoojaSlabs(prev => prev.filter((_, idx) => idx !== i))}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {poojaRateType === 'CUSTOM' && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full border-dashed text-[10px] h-8 bg-orange-50/30 hover:bg-orange-50 border-orange-200 text-orange-600"
                                            onClick={() => setPoojaSlabs([...poojaSlabs, { minAmount: 0, maxAmount: null, platformFee: 0, percentage: 0 }])}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Custom Slab
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8">
                        <Button type="submit" size="lg" disabled={isLoading} className="px-12 rounded-full font-bold">
                            {isLoading ? "Processing..." : (mode === "create" ? "Create Temple Account" : "Save Changes")}
                        </Button>
                    </div>
                </form>
            </Tabs>
        </>
    );
}

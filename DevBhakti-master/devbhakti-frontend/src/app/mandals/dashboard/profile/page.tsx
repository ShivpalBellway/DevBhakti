"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Save,
    Loader2,
    Upload,
    Image as ImageIcon,
    Sparkles,
    Globe,
    FileText,
    CheckCircle,
    AlertCircle,
    User,
    X,
    Eye,
    ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalProfile, updateMandalProfile } from "@/api/mandalAdminController";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { API_URL } from "@/config/apiConfig";

function getJsonVal(val: any, lang: string) {
    if (!val) return "";
    if (typeof val === "string") {
        try { val = JSON.parse(val); } catch { return val; }
    }
    return val?.[lang] || "";
}

const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "mr", label: "मराठी", flag: "🇮🇳" },
];

const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => (
    <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        <span className="text-[#7b4623]">{icon}</span>
        {children}
    </h3>
);

const SectionWrapper = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 md:p-6 ${className}`}>
        {children}
    </div>
);

export default function EnhancedMandalProfilePage() {
    const [activeLang, setActiveLang] = useState("en");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [contactError, setContactError] = useState("");
    const [imageError, setImageError] = useState("");

    // Media states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [existingImage, setExistingImage] = useState<string>("");
    const [heroFiles, setHeroFiles] = useState<File[]>([]);
    const [existingBanners, setExistingBanners] = useState<string[]>([]);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const heroInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        name_en: "", name_hi: "", name_mr: "",
        mandalType: "Ganesh",
        description_en: "", description_hi: "", description_mr: "",
        presiding_deity: "", festivals: "",
        address: "", city: "", state: "", pinCode: "",
        contactNumber: "", email: "", presidentName: "",
        registrationNumber: "",
    });

    const { toast } = useToast();

    useEffect(() => {
        loadProfile();
    }, []);

    const getApiAssetUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
        const baseUrl = API_URL.replace(/\/api\/?$/, "");
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetchMandalProfile();
            if (res.success && res.data) {
                const m = res.data;
                setForm({
                    name_en: getJsonVal(m.name, "en") || (typeof m.name === 'string' ? m.name : ''),
                    name_hi: getJsonVal(m.name, "hi"),
                    name_mr: getJsonVal(m.name, "mr"),
                    mandalType: m.mandalType || "Ganesh",
                    description_en: getJsonVal(m.description, "en") || (typeof m.description === 'string' ? m.description : ''),
                    description_hi: getJsonVal(m.description, "hi"),
                    description_mr: getJsonVal(m.description, "mr"),
                    presiding_deity: m.presiding_deity || "",
                    festivals: m.festivals || "",
                    address: m.address || "",
                    city: m.city || "",
                    state: m.state || "",
                    pinCode: m.pinCode || m.pincode || "",
                    contactNumber: m.contactNumber || m.phone || "",
                    email: m.email || "",
                    presidentName: m.presidentName || "",
                    registrationNumber: m.registrationNumber || "",
                });

                if (m.image) setExistingImage(m.image);
                if (m.bannerImages && Array.isArray(m.bannerImages)) {
                    setExistingBanners(m.bannerImages);
                }
            }
        } catch (error) {
            console.error("Failed to load mandal profile", error);
            toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "contactNumber") {
            const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
            setContactError(digitsOnly.length > 0 && digitsOnly.length < 10 ? "Contact number must be exactly 10 digits" : "");
            setForm(prev => ({ ...prev, contactNumber: digitsOnly }));
            return;
        }

        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleContactKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
        if (allowed.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleHeroesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setHeroFiles(prev => [...prev, ...files]);
    };

    const removeBanner = (idx: number, isExisting: boolean) => {
        if (isExisting) {
            setExistingBanners(prev => prev.filter((_, i) => i !== idx));
        } else {
            setHeroFiles(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setContactError("");

        if (form.contactNumber && form.contactNumber.length !== 10) {
            setContactError("Contact number must be exactly 10 digits");
            return;
        }

        setIsSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            
            if (imageFile) {
                fd.append("image", imageFile);
            }
            heroFiles.forEach(f => fd.append("heroImages", f));
            fd.append("existingBannerImages", JSON.stringify(existingBanners));

            const res = await updateMandalProfile(fd);
            if (res.success) {
                setSuccessMessage("Mandal profile updated successfully!");
                toast({ title: "Success", description: "Profile details updated successfully." });
                loadProfile();
            } else {
                setErrorMessage(res.message || "Failed to update profile.");
                toast({ title: "Error", description: res.message || "Failed to update profile", variant: "destructive" });
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Failed to save profile.";
            setErrorMessage(msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const InputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623] transition-all";
    const LabelClass = "block text-sm font-medium text-slate-700 mb-1.5";

    const getLangField = (field: string) => `${field}_${activeLang}`;

    // Compute live values for side preview
    const activeName = (form as any)[`name_${activeLang}`] || form.name_en || "Your Mandal Name";
    const activeDescription = (form as any)[`description_${activeLang}`] || form.description_en || "Mandal description will appear here...";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#7b4623]" />
                    <p className="text-sm text-muted-foreground">Loading mandal profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Manage Mandal Profile
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Update your mandal's public information, location, images, and contact details.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-md rounded-xl px-6"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Success / Error Alerts */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-3 shadow-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm flex items-center gap-3 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Main Content Layout: Left Form + Right Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── LEFT FORM (7 Columns) ── */}
                <div className="lg:col-span-7 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* ── 1. Basic Information ── */}
                        <SectionWrapper>
                            <SectionTitle icon={<Building2 className="w-5 h-5" />}>
                                1. Basic Information
                            </SectionTitle>

                            {/* Language Selector Tabs */}
                            <div className="flex gap-2 mb-4 border-b border-slate-100 pb-2">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => setActiveLang(lang.code)}
                                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 ${
                                            activeLang === lang.code
                                                ? "bg-[#7b4623]/10 text-[#7b4623] font-bold"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className={LabelClass}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                                            Mandal Name ({activeLang === "en" ? "English" : activeLang === "hi" ? "Hindi" : "Marathi"}) *
                                        </span>
                                    </Label>
                                    <Input
                                        type="text"
                                        name={getLangField("name")}
                                        value={(form as any)[getLangField("name")]}
                                        onChange={handleChange}
                                        className={InputClass}
                                        placeholder={`e.g. Lalbaugcha Raja Mandal in ${activeLang}`}
                                        required={activeLang === "en"}
                                    />
                                </div>

                                <div>
                                    <Label className={LabelClass}>
                                        Description ({activeLang === "en" ? "English" : activeLang === "hi" ? "Hindi" : "Marathi"})
                                    </Label>
                                    <RichTextEditor
                                        value={(form as any)[getLangField("description")]}
                                        onChange={(html) =>
                                            setForm((prev) => ({ ...prev, [getLangField("description")]: html }))
                                        }
                                        placeholder={`Describe history, rituals and activities in ${activeLang}...`}
                                        minHeight="140px"
                                    />
                                </div>

                                <div>
                                    <Label className={LabelClass}>Mandal Category / Type</Label>
                                    <select
                                        name="mandalType"
                                        value={form.mandalType}
                                        onChange={handleChange}
                                        className={InputClass}
                                    >
                                        <option value="Ganesh">Ganesh Mandal</option>
                                        <option value="Durga">Durga Puja Samiti</option>
                                        <option value="Ram">Ram Leela Samiti</option>
                                        <option value="Navratri">Navratri Mandal</option>
                                        <option value="Other">Other Religious Mandal</option>
                                    </select>
                                </div>
                            </div>
                        </SectionWrapper>

                        {/* ── 2. Deity & Festival Details ── */}
                        <SectionWrapper>
                            <SectionTitle icon={<Sparkles className="w-5 h-5" />}>
                                2. Deity & Festival Details
                            </SectionTitle>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className={LabelClass}>Presiding Deity</Label>
                                    <Input
                                        type="text"
                                        name="presiding_deity"
                                        value={form.presiding_deity}
                                        onChange={handleChange}
                                        className={InputClass}
                                        placeholder="e.g. Lord Ganesha / Goddess Durga"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Main deity worshipped</p>
                                </div>
                                <div>
                                    <Label className={LabelClass}>Major Festivals</Label>
                                    <Input
                                        type="text"
                                        name="festivals"
                                        value={form.festivals}
                                        onChange={handleChange}
                                        className={InputClass}
                                        placeholder="e.g. Ganesh Chaturthi, Anant Chaturdashi"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Comma-separated festival names</p>
                                </div>
                            </div>
                        </SectionWrapper>

                        {/* ── 3. Location Details ── */}
                        <SectionWrapper>
                            <SectionTitle icon={<MapPin className="w-5 h-5" />}>
                                3. Location Details
                            </SectionTitle>

                            <div className="space-y-4">
                                <div>
                                    <Label className={LabelClass}>Street Address</Label>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        className={InputClass}
                                        placeholder="Street, Landmark, Area..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className={LabelClass}>City</Label>
                                        <Input
                                            type="text"
                                            name="city"
                                            value={form.city}
                                            onChange={handleChange}
                                            className={InputClass}
                                            placeholder="Mumbai"
                                        />
                                    </div>
                                    <div>
                                        <Label className={LabelClass}>State</Label>
                                        <Input
                                            type="text"
                                            name="state"
                                            value={form.state}
                                            onChange={handleChange}
                                            className={InputClass}
                                            placeholder="Maharashtra"
                                        />
                                    </div>
                                    <div>
                                        <Label className={LabelClass}>Pincode</Label>
                                        <Input
                                            type="text"
                                            name="pinCode"
                                            value={form.pinCode}
                                            onChange={handleChange}
                                            className={InputClass}
                                            placeholder="400012"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SectionWrapper>

                        {/* ── 4. Contact & Authority ── */}
                        <SectionWrapper>
                            <SectionTitle icon={<Phone className="w-5 h-5" />}>
                                4. Contact & Registration
                            </SectionTitle>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className={LabelClass}>
                                        Contact Mobile Number *
                                        <span className="ml-1 text-xs font-normal text-slate-400">(10 digits)</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        name="contactNumber"
                                        value={form.contactNumber}
                                        onChange={handleChange}
                                        onKeyDown={handleContactKeyDown}
                                        maxLength={10}
                                        inputMode="numeric"
                                        className={`${InputClass} ${contactError ? "border-red-500 focus:ring-red-500/20" : ""}`}
                                        placeholder="10-digit mobile number"
                                    />
                                    <div className="flex items-center justify-between mt-1">
                                        {contactError ? (
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> {contactError}
                                            </p>
                                        ) : <span />}
                                        <span className={`text-xs ${form.contactNumber.length === 10 ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                                            {form.contactNumber.length}/10
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Label className={LabelClass}>Official Email</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className={InputClass}
                                        placeholder="mandal@example.com"
                                    />
                                </div>

                                <div>
                                    <Label className={LabelClass}>President / Organizer Name</Label>
                                    <Input
                                        type="text"
                                        name="presidentName"
                                        value={form.presidentName}
                                        onChange={handleChange}
                                        className={InputClass}
                                        placeholder="Name of President"
                                    />
                                </div>

                                <div>
                                    <Label className={LabelClass}>Trust / Registration Number</Label>
                                    <Input
                                        type="text"
                                        name="registrationNumber"
                                        value={form.registrationNumber}
                                        onChange={handleChange}
                                        className={InputClass}
                                        placeholder="REG/12345/MUM"
                                    />
                                </div>
                            </div>
                        </SectionWrapper>

                        {/* ── 5. Media (Logo & Banner Images) ── */}
                        <SectionWrapper>
                            <SectionTitle icon={<ImageIcon className="w-5 h-5" />}>
                                5. Media & Gallery
                            </SectionTitle>

                            {/* Main Logo */}
                            <div className="space-y-3 pb-4 border-b border-slate-100">
                                <Label className={LabelClass}>Mandal Logo / Main Image</Label>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => imageInputRef.current?.click()}
                                        className="relative cursor-pointer group w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#7b4623] transition-colors flex items-center justify-center bg-slate-50 overflow-hidden shrink-0"
                                    >
                                        {imagePreview || existingImage ? (
                                            <img
                                                src={imagePreview || getApiAssetUrl(existingImage)}
                                                alt="Mandal Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center px-1">
                                                <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                                                <span className="text-[10px] text-slate-500">Upload Logo</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 space-y-1">
                                        <p className="font-semibold text-slate-700">Mandal Avatar / Badge</p>
                                        <p>Displayed on search cards, event lists & booking pages.</p>
                                        <p>Recommended size: 500x500px (PNG, JPG, WebP)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Banner / Hero Gallery */}
                            <div className="space-y-3 pt-2">
                                <Label className={LabelClass}>Banner & Cover Photos (Multiple)</Label>
                                <input
                                    ref={heroInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleHeroesChange}
                                    className="hidden"
                                />
                                <div className="flex flex-wrap gap-3">
                                    {existingBanners.map((url, i) => (
                                        <div key={`ex-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                                            <img
                                                src={getApiAssetUrl(url)}
                                                alt={`Banner ${i}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeBanner(i, true)}
                                                className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                title="Remove photo"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {heroFiles.map((file, i) => (
                                        <div key={`new-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`New Banner ${i}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeBanner(i, false)}
                                                className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                title="Remove photo"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => heroInputRef.current?.click()}
                                        className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#7b4623] transition-colors flex flex-col items-center justify-center text-slate-400 hover:text-[#7b4623] bg-slate-50"
                                    >
                                        <Upload className="w-5 h-5 mb-1" />
                                        <span className="text-[11px] font-medium">Add Photo</span>
                                    </button>
                                </div>
                            </div>
                        </SectionWrapper>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-4 pt-2">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl px-8 py-3 h-auto text-base shadow-lg shadow-[#7b4623]/20"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Saving Profile...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Save Mandal Profile
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* ── RIGHT STICKY LIVE PROFILE PREVIEW CARD (5 Columns) ── */}
                <div className="lg:col-span-5">
                    <div className="sticky top-20 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-[#7b4623] flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Live Public Preview
                            </h2>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                                Live Updating
                            </Badge>
                        </div>

                        {/* Enhanced Public Card Mockup */}
                        <Card className="border border-slate-200/80 shadow-xl rounded-3xl overflow-hidden bg-white">
                            {/* Banner Header */}
                            <div className="relative h-44 bg-gradient-to-r from-amber-800 via-orange-800 to-[#7b4623] overflow-hidden">
                                {heroFiles.length > 0 ? (
                                    <img
                                        src={URL.createObjectURL(heroFiles[0])}
                                        alt="Cover"
                                        className="w-full h-full object-cover opacity-90"
                                    />
                                ) : existingBanners.length > 0 ? (
                                    <img
                                        src={getApiAssetUrl(existingBanners[0])}
                                        alt="Cover"
                                        className="w-full h-full object-cover opacity-90"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-black/40" />
                                )}

                                <div className="absolute top-3 right-3">
                                    <Badge className="bg-emerald-500/90 text-white backdrop-blur-md text-[10px] font-bold shadow">
                                        <ShieldCheck className="w-3 h-3 mr-1" /> Active Mandal
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="px-6 pb-6 pt-0 relative">
                                {/* Floating Logo */}
                                <div className="-mt-12 mb-4 flex items-end justify-between">
                                    <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg border-2 border-white overflow-hidden shrink-0">
                                        {imagePreview || existingImage ? (
                                            <img
                                                src={imagePreview || getApiAssetUrl(existingImage)}
                                                alt="Mandal Logo"
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[#7b4623]/10 rounded-xl flex items-center justify-center text-[#7b4623] font-bold text-xl">
                                                {activeName.charAt(0) || "M"}
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="bg-[#7b4623]/10 text-[#7b4623] font-bold text-xs">
                                        {form.mandalType || "Ganesh Mandal"}
                                    </Badge>
                                </div>

                                {/* Title & Subtitle */}
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                                        {activeName}
                                    </h3>
                                    {(form.city || form.state) && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-[#7b4623]" />
                                            {[form.city, form.state].filter(Boolean).join(", ")}
                                            {form.pinCode && ` - ${form.pinCode}`}
                                        </p>
                                    )}
                                </div>

                                {/* Highlights Grid */}
                                <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-100">
                                    {form.presiding_deity && (
                                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/60">
                                            <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider block">Deity</span>
                                            <span className="text-xs font-bold text-slate-800 truncate block">{form.presiding_deity}</span>
                                        </div>
                                    )}
                                    {form.festivals && (
                                        <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100/60">
                                            <span className="text-[10px] text-orange-700 font-semibold uppercase tracking-wider block">Festivals</span>
                                            <span className="text-xs font-bold text-slate-800 truncate block">{form.festivals}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Description Preview */}
                                {activeDescription && (
                                    <div className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 prose prose-xs">
                                        <div dangerouslySetInnerHTML={{ __html: activeDescription }} />
                                    </div>
                                )}

                                {/* Contact Details Card Footer */}
                                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                                    {form.contactNumber && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-[#7b4623] shrink-0" />
                                            <span className="font-semibold text-slate-800">+91 {form.contactNumber}</span>
                                        </div>
                                    )}
                                    {form.email && (
                                        <div className="flex items-center gap-2 truncate">
                                            <Mail className="w-3.5 h-3.5 text-[#7b4623] shrink-0" />
                                            <span className="truncate">{form.email}</span>
                                        </div>
                                    )}
                                    {form.presidentName && (
                                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                                            <User className="w-3.5 h-3.5 text-[#7b4623] shrink-0" />
                                            <span>President: <strong>{form.presidentName}</strong></span>
                                        </div>
                                    )}
                                    {form.registrationNumber && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5 text-[#7b4623] shrink-0" />
                                            <span>Reg: <strong>{form.registrationNumber}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

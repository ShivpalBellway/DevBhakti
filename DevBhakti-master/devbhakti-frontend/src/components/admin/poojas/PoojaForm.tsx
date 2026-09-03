"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Upload, Layout, Languages, FileText, HelpCircle, Package, ArrowRight, Save, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, Language  } from "@/context/LanguageContext";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { API_URL } from "@/config/apiConfig";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, ChevronsUpDown } from "lucide-react";
import { parseLocalizedValue } from "@/utils/textUtils";

interface PoojaFormProps {
    mode: "create" | "edit";
    initialData?: any;
    temples: any[];
    mandals?: any[];
    availableCategories: any[];
    masterTemplates?: any[];
    onSubmit: (formData: FormData) => Promise<void>;
    isLoading?: boolean;
}

const STATIC_PACKAGE_TYPES = [
    { name: "Single", description: "For 1 person", maxPersons: 1 },
    { name: "Couple", description: "For 2 people", maxPersons: 2 },
    { name: "Family", description: "Upto 5 people", maxPersons: 5 },
    { name: "Group", description: "Upto 8 people", maxPersons: 8 },
    { name: "Big Group", description: "Upto 25 people", maxPersons: 25 },
    { name: "Small Business", description: "Upto 50 people", maxPersons: 50 },
    { name: "Large Business", description: "Upto 100 people", maxPersons: 100 },
    { name: "Corporates", description: "Upto 500 people", maxPersons: 500 }
];

export const PoojaForm: React.FC<PoojaFormProps> = ({
    mode,
    initialData,
    temples,
    mandals = [],
    availableCategories,
    masterTemplates = [],
    onSubmit,
    isLoading = false
}) => {
    const { t } = useLanguage();
    // Local language tab — independent of global app language
    const [activeTab, setActiveTab] = useState<Language>("en");

    const [poojaType, setPoojaType] = useState<string>("template");
    const [formData, setFormData] = useState({
        price: 0,
        time: "",
        templeId: "",
        mandalId: "",
        masterPoojaId: "",
        categoryId: "",
        categoryIds: [] as string[],
        category_en: "",
        category_hi: "",
        category_mr: "",
        // Localized Strings
        name: { en: "", hi: "", mr: "" },
        about: { en: "", hi: "", mr: "" },
        duration: { en: "", hi: "", mr: "" },
        // Localized Arrays
        description: { en: [] as string[], hi: [] as string[], mr: [] as string[] },
        bullets: { en: [] as string[], hi: [] as string[], mr: [] as string[] },
        slug: "",
        hasPrasad: false,
    });

    const [packages, setPackages] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any>({ en: [], hi: [], mr: [] });

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const isMaster = poojaType === "template";

    useEffect(() => {
        if (mode === "edit" && initialData) {
            const parseArray = (val: any) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return [];
                }
            };

            // Helper to get lang value safely from both old (string) and new (multi-lang JSON) formats
            const getL = (field: any, lang: string, fallback: any = "") => {
                if (!field) return fallback;
                if (typeof field === "string") {
                    try {
                        const parsed = JSON.parse(field);
                        if (typeof parsed === "object" && parsed !== null) {
                            return parsed[lang] !== undefined ? parsed[lang] : fallback;
                        }
                    } catch (e) {
                        // ignore JSON parse errors, treat as a normal string
                    }
                    if (lang === "en") return field; // Legacy string format
                    return fallback;
                }
                if (typeof field === "object") {
                    // Check if it's already an array/object with en/hi/mr
                    if (field[lang] !== undefined) return field[lang];
                    // If it's a raw object/array but we're looking for English, take it all
                    if (lang === "en" && !field.hi && !field.mr) return field;
                    return fallback;
                }
                return fallback;
            };

            setFormData({
                price: initialData.price || 0,
                time: initialData.time || "",
                templeId: initialData.isMaster ? "platform" : (initialData.templeId || ""),
                mandalId: initialData.mandalId || "",
                masterPoojaId: initialData.masterPoojaId || "",
                categoryId: initialData.categoryId || "",
                categoryIds: initialData.categoryIds || (initialData.categoryId ? [initialData.categoryId] : []),
                category_en: getL(initialData.category, "en"),
                category_hi: getL(initialData.category, "hi"),
                category_mr: getL(initialData.category, "mr"),
                name: {
                    en: getL(initialData.name, "en"),
                    hi: getL(initialData.name, "hi"),
                    mr: getL(initialData.name, "mr")
                },
                about: {
                    en: getL(initialData.about, "en"),
                    hi: getL(initialData.about, "hi"),
                    mr: getL(initialData.about, "mr")
                },
                duration: {
                    en: getL(initialData.duration, "en"),
                    hi: getL(initialData.duration, "hi"),
                    mr: getL(initialData.duration, "mr")
                },
                description: {
                    en: parseArray(getL(initialData.description, "en", [])),
                    hi: parseArray(getL(initialData.description, "hi", [])),
                    mr: parseArray(getL(initialData.description, "mr", []))
                },
                bullets: {
                    en: parseArray(getL(initialData.bullets, "en", [])),
                    hi: parseArray(getL(initialData.bullets, "hi", [])),
                    mr: parseArray(getL(initialData.bullets, "mr", []))
                },
                slug: initialData.slug || "",
                hasPrasad: initialData.hasPrasad === true || initialData.hasPrasad === 'true',
            });

            // Resolve pooja type
            let pType = "template";
            if (!initialData.isMaster) {
                if (initialData.mandalId) pType = "mandal";
                else if (initialData.templeId) pType = "temple";
                else pType = "platform";
            }
            setPoojaType(pType);

            const parseLocalizedJson = (val: any) => {
                if (!val) return { en: [], hi: [], mr: [] };
                if (typeof val === 'object' && (val.en || val.hi || val.mr)) {
                    return {
                        en: parseArray(val.en),
                        hi: parseArray(val.hi),
                        mr: parseArray(val.mr)
                    };
                }
                const parsed = parseArray(val);
                return { en: parsed, hi: [], mr: [] };
            };

            const parseLocalizedJsonArray = (val: any) => {
                if (!val) return [];
                if (typeof val === 'object' && (val.en || val.hi || val.mr)) {
                    return parseArray(val.en || val.hi || val.mr);
                }
                return parseArray(val);
            };

            setPackages(parseLocalizedJsonArray(initialData.packages));
            setFaqs(parseLocalizedJson(initialData.faqs));

            if (initialData.image) {
                const imageUrl = initialData.image.startsWith('http')
                    ? initialData.image
                    : `${API_URL.replace('/api', '')}${initialData.image}`;
                setImagePreview(imageUrl);
            }
        } else if (mode === "create") {
            setFormData(prev => ({ ...prev, templeId: "" }));
            setPoojaType("template");
        }
    }, [mode, initialData, temples]);

    const handleTemplateSelect = (templateId: string) => {
        handleInputChange("masterPoojaId", templateId);
        if (!templateId) return;

        const template = masterTemplates.find(t => t.id === templateId);
        if (!template) return;

        // Auto-fill form fields from the selected template
        const parseArray = (val: any) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            try {
                return JSON.parse(val);
            } catch (e) {
                return [];
            }
        };

        const getL = (field: any, lang: string, fallback: any = "") => {
            if (!field) return fallback;
            if (typeof field === "string") {
                try {
                    const parsed = JSON.parse(field);
                    if (typeof parsed === "object" && parsed !== null) {
                        return parsed[lang] !== undefined ? parsed[lang] : fallback;
                    }
                } catch (e) { }
                if (lang === "en") return field;
                return fallback;
            }
            if (typeof field === "object") {
                if (field[lang] !== undefined) return field[lang];
                if (lang === "en" && !field.hi && !field.mr) return field;
                return fallback;
            }
            return fallback;
        };

        setFormData(prev => ({
            ...prev,
            price: template.price || prev.price,
            time: template.time || prev.time,
            categoryId: template.categoryId || prev.categoryId,
            categoryIds: template.categoryIds || (template.categoryId ? [template.categoryId] : prev.categoryIds),
            category_en: getL(template.category, "en") || prev.category_en,
            category_hi: getL(template.category, "hi") || prev.category_hi,
            category_mr: getL(template.category, "mr") || prev.category_mr,
            name: {
                en: getL(template.name, "en") || prev.name.en,
                hi: getL(template.name, "hi") || prev.name.hi,
                mr: getL(template.name, "mr") || prev.name.mr
            },
            about: {
                en: getL(template.about, "en") || prev.about.en,
                hi: getL(template.about, "hi") || prev.about.hi,
                mr: getL(template.about, "mr") || prev.about.mr
            },
            duration: {
                en: getL(template.duration, "en") || prev.duration.en,
                hi: getL(template.duration, "hi") || prev.duration.hi,
                mr: getL(template.duration, "mr") || prev.duration.mr
            },
            description: {
                en: parseArray(getL(template.description, "en", [])) || prev.description.en,
                hi: parseArray(getL(template.description, "hi", [])) || prev.description.hi,
                mr: parseArray(getL(template.description, "mr", [])) || prev.description.mr
            },
            bullets: {
                en: parseArray(getL(template.bullets, "en", [])) || prev.bullets.en,
                hi: parseArray(getL(template.bullets, "hi", [])) || prev.bullets.hi,
                mr: parseArray(getL(template.bullets, "mr", [])) || prev.bullets.mr
            }
        }));

        const parseLocalizedJsonArray = (val: any) => {
            if (!val) return [];
            if (typeof val === 'object' && (val.en || val.hi || val.mr)) {
                return parseArray(val.en || val.hi || val.mr);
            }
            return parseArray(val);
        };
        const parseLocalizedJson = (val: any) => {
            if (!val) return { en: [], hi: [], mr: [] };
            if (typeof val === 'object' && (val.en || val.hi || val.mr)) {
                return {
                    en: parseArray(val.en),
                    hi: parseArray(val.hi),
                    mr: parseArray(val.mr)
                };
            }
            const parsed = parseArray(val);
            return { en: parsed, hi: [], mr: [] };
        };

        if (template.packages) {
            setPackages(parseLocalizedJsonArray(template.packages));
        }
        if (template.faqs) {
            setFaqs(parseLocalizedJson(template.faqs));
        }
        if (template.image) {
            const imageUrl = template.image.startsWith('http')
                ? template.image
                : `${API_URL.replace('/api', '')}${template.image}`;
            setImagePreview(imageUrl);
        }
    };

    // Handlers
    const handleInputChange = (field: string, value: any, lang?: Language) => {
        if (lang) {
            setFormData(prev => ({
                ...prev,
                [field]: { ...(prev[field as keyof typeof formData] as any), [lang]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleArrayChange = (field: 'description' | 'bullets', lang: Language, index: number, value: string) => {
        setFormData(prev => {
            const currentLangArray = [...(prev[field][lang] || [])];
            currentLangArray[index] = value;
            return {
                ...prev,
                [field]: { ...prev[field], [lang]: currentLangArray }
            };
        });
    };

    const addArrayItem = (field: 'description' | 'bullets', lang: Language) => {
        setFormData(prev => {
            const currentLangArray = [...(prev[field][lang] || [])];
            return {
                ...prev,
                [field]: { ...prev[field], [lang]: [...currentLangArray, ""] }
            };
        });
    };

    const removeArrayItem = (field: 'description' | 'bullets', lang: Language, index: number) => {
        setFormData(prev => {
            const currentLangArray = (prev[field][lang] || []).filter((_: any, i: number) => i !== index);
            return {
                ...prev,
                [field]: { ...prev[field], [lang]: currentLangArray }
            };
        });
    };

    // Packages
    const togglePackage = (ptype: any) => {
        const isSelected = packages.some((p: any) => p.name === ptype.name);
        if (isSelected) {
            setPackages(packages.filter((p: any) => p.name !== ptype.name));
        } else {
            setPackages([...packages, { ...ptype, price: (ptype.name === "Single") ? formData.price : 0 }]);
        }
    };

    const updatePackage = (index: number, field: string, value: any) => {
        const newPkgs = [...packages];
        newPkgs[index] = { ...newPkgs[index], [field]: value };
        setPackages(newPkgs);

        if (newPkgs[index].name === "Single" && field === 'price') {
            setFormData(prev => ({ ...prev, price: value }));
        }
    };

    const addFaq = (lang: Language) => {
        setFaqs({ ...faqs, [lang]: [...(faqs[lang] || []), { q: "", a: "" }] });
    };

    const removeFaq = (index: number, lang: Language) => {
        const langFaqs = (faqs[lang] || []).filter((_: any, i: number) => i !== index);
        setFaqs({ ...faqs, [lang]: langFaqs });
    };

    const updateFaq = (index: number, field: 'q' | 'a', value: string, lang: Language) => {
        const langFaqs = [...(faqs[lang] || [])];
        langFaqs[index] = { ...langFaqs[index], [field]: value };
        setFaqs({ ...faqs, [lang]: langFaqs });
    };

    // Image Handlers
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        setImageFile(croppedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setShowCropper(false);
            setTempImage(null);
        };
        reader.readAsDataURL(croppedFile);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Image Validation:
        // Create mode: a new imageFile must be selected
        // Edit mode:   either a new imageFile OR an existing imagePreview is acceptable
        const hasImage = !!imageFile || (mode === 'edit' && !!imagePreview);
        if (!hasImage) {
            setImageError(true);
            document.getElementById('pooja-image-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setImageError(false);

        const fd = new FormData();

        const isMasterVal = poojaType === "template";

        // Basic fields
        fd.append("price", formData.price.toString());
        fd.append("time", formData.time);
        fd.append("isMaster", isMasterVal.toString());
        fd.append("templeId", poojaType === "temple" ? formData.templeId : "null");
        fd.append("mandalId", poojaType === "mandal" ? formData.mandalId : "null");
        fd.append("masterPoojaId", (poojaType !== "template" && formData.masterPoojaId) ? formData.masterPoojaId : "null");

        // Localized Fields
        Object.entries(formData.name).forEach(([lang, val]) => fd.append(`name_${lang}`, val));
        Object.entries(formData.about).forEach(([lang, val]) => fd.append(`about_${lang}`, val));
        Object.entries(formData.duration).forEach(([lang, val]) => fd.append(`duration_${lang}`, val));

        // Categories
        fd.append("categoryId", formData.categoryId);
        fd.append("categoryIds", JSON.stringify(formData.categoryIds));
        fd.append("category_en", formData.category_en);
        fd.append("category_hi", formData.category_hi);
        fd.append("category_mr", formData.category_mr);

        // Arrays
        fd.append("description_en", JSON.stringify(formData.description.en));
        fd.append("description_hi", JSON.stringify(formData.description.hi));
        fd.append("description_mr", JSON.stringify(formData.description.mr));

        fd.append("bullets_en", JSON.stringify(formData.bullets.en));
        fd.append("bullets_hi", JSON.stringify(formData.bullets.hi));
        fd.append("bullets_mr", JSON.stringify(formData.bullets.mr));

        // JSON Fields
        fd.append("packages", JSON.stringify({ en: packages, hi: packages, mr: packages }));
        fd.append("faqs", JSON.stringify(faqs));
        fd.append("slug", formData.slug);
        fd.append("hasPrasad", formData.hasPrasad.toString());
        if (imageFile) fd.append("image", imageFile);

        await onSubmit(fd);
    };


    return (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Language)} className="w-full">
            <TabsList className="mb-8 grid w-full max-w-md grid-cols-3 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="en" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                    English (EN)
                </TabsTrigger>
                <TabsTrigger value="hi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                    हिंदी (HI)
                </TabsTrigger>
                <TabsTrigger value="mr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                    मराठी (MR)
                </TabsTrigger>
            </TabsList>

            <form onSubmit={handleFormSubmit} className="space-y-10">
                {/* 1. Global Settings (Common to all languages) */}
                <div className="space-y-8 mb-10">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Side: Core Meta */}
                        <div className="flex-1 space-y-8">
                            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-bold text-slate-700">Pooja Type <span className="text-destructive">*</span></Label>
                                        <select
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                                            value={poojaType}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setPoojaType(val);
                                                if (val === "template") {
                                                    handleInputChange("templeId", "platform");
                                                    handleInputChange("masterPoojaId", "");
                                                } else if (val === "platform") {
                                                    handleInputChange("templeId", "");
                                                } else {
                                                    handleInputChange("templeId", "");
                                                }
                                            }}
                                            disabled={mode === "edit"}
                                        >
                                            <option value="template">Template</option>
                                            <option value="platform">DevBhakti Platform Pooja</option>
                                            <option value="temple">Temple Pooja</option>
                                            <option value="mandal">Mandal Pooja</option>
                                        </select>
                                    </div>

                                    {poojaType === "temple" && (
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700">{t('admin_pooja_form.labels.assigned_temple')} <span className="text-destructive">*</span></Label>
                                            <select
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 transition-all font-medium"
                                                value={formData.templeId}
                                                onChange={e => handleInputChange("templeId", e.target.value)}
                                                required={poojaType === "temple"}
                                            >
                                                <option value="">{t('admin_pooja_form.placeholders.select_temple')}</option>
                                                {temples.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {parseLocalizedValue(t[`name_${activeTab}`] || t.name_en || t.name, activeTab) || 'Unnamed'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {poojaType === "mandal" && (
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700">Assigned Mandal <span className="text-destructive">*</span></Label>
                                            <select
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 transition-all font-medium"
                                                value={formData.mandalId}
                                                onChange={e => handleInputChange("mandalId", e.target.value)}
                                                required={poojaType === "mandal"}
                                            >
                                                <option value="">Select Mandal...</option>
                                                {mandals.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {parseLocalizedValue(m.name, activeTab) || 'Unnamed Mandal'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {(poojaType === "platform" || poojaType === "temple") && (
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700">Link to Master Template</Label>
                                            <select
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                                                value={formData.masterPoojaId || ""}
                                                onChange={e => handleTemplateSelect(e.target.value)}
                                                disabled={mode === "edit"}
                                            >
                                                <option value="">-- Standalone (No Template) --</option>
                                                {masterTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {parseLocalizedValue(t.name, activeTab)}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-slate-400 font-medium">Selecting a master template will automatically pre-fill details from it.</p>
                                        </div>
                                    )}

                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-bold text-slate-700">{t('admin_pooja_form.labels.price')} <span className="text-destructive">*</span></Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                            <Input
                                                type="number"
                                                value={formData.price}
                                                onChange={e => {
                                                    const p = parseInt(e.target.value) || 0;
                                                    handleInputChange("price", p);
                                                    const newPkgs = [...packages];
                                                    const singleIdx = newPkgs.findIndex(pkg => pkg.name === "Single");
                                                    if (singleIdx > -1) newPkgs[singleIdx].price = p;
                                                    else newPkgs.push({ name: "Single", description: "For 1 person", price: p });
                                                    setPackages(newPkgs);
                                                }}
                                                className="pl-8 h-12 rounded-xl focus:ring-primary/20 border-slate-200 bg-white font-bold"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-bold text-slate-700">URL Slug (Optional)</Label>
                                    <Input
                                        placeholder="e.g. maha-mrityunjaya-pooja (leave empty for auto-generate)"
                                        value={formData.slug}
                                        onChange={e => handleInputChange("slug", e.target.value)}
                                        className="h-12 rounded-xl focus:ring-primary/20 border-slate-200 bg-white font-medium"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">Use lowercase letters, numbers, and hyphens only.</p>
                                </div>

                                {/* Free Prasad Toggle */}
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-bold text-slate-700">Free Prasad Available</Label>
                                    <div className="flex items-center gap-6 h-12 px-4 rounded-xl border border-slate-200 bg-white">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                            <input
                                                type="radio"
                                                name="hasPrasad"
                                                checked={formData.hasPrasad === true}
                                                onChange={() => handleInputChange("hasPrasad", true)}
                                                className="accent-orange-600 w-4 h-4"
                                            />
                                            Yes
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                            <input
                                                type="radio"
                                                name="hasPrasad"
                                                checked={formData.hasPrasad === false}
                                                onChange={() => handleInputChange("hasPrasad", false)}
                                                className="accent-orange-600 w-4 h-4"
                                            />
                                            No
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">Enable this if the pooja includes free prasad for devotees.</p>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-bold text-slate-700">{t('admin_pooja_form.labels.category')} <span className="text-destructive">*</span></Label>
                                    <Popover>
                                        <PopoverTrigger asChild>     
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-white",
                                                    !formData.category_en && "text-muted-foreground"
                                                )}
                                            >
                                                <div className="flex flex-wrap gap-1 max-w-[280px] overflow-hidden whitespace-nowrap text-ellipsis">
                                                    {formData.category_en ? (
                                                        formData.category_en.split(",").map((cat, i) => (
                                                            <Badge key={i} variant="secondary" className="mr-1 mb-1">
                                                                {cat.trim()}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        t('admin_pooja_form.placeholders.category')
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0 shadow-2xl border-primary/10" align="start">
                                            <Command>
                                                <CommandInput placeholder={t('admin_pooja_form.placeholders.search_category')} />
                                                <CommandList>
                                                    <CommandEmpty>No category found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {availableCategories.map((category) => {
                                                            const catNames = {
                                                                en: parseLocalizedValue(category.name_en || category.name, 'en'),
                                                                hi: parseLocalizedValue(category.name_hi || category.name_en || category.name, 'hi'),
                                                                mr: parseLocalizedValue(category.name_mr || category.name_en || category.name, 'mr')
                                                            };
                                                            const isSelected = formData.categoryIds.includes(category.id);

                                                            return (
                                                                <CommandItem
                                                                    key={category.id}
                                                                    value={catNames.en}
                                                                    onSelect={() => {
                                                                        const currentIds = formData.categoryIds;
                                                                        let newIds;
                                                                        if (isSelected) {
                                                                            newIds = currentIds.filter(id => id !== category.id);
                                                                        } else {
                                                                            newIds = [...currentIds, category.id];
                                                                        }
                                                                        
                                                                        const selectedCats = availableCategories.filter(c => newIds.includes(c.id));
                                                                        const enStr = selectedCats.map(c => parseLocalizedValue(c.name_en || c.name, 'en')).join(', ');
                                                                        const hiStr = selectedCats.map(c => parseLocalizedValue(c.name_hi || c.name_en || c.name, 'hi')).join(', ');
                                                                        const mrStr = selectedCats.map(c => parseLocalizedValue(c.name_mr || c.name_en || c.name, 'mr')).join(', ');

                                                                        handleInputChange("categoryIds", newIds);
                                                                        handleInputChange("categoryId", newIds[0] || "");
                                                                        handleInputChange("category_en", enStr);
                                                                        handleInputChange("category_hi", hiStr);
                                                                        handleInputChange("category_mr", mrStr);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">{catNames.en}</span>
                                                                        <span className="text-[10px] text-slate-400 font-medium">{catNames.hi} • {catNames.mr}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>

                        {/* Tip Side */}
                        <div className="hidden lg:block w-72 space-y-4">
                            <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-orange-900 mb-2">
                                    <Languages className="w-4 h-4" /> Multilingual Tip
                                </h4>
                                <p className="text-[11px] text-orange-800/80 leading-relaxed font-medium">
                                    Common fields above (Price, Category, Temple) apply to all versions. Use tabs below for localized content.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full mb-10" />

                {/* Multilingual Contents Tabs */}
                {["en", "hi", "mr"].map((lang) => (
                    <TabsContent key={lang} value={lang} className="space-y-10 mt-0 outline-none">
                        {/* Pooja Name */}
                        <div className="space-y-2.5">
                            <Label className="text-sm font-bold text-slate-700">{t('admin_pooja_form.labels.name')} <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder={t('admin_pooja_form.placeholders.name')}
                                value={(formData.name as any)[lang]}
                                onChange={e => handleInputChange("name", e.target.value, lang as Language)}
                                className="h-14 text-lg font-bold rounded-xl focus:ring-primary/20 border-slate-200 bg-white"
                                required={lang === 'en'}
                            />
                        </div>

                        {/* 3. About Section */}
                        <div className="space-y-2.5">
                            <Label className="text-sm font-bold text-slate-700">{t('admin_pooja_form.labels.about')}</Label>
                            <RichTextEditor
                                value={(formData.about as any)[lang]}
                                onChange={(html) => handleInputChange("about", html, lang as Language)}
                                placeholder={t('admin_pooja_form.placeholders.about')}
                                minHeight="120px"
                                maxLength={3000}
                            />
                        </div>



                    {/* FAQs */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold text-slate-800">Frequently Asked Questions</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => addFaq(lang as Language)} className="h-9 px-4 rounded-lg bg-orange-50/50 border-orange-100 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold text-xs ring-offset-white transition-colors">
                                <Plus className="w-3.5 h-3.5 mr-2" /> Add FAQ
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {(faqs[lang as Language] || []).map((faq: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-50/50 border rounded-xl relative group space-y-4 shadow-sm">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFaq(idx, lang as Language)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-red-50 hover:bg-red-100"
                                    >
                                        <X className="w-3.5 h-3.5 text-red-500" />
                                    </Button>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('admin_pooja_form.labels.faq_q')}</Label>
                                            <Input
                                                value={faq.q}
                                                onChange={e => updateFaq(idx, 'q', e.target.value, lang as Language)}
                                                placeholder={t('admin_pooja_form.placeholders.faq_q')}
                                                className="h-10 bg-white rounded-lg border-slate-200 font-medium text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('admin_pooja_form.labels.faq_a')}</Label>
                                            <Textarea
                                                value={faq.a}
                                                onChange={e => updateFaq(idx, 'a', e.target.value, lang as Language)}
                                                placeholder={t('admin_pooja_form.placeholders.faq_a')}
                                                className="min-h-[80px] bg-white rounded-lg border-slate-200 resize-none pr-10 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            ))}

            {/* Global Packages Section */}
            <div className="bg-white border rounded-xl p-8 shadow-sm space-y-8">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Package className="w-5 h-5" />
                    <h2 className="text-xl">Pooja Packages (Common)</h2>
                </div>
                
                <div className="space-y-4">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin_pooja_form.labels.select_tier')}</Label>
                    <div className="flex flex-wrap gap-2">
                        {STATIC_PACKAGE_TYPES.map((ptype) => {
                            const isSelected = packages.some((p: any) => p.name === ptype.name);
                            return (
                                <TooltipProvider key={ptype.name} delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant={isSelected ? "default" : "outline"}
                                                onClick={() => togglePackage(ptype)}
                                                className={`rounded-full px-6 h-[34px] text-xs font-bold transition-all ${isSelected ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100' : 'bg-orange-50/50 text-slate-600 border-orange-100 hover:bg-orange-50 hover:text-orange-700'}`}
                                            >
                                                <Plus className={`w-3.5 h-3.5 mr-1.5 ${isSelected ? 'rotate-45' : ''} transition-transform`} /> {ptype.name}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg">
                                            {ptype.description}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                </div>

                <div className="min-h-[100px] border border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50/50">
                    {(packages.length === 0) ? (
                        <div className="flex flex-col items-center gap-2 text-slate-400 py-8">
                            <Package className="w-8 h-8 opacity-20" />
                            <p className="text-xs font-medium">Select at least one package above to set its price</p>
                        </div>
                    ) : (
                        <div className="w-full p-6 grid grid-cols-1 gap-4">
                            {packages.map((pkg: any, idx: number) => (
                                <div key={pkg.name} className="flex flex-col md:flex-row gap-6 p-6 bg-white border border-slate-100 rounded-2xl relative group shadow-sm hover:shadow-md transition-shadow">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => togglePackage(pkg)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-red-50 hover:bg-red-100"
                                    >
                                        <X className="w-4 h-4 text-red-500" />
                                    </Button>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-4 space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('admin_pooja_form.labels.tier_type')}</Label>
                                            <TooltipProvider delayDuration={100}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="h-12 flex items-center gap-2 px-4 bg-slate-50/50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 cursor-default">
                                                            {pkg.name}
                                                            {pkg.description && (
                                                                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    {pkg.description && (
                                                        <TooltipContent side="top" className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg">
                                                            {pkg.description}
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('admin_pooja_form.labels.tier_price')}</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                                <Input
                                                    type="number"
                                                    value={pkg.price}
                                                    onChange={e => updatePackage(idx, 'price', parseInt(e.target.value) || 0)}
                                                    className="h-12 pl-8 bg-white rounded-xl border-slate-200 font-bold text-sm shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Note</Label>
                                            <div className="h-12 flex items-center px-4 bg-slate-50/30 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium select-none">
                                                {pkg.description || '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Service Image Section (Global) */}
            <div id="pooja-image-section" className={`bg-white border rounded-xl p-6 shadow-sm space-y-6 ${imageError ? 'border-red-400 ring-2 ring-red-200' : ''}`}>
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pooja Media Asset <span className="text-red-500">*</span></Label>
                    {imageError && (
                        <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                            ⚠️ Image is required — please upload a pooja image before saving.
                        </span>
                    )}
                </div>
                <div className={`flex flex-col md:flex-row items-center gap-8 p-6 rounded-2xl border border-dashed ${imageError ? 'bg-red-50 border-red-300' : 'bg-slate-50/50 border-slate-200'}`}>
                    <div className={`w-full md:w-48 aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-sm ${imageError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}>
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setImageFile(null);
                                        setImagePreview("");
                                        const fileInput = document.getElementById('pooja-image-upload') as HTMLInputElement;
                                        if (fileInput) fileInput.value = '';
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full z-10 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                <Upload className="w-8 h-8" />
                            </div>
                        )}
                        <input id="pooja-image-upload" type="file" className="absolute inset-0 opacity-0 cursor-pointer z-0" onChange={handleImageChange} accept="image/*" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-slate-800 text-sm">Upload a high-quality image</h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                            JPG, PNG or WEBP. Max 5MB. Aspect Ratio: 16:9 (1280x720 px)
                        </p>
                    </div>
                </div>
            </div>

                {/* Final Actions */}
                <div className="flex justify-end pt-8 pb-12 gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => window.history.back()}
                        className="px-8 rounded-full font-bold h-12 text-slate-500 hover:text-slate-700"
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="px-12 rounded-full font-bold h-12 shadow-lg shadow-primary/20 hover:scale-105 transition-all text-lg"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin mr-2">◌</span>
                                {t('common.processing')}
                            </>
                        ) : (
                            mode === "create" ? t('admin_pooja_form.actions.create') : t('admin_pooja_form.actions.update')
                        )}
                    </Button>
                </div>

                {showCropper && tempImage && (
                    <ImageCropper
                        image={tempImage}
                        onCropComplete={handleCropComplete}
                        onCancel={() => setShowCropper(false)}
                        initialAspect={16 / 9}
                        lockAspect={true}
                        title={t('admin_pooja_form.crop_modal.title')}
                    />
                )}
            </form>
        </Tabs>
    );
};

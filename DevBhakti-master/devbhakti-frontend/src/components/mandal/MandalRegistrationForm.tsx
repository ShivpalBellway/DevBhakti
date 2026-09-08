"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import {
    X,
    User,
    Building2,
    MapPin,
    Phone,
    Globe,
    Check,
    ArrowRight,
    Sparkles,
    FileText,
    Image as ImageIcon,
    Upload,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitMandalRegistration, fetchMandalRegistrationStatus } from "@/api/publicController";
import { captureLead } from "@/api/leadApi";
import { ImageCropper } from "@/components/admin/ImageCropper";

export default function MandalRegistrationForm({ onClose }: { onClose?: () => void }) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");
    const [festivalsList, setFestivalsList] = useState<any[]>([]);

    useEffect(() => {
        fetchMandalRegistrationStatus()
            .then(res => {
                if (res && res.success) {
                    const list = Array.isArray(res.festivals) ? res.festivals : [];
                    setFestivalsList(list);
                    if (res.activeFestival && (res.activeFestival.name || res.activeFestival.title?.en)) {
                        const defaultFestName = res.activeFestival.name || res.activeFestival.title?.en;
                        setFormData(prev => ({
                            ...prev,
                            mandalType: prev.mandalType || defaultFestName
                        }));
                    }
                }
            })
            .catch(console.error);
    }, []);

    const [formData, setFormData] = useState({
        presidentName: "",
        contactNumber: "",
        email: "",
        name: "",
        mandalType: "",
        establishedYear: "",
        description: "",
        presiding_deity: "",
        festivals: "",
        address: "",
        city: "",
        state: "",
        pinCode: "",
        registrationNumber: "",
        verificationDocUrl: "",
        presidentIdDocUrl: "",
        mapUrl: ""
    });

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>("");
    const [heroImages, setHeroImages] = useState<File[]>([]);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);

    // Cropper states
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<"main" | "banner">("main");
    const [cropperTitle, setCropperTitle] = useState("Crop Image");
    const [pendingHeroFiles, setPendingHeroFiles] = useState<File[]>([]);

    const openCropper = (file: File, target: "main" | "banner", title: string) => {
        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result as string);
            setCropTarget(target);
            setCropperTitle(title);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            openCropper(file, "main", "Crop Mandal Main Image (4:3 Landscape Ratio)");
            e.target.value = "";
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter(file => file.type.startsWith("image/"));
        if (!files.length) return;

        const currentCount = heroImages.length;
        const remaining = 5 - currentCount;
        const validFiles = files.slice(0, remaining);
        if (!validFiles.length) return;

        const [first, ...rest] = validFiles;
        setPendingHeroFiles(rest);
        openCropper(first, "banner", "Crop Banner Image (4:3 Landscape Ratio)");
        e.target.value = "";
    };

    const handleCropComplete = (croppedFile: File) => {
        if (cropTarget === "main") {
            setMainImage(croppedFile);
            setMainImagePreview(URL.createObjectURL(croppedFile));
        } else if (cropTarget === "banner") {
            setHeroImages(prev => [...prev, croppedFile]);
            setHeroPreviews(prev => [...prev, URL.createObjectURL(croppedFile)]);
            if (pendingHeroFiles.length > 0) {
                const [next, ...remaining] = pendingHeroFiles;
                setPendingHeroFiles(remaining);
                setTimeout(() => {
                    openCropper(next, "banner", "Crop Banner Image (4:3 Landscape Ratio)");
                }, 100);
                return;
            }
        }
        setShowCropper(false);
        setTempImage(null);
    };

    const removeHeroImage = (index: number) => {
        setHeroImages(prev => prev.filter((_, i) => i !== index));
        setHeroPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const fd = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    fd.append(key, value as string);
                }
            });

            if (mainImage) fd.append("image", mainImage);
            heroImages.forEach(file => {
                fd.append("heroImages", file);
            });

            const res = await submitMandalRegistration(fd);
            if (res.success) {
                setShowSuccess(true);
                // Auto-capture lead for CRM
                try {
                    const phone = formData.contactNumber.startsWith('+91') ? formData.contactNumber : `+91${formData.contactNumber}`;
                    await captureLead(phone, "TEMPLE_ONBOARDING", { mandalName: formData.name, mandalType: formData.mandalType }, formData.presidentName, formData.email);
                } catch (leadErr) {
                    console.error("Lead capture warning:", leadErr);
                }
            } else {
                setError(res.message || "Failed to submit registration.");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="p-12 text-center space-y-6 bg-white rounded-[2rem] w-full max-w-4xl mx-auto shadow-2xl">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                    <Check className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900">{t("registerMandal.success_title")}</h2>
                <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                    {t("registerMandal.success_desc")}
                </p>
                <Button onClick={() => window.location.href = "/"} className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full shadow-lg">
                    {t("registerMandal.btn_return_home")}
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] overflow-hidden shadow-2xl relative border border-slate-100 font-sans flex flex-col max-h-[90vh]">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-[#88542b] to-[#88542b] p-8 md:p-10 text-white relative shrink-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none" />
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">{t("registerMandal.page_title")}</h2>
                        <p className="text-orange-50 font-medium">{t("registerMandal.page_subtitle")}</p>
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

            <form
                id="mandal-reg-form"
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar"
            >
                {/* 1. Account Identity */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{t("registerMandal.president_name")}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.president_name")}</label>
                            <Input
                                name="presidentName"
                                value={formData.presidentName}
                                onChange={handleChange}
                                placeholder={t("registerMandal.president_name")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.contact_number")}</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold border-r pr-2 border-slate-300">
                                    +91
                                </div>
                                <Input
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    type="tel"
                                    maxLength={10}
                                    onChange={handleChange}
                                    placeholder={t("registerMandal.contact_number")}
                                    className="h-12 pl-14 border-slate-200 focus:border-orange-500 rounded-xl"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.email")}</label>
                            <Input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={t("registerMandal.email")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Mandal Profile */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{t("registerMandal.section_basic")}</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.name_label")} *</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t("registerMandal.name_label")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">Festival / Mandal Type</label>
                                <select
                                    name="mandalType"
                                    value={formData.mandalType}
                                    onChange={handleChange}
                                    className="w-full h-12 px-3 border border-slate-200 focus:border-orange-500 rounded-xl font-medium"
                                >
                                    <option value="">{t("registerMandal.mandal_type_select") || "Select Festival / Type"}</option>
                                    {festivalsList.length > 0 ? (
                                        festivalsList.map((fest: any) => {
                                            const festName = fest.name || fest.title?.en || fest.title?.hi || fest.id;
                                            return (
                                                <option key={fest.id || festName} value={festName}>
                                                    {festName} {fest.isActive ? "(Active Festival)" : ""}
                                                </option>
                                            );
                                        })
                                    ) : (
                                        <>
                                            <option value="Ganesh">{t("registerMandal.type_ganesh") || "Ganesh Mandal"}</option>
                                            <option value="Durga">{t("registerMandal.type_durga") || "Durga Puja Samiti"}</option>
                                            <option value="Ram">{t("registerMandal.type_ram") || "Ram Leela Samiti"}</option>
                                            <option value="Other">{t("registerMandal.type_other") || "Other"}</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">Established Year / Active Since</label>
                                <Input
                                    name="establishedYear"
                                    value={formData.establishedYear}
                                    onChange={handleChange}
                                    placeholder="e.g. 1950 or 80+ years"
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.about_label")}</label>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder={t("registerMandal.desc_placeholder")}
                                className="min-h-[120px] border-slate-200 focus:border-orange-500 rounded-xl resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* 3. Deity & Festivals */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{t("registerMandal.section_deity")}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.presiding_deity")}</label>
                            <Input
                                name="presiding_deity"
                                value={formData.presiding_deity}
                                onChange={handleChange}
                                placeholder={t("registerMandal.presiding_deity_placeholder")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.festivals")}</label>
                            <Input
                                name="festivals"
                                value={formData.festivals}
                                onChange={handleChange}
                                placeholder={t("registerMandal.festivals_placeholder")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                    </div>
                </section>

                {/* 4. Location */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{t("registerMandal.section_location")}</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.address")}</label>
                            <Input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder={t("registerMandal.address_placeholder")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t('registerMandal.map_url') || 'Google Maps URL'}</label>
                            <Input
                                name="mapUrl"
                                value={formData.mapUrl}
                                onChange={handleChange}
                                placeholder="https://maps.google.com/..."
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.city")}</label>
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder={t("registerMandal.city")}
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.state")}</label>
                                <Input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder={t("registerMandal.state")}
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.pincode")}</label>
                                <Input
                                    name="pinCode"
                                    value={formData.pinCode}
                                    onChange={handleChange}
                                    placeholder={t("registerMandal.pincode")}
                                    className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Media Assets */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{t('registerMandal.section_media') || 'Media Assets'}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t('registerMandal.main_image') || 'Main Image'}</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-1 hover:border-[#88542b]/50 hover:bg-orange-50/30 transition-all group relative cursor-pointer overflow-hidden aspect-[16/9] flex items-center justify-center bg-slate-50/50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    onChange={handleMainImageChange}
                                />
                                {mainImagePreview ? (
                                    <div className="w-full h-full relative group">
                                        <img src={mainImagePreview} className="w-full h-full object-cover rounded-[1.25rem]" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[1.25rem] backdrop-blur-[2px]">
                                            <div className="bg-white/20 p-4 rounded-full border border-white/30">
                                                <Upload className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-3 p-6 flex flex-col items-center justify-center w-full h-full">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                                            <Upload className="w-8 h-8 text-[#88542b]/60 group-hover:text-[#88542b]" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-[#88542b] font-bold uppercase tracking-[0.2em]">{t('registerMandal.select_photo') || 'SELECT PHOTO'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t('registerMandal.banners') || 'Banner Images'}</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {heroPreviews.map((url, i) => (
                                    <div key={url} className="aspect-[2.4/1] rounded-2xl overflow-hidden relative border border-slate-100 group shadow-sm bg-slate-50">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeHeroImage(i)}
                                                className="bg-red-500 text-white p-2.5 rounded-full hover:scale-110 transition-transform shadow-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {heroPreviews.length < 5 && (
                                    <div className="aspect-[2.4/1] rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#88542b]/50 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center cursor-pointer relative bg-slate-50/50 group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                            onChange={handleHeroImagesChange}
                                        />
                                        <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 mb-2 group-hover:scale-110 transition-transform duration-300">
                                            <Upload className="w-5 h-5 text-[#88542b]/60 group-hover:text-[#88542b]" />
                                        </div>
                                        <p className="text-[10px] font-bold text-[#88542b] uppercase tracking-wider">{t('registerMandal.add_banner') || 'Add Banner'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Documents */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{t("registerMandal.section_contact")}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.reg_number")}</label>
                            <Input
                                name="registrationNumber"
                                value={formData.registrationNumber}
                                onChange={handleChange}
                                placeholder={t("registerMandal.reg_number_placeholder")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.verification_doc")}</label>
                            <Input
                                name="verificationDocUrl"
                                value={formData.verificationDocUrl}
                                onChange={handleChange}
                                placeholder={t("registerMandal.doc_link_placeholder")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">{t("registerMandal.president_id")}</label>
                            <Input
                                name="presidentIdDocUrl"
                                value={formData.presidentIdDocUrl}
                                onChange={handleChange}
                                placeholder={t("registerMandal.doc_link_placeholder")}
                                className="h-12 border-slate-200 focus:border-orange-500 rounded-xl"
                            />
                        </div>
                    </div>
                </section>
                
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
                        {error}
                    </div>
                )}
            </form>

            {/* Footer Actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
                {onClose && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="h-14 px-8 text-slate-500 font-bold hover:bg-slate-200 rounded-full"
                    >
                        {t('common.discard') || 'Discard'}
                    </Button>
                )}
                <Button
                    type="submit"
                    form="mandal-reg-form"
                    disabled={isLoading}
                    className="h-14 px-12 bg-gradient-to-r from-[#88542b] to-[#794a05] hover:from-[#794a05] hover:to-[#88542b] text-white rounded-full text-lg font-bold shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t("registerMandal.btn_submitting")}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {t("registerMandal.btn_submit")}
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </Button>
            </div>

            {showCropper && tempImage && (
                <ImageCropper
                    image={tempImage}
                    initialAspect={4 / 3}
                    lockAspect={true}
                    title={cropperTitle}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        setTempImage(null);
                        setPendingHeroFiles([]);
                    }}
                />
            )}
        </div>
    );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    FileText,
    Upload,
    Trash2,
    Eye,
    Save,
    Plus,
    Loader2,
    CheckCircle2,
    Sparkles,
    Image as ImageIcon,
    HelpCircle,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchReceiptConfig, updateReceiptConfig, fetchMandalProfile } from "@/api/mandalAdminController";
import { generateMandalReceiptHTML } from "@/utils/mandalReceiptTemplate";
import { BASE_URL } from "@/config/apiConfig";

const getApiAssetUrl = (pathStr: string) => {
    if (!pathStr) return "";
    if (pathStr.startsWith("http") || pathStr.startsWith("blob:")) return pathStr;
    const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function MandalReceiptSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [mandalInfo, setMandalInfo] = useState<any>(null);

    // Config state
    const [receiptHeaderFile, setReceiptHeaderFile] = useState<File | null>(null);
    const [receiptHeaderPreview, setReceiptHeaderPreview] = useState<string | null>(null);
    const [existingReceiptHeader, setExistingReceiptHeader] = useState<string | null>(null);
    const [removeReceiptHeader, setRemoveReceiptHeader] = useState(false);

    const [existingSponsors, setExistingSponsors] = useState<Array<{ id: string; imageUrl: string; name?: string }>>([]);
    const [sponsorFiles, setSponsorFiles] = useState<File[]>([]);
    const [customThankYouNote, setCustomThankYouNote] = useState<string>("");

    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const receiptHeaderInputRef = useRef<HTMLInputElement>(null);
    const sponsorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const profileRes = await fetchMandalProfile();
            if (profileRes.success && profileRes.data) {
                setMandalInfo(profileRes.data);
            }

            const res = await fetchReceiptConfig();
            if (res.success && res.data) {
                const config = res.data.receiptConfig || {};
                setExistingReceiptHeader(config.headerBanner || null);
                setExistingSponsors(config.sponsors || []);
                setCustomThankYouNote(config.customThankYouNote || "");
            }
        } catch (error) {
            console.error("Error loading receipt settings:", error);
            toast.error("Failed to load receipt settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSponsorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const totalAllowed = 5 - (existingSponsors.length + sponsorFiles.length);
        if (totalAllowed <= 0) {
            toast.error("Maximum 5 sponsor banner strips allowed");
            return;
        }

        const validFiles = files.slice(0, totalAllowed);
        setSponsorFiles(prev => [...prev, ...validFiles]);
        if (files.length > totalAllowed) {
            toast.info(`Added ${totalAllowed} banners. Maximum limit is 5 sponsor strips.`);
        }
        e.target.value = "";
    };

    const handleRemoveExistingSponsor = (index: number) => {
        setExistingSponsors(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNewSponsor = (index: number) => {
        setSponsorFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            if (receiptHeaderFile) {
                formData.append("receiptHeaderBanner", receiptHeaderFile);
            }
            if (removeReceiptHeader) {
                formData.append("removeReceiptHeader", "true");
            }
            formData.append("existingSponsors", JSON.stringify(existingSponsors));
            sponsorFiles.forEach((file) => {
                formData.append("sponsorBanners", file);
            });
            formData.append("customThankYouNote", customThankYouNote);

            const res = await updateReceiptConfig(formData);
            if (res.success) {
                toast.success("Receipt branding updated successfully!");
                setReceiptHeaderFile(null);
                setReceiptHeaderPreview(null);
                setSponsorFiles([]);
                await loadData();
            } else {
                toast.error(res.message || "Failed to update receipt settings");
            }
        } catch (error: any) {
            console.error("Save receipt settings error:", error);
            toast.error(error?.response?.data?.message || "Error saving receipt settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-[#7b4623] animate-spin" />
                <p className="text-[#7b4623] font-serif font-medium text-sm animate-pulse">
                    Loading Receipt Configuration...
                </p>
            </div>
        );
    }

    const currentHeaderUrl = !removeReceiptHeader
        ? (receiptHeaderPreview || (existingReceiptHeader ? getApiAssetUrl(existingReceiptHeader) : null))
        : null;

    const allSponsorItems = [
        ...existingSponsors.map(sp => ({ ...sp, imageUrl: getApiAssetUrl(sp.imageUrl) })),
        ...sponsorFiles.map(f => ({ imageUrl: URL.createObjectURL(f) }))
    ];

    return (
        <div className="space-y-6 pb-12 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-900 via-[#7b4623] to-amber-950 p-6 rounded-2xl text-white shadow-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <FileText className="w-7 h-7 text-amber-300" />
                        <h1 className="text-2xl font-serif font-bold tracking-wide">Receipt Branding & Ads Settings</h1>
                    </div>
                    <p className="text-amber-100/80 text-sm">
                        Personalize donation receipts with your Mandal header logo, sponsor banner strips, and custom thank-you notes.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => setShowPreviewModal(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
                    >
                        <Eye className="w-4 h-4 mr-2" /> Live Receipt Preview
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold shadow-lg shadow-amber-400/20"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Settings
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Settings Form (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Header Banner Card */}
                    <Card className="border-amber-200/60 shadow-md">
                        <CardHeader className="pb-4 border-b bg-amber-50/40">
                            <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-amber-700" />
                                    1. Custom Top Header Banner
                                </span>
                                <Badge variant="outline" className="text-[11px] bg-amber-100 text-amber-800 border-amber-300">
                                    Recommended: 1600 × 300 px
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                This logo/banner will be displayed at the top of every printed donation receipt and PDF download.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <input
                                ref={receiptHeaderInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setReceiptHeaderFile(file);
                                    setReceiptHeaderPreview(URL.createObjectURL(file));
                                    setRemoveReceiptHeader(false);
                                    e.target.value = "";
                                }}
                                className="hidden"
                            />

                            <div className="space-y-3">
                                {currentHeaderUrl ? (
                                    <div className="relative group border-2 border-dashed border-amber-300 rounded-2xl overflow-hidden bg-slate-900 p-2 shadow-inner">
                                        <img
                                            src={currentHeaderUrl}
                                            alt="Receipt Header"
                                            className="w-full h-32 object-contain rounded-xl"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => receiptHeaderInputRef.current?.click()}
                                                className="bg-white text-black hover:bg-amber-100"
                                            >
                                                <Upload className="w-4 h-4 mr-1.5" /> Change Image
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setReceiptHeaderFile(null);
                                                    setReceiptHeaderPreview(null);
                                                    setRemoveReceiptHeader(true);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1.5" /> Remove Banner
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => receiptHeaderInputRef.current?.click()}
                                        className="cursor-pointer border-2 border-dashed border-amber-300 hover:border-[#7b4623] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-amber-50/20 hover:bg-amber-50/60 transition-all text-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-amber-100 text-[#7b4623] flex items-center justify-center">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#7b4623]">Click to upload Header Banner</p>
                                            <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, WEBP (Max 3MB)</p>
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                                    If no custom banner is uploaded, the system will automatically render a clean text header with your Mandal Name & Address.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sponsor Banners Card */}
                    <Card className="border-amber-200/60 shadow-md">
                        <CardHeader className="pb-4 border-b bg-amber-50/40">
                            <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-700" />
                                    2. Sponsor / Advertiser Banners
                                </span>
                                <Badge variant="outline" className="text-[11px] bg-amber-100 text-amber-800 border-amber-300">
                                    Up to 5 Strips (1600 × 120 px)
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Add horizontal sponsor strips at the bottom of the receipt to monetize or thank local advertisers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <input
                                ref={sponsorInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleSponsorUpload}
                                className="hidden"
                            />

                            <div className="space-y-3">
                                {allSponsorItems.length === 0 ? (
                                    <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                        <p className="text-sm font-medium text-slate-600">No Sponsor Banners Added Yet</p>
                                        <p className="text-xs text-slate-400 mt-1">Sponsor banners will be printed cleanly at the bottom strip of receipts.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {existingSponsors.map((sponsor, idx) => (
                                            <div key={sponsor.id} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-xs font-bold text-amber-800 w-6 text-center">#{idx + 1}</span>
                                                    <img src={getApiAssetUrl(sponsor.imageUrl)} alt="Sponsor" className="w-28 h-10 object-contain rounded border bg-white" />
                                                    <span className="text-xs font-medium truncate text-slate-700">{sponsor.name || `Sponsor ${idx + 1}`}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveExistingSponsor(idx)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        {sponsorFiles.map((file, idx) => (
                                            <div key={`new_${idx}`} className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-xs font-bold text-amber-800 w-6 text-center">#{existingSponsors.length + idx + 1}</span>
                                                    <img src={URL.createObjectURL(file)} alt="New Sponsor" className="w-28 h-10 object-contain rounded border bg-white" />
                                                    <span className="text-xs font-medium truncate text-amber-900">{file.name} (New)</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveNewSponsor(idx)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {allSponsorItems.length < 5 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => sponsorInputRef.current?.click()}
                                        className="w-full border-dashed border-amber-400 text-[#7b4623] hover:bg-amber-50 h-11 rounded-xl font-medium"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Sponsor Banner Strip
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Custom Thank You Note Card */}
                    <Card className="border-amber-200/60 shadow-md">
                        <CardHeader className="pb-4 border-b bg-amber-50/40">
                            <CardTitle className="text-lg font-serif text-[#7b4623] flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-amber-700" />
                                3. Custom Thank You Note
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-3">
                            <Textarea
                                rows={3}
                                value={customThankYouNote}
                                onChange={(e) => setCustomThankYouNote(e.target.value)}
                                placeholder="Your support helps us continue our seva and keep our traditions alive."
                                className="border-slate-200 rounded-xl text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                This message appears directly above the total amount and QR code on the receipt.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Preview Column (5 cols) */}
                <div className="lg:col-span-5">
                    <div className="sticky top-20 space-y-4">
                        <Card className="border-amber-200/80 shadow-lg overflow-hidden bg-slate-50">
                            <CardHeader className="py-3 px-4 bg-gradient-to-r from-[#7b4623] to-amber-900 text-white flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-serif flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-amber-300" /> Live Receipt Preview
                                </CardTitle>
                                <Badge className="bg-amber-400 text-amber-950 text-[10px] font-bold">
                                    Print Ready
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-2">
                                <iframe
                                    srcDoc={generateMandalReceiptHTML({
                                        receiptNo: "REC-2026-001",
                                        dateTime: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
                                        paymentMode: "ONLINE / UPI",
                                        transactionId: "TXN_SAMPLE_8923",
                                        mandalName: mandalInfo?.name_en || mandalInfo?.name || "Shree Ganesh Utsav Mandal",
                                        mandalAddress: mandalInfo?.address ? `${mandalInfo.address}, ${mandalInfo.city || ''}` : "Mumbai, Maharashtra",
                                        mandalSlug: mandalInfo?.slug || "ganesh-utsav-mandal",
                                        headerBanner: currentHeaderUrl,
                                        sponsors: allSponsorItems,
                                        customThankYouNote: customThankYouNote || "Your support helps us continue our seva and keep our traditions alive.",
                                        items: [
                                            { srNo: 1, description: "Ganesh Pooja & Seva Contribution", quantity: 1, amount: 2100 },
                                            { srNo: 2, description: "Annadan Prasadam Seva", quantity: 1, amount: 501 }
                                        ],
                                        totalAmount: 2601,
                                        devoteeName: "Sample Devotee",
                                        devoteePhone: "+91 9876543210"
                                    })}
                                    className="w-full h-[640px] border-0 rounded-lg shadow-inner bg-white"
                                    title="Receipt Live Preview"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal Dialog for Full Screen Preview */}
            <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white p-6">
                    <DialogHeader>
                        <DialogTitle className="text-center font-serif font-bold text-lg text-[#7b4623] flex items-center justify-center gap-2">
                            <Eye className="w-5 h-5" /> Full Printable Receipt Preview
                        </DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-xl p-2 bg-slate-50">
                        <iframe
                            srcDoc={generateMandalReceiptHTML({
                                receiptNo: "REC-2026-001",
                                dateTime: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
                                paymentMode: "ONLINE / UPI",
                                transactionId: "TXN_SAMPLE_8923",
                                mandalName: mandalInfo?.name_en || mandalInfo?.name || "Shree Ganesh Utsav Mandal",
                                mandalAddress: mandalInfo?.address ? `${mandalInfo.address}, ${mandalInfo.city || ''}` : "Mumbai, Maharashtra",
                                mandalSlug: mandalInfo?.slug || "ganesh-utsav-mandal",
                                headerBanner: currentHeaderUrl,
                                sponsors: allSponsorItems,
                                customThankYouNote: customThankYouNote || "Your support helps us continue our seva and keep our traditions alive.",
                                items: [
                                    { srNo: 1, description: "Ganesh Pooja & Seva Contribution", quantity: 1, amount: 2100 },
                                    { srNo: 2, description: "Annadan Prasadam Seva", quantity: 1, amount: 501 }
                                ],
                                totalAmount: 2601,
                                devoteeName: "Sample Devotee",
                                devoteePhone: "+91 9876543210"
                            })}
                            className="w-full h-[700px] border-0 rounded-lg"
                            title="Receipt Full Preview"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

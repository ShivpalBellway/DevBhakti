"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Upload, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { createMandalPooja } from "@/api/mandalAdminController";
import { fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { parseLocalizedValue } from "@/utils/textUtils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function MandalCreatePoojaPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [poojaCategories, setPoojaCategories] = useState<any[]>([]);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await fetchPoojaCategories();
            if (res.success) setPoojaCategories(res.data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const toggleCategory = (catName: string) => {
        setSelectedCats(prev => {
            if (prev.includes(catName)) {
                return prev.filter(c => c !== catName);
            } else {
                if (prev.length >= 5) {
                    toast({
                        title: "Limit Exceeded",
                        description: "You can only select up to 5 categories.",
                        variant: "destructive"
                    });
                    return prev;
                }
                return [...prev, catName];
            }
        });
    };

    const handleSuggestCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsSuggesting(true);
        try {
            const res = await suggestPoojaCategory(newCategoryName);
            if (res.success) {
                toast({ 
                    title: "Suggested", 
                    description: "Your suggestion has been sent to admin for approval.",
                    variant: "success"
                });
                setNewCategoryName("");
                setShowAddCategory(false);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to suggest", variant: "destructive" });
        } finally {
            setIsSuggesting(false);
        }
    };

    const STATIC_PACKAGE_TYPES = [
        { name: "Single", description: "For 1 person" },
        { name: "Couple", description: "For 2 people" },
        { name: "Family", description: "Upto 5 people" },
        { name: "Group", description: "Upto 8 people" },
        { name: "Big Group", description: "Upto 25 people" },
        { name: "Small Business", description: "Upto 50 people" },
        { name: "Large Business", description: "Upto 100 people" },
    ];

    const [formData, setFormData] = useState({
        name_en: "",
        name_hi: "",
        name_mr: "",
        price: 501,
        time: "",
        about_en: "",
        about_hi: "",
        about_mr: "",
        description_en: [] as string[],
        description_hi: [] as string[],
        description_mr: [] as string[],
        benefits_en: [] as string[],
        benefits_hi: [] as string[],
        benefits_mr: [] as string[],
        bullets_en: [] as string[],
        bullets_hi: [] as string[],
        bullets_mr: [] as string[],
        packages: [
            { name: "Single", description: "For 1 person", price: 501 }
        ] as any[],
        processSteps: [] as any[],
        faqs: [] as any[],
        hasPrasad: false,
        status: true
    });

    const [newStep, setNewStep] = useState({ title: "", description: "" });
    const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

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
        setImagePreview(URL.createObjectURL(croppedFile));
        setShowCropper(false);
    };

    const addStep = () => {
        if (!newStep.title || !newStep.description) return;
        setFormData({
            ...formData,
            processSteps: [...formData.processSteps, newStep]
        });
        setNewStep({ title: "", description: "" });
    };

    const removeStep = (index: number) => {
        setFormData({
            ...formData,
            processSteps: formData.processSteps.filter((_, i) => i !== index)
        });
    };

    const addFaq = () => {
        if (!newFaq.question || !newFaq.answer) return;
        setFormData({
            ...formData,
            faqs: [...formData.faqs, newFaq]
        });
        setNewFaq({ question: "", answer: "" });
    };

    const removeFaq = (index: number) => {
        setFormData({
            ...formData,
            faqs: formData.faqs.filter((_, i) => i !== index)
        });
    };

    const togglePackage = (ptype: any) => {
        const exists = formData.packages.find(p => p.name === ptype.name);
        if (exists) {
            setFormData({
                ...formData,
                packages: formData.packages.filter(p => p.name !== ptype.name)
            });
        } else {
            const newPrice = ptype.name === "Single" ? formData.price : 0;
            setFormData({
                ...formData,
                packages: [...formData.packages, { ...ptype, price: newPrice }]
            });
        }
    };

    const handlePackagePriceChange = (name: string, priceVal: number) => {
        setFormData({
            ...formData,
            packages: formData.packages.map(p => p.name === name ? { ...p, price: priceVal } : p)
        });
    };

    const handlePackageDescriptionChange = (name: string, descVal: string) => {
        setFormData({
            ...formData,
            packages: formData.packages.map(p => p.name === name ? { ...p, description: descVal } : p)
        });
    };

    const handleArrayInput = (field: 'description' | 'benefits' | 'bullets', lang: 'en' | 'hi' | 'mr', value: string) => {
        const arrayVal = value.split('\n').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({
            ...prev,
            [`${field}_${lang}`]: arrayVal
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name_en) {
            toast({ title: "Validation Error", description: "Pooja name is required in English.", variant: "destructive" });
            return;
        }

        if (selectedCats.length === 0) {
            toast({ title: "Validation Error", description: "Please select at least one category.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            const submissionData = new FormData();
            
            submissionData.append('name_en', formData.name_en);
            submissionData.append('name_hi', formData.name_hi);
            submissionData.append('name_mr', formData.name_mr);
            submissionData.append('price', String(formData.price));
            submissionData.append('category', selectedCats.join(", "));
            submissionData.append('time', formData.time);
            submissionData.append('about_en', formData.about_en);
            submissionData.append('about_hi', formData.about_hi);
            submissionData.append('about_mr', formData.about_mr);

            submissionData.append('description_en', JSON.stringify(formData.description_en));
            submissionData.append('description_hi', JSON.stringify(formData.description_hi));
            submissionData.append('description_mr', JSON.stringify(formData.description_mr));

            submissionData.append('benefits_en', JSON.stringify(formData.benefits_en));
            submissionData.append('benefits_hi', JSON.stringify(formData.benefits_hi));
            submissionData.append('benefits_mr', JSON.stringify(formData.benefits_mr));

            submissionData.append('bullets_en', JSON.stringify(formData.bullets_en));
            submissionData.append('bullets_hi', JSON.stringify(formData.bullets_hi));
            submissionData.append('bullets_mr', JSON.stringify(formData.bullets_mr));

            submissionData.append('packages', JSON.stringify(formData.packages));
            submissionData.append('processSteps', JSON.stringify(formData.processSteps));
            submissionData.append('faqs', JSON.stringify(formData.faqs));
            submissionData.append('hasPrasad', String(formData.hasPrasad));
            submissionData.append('status', String(formData.status));

            if (imageFile) {
                submissionData.append('image', imageFile);
            }

            const res = await createMandalPooja(submissionData);

            if (res.success) {
                toast({ title: "Success", description: "Pooja created successfully!" });
                router.push("/mandals/dashboard/poojas");
            } else {
                toast({ title: "Error", description: res.message || "Failed to create pooja", variant: "destructive" });
            }
        } catch (error: any) {
            console.error("Submit Error:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/mandals/dashboard/poojas")} className="rounded-full">
                    <ArrowLeft className="w-5 h-5 text-[#7b4623]" />
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#7b4623]">Create New Pooja</h1>
                    <p className="text-muted-foreground text-sm">Add a new sacred ritual or seva for your mandal.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Name & Primary Info */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">1. Basic Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-500">Pooja Name (English) *</Label>
                            <Input
                                placeholder="e.g. Rudrabhishek Pooja"
                                required
                                value={formData.name_en}
                                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-500">Pooja Name (Hindi)</Label>
                            <Input
                                placeholder="e.g. रुद्राभिषेक पूजा"
                                value={formData.name_hi}
                                onChange={(e) => setFormData({ ...formData, name_hi: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-500">Pooja Name (Marathi)</Label>
                            <Input
                                placeholder="e.g. रुद्राभिषेक पूजा"
                                value={formData.name_mr}
                                onChange={(e) => setFormData({ ...formData, name_mr: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-500">Single Person Price (₹) *</Label>
                            <Input
                                type="number"
                                required
                                min="0"
                                value={formData.price}
                                onChange={(e) => {
                                    const newPrice = parseInt(e.target.value) || 0;
                                    setFormData((prev) => {
                                        const newPackages = prev.packages.map((pkg) => {
                                            if (pkg.name === "Single") {
                                                return { ...pkg, price: newPrice };
                                            }
                                            return pkg;
                                        });
                                        return { ...prev, price: newPrice, packages: newPackages };
                                    });
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-500">Duration (e.g. 1.5 Hours)</Label>
                            <Input
                                placeholder="e.g. 2 Hours"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-xs text-slate-500">Category Selection *</Label>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between border-slate-200 text-slate-700 h-10">
                                            {selectedCats.length === 0 ? "Select Categories" : `${selectedCats.length} Selected`}
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                                        {poojaCategories.map((cat) => {
                                            const catName = parseLocalizedValue(cat.name);
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={cat.id}
                                                    checked={selectedCats.includes(catName)}
                                                    onCheckedChange={() => toggleCategory(catName)}
                                                >
                                                    {catName}
                                                </DropdownMenuCheckboxItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button type="button" variant="ghost" onClick={() => setShowAddCategory(true)} className="px-2 h-10 border border-dashed border-orange-200 text-[#7b4623] hover:bg-orange-50">
                                    + Suggest
                                </Button>
                            </div>
                        </div>
                    </div>


                </div>

                {/* 2. Cover Image */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">2. Cover Image</h2>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors relative overflow-hidden group min-h-[200px]">
                        {imagePreview ? (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden max-h-[250px]">
                                <img src={imagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImageFile(null); setImagePreview(""); }}
                                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer w-full py-6">
                                <Upload className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform mb-2" />
                                <span className="text-xs font-bold text-slate-700">Upload Banner Image</span>
                                <span className="text-[10px] text-slate-400 mt-1">Accepts PNG, JPG. Max 5MB. Recommended: 1200 x 600</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                </div>

                {/* 3. About Translation Tab */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">3. About & Descriptions</h2>
                    <Tabs defaultValue="en" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl h-10">
                            <TabsTrigger value="en" className="font-bold text-xs">English</TabsTrigger>
                            <TabsTrigger value="hi" className="font-bold text-xs">Hindi</TabsTrigger>
                            <TabsTrigger value="mr" className="font-bold text-xs">Marathi</TabsTrigger>
                        </TabsList>

                        {(['en', 'hi', 'mr'] as const).map((lang) => (
                            <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-xs text-slate-500">About Seva (Rich text description)</Label>
                                    <RichTextEditor
                                        value={formData[`about_${lang}`]}
                                        onChange={(html) => setFormData({ ...formData, [`about_${lang}`]: html })}
                                        placeholder={`Explain what this ritual is, its significance, and how it benefits the devotee...`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-xs text-slate-500">Points / Description Lines (One line per paragraph)</Label>
                                    <Textarea
                                        placeholder="Line 1 of details&#10;Line 2 of details&#10;Line 3 of details"
                                        rows={4}
                                        onChange={(e) => handleArrayInput('description', lang, e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-xs text-slate-500">Benefits of Pooja (One point per line)</Label>
                                    <Textarea
                                        placeholder="Removes hurdles from professional life&#10;Provides mental peace and family prosperity&#10;Brings good fortune"
                                        rows={3}
                                        onChange={(e) => handleArrayInput('benefits', lang, e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                {/* 4. Packages */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">4. Packages Configurations</h2>
                    <p className="text-xs text-slate-400">Configure price points for couples, family, or business groups.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {STATIC_PACKAGE_TYPES.map((ptype) => {
                            const isSelected = formData.packages.some(p => p.name === ptype.name);
                            return (
                                <button
                                    key={ptype.name}
                                    type="button"
                                    onClick={() => togglePackage(ptype)}
                                    className={cn(
                                        "px-4 py-2 rounded-2xl text-xs font-bold transition-all border",
                                        isSelected
                                            ? "bg-[#7b4623] text-white border-[#7b4623]"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-[#7b4623]/30"
                                    )}
                                >
                                    {ptype.name}
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-3">
                        {formData.packages.map((pkg, idx) => (
                            <div key={pkg.name} className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 text-sm capitalize">{pkg.name} Tier</span>
                                    <Button variant="ghost" size="sm" type="button" onClick={() => togglePackage(pkg)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto">
                                        Remove
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="font-bold text-[10px] text-slate-500">Price (₹) *</Label>
                                        <Input
                                            type="number"
                                            value={pkg.price}
                                            disabled={pkg.name === "Single"}
                                            onChange={(e) => handlePackagePriceChange(pkg.name, parseInt(e.target.value) || 0)}
                                            className="h-8 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="font-bold text-[10px] text-slate-500">Tier Description (e.g. includes family of 4)</Label>
                                        <Input
                                            value={pkg.description}
                                            onChange={(e) => handlePackageDescriptionChange(pkg.name, e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQs */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        <Input
                            placeholder="Question (e.g. Can I join via video stream?)"
                            value={newFaq.question}
                            onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                            className="h-9 text-xs"
                        />
                        <Textarea
                            placeholder="Provide the detailed answer here..."
                            value={newFaq.answer}
                            onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                            className="text-xs"
                            rows={2}
                        />
                        <Button type="button" size="sm" onClick={addFaq} className="bg-orange-50 text-[#7b4623] hover:bg-orange-100 w-full h-8 text-xs font-bold">
                            + Add FAQ
                        </Button>
                    </div>

                    <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto pr-1">
                        {formData.faqs.map((faq, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl relative border">
                                <h4 className="font-bold text-slate-800 text-xs pr-6">Q: {faq.question}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">A: {faq.answer}</p>
                                <button
                                    type="button"
                                    onClick={() => removeFaq(idx)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submitting Status */}
                <div className="flex gap-4 items-center justify-end">
                    <Button type="button" variant="outline" onClick={() => router.push("/mandals/dashboard/poojas")} disabled={isSubmitting} className="rounded-xl px-6">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl px-8 shadow-md">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Seva...
                            </>
                        ) : (
                            "Submit Offering"
                        )}
                    </Button>
                </div>
            </form>

            {/* Dialog for Suggesting Category */}
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Suggest New Category</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label className="text-xs font-bold text-slate-500">Category Name (Hindi/English)</Label>
                        <Input
                            placeholder="e.g. Pitra Dosh Nivaran"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Our team will verify and approve the suggested category before it becomes active.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowAddCategory(false)} disabled={isSuggesting}>Cancel</Button>
                        <Button onClick={handleSuggestCategory} disabled={isSuggesting} className="bg-[#7b4623] hover:bg-[#5d351a] text-white">
                            {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Suggestion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cropper Modal */}
            {showCropper && tempImage && (
                <ImageCropper
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                    initialAspect={21 / 9}
                />
            )}
        </div>
    );
}

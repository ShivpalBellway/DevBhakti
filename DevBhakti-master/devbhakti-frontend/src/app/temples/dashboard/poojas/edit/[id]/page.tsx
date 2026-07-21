"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { ArrowLeft, Save, X, Upload, Plus, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { fetchMyPoojas, updateMyPooja, fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseLocalizedValue } from "@/utils/textUtils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function TempleEditPoojaPage() {
    const router = useRouter();
    const params = useParams();
    const poojaId = params.id as string;
    const { toast } = useToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [poojaCategories, setPoojaCategories] = useState<any[]>([]);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSuggesting, setIsSuggesting] = useState(false);

    const [formData, setFormData] = useState({
        name_en: "",
        name_hi: "",
        name_mr: "",
        price: 0,
        category: "",
        time: "",
        about_en: "",
        about_hi: "",
        about_mr: "",
        description: [] as string[],
        benefits: [] as string[],
        bullets: [] as string[],
        packages: [] as any[],
        processSteps: [] as any[],
        faqs: [] as any[],
        hasPrasad: false,
        status: true
    });

    useEffect(() => {
        loadPooja();
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
        { name: "Corporates", description: "Upto 500 people" }
    ];

    const loadPooja = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyPoojas();
            // The API returns { success: true, data: [...] }
            const poojasList = response.data || response || [];
            const pooja = Array.isArray(poojasList) ? poojasList.find((p: any) => p.id === poojaId) : null;

            if (pooja) {
                // Ensure packages is an array
                const rawPackages = Array.isArray(pooja.packages) ? pooja.packages : [];

                // Only keep packages that match our fixed types
                const validPackages = rawPackages.filter((p: any) =>
                    STATIC_PACKAGE_TYPES.some(st => st.name === p.name)
                );

                const getL = (field: any, lang: string, fallback: any = "") => {
                    const result = parseLocalizedValue(field, lang);
                    return result === "N/A" ? fallback : result;
                };

                const ensureArray = (val: any) => Array.isArray(val) ? val : [];

                setFormData({
                    name_en: getL(pooja.name, 'en'),
                    name_hi: getL(pooja.name, 'hi'),
                    name_mr: getL(pooja.name, 'mr'),
                    price: pooja.price || 0,
                    category: typeof pooja.category === 'string' ? pooja.category : getL(pooja.category, 'en'),
                    time: pooja.time || "",
                    about_en: getL(pooja.about, 'en'),
                    about_hi: getL(pooja.about, 'hi'),
                    about_mr: getL(pooja.about, 'mr'),
                    description: ensureArray(pooja.description),
                    benefits: ensureArray(pooja.benefits),
                    bullets: ensureArray(pooja.bullets),
                    packages: validPackages,
                    processSteps: ensureArray(pooja.processSteps),
                    faqs: ensureArray(pooja.faqs),
                    hasPrasad: pooja.hasPrasad ?? false,
                    status: pooja.status ?? true
                });

                const catStr = getL(pooja.category, 'en');
                if (catStr) {
                    const cats = catStr.split(",").map((c: string) => c.trim()).filter(Boolean);
                    setSelectedCats(cats);
                }

                if (pooja.image) {
                    const imageUrl = pooja.image.startsWith('http')
                        ? pooja.image
                        : `${API_URL.replace('/api', '')}${pooja.image}`;
                    setImagePreview(imageUrl);
                }
            } else {
                toast({ title: "Error", description: "Pooja not found", variant: "destructive" });
                router.push('/temples/dashboard/poojas');
            }
        } catch (error: any) {
            console.error("Failed to load pooja:", error);
            toast({ 
                title: "Error", 
                description: error.response?.data?.message || "Failed to load pooja details", 
                variant: "destructive" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset input to allow re-selection of the same file
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        setImageFile(croppedFile);
        setImagePreview(URL.createObjectURL(croppedFile));
        setShowCropper(false);
        setTempImage(null);
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

    const updatePackage = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newPackages = [...prev.packages];
            if (newPackages[index]) {
                newPackages[index] = { ...newPackages[index], [field]: value };

                const update: any = { packages: newPackages };
                // If it's a Single package and price changed, sync top price
                if (newPackages[index].name === "Single" && field === 'price') {
                    update.price = value;
                }
                return { ...prev, ...update };
            }
            return prev;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageFile && !imagePreview) {
            toast({
                title: "Error",
                description: "Please upload a cover image for the pooja.",
                variant: "destructive"
            });
            document.getElementById('pooja-image')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);

        const submissionData = new FormData();
        submissionData.append('name_en', formData.name_en);
        submissionData.append('name_hi', formData.name_hi);
        submissionData.append('name_mr', formData.name_mr);
        submissionData.append('about_en', formData.about_en);
        submissionData.append('about_hi', formData.about_hi);
        submissionData.append('about_mr', formData.about_mr);
        submissionData.append('price', formData.price.toString());

        submissionData.append('category', formData.category);
        submissionData.append('time', formData.time);
        submissionData.append('description', JSON.stringify(formData.description));
        submissionData.append('benefits', JSON.stringify(formData.benefits));
        submissionData.append('bullets', JSON.stringify(formData.bullets));
        submissionData.append('packages', JSON.stringify(formData.packages));
        submissionData.append('processSteps', JSON.stringify(formData.processSteps));
        submissionData.append('faqs', JSON.stringify(formData.faqs));
        submissionData.append('hasPrasad', formData.hasPrasad.toString());
        submissionData.append('status', formData.status.toString());

        if (imageFile) {
            submissionData.append('image', imageFile);
        }

        // Add the combined categories
        submissionData.set('category', selectedCats.join(", "));

        try {
            await updateMyPooja(poojaId, submissionData);
            toast({ title: "Success", description: "Pooja updated successfully" });
            router.push('/temples/dashboard/poojas');
        } catch (error) {
            toast({ title: "Error", description: "Failed to update pooja", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 border-4 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading pooja details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {showCropper && tempImage && (
                <ImageCropper
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        setTempImage(null);
                    }}
                    initialAspect={16 / 9}
                    lockAspect={true}
                    title="Crop Pooja Image"
                />
            )}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#7b4623]">Edit Pooja</h1>
                    <p className="text-slate-500">Modify your existing spiritual offering.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-2xl border shadow-sm">
                <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="en" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">English</TabsTrigger>
                        <TabsTrigger value="hi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">हिन्दी</TabsTrigger>
                        <TabsTrigger value="mr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">मराठी</TabsTrigger>
                    </TabsList>

                    {['en', 'hi', 'mr'].map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-6 mt-0 outline-none animate-in fade-in-50 duration-300">
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold border-b pb-2 text-[#7b4623]">
                                    {lang === 'en' ? 'Pooja Details' : lang === 'hi' ? 'पूजा विवरण' : 'पूजा तपशील'} ({lang.toUpperCase()})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor={`name_${lang}`}>Pooja Name * ({lang.toUpperCase()})</Label>
                                        <Input
                                            id={`name_${lang}`}
                                            value={(formData as any)[`name_${lang}`]}
                                            onChange={(e) => setFormData({ ...formData, [`name_${lang}`]: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                            required={lang === 'en'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Single Person Price (₹) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price === 0 ? "" : formData.price}
                                            onChange={(e) => {
                                                const newPrice = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                setFormData(prev => {
                                                    let newPackages = [...prev.packages];
                                                    const singlePkgIndex = newPackages.findIndex(p => p.name === "Single");
                                                    
                                                    if (singlePkgIndex > -1) {
                                                        // Update existing single package
                                                        newPackages[singlePkgIndex] = { ...newPackages[singlePkgIndex], price: newPrice };
                                                    } else if (newPrice > 0) {
                                                        // Auto-add Single package if it doesn't exist
                                                        newPackages.push({ name: "Single", description: "For 1 person", price: newPrice });
                                                    }
                                                    
                                                    return { ...prev, price: newPrice, packages: newPackages };
                                                });
                                            }}
                                            className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-8">
                                        <input
                                            type="checkbox"
                                            id="status"
                                            checked={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                            className="w-5 h-5 accent-[#7b4623]"
                                        />
                                        <Label htmlFor="status" className="font-semibold cursor-pointer">Active (Visible to devotees)</Label>
                                    </div>

                                </div>

                                <div className="space-y-2">
                                    <Label>About the Pooja ({lang.toUpperCase()})</Label>
                                    <RichTextEditor
                                        value={(formData as any)[`about_${lang}`]}
                                        onChange={(content) => setFormData({ ...formData, [`about_${lang}`]: content })}
                                        placeholder="Describe the significance and process..."
                                        minHeight="150px"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-base font-semibold text-[#7b4623]">Pooja Image</Label>
                        <div className="flex items-start gap-6">
                            <div className="shrink-0">
                                <div className="w-32 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden relative group">
                                    {imagePreview ? (
                                        <>
                                            <img 
                                                src={imagePreview} 
                                                alt="Pooja preview" 
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setImageFile(null);
                                                    setImagePreview("");
                                                    const fileInput = document.getElementById('pooja-image') as HTMLInputElement;
                                                    if (fileInput) fileInput.value = '';
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full z-10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <input
                                        type="file"
                                        id="pooja-image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => document.getElementById('pooja-image')?.click()}
                                        variant="outline"
                                        className="rounded-xl border-dashed border-[#7b4623] text-[#7b4623] hover:bg-orange-50"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Choose New Image
                                    </Button>
                                </div>
                                {imagePreview && (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview("");
                                        }}
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Remove Image
                                    </Button>
                                )}
                                <p className="text-xs text-slate-500">
                                    Upload a new image to replace the current one. Image will be cropped to 16:9 ratio.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold text-[#7b4623]">Category/Purpose </Label>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddCategory(true)}
                                className="rounded-full px-4 h-9 text-sm border-dashed border-[#7b4623] text-[#7b4623] hover:bg-orange-50"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add New
                            </Button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-between h-14 rounded-2xl px-4 border-slate-200 bg-slate-50/50 hover:bg-white transition-all text-left font-normal"
                                >
                                    <div className="flex flex-wrap gap-1.5 items-center overflow-hidden py-1">
                                        {selectedCats.length > 0 ? (
                                            selectedCats.map((catName) => (
                                                <span key={catName} className="bg-[#7b4623]/10 text-[#7b4623] text-[12px] font-medium px-3 py-1 rounded-lg border border-[#7b4623]/20 whitespace-nowrap">
                                                    {parseLocalizedValue(catName)}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400">Select categories for this pooja...</span>
                                        )}
                                    </div>
                                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-2 text-[#7b4623]" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[400px] overflow-y-auto rounded-2xl shadow-2xl border-slate-100 p-2 animate-in slide-in-from-top-2 duration-200">
                                {poojaCategories.map((cat) => (
                                    <DropdownMenuCheckboxItem
                                        key={cat.id}
                                        checked={selectedCats.includes(cat.name)}
                                        onSelect={(e) => e.preventDefault()}
                                        onCheckedChange={() => toggleCategory(cat.name)}
                                        className="rounded-xl mb-1 last:mb-0 h-10 cursor-pointer focus:bg-orange-50 focus:text-[#7b4623]"
                                    >
                                        {parseLocalizedValue(cat.name)}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {selectedCats.length === 0 && (
                            <p className="text-[11px] text-slate-400 italic pl-1">Select one or more purposes for this pooja (Max 5)</p>
                        )}
                        {selectedCats.length > 0 && (
                            <p className="text-[11px] text-[#7b4623] font-medium pl-1">
                                Selected {selectedCats.length} of 5 categories
                            </p>
                        )}
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
                                    onChange={() => setFormData({ ...formData, hasPrasad: true })}
                                    className="w-4 h-4 text-primary focus:ring-primary/20 cursor-pointer"
                                />
                                Yes
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                <input
                                    type="radio"
                                    name="hasPrasad"
                                    checked={formData.hasPrasad === false}
                                    onChange={() => setFormData({ ...formData, hasPrasad: false })}
                                    className="w-4 h-4 text-primary focus:ring-primary/20 cursor-pointer"
                                />
                                No
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Enable this if the pooja includes free prasad for devotees.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-lg font-semibold text-[#7b4623]">Update Packages</h3>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Select Packages to Offer</Label>
                        <TooltipProvider>
                            <div className="flex flex-wrap gap-3">
                                {STATIC_PACKAGE_TYPES.map((ptype) => {
                                    const isSelected = formData.packages.some(p => p.name === ptype.name);
                                    return (
                                        <Tooltip key={ptype.name}>
                                            <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant={isSelected ? "default" : "outline"}
                                                onClick={() => togglePackage(ptype)}
                                                className={`rounded-full px-6 transition-all ${isSelected ? 'bg-[#7b4623] hover:bg-[#5d351a] shadow-md border-transparent' : 'hover:border-[#7b4623] hover:text-[#7b4623]'}`}
                                            >
                                                {isSelected && <Plus className="w-4 h-4 mr-2 rotate-45" />}
                                                {!isSelected && <Plus className="w-4 h-4 mr-2" />}
                                                {ptype.name}
                                            </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{ptype.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </TooltipProvider>
                    </div>

                    <div className="space-y-4">
                        {formData.packages.length > 0 ? (
                            <div className="space-y-4 pt-2">
                                <Label className="text-sm font-medium">Configure Selected Packages</Label>
                                {formData.packages.map((pkg, index) => (
                                    <div key={pkg.name} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-end">
                                        <div className="sm:col-span-3">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Type</Label>
                                            <div className="h-10 flex items-center px-3 bg-white rounded-lg border border-slate-200 font-semibold text-[#7b4623]">
                                                {pkg.name}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-3">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Price (₹)</Label>
                                            <Input
                                                type="number"
                                                value={pkg.price === 0 ? "" : pkg.price}
                                                onChange={(e) => updatePackage(index, 'price', e.target.value === "" ? 0 : parseInt(e.target.value))}
                                                className="h-10 border-slate-200 focus:border-[#7b4623]"
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Short Note</Label>
                                            <Input
                                                placeholder="Details"
                                                value={pkg.description}
                                                readOnly
                                                className="h-10 border-slate-200 bg-slate-50 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex items-center justify-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => togglePackage(pkg)}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                                <p className="text-sm italic">Toggle the buttons above to enable specific pricing packages.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl h-11 px-8">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-10 bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-lg">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="mr-2 w-4 h-4" />}
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>

            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Suggest New Purpose/Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="newCat">Purpose Name</Label>
                            <Input
                                id="newCat"
                                placeholder="e.g. Baby Shower"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="rounded-xl"
                            />
                            <p className="text-xs text-slate-500 italic">New purposes will be visible to everyone once approved by DevBhakti Admin.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddCategory(false)} className="rounded-xl">Cancel</Button>
                        <Button
                            onClick={handleSuggestCategory}
                            disabled={isSuggesting || !newCategoryName.trim()}
                            className="bg-[#7b4623] hover:bg-[#5d351a] rounded-xl text-white"
                        >
                            {isSuggesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
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
import { createMyPooja, fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";
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

export default function TempleCreatePoojaPage() {
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
        { name: "Corporates", description: "Upto 500 people" }
    ];

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
        packages: [] as any[], // Start with empty, user will select
        processSteps: [] as any[],
        faqs: [] as any[],
        hasPrasad: false,
        status: true
    });

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

        if (!imageFile) {
            toast({
                title: "Error",
                description: "Please upload a cover image for the pooja.",
                variant: "destructive"
            });
            document.getElementById('image-upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            await createMyPooja(submissionData);
            toast({ title: "Success", description: "Pooja offered successfully" });
            router.push('/temples/dashboard/poojas');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to offer pooja",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full hover:bg-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#7b4623]">Create New Pooja</h1>
                    <p className="text-slate-500">Add a new ritual or service for your devotees.</p>
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
                                    {lang === 'en' ? 'Basic Information' : lang === 'hi' ? 'बुनियादी जानकारी' : 'मूलभूत माहिती'} ({lang.toUpperCase()})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor={`name_${lang}`}>Pooja Name * ({lang.toUpperCase()})</Label>
                                        <Input
                                            id={`name_${lang}`}
                                            placeholder={lang === 'en' ? "e.g. Shanti Path" : lang === 'hi' ? "उदा. शांति पाठ" : "उदा. शांती पाठ"}
                                            value={(formData as any)[`name_${lang}`]}
                                            onChange={(e) => setFormData({ ...formData, [`name_${lang}`]: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                            required={lang === 'en'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Single Person Price(₹) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price === 0 ? "" : formData.price}
                                            onChange={(e) => {
                                                const newPrice = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                setFormData((prev) => {
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
                                        placeholder={lang === 'en' ? "Describe the significance and process..." : lang === 'hi' ? "इस पूजा के महत्व और प्रक्रिया का वर्णन करें..." : "या पूजेचे महत्व आणि प्रक्रिया स्पष्ट करा..."}
                                        minHeight="150px"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>

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

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-[#7b4623]">Visuals</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-full sm:w-48 h-48 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 relative group cursor-pointer" onClick={() => (document.getElementById('image-upload') as any).click()}>
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setImageFile(null);
                                            setImagePreview("");
                                            const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                                            if (fileInput) fileInput.value = '';
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full z-10 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                                    <span className="text-xs text-slate-400 mt-2 block">Click to upload</span>
                                </div>
                            )}
                            <input
                                id="image-upload"
                                type="file"
                                className="hidden"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                            <p className="text-sm font-semibold">Cover Image</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Upload a high-quality image.<br />
                                <span className="text-primary font-semibold">Recommended: 1200x675 px (16:9).</span> Max 5MB.
                            </p>
                            <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full" onClick={() => (document.getElementById('image-upload') as any).click()}>
                                Select Image
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-lg font-semibold text-[#7b4623]">Pricing Packages</h3>
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
                                                className={`rounded-full px-6 transition-all ${isSelected ? 'bg-[#7b4623] hover:bg-[#5d351a] shadow-md' : 'hover:border-[#7b4623] hover:text-[#7b4623]'}`}
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

                    {formData.packages.length > 0 ? (
                        <div className="space-y-4 pt-4">
                            <Label className="text-sm font-medium">Set Package Pricing</Label>
                            {formData.packages.map((pkg, index) => (
                                <div key={pkg.name} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 items-end">
                                    <div className="sm:col-span-3 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Type</Label>
                                        <div className="h-10 flex items-center px-3 bg-white rounded-lg border border-slate-200 font-semibold text-[#7b4623]">
                                            {pkg.name}
                                        </div>
                                    </div>
                                    <div className="sm:col-span-3 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Price (₹)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={pkg.price === 0 ? "" : pkg.price}
                                            onChange={(e) => updatePackage(index, 'price', e.target.value === "" ? 0 : parseInt(e.target.value))}
                                            className="rounded-lg h-10 border-slate-200 focus:border-[#7b4623]"
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-5 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Short Note</Label>
                                        <Input
                                            placeholder="e.g. Special prasad included"
                                            value={pkg.description}
                                            readOnly
                                            className="rounded-lg h-10 border-slate-200 bg-slate-50 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="sm:col-span-1 flex justify-center">
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
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                            <p className="text-sm italic">Select at least one package above to set its price.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl h-11 px-8">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-10 bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-lg shadow-orange-900/10">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isSubmitting ? "Creating..." : "Submit"}
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

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
        setSelectedCats(prev =>
            prev.includes(catName)
                ? prev.filter(c => c !== catName)
                : [...prev, catName]
        );
    };

    const handleSuggestCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsSuggesting(true);
        try {
            const res = await suggestPoojaCategory(newCategoryName);
            if (res.success) {
                toast({ title: "Suggested", description: "Your suggestion has been sent to admin for approval." });
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
        name: "",
        price: 0,

        category: "",
        time: "",
        about: "",
        description: [] as string[],
        benefits: [] as string[],
        bullets: [] as string[],
        packages: [] as any[], // Start with empty, user will select
        processSteps: [] as any[],
        faqs: [] as any[],
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
        const newPackages = [...formData.packages];
        newPackages[index] = { ...newPackages[index], [field]: value };
        setFormData({ ...formData, packages: newPackages });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('price', formData.price.toString());

        submissionData.append('category', formData.category);
        submissionData.append('time', formData.time);
        submissionData.append('about', formData.about);
        submissionData.append('description', JSON.stringify(formData.description));
        submissionData.append('benefits', JSON.stringify(formData.benefits));
        submissionData.append('bullets', JSON.stringify(formData.bullets));
        submissionData.append('packages', JSON.stringify(formData.packages));
        submissionData.append('processSteps', JSON.stringify(formData.processSteps));
        submissionData.append('faqs', JSON.stringify(formData.faqs));
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
                    <h1 className="text-3xl font-serif font-bold text-[#7b4623]">Offer New Pooja</h1>
                    <p className="text-slate-500">Add a new ritual or service for your devotees.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-2xl border shadow-sm">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2 text-[#7b4623]">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Pooja Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Shanti Path"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>
                        <div className="space-y-4 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold text-[#7b4623]">Category/Purpose *</Label>
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
                                    <Button variant="outline" className="w-full justify-between h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-transparent">
                                        <span>Select purposes...</span>
                                        <ChevronDown className="w-4 h-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                                    {poojaCategories.map((cat) => (
                                        <DropdownMenuCheckboxItem
                                            key={cat.id}
                                            checked={selectedCats.includes(cat.name)}
                                            onCheckedChange={() => toggleCategory(cat.name)}
                                        >
                                            {cat.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedCats.map(catName => (
                                    <div key={catName} className="flex items-center gap-1.5 bg-[#7b4623] text-white px-3 py-1.5 rounded-full text-sm">
                                        <span>{catName}</span>
                                        <X
                                            className="w-3.5 h-3.5 cursor-pointer hover:text-red-300"
                                            onClick={() => toggleCategory(catName)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {selectedCats.length === 0 && (
                                <p className="text-[10px] text-slate-400 italic">Select one or more purposes for this pooja</p>
                            )}
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
                                        const newPackages = prev.packages.map((pkg) => {
                                            if (pkg.name === "Single") {
                                                return { ...pkg, price: newPrice };
                                            }
                                            return pkg;
                                        });
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
                        {/* <div className="space-y-2">
                            <Label htmlFor="time">Preferred Time *</Label>
                            <Input
                                id="time"
                                placeholder="e.g. Morning (7:00 AM)"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div> */}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="about">About the Pooja</Label>
                        <Textarea
                            id="about"
                            placeholder="Describe the significance and process of this pooja..."
                            value={formData.about}
                            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                            className="h-32 rounded-xl resize-none border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-[#7b4623]">Visuals</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-full sm:w-48 h-48 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 relative group cursor-pointer" onClick={() => (document.getElementById('image-upload') as any).click()}>
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
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
                        <div className="flex flex-wrap gap-3">
                            {STATIC_PACKAGE_TYPES.map((ptype) => {
                                const isSelected = formData.packages.some(p => p.name === ptype.name);
                                return (
                                    <Button
                                        key={ptype.name}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        onClick={() => togglePackage(ptype)}
                                        className={`rounded-full px-6 transition-all ${isSelected ? 'bg-[#7b4623] hover:bg-[#5d351a] shadow-md' : 'hover:border-[#7b4623] hover:text-[#7b4623]'}`}
                                    >
                                        {isSelected && <Plus className="w-4 h-4 mr-2 rotate-45" />}
                                        {!isSelected && <Plus className="w-4 h-4 mr-2" />}
                                        {ptype.name}
                                    </Button>
                                );
                            })}
                        </div>
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
                                            onChange={(e) => updatePackage(index, 'description', e.target.value)}
                                            className="rounded-lg h-10 border-slate-200"
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

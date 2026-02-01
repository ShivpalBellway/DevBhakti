"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, Upload, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchMyPoojas, updateMyPooja } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function TempleEditPoojaPage() {
    const router = useRouter();
    const params = useParams();
    const poojaId = params.id as string;
    const { toast } = useToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: "",
        price: 0,
        duration: "",
        category: "",
        time: "",
        about: "",
        description: [] as string[],
        benefits: [] as string[],
        bullets: [] as string[],
        packages: [] as any[],
        processSteps: [] as any[],
        faqs: [] as any[]
    });

    useEffect(() => {
        loadPooja();
    }, []);

    const STATIC_PACKAGE_TYPES = [
        { name: "Single", description: "For 1 person" },
        { name: "Couple", description: "For 2 people" },
        { name: "Family", description: "Upto 5 people" },
        { name: "Group", description: "Upto 6 people" }
    ];

    const loadPooja = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyPoojas();
            // The API returns { success: true, data: [...] }
            const pooja = (response.data || []).find((p: any) => p.id === poojaId);

            if (pooja) {
                // Only keep packages that match our fixed types
                const validPackages = (pooja.packages || []).filter((p: any) =>
                    STATIC_PACKAGE_TYPES.some(st => st.name === p.name)
                );

                setFormData({
                    name: pooja.name,
                    price: pooja.price,
                    duration: pooja.duration || "",
                    category: pooja.category || "",
                    time: pooja.time || "",
                    about: pooja.about || "",
                    description: pooja.description || [],
                    benefits: pooja.benefits || [],
                    bullets: pooja.bullets || [],
                    packages: validPackages,
                    processSteps: pooja.processSteps || [],
                    faqs: pooja.faqs || []
                });

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
        } catch (error) {
            toast({ title: "Error", description: "Failed to load pooja", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const togglePackage = (ptype: any) => {
        const exists = formData.packages.find(p => p.name === ptype.name);
        if (exists) {
            setFormData({
                ...formData,
                packages: formData.packages.filter(p => p.name !== ptype.name)
            });
        } else {
            setFormData({
                ...formData,
                packages: [...formData.packages, { ...ptype, price: 0 }]
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
        submissionData.append('duration', formData.duration);
        submissionData.append('category', formData.category);
        submissionData.append('time', formData.time);
        submissionData.append('about', formData.about);
        submissionData.append('description', JSON.stringify(formData.description));
        submissionData.append('benefits', JSON.stringify(formData.benefits));
        submissionData.append('bullets', JSON.stringify(formData.bullets));
        submissionData.append('packages', JSON.stringify(formData.packages));
        submissionData.append('processSteps', JSON.stringify(formData.processSteps));
        submissionData.append('faqs', JSON.stringify(formData.faqs));

        if (imageFile) {
            submissionData.append('image', imageFile);
        }

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
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2 text-[#7b4623]">Pooja Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Pooja Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Input
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Base Price (₹) *</Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration *</Label>
                            <Input
                                id="duration"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 text-[#7b4623]">Pooja Media</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 relative group cursor-pointer" onClick={() => (document.getElementById('image-edit') as any).click()}>
                            {imagePreview && (
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                                <Upload className="w-6 h-6 mb-1" />
                            </div>
                            <input
                                id="image-edit"
                                type="file"
                                className="hidden"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-semibold">Change Cover Image</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">Click on the image preview to pick a new file.
                                Leave as is if you don't want to change the image.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-lg font-semibold text-[#7b4623]">Update Packages</h3>
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
                                        className={`rounded-full px-6 transition-all ${isSelected ? 'bg-[#7b4623] hover:bg-[#5d351a] shadow-md border-transparent' : 'hover:border-[#7b4623] hover:text-[#7b4623]'}`}
                                    >
                                        {isSelected && <Plus className="w-4 h-4 mr-2 rotate-45" />}
                                        {!isSelected && <Plus className="w-4 h-4 mr-2" />}
                                        {ptype.name}
                                    </Button>
                                );
                            })}
                        </div>
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
                                                value={pkg.price}
                                                onChange={(e) => updatePackage(index, 'price', parseInt(e.target.value) || 0)}
                                                className="h-10 border-slate-200 focus:border-[#7b4623]"
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-5">
                                            <Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Short Note</Label>
                                            <Input
                                                placeholder="Details"
                                                value={pkg.description}
                                                onChange={(e) => updatePackage(index, 'description', e.target.value)}
                                                className="h-10 border-slate-200"
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
        </div>
    );
}

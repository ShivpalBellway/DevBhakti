"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMyPooja } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";

export default function TempleCreatePoojaPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const addPackage = () => {
        setFormData({
            ...formData,
            packages: [...formData.packages, { name: "", price: 0, description: "" }]
        });
    };

    const updatePackage = (index: number, field: string, value: any) => {
        const newPackages = [...formData.packages];
        newPackages[index] = { ...newPackages[index], [field]: value };
        setFormData({ ...formData, packages: newPackages });
    };

    const removePackage = (index: number) => {
        setFormData({
            ...formData,
            packages: formData.packages.filter((_, i) => i !== index)
        });
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
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Input
                                id="category"
                                placeholder="e.g. Special Ritual"
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
                                placeholder="e.g. 45 mins"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Preferred Time *</Label>
                            <Input
                                id="time"
                                placeholder="e.g. Morning (7:00 AM)"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="rounded-xl h-11 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>
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
                                Recommended: 800x800px or larger. Max 5MB.
                            </p>
                            <Button type="button" variant="outline" size="sm" className="mt-2 rounded-full" onClick={() => (document.getElementById('image-upload') as any).click()}>
                                Select Image
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-lg font-semibold text-[#7b4623]">Pricing Packages</h3>
                        <Button type="button" variant="ghost" size="sm" onClick={addPackage} className="text-[#7b4623] hover:bg-orange-50 h-8">
                            <Plus className="w-4 h-4 mr-1" /> Add Package
                        </Button>
                    </div>
                    {formData.packages.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground py-4 italic">No extra packages. Base price will apply.</p>
                    ) : (
                        <div className="space-y-4">
                            {formData.packages.map((pkg, index) => (
                                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <div className="sm:col-span-5 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Package Name</Label>
                                        <Input
                                            placeholder="e.g. Family Package"
                                            value={pkg.name}
                                            onChange={(e) => updatePackage(index, 'name', e.target.value)}
                                            className="rounded-lg h-10 border-slate-200"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Price (₹)</Label>
                                        <Input
                                            type="number"
                                            value={pkg.price}
                                            onChange={(e) => updatePackage(index, 'price', parseInt(e.target.value))}
                                            className="rounded-lg h-10 border-slate-200"
                                        />
                                    </div>
                                    <div className="sm:col-span-4 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Short Note</Label>
                                        <Input
                                            placeholder="e.g. For 4 persons"
                                            value={pkg.description}
                                            onChange={(e) => updatePackage(index, 'description', e.target.value)}
                                            className="rounded-lg h-10 border-slate-200"
                                        />
                                    </div>
                                    <div className="sm:col-span-1 flex items-end justify-center pb-0.5">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removePackage(index)} className="hover:text-red-600 hover:bg-red-50">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl h-11 px-8">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-10 bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-lg shadow-orange-900/10">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isSubmitting ? "Creating..." : "Offer Pooja"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

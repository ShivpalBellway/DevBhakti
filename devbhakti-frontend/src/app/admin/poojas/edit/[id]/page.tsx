"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchAllPoojasAdmin, updatePoojaAdmin, fetchAllTemplesAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function EditPoojaPage() {
    const router = useRouter();
    const params = useParams();
    const poojaId = params.id as string;
    const { toast } = useToast();
    const [temples, setTemples] = useState<any[]>([]);
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
        templeId: "",
        packages: [] as any[],
        processSteps: [] as any[],
        faqs: [] as any[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [poojasData, templesData] = await Promise.all([
                fetchAllPoojasAdmin(),
                fetchAllTemplesAdmin()
            ]);

            setTemples(templesData);

            const pooja = poojasData.find((p: any) => p.id === poojaId);
            if (pooja) {
                setFormData({
                    name: pooja.name,
                    price: pooja.price,
                    duration: pooja.duration,
                    category: pooja.category,
                    time: pooja.time,
                    about: pooja.about || "",
                    description: pooja.description || [],
                    benefits: pooja.benefits || [],
                    bullets: pooja.bullets || [],
                    templeId: pooja.templeId || "",
                    packages: pooja.packages || [],
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
                toast({
                    title: "Error",
                    description: "Pooja not found",
                    variant: "destructive"
                });
                router.push('/admin/poojas');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load pooja data",
                variant: "destructive"
            });
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

    const handleArrayChange = (field: 'description' | 'benefits' | 'bullets', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const addArrayItem = (field: 'description' | 'benefits' | 'bullets') => {
        setFormData({ ...formData, [field]: [...formData[field], ""] });
    };

    const removeArrayItem = (field: 'description' | 'benefits' | 'bullets', index: number) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        setFormData({ ...formData, [field]: newArray });
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

    const addStep = () => {
        setFormData({
            ...formData,
            processSteps: [...formData.processSteps, { title: "", description: "" }]
        });
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...formData.processSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, processSteps: newSteps });
    };

    const removeStep = (index: number) => {
        setFormData({
            ...formData,
            processSteps: formData.processSteps.filter((_, i) => i !== index)
        });
    };

    const addFAQ = () => {
        setFormData({
            ...formData,
            faqs: [...formData.faqs, { q: "", a: "" }]
        });
    };

    const updateFAQ = (index: number, field: 'q' | 'a', value: string) => {
        const newFAQs = [...formData.faqs];
        newFAQs[index] = { ...newFAQs[index], [field]: value };
        setFormData({ ...formData, faqs: newFAQs });
    };

    const removeFAQ = (index: number) => {
        setFormData({
            ...formData,
            faqs: formData.faqs.filter((_, i) => i !== index)
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
        submissionData.append('templeId', formData.templeId);
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
            await updatePoojaAdmin(poojaId, submissionData);
            toast({ title: "Success", description: "Pooja updated successfully" });
            router.push('/admin/poojas');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update pooja",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Pooja</h1>
                    <p className="text-muted-foreground">Update spiritual service details</p>
                </div>
            </div>

            {/* Form - Same as create but with pre-filled data */}
            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Pooja Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Mangala Aarti"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="templeId">Temple *</Label>
                        <select
                            id="templeId"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.templeId}
                            onChange={(e) => setFormData({ ...formData, templeId: e.target.value })}
                            required
                        >
                            <option value="">Select a Temple</option>
                            {temples.map(temple => (
                                <option key={temple.id} value={temple.id}>{temple.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Input
                            id="category"
                            placeholder="e.g. Aarti, Pooja"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Input
                            id="duration"
                            placeholder="e.g. 30 mins"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="time">Time *</Label>
                        <Input
                            id="time"
                            placeholder="e.g. 6:00 AM"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="about">About Pooja</Label>
                    <Textarea
                        id="about"
                        placeholder="Brief description of the pooja..."
                        value={formData.about}
                        onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                        className="h-24"
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                    <Label>Pooja Image</Label>
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 relative group">
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                </>
                            ) : (
                                <Upload className="w-8 h-8 text-slate-300" />
                            )}
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Upload a high-quality image</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Max 5MB.</p>
                        </div>
                    </div>
                </div>

                {/* Description Points */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Description Points</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('description')}>
                            <Plus className="w-3 h-3 mr-1" /> Add Point
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {formData.description.map((item, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={item}
                                    onChange={(e) => handleArrayChange('description', index, e.target.value)}
                                    placeholder={`Point ${index + 1}`}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('description', index)}>
                                    <X className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Benefits</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('benefits')}>
                            <Plus className="w-3 h-3 mr-1" /> Add Benefit
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {formData.benefits.map((item, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={item}
                                    onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                                    placeholder={`Benefit ${index + 1}`}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('benefits', index)}>
                                    <X className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bullets/Highlights */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Highlights (Bullets)</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('bullets')}>
                            <Plus className="w-3 h-3 mr-1" /> Add Highlight
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.bullets.map((item, index) => (
                            <div key={index} className="flex items-center gap-1 bg-white border rounded-full px-3 py-1 shadow-sm">
                                <input
                                    className="text-xs font-medium outline-none w-20"
                                    value={item}
                                    onChange={(e) => handleArrayChange('bullets', index, e.target.value)}
                                    placeholder="Word..."
                                />
                                <button type="button" onClick={() => removeArrayItem('bullets', index)}>
                                    <X className="w-3 h-3 text-slate-400 hover:text-destructive" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Packages */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Pooja Packages</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                            <Plus className="w-4 h-4 mr-2" /> Add Package
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {formData.packages.map((pkg, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-white border rounded-lg">
                                <div className="col-span-4 space-y-1.5">
                                    <Label className="text-xs">Package Name</Label>
                                    <Input
                                        placeholder="e.g. Family Package"
                                        value={pkg.name}
                                        onChange={(e) => updatePackage(index, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-xs">Price (₹)</Label>
                                    <Input
                                        type="number"
                                        value={pkg.price}
                                        onChange={(e) => updatePackage(index, 'price', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="col-span-5 space-y-1.5">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        placeholder="e.g. For 4 people"
                                        value={pkg.description}
                                        onChange={(e) => updatePackage(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 flex items-end justify-center pb-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removePackage(index)}>
                                        <X className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Process Steps */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Ritual Process Steps</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addStep}>
                            <Plus className="w-4 h-4 mr-2" /> Add Step
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {formData.processSteps.map((step, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-white border rounded-lg">
                                <div className="col-span-1 flex items-center justify-center font-bold text-slate-400">
                                    {index + 1}
                                </div>
                                <div className="col-span-4 space-y-1.5">
                                    <Label className="text-xs">Step Title</Label>
                                    <Input
                                        placeholder="e.g. Sankalp"
                                        value={step.title}
                                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 space-y-1.5">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        placeholder="Briefly explain the step..."
                                        value={step.description}
                                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 flex items-end justify-center pb-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                                        <X className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQs */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Frequently Asked Questions</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addFAQ}>
                            <Plus className="w-4 h-4 mr-2" /> Add FAQ
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {formData.faqs.map((faq, index) => (
                            <div key={index} className="p-4 bg-white border rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold text-primary">FAQ #{index + 1}</Label>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFAQ(index)}>
                                        <X className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Question"
                                        value={faq.q}
                                        onChange={(e) => updateFAQ(index, 'q', e.target.value)}
                                    />
                                    <Textarea
                                        placeholder="Answer..."
                                        value={faq.a}
                                        onChange={(e) => updateFAQ(index, 'a', e.target.value)}
                                        className="h-20"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update Pooja"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

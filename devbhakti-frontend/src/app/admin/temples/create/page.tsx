"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    Sparkles,
    CheckCircle,
    Trash2,
    Calendar,
    Image as ImageIcon,
    Layout,
    Building2,
    MapPin,
    IndianRupee,
    ZoomIn,
    ZoomOut,
    Crop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { createTempleAdmin, fetchAllPoojasAdmin, fetchCommissionSlabsAdmin } from "@/api/adminController";
import { Badge } from "@/components/ui/badge";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

export default function CreateTemplePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [allPoojas, setAllPoojas] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        // Auth
        name: "",
        email: "",
        phone: "",
        password: "",
        // Temple Basic
        templeName: "",
        location: "",
        fullAddress: "",
        category: "",
        openTime: "",
        // Details
        description: "",
        history: "",
        viewers: "",
        // Contact
        templePhone: "",
        website: "",
        mapUrl: "",
        // Stats
        rating: "0",
        reviewsCount: "0",
        slug: "", // For slug-based URLs
        subdomain: "", // For subdomain-based URLs
        urlType: "slug", // "slug" or "subdomain"
        isActive: "true", // Added isActive for visibility
        liveStatus: "false", // Future feature
        poojaCommissionRate: "5.0"
    });

    // Relationships State
    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [inlineEvents, setInlineEvents] = useState<any[]>([]);
    const [marketplaceSlabs, setMarketplaceSlabs] = useState<any[]>([]);
    const [poojaSlabs, setPoojaSlabs] = useState<any[]>([]);

    // Images State
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>("");
    const [heroImages, setHeroImages] = useState<File[]>([]);
    const [heroPreviews, setHeroPreviews] = useState<string[]>([]);

    // Cropping State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string>("");
    const [cropType, setCropType] = useState<"main" | "hero">("main");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [aspectRatio, setAspectRatio] = useState(3 / 2); // Default for main image

    useEffect(() => {
        loadPoojas();
        loadDefaultSlabs();
    }, []);

    const loadDefaultSlabs = async () => {
        try {
            // Load Marketplace Slabs (Global)
            const mResponse = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'MARKETPLACE');
            if (mResponse.success) {
                setMarketplaceSlabs(mResponse.data);
            }

            // Load Pooja Slabs (Global)
            const pResponse = await fetchCommissionSlabsAdmin('GLOBAL', undefined, 'POOJA');
            if (pResponse.success) {
                setPoojaSlabs(pResponse.data);
            }
        } catch (error) {
            console.error("Failed to load global slabs structure");
        }
    };

    const loadPoojas = async () => {
        try {
            const data = await fetchAllPoojasAdmin();
            setAllPoojas(data);
        } catch (error) {
            console.error("Failed to load poojas");
        }
    };

    // Crop Utility Functions
    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
        fileName: string
    ): Promise<File> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Canvas is empty"));
                    return;
                }
                const file = new File([blob], fileName, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                });
                resolve(file);
            }, "image/jpeg", 0.95);
        });
    };

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        if (!croppedAreaPixels || !cropImageSrc) return;

        try {
            const croppedImage = await getCroppedImg(
                cropImageSrc,
                croppedAreaPixels,
                `cropped-${Date.now()}.jpg`
            );

            if (cropType === "main") {
                setMainImage(croppedImage);
                setMainImagePreview(URL.createObjectURL(croppedImage));
            } else {
                setHeroImages(prev => [...prev, croppedImage]);
                setHeroPreviews(prev => [...prev, URL.createObjectURL(croppedImage)]);
            }

            // Reset crop modal
            setCropModalOpen(false);
            setCropImageSrc("");
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);

            toast({
                title: "Image Cropped",
                description: "Image has been cropped successfully!",
            });
        } catch (error) {
            toast({
                title: "Crop Failed",
                description: "Failed to crop image. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Handlers
    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB for initial upload (will be compressed after crop)

        if (file) {
            if (file.size > MAX_SIZE) {
                toast({
                    title: "File Too Large",
                    description: `Image "${file.name}" exceeds 5MB limit. Please select a smaller file.`,
                    variant: "destructive"
                });
                e.target.value = ''; // Reset input
                return;
            }

            // Open crop modal
            const reader = new FileReader();
            reader.onload = () => {
                setCropImageSrc(reader.result as string);
                setCropType("main");
                setAspectRatio(3 / 2); // 3:2 for main image
                setCropModalOpen(true);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset input
        }
    };

    const handleHeroImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        if (files.length > 0) {
            const largeFiles = files.filter(f => f.size > MAX_SIZE);
            if (largeFiles.length > 0) {
                toast({
                    title: "Files Too Large",
                    description: `${largeFiles.length} file(s) exceed the 5MB limit. None of those were added.`,
                    variant: "destructive"
                });
            }

            const validFiles = files.filter(f => f.size <= MAX_SIZE);
            if (validFiles.length > 0) {
                // Process first valid file for cropping
                const reader = new FileReader();
                reader.onload = () => {
                    setCropImageSrc(reader.result as string);
                    setCropType("hero");
                    setAspectRatio(16 / 9); // 16:9 for hero banners
                    setCropModalOpen(true);
                };
                reader.readAsDataURL(validFiles[0]);
            }
            e.target.value = ''; // Reset input
        }
    };

    const removeHeroImage = (index: number) => {
        setHeroImages(prev => prev.filter((_, i) => i !== index));
        setHeroPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const addEvent = () => {
        setInlineEvents(prev => [...prev, { name: "", date: "", description: "" }]);
    };

    const removeEvent = (index: number) => {
        setInlineEvents(prev => prev.filter((_, i) => i !== index));
    };

    const updateEvent = (index: number, field: string, value: string) => {
        setInlineEvents(prev => {
            const newEvents = [...prev];
            newEvents[index] = { ...newEvents[index], [field]: value };
            return newEvents;
        });
    };

    const togglePooja = (id: string) => {
        setSelectedPoojaIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleRemoveMarketplaceSlab = (index: number) => {
        setMarketplaceSlabs(marketplaceSlabs.filter((_, i) => i !== index));
    };

    const handleRemovePoojaSlab = (index: number) => {
        setPoojaSlabs(poojaSlabs.filter((_, i) => i !== index));
    };

    const handleMarketplaceSlabChange = (index: number, field: string, value: any) => {
        const newSlabs = [...marketplaceSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setMarketplaceSlabs(newSlabs);
    };

    const handlePoojaSlabChange = (index: number, field: string, value: any) => {
        const newSlabs = [...poojaSlabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setPoojaSlabs(newSlabs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Phone Number Validation
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            toast({
                title: "Invalid Phone Number",
                description: "Account phone must be exactly 10 digits.",
                variant: "destructive"
            });
            return;
        }

        // 2. Hero Images Count Validation
        if (heroImages.length > 5) {
            toast({
                title: "Too Many Banners",
                description: "Maximum 5 banner images allowed.",
                variant: "destructive"
            });
            return;
        }

        // 3. Image Size Validation (Max 2MB)
        const MAX_SIZE = 2 * 1024 * 1024;
        const allFiles = [
            ...(mainImage ? [mainImage] : []),
            ...heroImages
        ];

        for (const file of allFiles) {
            if (file.size > MAX_SIZE) {
                toast({
                    title: "File Too Large",
                    description: `Image "${file.name}" exceeds 2MB limit.`,
                    variant: "destructive"
                });
                return;
            }
        }

        setIsLoading(true);

        try {
            const fd = new FormData();

            // Append basic fields
            Object.entries(formData).forEach(([key, value]) => {
                fd.append(key, value);
            });

            // Append relationships
            fd.append("poojaIds", JSON.stringify(selectedPoojaIds));
            fd.append("inlineEvents", JSON.stringify(inlineEvents));

            // Combine both slab types for backend
            const combinedSlabs = [
                ...marketplaceSlabs.map(s => ({ ...s, category: 'MARKETPLACE' })),
                ...poojaSlabs.map(s => ({ ...s, category: 'POOJA' }))
            ];
            fd.append("commissionSlabs", JSON.stringify(combinedSlabs));

            // Append images
            if (mainImage) fd.append("image", mainImage);
            heroImages.forEach(file => {
                fd.append("heroImages", file);
            });

            await createTempleAdmin(fd);
            toast({ title: "Success", description: "Temple account and profile created successfully" });
            router.push('/admin/temples');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create temple. Ensure unique email/phone.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Image Crop Modal */}
            {cropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                            <div className="flex items-center gap-3">
                                <Crop className="w-5 h-5 text-[#88542b]" />
                                <h3 className="text-lg font-bold text-slate-800">
                                    Crop Image {cropType === "main" ? "(Main Profile)" : "(Banner)"}
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setCropModalOpen(false);
                                    setCropImageSrc("");
                                }}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Cropper Area */}
                        <div className="relative h-[calc(80vh-180px)] bg-slate-900">
                            <Cropper
                                image={cropImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                style={{
                                    containerStyle: {
                                        backgroundColor: "#1e293b",
                                    },
                                }}
                            />
                        </div>

                        {/* Controls */}
                        <div className="px-6 py-4 bg-white border-t space-y-4">
                            {/* Zoom Control */}
                            <div className="flex items-center gap-4">
                                <ZoomOut className="w-5 h-5 text-slate-600" />
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#88542b]"
                                />
                                <ZoomIn className="w-5 h-5 text-slate-600" />
                                <span className="text-sm font-semibold text-slate-700 min-w-[60px]">
                                    {Math.round(zoom * 100)}%
                                </span>
                            </div>

                            {/* Aspect Ratio Buttons */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-600 mr-2">Aspect Ratio:</span>
                                <Button
                                    type="button"
                                    variant={aspectRatio === 1 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAspectRatio(1)}
                                >
                                    Square (1:1)
                                </Button>
                                <Button
                                    type="button"
                                    variant={aspectRatio === 4 / 3 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAspectRatio(4 / 3)}
                                >
                                    Classic (4:3)
                                </Button>
                                <Button
                                    type="button"
                                    variant={aspectRatio === 3 / 2 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAspectRatio(3 / 2)}
                                >
                                    Photo (3:2)
                                </Button>
                                <Button
                                    type="button"
                                    variant={aspectRatio === 16 / 9 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAspectRatio(16 / 9)}
                                >
                                    Wide (16:9)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setCropModalOpen(false);
                                        setCropImageSrc("");
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleCropSave}
                                    className="bg-[#88542b] hover:bg-[#6d4222] text-white px-6"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Save Crop
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Page Content */}
            <div className="max-w-7xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Add New Temple</h1>
                        <p className="text-muted-foreground">Create a new temple administrator account and profile.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. Account Identity Section */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Layout className="w-5 h-5" />
                            <h2 className="text-xl">Account Identity</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Owner/Admin Name *</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Full Name of Trustee or Administrator"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Account Email</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="temple@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Account Phone *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold border-r border-slate-300 pr-2">+91</span>
                                    <Input
                                        type="tel"
                                        maxLength={10}
                                        value={formData.phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, phone: val });
                                        }}
                                        placeholder="Enter 10-digit number"
                                        className="pl-14"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Temple Profile Section */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Building2 className="w-5 h-5" />
                            <h2 className="text-xl">Temple Profile</h2>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Temple Official Name *</label>
                                <Input
                                    value={formData.templeName}
                                    onChange={e => setFormData({ ...formData, templeName: e.target.value })}
                                    placeholder="e.g. Shri Kashi Vishwanath Temple"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Location (City, State) *</label>
                                <Input
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Varanasi, Uttar Pradesh"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Category / Deity *</label>
                                <Input
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="Shiva, Vishnu, Shakti, etc."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Operating Hours</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 max-w-[140px]">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={formData.openTime.split(' - ')[0]?.replace(' AM', '') || ''}
                                            onChange={e => {
                                                const amTime = e.target.value;
                                                const pmTime = formData.openTime.split(' - ')[1] || '11 PM';
                                                setFormData({ ...formData, openTime: `${amTime} AM - ${pmTime}` });
                                            }}
                                            placeholder="6"
                                            className="text-center w-16"
                                        />
                                        <span className="text-sm font-bold text-slate-600 whitespace-nowrap">AM</span>
                                    </div>
                                    <span className="text-slate-400 font-bold">to</span>
                                    <div className="flex items-center gap-2 max-w-[150px]">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={formData.openTime.split(' - ')[1]?.replace(' PM', '') || ''}
                                            onChange={e => {
                                                const pmTime = e.target.value;
                                                const amTime = formData.openTime.split(' - ')[0] || '6 AM';
                                                setFormData({ ...formData, openTime: `${amTime} - ${pmTime} PM` });
                                            }}
                                            placeholder="10"
                                            className="text-center w-22"
                                        />
                                        <span className="text-sm font-bold text-slate-600 whitespace-nowrap">PM</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Example: 6 AM to 10 PM</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Viewers Count (Social Proof)</label>
                                <Input
                                    value={formData.viewers}
                                    onChange={e => setFormData({ ...formData, viewers: e.target.value })}
                                // placeholder="e.g. 10K+"
                                />
                            </div>
                            {/* URL Configuration Section */}
                            <div className="space-y-4 md:col-span-2 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">🌐 Public URL Configuration</label>

                                {/* URL Type Selection */}
                                <div className="flex items-center gap-6 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="urlType"
                                            value="slug"
                                            checked={formData.urlType === "slug"}
                                            onChange={e => setFormData({ ...formData, urlType: e.target.value })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-semibold text-slate-700">Path-based URL</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="urlType"
                                            value="subdomain"
                                            checked={formData.urlType === "subdomain"}
                                            onChange={e => setFormData({ ...formData, urlType: e.target.value })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-semibold text-slate-700">Subdomain URL</span>
                                    </label>
                                </div>

                                {/* Slug Field (Path-based) */}
                                {formData.urlType === "slug" && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">URL Slug *</label>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-l-md border border-r-0 font-mono">devbhakti.in/temples/</span>
                                            <Input
                                                value={formData.slug}
                                                onChange={e => {
                                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                    setFormData({ ...formData, slug: val, subdomain: val });
                                                }}
                                                placeholder="kashi-vishwanath"
                                                className="rounded-l-none font-mono"
                                                required={formData.urlType === "slug"}
                                            />
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                                            <p className="text-xs text-slate-500 mb-1">Preview:</p>
                                            <p className="text-sm font-mono text-blue-600">
                                                https://devbhakti.in/temples/{formData.slug || "your-temple-slug"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Subdomain Field */}
                                {formData.urlType === "subdomain" && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Subdomain *</label>
                                        <div className="flex items-center gap-1">
                                            <Input
                                                value={formData.subdomain}
                                                onChange={e => {
                                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                    setFormData({ ...formData, subdomain: val, slug: val });
                                                }}
                                                placeholder="kashi-vishwanath"
                                                className="rounded-r-none font-mono"
                                                required={formData.urlType === "subdomain"}
                                            />
                                            <span className="text-xs text-muted-foreground bg-white px-3 py-2 rounded-r-md border border-l-0 font-mono">.devbhakti.in</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                                            <p className="text-xs text-slate-500 mb-1">Preview:</p>
                                            <p className="text-sm font-mono text-blue-600">
                                                https://{formData.subdomain || "your-temple"}.devbhakti.in
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className="text-[10px] text-slate-600 italic mt-2">
                                    💡 Alphanumeric and hyphens only. Both slug and subdomain will be stored for flexibility.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Full Address</label>
                            <Input
                                value={formData.fullAddress}
                                onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                                placeholder="Complete street address, pin code"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Temple History</label>
                            <Textarea
                                value={formData.history}
                                onChange={e => setFormData({ ...formData, history: e.target.value })}
                                placeholder="Describe the ancient origin and historical significance..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Description</label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="General information about the temple..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* 3. Media & Assets Section */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <ImageIcon className="w-5 h-5" />
                            <h2 className="text-xl">Media & Assets</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Main Image */}
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-slate-700">Main Profile Image</label>
                                <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleMainImageChange}
                                    />
                                    {mainImagePreview ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden">
                                            <img src={mainImagePreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Upload className="text-white w-8 h-8" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center">
                                            <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">Click or drag profile image</p>



                                            <p className="font-semibold">Main Profile Image</p>
                                            <p className="text-slate-300">Max 2MB • 1200x800px</p>
                                            <p className="text-slate-400">JPG, PNG, WebP</p>

                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hero Images (Multiple) */}
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-slate-700">Hero Banners (Multiple)</label>

                                <div className="grid grid-cols-3 gap-2">
                                    {heroPreviews.map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeHeroImage(i)}
                                                className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-destructive" />
                                            </button>


                                        </div>
                                    ))}
                                    <div className="border-2 border-dashed rounded-lg flex items-center justify-center aspect-square hover:bg-slate-50 cursor-pointer transition-colors relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleHeroImagesChange}
                                        />
                                        <div className="text-center">

                                            <p className="text-dark-100">Max 1MB each • 800x800px</p>
                                            <p className="text-dark-200">JPG, PNG, WebP</p>
                                        </div>
                                        <Plus className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Contact & Online Section */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <MapPin className="w-5 h-5" />
                            <h2 className="text-xl">Contact & Online</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Temple Contact Number</label>
                                <Input
                                    value={formData.templePhone}
                                    onChange={e => setFormData({ ...formData, templePhone: e.target.value })}
                                    placeholder="+91 000 000 0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Website URL</label>
                                <Input
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://temple-name.org"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Google Maps URL</label>
                                <Input
                                    value={formData.mapUrl}
                                    onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Poojas Management (Multiple Select) */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Layout className="w-5 h-5" />
                                <h2 className="text-xl">Available Poojas</h2>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Select poojas that are performed at this temple.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allPoojas.map(pooja => (
                                <div
                                    key={pooja.id}
                                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${selectedPoojaIds.includes(pooja.id)
                                        ? "border-[#88542b] bg-orange-50 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-[#88542b]/30"
                                        }`}
                                    onClick={() => togglePooja(pooja.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedPoojaIds.includes(pooja.id)
                                            ? "border-[#88542b] bg-[#88542b]"
                                            : "border-slate-300 bg-white"
                                            }`}>
                                            {selectedPoojaIds.includes(pooja.id) && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-800 text-sm">{pooja.name}</h4>
                                            {pooja.category && (
                                                <p className="text-xs text-slate-500 mt-1">{pooja.category}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* 6. Inline Events Section */}
                    {/*    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-xl">Upcoming Events</h2>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addEvent}>
                            <Plus className="w-4 h-4 mr-2" /> Add Event
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {inlineEvents.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dotted rounded-lg">No events added yet. Add festivals or special programs.</p>
                        )}
                        {inlineEvents.map((ev, i) => (
                            <div key={i} className="p-4 border rounded-xl bg-slate-50 relative animate-in fade-in slide-in-from-top-2">
                                <button
                                    type="button"
                                    onClick={() => removeEvent(i)}
                                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Event Name</label>
                                        <Input
                                            value={ev.name}
                                            onChange={e => updateEvent(i, 'name', e.target.value)}
                                            placeholder="e.g. Maha Shivratri"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Date</label>
                                        <Input
                                            value={ev.date}
                                            onChange={e => updateEvent(i, 'date', e.target.value)}
                                            placeholder="e.g. March 12, 2025"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold uppercase text-slate-500">Brief Detail (Optional)</label>
                                        <Input
                                            value={ev.description}
                                            onChange={e => updateEvent(i, 'description', e.target.value)}
                                            placeholder="What happens during this event?"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div> */}

                    {/* 7. Commission Slabs Section */}
                    <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Layout className="w-5 h-5" />
                            <h2 className="text-xl font-serif">Marketplace Commission Slabs</h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Define amount-based commission rates for Marketplace Products for this temple.</p>
                            {marketplaceSlabs.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-400">
                                    Loading default product slab structure...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {marketplaceSlabs.map((slab, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Min Amount</label>
                                                <Input type="number" value={slab.minAmount} readOnly className="h-9 bg-slate-100 cursor-not-allowed border-dashed" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Max Amount</label>
                                                <Input type="number" value={slab.maxAmount || ''} placeholder="∞" readOnly className="h-9 bg-slate-100 cursor-not-allowed border-dashed" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Fixed Fee (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={slab.platformFee}
                                                    onChange={e => handleMarketplaceSlabChange(index, 'platformFee', e.target.value)}
                                                    className="h-9 text-[#794A05] font-bold bg-white border-primary/20 focus:border-primary shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Percentage (%)</label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={slab.percentage}
                                                    onChange={e => handleMarketplaceSlabChange(index, 'percentage', e.target.value)}
                                                    className="h-9 bg-white border-primary/20 focus:border-primary shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator className="my-6" />

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Calendar className="w-5 h-5" />
                                <h2 className="text-xl">Pooja Booking Commission Slabs</h2>
                            </div>
                            <p className="text-sm text-slate-500">Define amount-based commission rates for Pooja Bookings for this temple.</p>
                            {poojaSlabs.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-400">
                                    Loading default pooja slab structure...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {poojaSlabs.map((slab, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100/50 relative group">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Min Amount</label>
                                                <Input type="number" value={slab.minAmount} readOnly className="h-9 bg-slate-100/50 cursor-not-allowed border-dashed" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Max Amount</label>
                                                <Input type="number" value={slab.maxAmount || ''} placeholder="∞" readOnly className="h-9 bg-slate-100/50 cursor-not-allowed border-dashed" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Fixed Fee (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={slab.platformFee}
                                                    onChange={e => handlePoojaSlabChange(index, 'platformFee', e.target.value)}
                                                    className="h-9 text-[#794A05] font-bold bg-white border-primary/20 focus:border-primary shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-slate-400">Percentage (%)</label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={slab.percentage}
                                                    onChange={e => handlePoojaSlabChange(index, 'percentage', e.target.value)}
                                                    className="h-9 bg-white border-primary/20 focus:border-primary shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex items-center gap-3 p-6 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="sr-only peer"
                                    checked={formData.isActive === "true"}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked ? "true" : "false" })}
                                />
                                <label
                                    htmlFor="isActive"
                                    className="w-11 h-6 bg-slate-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
                                ></label>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Mark as Active & Verified</p>
                                <p className="text-xs text-emerald-700">Visible to all devotees on the platform immediately.</p>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center gap-3 p-6 bg-amber-50 rounded-xl border border-amber-100 shadow-sm opacity-60 grayscale-[0.5]">
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="liveStatus"
                                    className="sr-only peer"
                                    disabled // Future feature
                                />
                                <label
                                    htmlFor="liveStatus"
                                    className="w-11 h-6 bg-slate-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"
                                ></label>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">Live Streaming Mode (Future)</p>
                                <p className="text-xs text-amber-700">Will be used for real-time video streaming.</p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" size="lg" disabled={isLoading} className="px-10">
                            {isLoading ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Creating...</>
                            ) : "Create Temple account"}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

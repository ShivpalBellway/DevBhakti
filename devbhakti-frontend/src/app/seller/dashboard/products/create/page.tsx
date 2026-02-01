"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Package,
    Save,
    X,
    Upload,
    Image as ImageIcon,
    Layers,
    Info,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchCategories, createSellerProduct } from "@/api/sellerController";

interface Variant {
    id: string;
    name: string;
    price: number;
    stock: number;
    image?: string | null;
}



export default function CreateSellerProductPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productImagePreview, setProductImagePreview] = useState<string>("");

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoadingCategories(true);
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch (error) {
            console.error("Load Categories Error:", error);
            setCategories([]);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        highlights: "",
        longDescription: "",
        shippingInfo: "Ships in 24-48 Hours",
        origin: "India",
        rating: "4.5",
    });

    const [variants, setVariants] = useState<Variant[]>([
        { id: "1", name: "", price: 0, stock: 0 }
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid File", description: "Please select an image file", variant: "destructive" });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "File Too Large", description: "Image size should be less than 5MB", variant: "destructive" });
                return;
            }
            setProductImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setProductImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeProductImage = () => {
        setProductImage(null);
        setProductImagePreview("");
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Product name is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.category) newErrors.category = "Category is required";

        const validVariants = variants.filter(v => v.name.trim() && v.price > 0);
        if (validVariants.length === 0) newErrors.variants = "At least one valid variant is required";

        validVariants.forEach((variant, index) => {
            if (!variant.name.trim()) newErrors[`variant_name_${index}`] = "Variant name is required";
            if (variant.price <= 0) newErrors[`variant_price_${index}`] = "Price must be greater than 0";
            if (variant.stock < 0) newErrors[`variant_stock_${index}`] = "Stock cannot be negative";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast({ title: "Validation Error", description: "Please fill all required fields correctly", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", formData.name);
            fd.append("description", formData.description);
            fd.append("category", formData.category);
            fd.append("highlights", formData.highlights);
            fd.append("longDescription", formData.longDescription);
            fd.append("shippingInfo", formData.shippingInfo);
            fd.append("origin", formData.origin);
            fd.append("rating", formData.rating);
            fd.append("variants", JSON.stringify(variants.filter(v => v.name.trim() && v.price > 0)));

            if (productImage) {
                fd.append("image", productImage);
            }

            const response = await createSellerProduct(fd);
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Product created successfully and sent for approval.",
                });
                router.push("/seller/dashboard/products");
            }
        } catch (error: any) {
            console.error("Create Product Error:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create product",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addVariant = () => {
        setVariants([...variants, { id: Date.now().toString(), name: "", price: 0, stock: 0 }]);
    };

    const removeVariant = (id: string) => {
        if (variants.length > 1) setVariants(variants.filter(v => v.id !== id));
    };

    const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
        setVariants(variants.map(variant =>
            variant.id === id ? { ...variant, [field]: field === 'price' || field === 'stock' ? Number(value) : value } : variant
        ));
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Product</h1>
                    <p className="text-muted-foreground">Add a new product to your seller store</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter product name" className={errors.name ? "border-red-500" : ""} />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                        <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Brief Description *</Label>
                                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter product description" rows={4} className={errors.description ? "border-red-500" : ""} />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Product Image</Label>
                                <div className="flex items-center gap-4">
                                    {productImagePreview ? (
                                        <div className="relative">
                                            <img src={productImagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={removeProductImage}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 border-2 border-dashed border-input rounded-lg flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Input type="file" accept="image/*" onChange={handleProductImageChange} className="cursor-pointer" />
                                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF up to 5MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="origin">Origin</Label>
                                    <Input id="origin" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shippingInfo">Shipping</Label>
                                    <Input id="shippingInfo" value={formData.shippingInfo} onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="highlights">Highlights</Label>
                                <Textarea id="highlights" value={formData.highlights} onChange={(e) => setFormData({ ...formData, highlights: e.target.value })} rows={2} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longDescription">Detailed Description</Label>
                                <Textarea id="longDescription" value={formData.longDescription} onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })} rows={6} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Variants</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {variants.map((variant, index) => (
                                    <div key={variant.id} className="p-3 border rounded-lg bg-card/50 space-y-3">
                                        <div className="flex justify-between">
                                            <Label>Variant {index + 1}</Label>
                                            {variants.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variant.id)} className="h-6 w-6 text-red-500"><Trash2 className="w-3 h-3" /></Button>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Variant Name</Label>
                                            <Input placeholder="e.g. Small" value={variant.name} onChange={(e) => updateVariant(variant.id, 'name', e.target.value)} />
                                            {errors[`variant_name_${index}`] && <p className="text-xs text-red-500">{errors[`variant_name_${index}`]}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label>Price (₹)</Label>
                                                <Input type="number" placeholder="0.00" value={variant.price || ''} onChange={(e) => updateVariant(variant.id, 'price', e.target.value)} />
                                                {errors[`variant_price_${index}`] && <p className="text-xs text-red-500">{errors[`variant_price_${index}`]}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Stock</Label>
                                                <Input type="number" placeholder="0" value={variant.stock || ''} onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {errors.variants && <p className="text-sm text-red-500">{errors.variants}</p>}
                                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Variant</Button>
                            </CardContent>
                        </Card>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary">{isSubmitting ? "Creating..." : "Create Product"}</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}


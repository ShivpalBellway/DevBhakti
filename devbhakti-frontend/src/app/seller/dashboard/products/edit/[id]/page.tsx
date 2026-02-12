"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
    CheckCircle2,
    AlertCircle,
    Truck
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
import { fetchCategories, fetchSellerProductById, updateSellerProduct } from "@/api/sellerController";
import { API_URL, BASE_URL } from "@/config/apiConfig";

interface Variant {
    id: string;
    name: string;
    price: number;
    stock: number;
    image?: string | null;
    imageFile?: File | null;
    imagePreview?: string;
}



export default function EditSellerProductPage() {
    const router = useRouter();
    const { id } = useParams();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productImagePreview, setProductImagePreview] = useState<string>("");
    const [removeImage, setRemoveImage] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        status: "",
        highlights: "",
        longDescription: "",
        shippingInfo: "",
        origin: "",
        rating: "4.5",
        weight: "",
        length: "",
        width: "",
        height: "",
    });

    const [variants, setVariants] = useState<Variant[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [productResponse, cats] = await Promise.all([
                    fetchSellerProductById(id as string),
                    fetchCategories()
                ]);

                if (productResponse.success && productResponse.data) {
                    const p = productResponse.data;
                    setFormData({
                        name: p.name,
                        description: p.description,
                        category: p.categoryId || p.category,
                        status: p.status,
                        highlights: p.highlights || "",
                        longDescription: p.longDescription || "",
                        shippingInfo: p.shippingInfo || "",
                        origin: p.origin || "",
                        rating: p.rating ? p.rating.toString() : "4.5",
                        weight: p.weight ? p.weight.toString() : "",
                        length: p.length ? p.length.toString() : "",
                        width: p.width ? p.width.toString() : "",
                        height: p.height ? p.height.toString() : "",
                    });
                    setVariants(p.variants.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        price: v.price,
                        stock: v.stock,
                        image: v.image,
                        imagePreview: v.image ? `${BASE_URL}${v.image}` : ""
                    })));
                    if (p.image) {
                        setProductImagePreview(`${BASE_URL}${p.image}`);
                    }
                }

                setCategories(cats);
            } catch (error: any) {
                console.error("Load Data Error:", error);
                toast({ title: "Error", description: "Failed to load product details", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

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
            setRemoveImage(false);
            const reader = new FileReader();
            reader.onloadend = () => setProductImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeProductImageAction = () => {
        setProductImage(null);
        setProductImagePreview("");
        setRemoveImage(true);
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
            const validVariants = variants.filter(v => v.name.trim() && v.price > 0);
            const formDataToSend = new FormData();

            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.category);

            if (productImage) formDataToSend.append('image', productImage);
            if (removeImage) formDataToSend.append('removeImage', 'true');

            formDataToSend.append('highlights', formData.highlights);
            formDataToSend.append('longDescription', formData.longDescription);
            formDataToSend.append('shippingInfo', formData.shippingInfo);
            formDataToSend.append('origin', formData.origin);
            formDataToSend.append('rating', formData.rating);
            formDataToSend.append('weight', formData.weight);
            formDataToSend.append('length', formData.length);
            formDataToSend.append('width', formData.width);
            formDataToSend.append('height', formData.height);

            const variantsData = validVariants.map((v, index) => {
                if (v.imageFile) {
                    formDataToSend.append(`variant_image_${index}`, v.imageFile);
                }
                return {
                    id: v.id,
                    name: v.name,
                    price: v.price,
                    stock: v.stock,
                    image: v.imageFile ? null : (v.image || null)
                };
            });
            formDataToSend.append('variants', JSON.stringify(variantsData));

            await updateSellerProduct(id as string, formDataToSend);

            toast({ title: "Success", description: "Product updated successfully." });
            router.push("/seller/dashboard/products");
        } catch (error: any) {
            console.error("Update Product Error:", error);
            const errorMessage = error?.response?.data?.message || "Failed to update product";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addVariant = () => {
        setVariants([...variants, { id: Date.now().toString(), name: "", price: 0, stock: 0, imageFile: null, imagePreview: "" }]);
    };

    const removeVariant = (id: string) => {
        if (variants.length > 1) setVariants(variants.filter(v => v.id !== id));
    };

    const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
        setVariants(variants.map(variant =>
            variant.id === id ? { ...variant, [field]: field === 'price' || field === 'stock' ? Number(value) : value } : variant
        ));
    };

    const handleVariantImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
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
            const reader = new FileReader();
            reader.onloadend = () => {
                setVariants(variants.map(variant =>
                    variant.id === id ? { ...variant, imageFile: file, imagePreview: reader.result as string } : variant
                ));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeVariantImage = (id: string) => {
        setVariants(variants.map(variant =>
            variant.id === id ? { ...variant, imageFile: null, imagePreview: "", image: null } : variant
        ));
    };

    if (isLoading) return <div className="p-8 text-center">Loading product...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Product</h1>
                    <p className="text-muted-foreground">Update product details</p>
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
                                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? "border-red-500" : ""} />
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
                                <Label htmlFor="description">Description *</Label>
                                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className={errors.description ? "border-red-500" : ""} />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Product Image</Label>
                                <div className="flex items-center gap-4">
                                    {productImagePreview ? (
                                        <div className="relative">
                                            <img src={productImagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={removeProductImageAction}>
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
                                        <p className="text-[10px] font-semibold text-primary mt-1">Recommended: 800x800 px (Square)</p>
                                        <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, GIF up to 5MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="origin">Origin</Label>
                                    <Input id="origin" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shippingInfo">Shipping Label (UI)</Label>
                                    <Input id="shippingInfo" value={formData.shippingInfo} onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Base Rating (1-5)</Label>
                                    <Input
                                        id="rating"
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        max="5"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900 space-y-4">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                    <Truck className="w-5 h-5" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider">Shiprocket Dimensions (Required)</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="weight">Weight (kg) *</Label>
                                        <Input id="weight" type="number" step="0.01" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="0.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="length">Length (cm) *</Label>
                                        <Input id="length" type="number" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })} placeholder="10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="width">Width (cm) *</Label>
                                        <Input id="width" type="number" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} placeholder="10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="height">Height (cm) *</Label>
                                        <Input id="height" type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="10" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-blue-600/70 font-medium">Note: Exact dimensions help in accurate shipping charges.</p>
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
                                    <div key={variant.id} className="p-4 border rounded-lg bg-card/50 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="font-semibold">Variant {index + 1}</Label>
                                            {variants.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variant.id)} className="h-6 w-6 text-red-500"><Trash2 className="w-3 h-3" /></Button>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Variant Name *</Label>
                                            <Input placeholder="e.g. Small, Red, 100ml" value={variant.name} onChange={(e) => updateVariant(variant.id, 'name', e.target.value)} />
                                            {errors[`variant_name_${index}`] && <p className="text-xs text-red-500">{errors[`variant_name_${index}`]}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Variant Image</Label>
                                            <div className="flex items-center gap-3">
                                                {variant.imagePreview ? (
                                                    <div className="relative">
                                                        <img src={variant.imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-md border" />
                                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5" onClick={() => removeVariantImage(variant.id)}>
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 border-2 border-dashed border-input rounded-md flex items-center justify-center">
                                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <Input type="file" accept="image/*" onChange={(e) => handleVariantImageChange(variant.id, e)} className="cursor-pointer text-xs" />
                                                    <p className="text-[10px] font-semibold text-primary mt-0.5">Recommended: 800x800 px</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Max 5MB</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label>Selling Price (₹) *</Label>
                                                <Input type="number" step="0.01" placeholder="0.00" value={variant.price || ''} onChange={(e) => updateVariant(variant.id, 'price', e.target.value)} />
                                                {errors[`variant_price_${index}`] && <p className="text-xs text-red-500">{errors[`variant_price_${index}`]}</p>}
                                            </div>
                                            {/* <div className="space-y-2">
                                                <Label>Cost Price (₹)</Label>
                                                <Input type="number" step="0.01" placeholder="0.00" value={variant.costPrice || ''} onChange={(e) => updateVariant(variant.id, 'costPrice', e.target.value)} />
                                            </div> */}
                                        </div>


                                        <div className="space-y-2">
                                            <Label>Stock Quantity *</Label>
                                            <Input type="number" placeholder="0" value={variant.stock || ''} onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)} />
                                            {errors[`variant_stock_${index}`] && <p className="text-xs text-red-500">{errors[`variant_stock_${index}`]}</p>}
                                        </div>
                                    </div>
                                ))}
                                {errors.variants && <p className="text-sm text-red-500">{errors.variants}</p>}
                                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Variant</Button>
                            </CardContent>
                        </Card>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary">{isSubmitting ? "Updating..." : "Update Product"}</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

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
    Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateMandalProduct, fetchMandalProductById } from "@/api/mandalAdminController";
import { fetchCategories } from "@/api/templeAdminController";
import { BASE_URL } from "@/config/apiConfig";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { parseLocalizedValue } from "@/utils/textUtils";

interface Variant {
    id: string;
    name_en: string;
    name_hi: string;
    name_mr: string;
    price: number;
    stock: number;
    image?: string | null;
    imageFile?: File | null;
    imagePreview?: string;
}

export default function EditMandalProductPage() {
    const router = useRouter();
    const { id } = useParams();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [productImage, setProductImage] = useState<File | null>(null);
    const [productImagePreview, setProductImagePreview] = useState<string>("");
    const [removeImage, setRemoveImage] = useState(false);
    const [hasMultipleVariants, setHasMultipleVariants] = useState(false);

    // Cropper state
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [croppingTarget, setCroppingTarget] = useState<{ type: 'product' | 'variant', id?: string } | null>(null);

    const [formData, setFormData] = useState({
        name_en: "",
        name_hi: "",
        name_mr: "",
        description_en: "",
        description_hi: "",
        description_mr: "",
        category: "",
        status: "",
        highlights_en: "",
        highlights_hi: "",
        highlights_mr: "",
        longDescription: "",
        shippingInfo: "",
        origin: "",
        rating: "4.5",
    });

    const [variants, setVariants] = useState<Variant[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const getL = (value: any, lang: 'en' | 'hi' | 'mr') => {
        const result = parseLocalizedValue(value, lang);
        return result === "N/A" ? "" : result;
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [productData, cats] = await Promise.all([
                    fetchMandalProductById(id as string),
                    fetchCategories()
                ]);

                if (productData.success && productData.data) {
                    const p = productData.data;
                    setFormData({
                        name_en: getL(p.name, 'en'),
                        name_hi: getL(p.name, 'hi'),
                        name_mr: getL(p.name, 'mr'),
                        description_en: getL(p.description, 'en'),
                        description_hi: getL(p.description, 'hi'),
                        description_mr: getL(p.description, 'mr'),
                        category: p.categoryId || (typeof p.category === 'string' ? p.category : ""),
                        status: p.status,
                        highlights_en: getL(p.highlights, 'en'),
                        highlights_hi: getL(p.highlights, 'hi'),
                        highlights_mr: getL(p.highlights, 'mr'),
                        longDescription: p.longDescription || "",
                        shippingInfo: getL(p.shippingInfo, 'en'),
                        origin: getL(p.origin, 'en'),
                        rating: p.rating ? p.rating.toString() : "4.5",
                    });
                    
                    const fetchedVariants = p.variants ? p.variants.filter((v: any) => v.isActive !== false) : [];
                    setHasMultipleVariants(fetchedVariants.length > 1 || (fetchedVariants.length === 1 && p.variants[0]?.name && getL(p.variants[0].name, 'en') !== "Default" && getL(p.variants[0].name, 'en') !== ""));

                    setVariants(fetchedVariants.map((v: any) => ({
                        id: v.id,
                        name_en: getL(v.name, 'en'),
                        name_hi: getL(v.name, 'hi'),
                        name_mr: getL(v.name, 'mr'),
                        price: v.price,
                        stock: v.stock,
                        image: v.image,
                        imagePreview: v.image ? `${BASE_URL}${v.image}` : ""
                    })));
                    if (p.image) {
                        setProductImagePreview(`${BASE_URL}${p.image}`);
                    }
                }

                setCategories(cats || []);
            } catch (error: any) {
                console.error("Load Mandal Product Error:", error);
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
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setCroppingTarget({ type: 'product' });
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleVariantImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid File", description: "Please select an image file", variant: "destructive" });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setCroppingTarget({ type: 'variant', id });
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        if (croppingTarget?.type === 'product') {
            setProductImage(croppedFile);
            setRemoveImage(false);
            setProductImagePreview(URL.createObjectURL(croppedFile));
        } else if (croppingTarget?.type === 'variant' && croppingTarget.id) {
            setVariants(variants.map(variant =>
                variant.id === croppingTarget.id ? { ...variant, imageFile: croppedFile, imagePreview: URL.createObjectURL(croppedFile) } : variant
            ));
        }
        setShowCropper(false);
        setTempImage(null);
        setCroppingTarget(null);
    };

    const removeProductImageAction = () => {
        setProductImage(null);
        setProductImagePreview("");
        setRemoveImage(true);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name_en.trim()) newErrors.name = "Product name (English) is required";
        if (!formData.description_en.trim()) newErrors.description = "Description (English) is required";
        if (!formData.category) newErrors.category = "Category is required";
        if (!productImage && !productImagePreview) newErrors.image = "Product image is required";

        const validVariants = variants.filter(v => (hasMultipleVariants ? v.name_en.trim() : true) && v.price > 0);
        if (validVariants.length === 0) newErrors.variants = "At least one valid variant is required";

        validVariants.forEach((variant, index) => {
            if (hasMultipleVariants && !variant.name_en.trim()) newErrors[`variant_name_${index}`] = "Variant name is required";
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
            const validVariants = variants.filter(v => (hasMultipleVariants ? v.name_en.trim() : true) && v.price > 0);
            const formDataToSend = new FormData();

            formDataToSend.append('name_en', formData.name_en);
            formDataToSend.append('name_hi', formData.name_hi);
            formDataToSend.append('name_mr', formData.name_mr);

            formDataToSend.append('description_en', formData.description_en);
            formDataToSend.append('description_hi', formData.description_hi);
            formDataToSend.append('description_mr', formData.description_mr);

            formDataToSend.append('category', formData.category);

            if (productImage) formDataToSend.append('image', productImage);
            if (removeImage) formDataToSend.append('removeImage', 'true');

            formDataToSend.append('highlights_en', formData.highlights_en);
            formDataToSend.append('highlights_hi', formData.highlights_hi);
            formDataToSend.append('highlights_mr', formData.highlights_mr);

            formDataToSend.append('longDescription', formData.longDescription);
            formDataToSend.append('shippingInfo_en', formData.shippingInfo);
            formDataToSend.append('origin_en', formData.origin);
            formDataToSend.append('rating', formData.rating);

            const variantsData = validVariants.map((v, index) => {
                if (hasMultipleVariants && v.imageFile) {
                    formDataToSend.append(`variant_image_${index}`, v.imageFile);
                }
                return {
                    id: v.id,
                    name_en: hasMultipleVariants ? v.name_en : "Default",
                    name_hi: hasMultipleVariants ? v.name_hi : "",
                    name_mr: hasMultipleVariants ? v.name_mr : "",
                    price: v.price,
                    stock: v.stock,
                    image: hasMultipleVariants ? (v.imageFile ? null : (v.image || null)) : null
                };
            });
            formDataToSend.append('variants', JSON.stringify(variantsData));

            await updateMandalProduct(id as string, formDataToSend);

            toast({ title: "Success", description: "Product updated successfully." });
            router.push("/mandals/dashboard/products");
        } catch (error: any) {
            console.error("Update Product Error:", error);
            const errorMessage = error?.response?.data?.message || "Failed to update product";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addVariant = () => {
        setVariants([...variants, { id: Date.now().toString(), name_en: "", name_hi: "", name_mr: "", price: 0, stock: 0, imageFile: null, imagePreview: "" }]);
    };

    const removeVariant = (id: string) => {
        if (variants.length > 1) setVariants(variants.filter(v => v.id !== id));
    };

    const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
        setVariants(variants.map(variant =>
            variant.id === id ? { ...variant, [field]: field === 'price' || field === 'stock' ? Number(value) : value } : variant
        ));
    };

    const removeVariantImage = (id: string) => {
        setVariants(variants.map(variant =>
            variant.id === id ? { ...variant, imageFile: null, imagePreview: "", image: null } : variant
        ));
    };

    if (isLoading) return <div className="p-8 text-center">Loading mandal product...</div>;

    return (
        <div className="space-y-6">
            {showCropper && tempImage && (
                <ImageCropper
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        setTempImage(null);
                        setCroppingTarget(null);
                    }}
                    initialAspect={3 / 2}
                    lockAspect={true}
                    title={croppingTarget?.type === 'product' ? "Crop Product Image" : "Crop Variant Image"}
                />
            )}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Product</h1>
                    <p className="text-muted-foreground">Update mandal marketplace product</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="en" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">English</TabsTrigger>
                        <TabsTrigger value="hi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">{"हिन्दी"}</TabsTrigger>
                        <TabsTrigger value="mr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">{"मराठी"}</TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {['en', 'hi', 'mr'].map((lang) => (
                                <TabsContent key={lang} value={lang} className="space-y-6 mt-0 animate-in fade-in-50 duration-300 outline-none">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-[#7b4623]">
                                                <Package className="w-5 h-5" />
                                                Product Details ({lang.toUpperCase()})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`name_${lang}`}>Product Name * ({lang.toUpperCase()})</Label>
                                                    <Input
                                                        id={`name_${lang}`}
                                                        value={(formData as any)[`name_${lang}`]}
                                                        onChange={(e) => setFormData({ ...formData, [`name_${lang}`]: e.target.value })}
                                                        placeholder="Enter product name"
                                                        className={cn("placeholder:text-muted-foreground/50", lang === 'en' && errors.name ? "border-red-500" : "")}
                                                        required={lang === 'en'}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`description_${lang}`}>Short Description * ({lang.toUpperCase()})</Label>
                                                <RichTextEditor 
                                                    value={(formData as any)[`description_${lang}`]} 
                                                    onChange={content => setFormData({...formData, [`description_${lang}`]: content})} 
                                                    minHeight="150px"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`highlights_${lang}`}>Highlights ({lang.toUpperCase()})</Label>
                                                <Textarea
                                                    id={`highlights_${lang}`}
                                                    value={(formData as any)[`highlights_${lang}`]}
                                                    onChange={(e) => setFormData({ ...formData, [`highlights_${lang}`]: e.target.value })}
                                                    placeholder="Key features..."
                                                    rows={2}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            ))}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Shared Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category *</Label>
                                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>{parseLocalizedValue(category.name)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className={cn("text-xs font-bold uppercase", errors.image ? "text-red-600" : "text-slate-400")}>Product Cover Image *</Label>
                                        <div className="mt-2">
                                            {productImagePreview ? (
                                                <div className="relative inline-block">
                                                    <img src={productImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeProductImageAction}>
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-24 h-24 shrink-0 rounded-xl flex items-center justify-center", errors.image ? "border-2 border-solid border-red-500 bg-red-50" : "border-2 border-dashed border-slate-200 bg-slate-50")}>
                                                        <ImageIcon className={cn("w-8 h-8", errors.image ? "text-red-400" : "text-slate-400")} />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className={cn("relative flex items-center justify-center w-full h-12 rounded-xl hover:bg-orange-50/50 transition-colors", errors.image ? "border-2 border-solid border-red-500" : "border border-dashed border-[#7b4623]")}>
                                                            <input type="file" accept="image/*" onChange={handleProductImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                            <div className={cn("flex items-center gap-2 font-medium text-sm", errors.image ? "text-red-600" : "text-[#7b4623]")}>
                                                                <ImageIcon className="w-4 h-4" />
                                                                Upload Cover Image
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] font-semibold text-[#7b4623]">Recommended: 800x800 px (Square)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {errors.image && <p className="text-sm text-red-500 font-medium">{errors.image}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                    <CardTitle className="text-[#7b4623]">Product Variants</CardTitle>
                                    <div className="flex items-center gap-6">
                                        <Label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                            <input 
                                                type="radio" 
                                                checked={!hasMultipleVariants} 
                                                onChange={() => {
                                                    setHasMultipleVariants(false);
                                                    setVariants([variants[0]]);
                                                }} 
                                                className="accent-[#7b4623] w-4 h-4" 
                                            />
                                            Single Product
                                        </Label>
                                        <Label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                            <input 
                                                type="radio" 
                                                checked={hasMultipleVariants} 
                                                onChange={() => setHasMultipleVariants(true)} 
                                                className="accent-[#7b4623] w-4 h-4" 
                                            />
                                            Multiple Variants
                                        </Label>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    {variants.map((variant, index) => (
                                        <div key={variant.id} className="p-5 border rounded-2xl bg-slate-50/50 space-y-4 relative group">
                                            <div className="flex justify-between items-center">
                                                <Label className="font-bold text-[#7b4623]">{hasMultipleVariants ? `Variant ${index + 1}` : 'Product Pricing & Stock'}</Label>
                                                {hasMultipleVariants && variants.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variant.id)} className="h-8 w-8 text-red-500 rounded-full hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {hasMultipleVariants && (
                                                <>
                                                    {['en', 'hi', 'mr'].map((lang) => (
                                                        <TabsContent key={lang} value={lang} className="mt-0">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Variant Name ({lang.toUpperCase()}) *</Label>
                                                                <Input
                                                                    placeholder="e.g. Small"
                                                                    value={(variant as any)[`name_${lang}`]}
                                                                    onChange={(e) => updateVariant(variant.id, `name_${lang}` as any, e.target.value)}
                                                                    className={cn("h-10 rounded-lg", lang === 'en' && errors[`variant_name_${index}`] ? "border-red-500" : "")}
                                                                    required={hasMultipleVariants && lang === 'en'}
                                                                />
                                                            </div>
                                                        </TabsContent>
                                                    ))}

                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Variant Image</Label>
                                                        <div className="mt-2">
                                                            {variant.imagePreview ? (
                                                                <div className="relative inline-block">
                                                                    <img src={variant.imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => removeVariantImage(variant.id)}>
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-20 h-20 shrink-0 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-white">
                                                                        <ImageIcon className="w-6 h-6 text-slate-400" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="relative flex items-center justify-center w-full h-11 border border-dashed border-[#7b4623] rounded-xl hover:bg-orange-50/50 transition-colors">
                                                                            <input type="file" accept="image/*" onChange={(e) => handleVariantImageChange(variant.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                            <div className="flex items-center gap-2 text-[#7b4623] font-medium text-sm">
                                                                                <ImageIcon className="w-4 h-4" />
                                                                                Upload Variant Image
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Price (₹)</Label>
                                                    <Input type="number" value={variant.price || ''} onChange={(e) => updateVariant(variant.id, 'price', e.target.value)} className="h-10 rounded-lg" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Stock</Label>
                                                    <Input type="number" value={variant.stock || ''} onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)} className="h-10 rounded-lg" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {hasMultipleVariants && (
                                        <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full h-11 border-dashed border-[#7b4623] text-[#7b4623] hover:bg-orange-50 rounded-xl">
                                            <Plus className="w-4 h-4 mr-2" /> Add More Variant
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                            <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg font-bold rounded-2xl bg-[#7b4623] hover:bg-[#5d351a] shadow-lg shadow-orange-900/20">
                                {isSubmitting ? "Processing..." : "Update Product"}
                            </Button>
                        </div>
                    </div>
                </Tabs>
            </form>
        </div>
    );
}

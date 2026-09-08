"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit2, Package, Languages, ImageIcon, CheckCircle, Info, Layers, Truck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { fetchMandalProductById } from "@/api/mandalAdminController";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/apiConfig";
import { parseLocalizedValue } from "@/utils/textUtils";
import { useLanguage, Language } from "@/context/LanguageContext";

export default function ViewMandalProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const { toast } = useToast();
    const { language } = useLanguage();
    
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewLang, setViewLang] = useState<Language>(language as Language || 'en');

    useEffect(() => {
        if (productId) {
            loadProduct();
        }
    }, [productId]);

    const loadProduct = async () => {
        setIsLoading(true);
        try {
            const data = await fetchMandalProductById(productId);
            if (data.success) {
                setProduct(data.data);
            } else {
                toast({ title: "Error", description: "Product not found", variant: "destructive" });
                router.push('/mandals/dashboard/products');
            }
        } catch (error) {
            console.error("Load Mandal Product Error:", error);
            toast({ title: "Error", description: "Failed to load product", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        return `${BASE_URL}${path}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-amber-500 hover:bg-amber-600">Pending Approval</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7b4623]"></div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/mandals/dashboard/products')}
                        className="rounded-full hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {parseLocalizedValue(product.name, viewLang)}
                        </h1>
                        <nav className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span>Mandal Inventory</span>
                            <span className="opacity-30">/</span>
                            <span>{parseLocalizedValue(product.categoryObj?.name, viewLang) || "General"}</span>
                        </nav>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => router.push(`/mandals/dashboard/products/edit/${productId}`)}
                        className="rounded-xl border-slate-200 hover:bg-slate-50"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Product
                    </Button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Side: Images & Quick Stats */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden border-slate-100 shadow-sm rounded-3xl">
                        <div className="aspect-square bg-slate-50 relative flex items-center justify-center p-6">
                            {product.image ? (
                                <img
                                    src={getImageUrl(product.image)}
                                    alt="Product"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Package className="w-24 h-24 text-slate-200" />
                            )}
                            <div className="absolute top-4 left-4">
                                {getStatusBadge(product.status)}
                            </div>
                        </div>
                        <CardContent className="p-6 bg-white border-t border-slate-50">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Variants</p>
                                    <p className="text-xl font-bold text-slate-900">{product.variants?.length || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Stock</p>
                                    <p className="text-xl font-bold text-emerald-600">
                                        {product.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)} Units
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Tabbed Details & Variants */}
                <div className="lg:col-span-8 space-y-6">
                    <Tabs value={viewLang} onValueChange={(v) => setViewLang(v as Language)} className="w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm mb-6">
                            <div className="flex items-center gap-2 px-3 text-slate-500 font-bold text-xs uppercase tracking-widest">
                                <Languages className="w-4 h-4 text-[#7b4623]" /> 
                                Localized Content View
                            </div>
                            <TabsList className="bg-slate-50/50 border h-10 p-1">
                                <TabsTrigger value="en" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">English</TabsTrigger>
                                <TabsTrigger value="hi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">हिन्दी</TabsTrigger>
                                <TabsTrigger value="mr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">मराठी</TabsTrigger>
                            </TabsList>
                        </div>

                        {['en', 'hi', 'mr'].map((l) => (
                            <TabsContent key={l} value={l} className="space-y-6 mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 outline-none">
                                <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                                    <CardContent className="p-8 space-y-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7b4623]/60">Product Name ({l.toUpperCase()})</p>
                                            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                                                {parseLocalizedValue(product.name, l as Language) || <span className="text-slate-300 italic">No name provided</span>}
                                            </h2>
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <Info className="w-3 h-3" /> Description
                                            </div>
                                            <div 
                                                className="prose prose-orange max-w-none text-slate-600 leading-relaxed text-base min-h-[100px]"
                                                dangerouslySetInnerHTML={{ __html: parseLocalizedValue(product.description, l as Language) || "<p class='text-slate-300 italic'>No description provided in this language.</p>" }}
                                            />
                                        </div>

                                        {product.highlights && (
                                            <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">✨ Key Highlights ({l.toUpperCase()})</p>
                                                <p className="text-sm font-medium text-amber-800 leading-relaxed">
                                                    {parseLocalizedValue(product.highlights, l as Language)}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* Variants Section */}
                    <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/30">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-[#7b4623]" />
                                Product Variants & Pricing
                            </CardTitle>
                            <Badge variant="outline" className="bg-white">{product.variants?.length || 0} Variations</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {product.variants?.map((variant: any, index: number) => {
                                    return (
                                        <div key={variant.id || index} className="p-6 hover:bg-slate-50/50 transition-colors group">
                                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                    {variant.image ? (
                                                        <img src={getImageUrl(variant.image)} alt="Variant" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-8 h-8 text-slate-200" />
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 text-lg">
                                                            {parseLocalizedValue(variant.name, viewLang)}
                                                        </h4>
                                                        {variant.stock <= 5 && (
                                                            <Badge variant="destructive" className="text-[9px] h-4">Low Stock</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${variant.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                            Stock: <span className="text-slate-900">{variant.stock} Units</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 md:text-right border-t md:border-t-0 pt-4 md:pt-0">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Price</p>
                                                        <p className="text-2xl font-black text-[#7b4623]">₹{variant.price}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

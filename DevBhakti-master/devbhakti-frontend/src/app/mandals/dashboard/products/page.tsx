"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Package,
    Eye,
    MoreVertical,
    ShoppingBag,
    Layers,
    Download,
    Upload,
    Loader2,
    FileText
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { fetchMandalProducts, deleteMandalProduct } from "@/api/mandalAdminController";
import { fetchCategories } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/apiConfig";
import { parseLocalizedValue, stripHtml } from '@/utils/textUtils';



export default function MandalProductsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [stockStatus, setStockStatus] = useState("all");

    // Stats
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'approved').length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;

    const outOfStockCount = products.filter(p => {
        const totalStock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
        return totalStock === 0;
    }).length;

    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [selectedCategory, stockStatus, searchQuery]);

    const loadCategories = async () => {
        try {
            const data = await fetchCategories();
            setCategories(data || []);
        } catch (error) {
            console.error("Load Categories Error:", error);
        }
    };

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (selectedCategory !== "all") params.categoryId = selectedCategory;
            if (stockStatus !== "all") params.stockStatus = stockStatus;

            const data = await fetchMandalProducts(params);
            if (data.success) {
                setProducts(data.data.products);
            }
        } catch (error) {
            console.error("Load Products Error:", error);
            toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteMandalProduct(id);
            toast({ title: "Success", description: "Product deleted successfully" });
            loadProducts();
        } catch (error) {
            console.error("Delete Error:", error);
            toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
        }
    };

    const handleView = (product: any) => {
        router.push(`/mandals/dashboard/products/${product.id}/view`);
    };

    const filteredProducts = products;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Product Management
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Manage your mandal's marketplace inventory, track stock, and organize variants.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                    <Button
                        onClick={() => router.push('/mandals/dashboard/products/create')}
                        className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 flex-1 md:flex-initial"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Product
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Products", value: totalProducts, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Active", value: activeProducts, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Pending", value: pendingProducts, icon: Layers, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Out of Stock", value: outOfStockCount, icon: Trash2, color: "text-red-600", bg: "bg-red-50" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search products by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[180px] h-11 border-slate-200 bg-slate-50 focus:ring-[#7b4623]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {parseLocalizedValue(cat.name)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={stockStatus} onValueChange={setStockStatus}>
                        <SelectTrigger className="w-full sm:w-[180px] h-11 border-slate-200 bg-slate-50 focus:ring-[#7b4623]">
                            <SelectValue placeholder="Stock Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stock</SelectItem>
                            <SelectItem value="in_stock">In Stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>

                    {(selectedCategory !== "all" || stockStatus !== "all" || searchQuery) && (
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setSelectedCategory("all");
                                setStockStatus("all");
                                setSearchQuery("");
                            }}
                            className="h-11 px-4 text-slate-500 hover:text-[#7b4623]"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-sm mb-4">
                        <Package className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">No products found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Get started by adding your first product to the marketplace.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-6"
                        onClick={() => router.push('/mandals/dashboard/products/create')}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredProducts.map((product, index) => {
                            const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
                            const minPrice = product.variants?.length > 0
                                ? Math.min(...product.variants.map((v: any) => v.price))
                                : 0;
                            const variantsCount = product.variants?.length || 0;

                            return (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className="group h-full flex flex-col overflow-hidden border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                                        {/* Image Area */}
                                        <div className="relative aspect-video bg-slate-50 overflow-hidden cursor-pointer" onClick={() => handleView(product)}>
                                            {product.image ? (
                                                <img
                                                    src={`${BASE_URL}${product.image}`}
                                                    alt={parseLocalizedValue(product.name)}
                                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-12 h-12 text-slate-300" />
                                                </div>
                                            )}

                                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                                                {getStatusBadge(product.status)}
                                            </div>

                                            <div className="absolute top-3 left-3">
                                                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm text-xs font-semibold">
                                                    {variantsCount} {variantsCount === 1 ? 'Variant' : 'Variants'}
                                                </Badge>
                                            </div>

                                            {/* Hover Quick Actions */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <Button
                                                    size="sm"
                                                    className="bg-white text-slate-900 hover:bg-white/90"
                                                    onClick={(e) => { e.stopPropagation(); handleView(product); }}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-white text-slate-900 hover:bg-white/90"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/mandals/dashboard/products/edit/${product.id}`); }}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <CardContent className="p-4 flex-1">
                                            <div className="mb-2">
                                                <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
                                                {parseLocalizedValue(product.categoryObj?.name || "General")}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-1" title={parseLocalizedValue(product.name)}>
                                            {parseLocalizedValue(product.name)}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-3 h-10">
                                            {stripHtml(parseLocalizedValue(product.description))}
                                        </p>

                                            <Separator className="my-3" />

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-500">Starting from</p>
                                                    <p className="text-lg font-bold text-slate-900">₹{minPrice}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">Total Stock</p>
                                                    <p className={`font-medium ${totalStock === 0 ? "text-red-600" : "text-emerald-600"}`}>
                                                        {totalStock} units
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Footer Actions (Visible on mobile/tap) */}
                                        <div className="md:hidden p-3 border-t bg-slate-50 flex justify-between gap-2">
                                            <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleView(product)}>View</Button>
                                            <Button variant="ghost" size="sm" className="flex-1" onClick={() => router.push(`/mandals/dashboard/products/edit/${product.id}`)}>Edit</Button>
                                            <Button variant="ghost" size="sm" className="flex-1 text-red-600" onClick={() => handleDelete(product.id)}>Delete</Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

        </div>
    );
}

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
import * as XLSX from 'xlsx';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { fetchMyProducts, deleteMyProduct, createMyProduct, fetchCategories, createBulkMyProducts } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/config/apiConfig";
import { parseLocalizedValue, stripHtml } from '@/utils/textUtils';



export default function TempleProductsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [stockStatus, setStockStatus] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // Stats
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'approved').length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;

    // Calculate out of stock
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

            const data = await fetchMyProducts(params);
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
            await deleteMyProduct(id);
            toast({ title: "Success", description: "Product deleted successfully" });
            loadProducts();
        } catch (error) {
            console.error("Delete Error:", error);
            toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
        }
    };

    const handleView = (product: any) => {
        router.push(`/temples/dashboard/products/${product.id}/view`);
    };

    const filteredProducts = products;

    // --- BULK MANAGEMENT ---
    const downloadTemplate = () => {
        const template = [
            {
                "Name_EN": "Sandalwood Mala",
                "Name_HI": "चंदन की माला",
                "Name_MR": "चंदन माळ",
                "Category": categories[0]?.name || "General",
                "Short_Description_EN": "Pure sandalwood beads.",
                "Short_Description_HI": "शुद्ध चंदन के मोती।",
                "Short_Description_MR": "शुद्ध चंदनाचे मणी.",
                "Highlights_EN": "108 beads, Fragrant",
                "Highlights_HI": "108 मोती, सुगंधित",
                "Highlights_MR": "108 मणी, सुवासिक",
                "Origin": "India",
                "Base_Rating": 4.5,
                "Weight": 0.1,
                "Length": 10,
                "Width": 10,
                "Height": 2,
                "Variants_JSON": JSON.stringify([{ name_en: "Standard", name_hi: "मानक", name_mr: "प्रमाणित", price: 350, stock: 100 }])
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Product Template");
        XLSX.writeFile(wb, "Temple_Product_Import_Template.xlsx");
    };

    const handleExportExcel = () => {
        const exportData = products.map(p => ({
            "ID": p.id,
            "Name_EN": p.name?.en || p.name || "",
            "Name_HI": p.name?.hi || "",
            "Name_MR": p.name?.mr || "",
            "Category": p.categoryObj?.name || "",
            "Status": p.status,
            "Price_Starting": p.variants?.[0]?.price || 0,
            "Total_Stock": p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0,
            "Short_Description_EN": p.description?.en || p.description || "",
            "Highlights_EN": p.highlights?.en || p.highlights || "",
            "Origin": p.origin || "India",
            "Base_Rating": p.rating || 4.5,
            "Weight": p.weight || 0,
            "Variants_Data": JSON.stringify(p.variants || [])
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "My Products");
        XLSX.writeFile(wb, `My_Products_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                if (data.length === 0) {
                    toast({ title: "Error", description: "Excel file is empty", variant: "destructive" });
                    return;
                }

                toast({ title: "Import Started", description: `Importing ${data.length} products...`, variant: "success" });

                const mappedProducts = data.map((row: any) => {
                    const categoryName = String(row.Category || "").trim();
                    const foundCategory = categories.find(c => 
                        c.name.toLowerCase() === categoryName.toLowerCase() || 
                        c.id === categoryName
                    );

                    let variantsArray = [];
                    try {
                        if (row.Variants_JSON) {
                            variantsArray = JSON.parse(row.Variants_JSON);
                        } else {
                            variantsArray = [{
                                name_en: "Standard",
                                name_hi: "मानक",
                                name_mr: "प्रमाणित",
                                price: Number(row.Price_Starting || 0),
                                stock: Number(row.Total_Stock || 0)
                            }];
                        }
                    } catch (e) {
                         variantsArray = [];
                    }

                    return {
                        name_en: String(row.Name_EN || "").trim(),
                        name_hi: String(row.Name_HI || "").trim(),
                        name_mr: String(row.Name_MR || "").trim(),
                        description_en: String(row.Short_Description_EN || "").trim(),
                        description_hi: String(row.Short_Description_HI || "").trim(),
                        description_mr: String(row.Short_Description_MR || "").trim(),
                        category: foundCategory?.id || categories[0]?.id || "",
                        highlights_en: String(row.Highlights_EN || "").trim(),
                        highlights_hi: String(row.Highlights_HI || "").trim(),
                        highlights_mr: String(row.Highlights_MR || "").trim(),
                        origin: String(row.Origin || "India").trim(),
                        rating: String(row.Base_Rating || "4.5"),
                        weight: String(row.Weight || "0.5"),
                        length: String(row.Length || "10"),
                        width: String(row.Width || "10"),
                        height: String(row.Height || "10"),
                        variants: variantsArray
                    };
                });

                try {
                    const result = await createBulkMyProducts({ products: mappedProducts });
                    const { successCount, failCount, errors } = result.data;

                    if (failCount > 0) {
                        toast({
                            title: "Import Partially Failed",
                            description: `Success: ${successCount}, Failed: ${failCount}. Check console or fix these: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
                            variant: "destructive"
                        });
                        console.error('Bulk Import Errors:', errors);
                    } else {
                        toast({
                            title: "Import Successful",
                            description: `Successfully imported ${successCount} products.`,
                            variant: "success"
                        });
                    }
                    loadProducts();
                } catch (bulkErr: any) {
                     toast({ title: "Import Failed", description: bulkErr.response?.data?.message || "Failed to process bulk upload.", variant: "destructive" });
                }
            } catch (error) {
                toast({ title: "Import Failed", description: "Failed to process Excel file", variant: "destructive" });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-widest text-[10px] px-3 py-1">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-amber-500 hover:bg-amber-600 font-bold uppercase tracking-widest text-[10px] px-3 py-1">Pending</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-500 hover:bg-rose-600 font-bold uppercase tracking-widest text-[10px] px-3 py-1">Rejected</Badge>;
            default:
                return <Badge variant="secondary" className="font-bold uppercase tracking-widest text-[10px] px-3 py-1">Unknown</Badge>;
        }
    };

    return (
        <div className="w-full p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b4623]/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-100 pointer-events-none" />
                <div className="relative z-10 w-full md:w-auto">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-serif mb-2">
                        Product Management
                    </h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl">
                        Manage your temple's marketplace inventory, track stock, organize variants, and monitor overall performance.
                    </p>
                </div>
                <div className="flex flex-wrap items-center justify-start md:justify-end gap-3 w-full md:w-auto relative z-10">
                    <Button
                        onClick={downloadTemplate}
                        variant="outline"
                        className="flex-1 md:flex-none border-slate-200 hover:bg-slate-50 text-slate-700 h-11 px-4 rounded-xl font-semibold transition-colors"
                    >
                        <FileText className="w-4 h-4 mr-2 text-slate-500" />
                        Template
                    </Button>
                    <div className="relative flex-1 md:flex-none">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="import-excel"
                            onChange={handleImportExcel}
                        />
                        <Button
                            onClick={() => document.getElementById('import-excel')?.click()}
                            variant="outline"
                            className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 h-11 px-4 rounded-xl font-semibold transition-colors"
                        >
                            <Upload className="w-4 h-4 mr-2 text-slate-500" />
                            Import
                        </Button>
                    </div>
                    <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        className="flex-1 md:flex-none border-slate-200 hover:bg-slate-50 text-slate-700 h-11 px-4 rounded-xl font-semibold transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2 text-slate-500" />
                        Export
                    </Button>
                    <Button
                        onClick={() => router.push('/temples/dashboard/products/create')}
                        className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-xl shadow-[#7b4623]/20 transition-all hover:scale-105 h-11 px-6 rounded-xl font-bold flex-1 md:flex-none w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Product
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: "Total Products", value: totalProducts, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50/80 border border-blue-100" },
                    { label: "Active Items", value: activeProducts, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50/80 border border-emerald-100" },
                    { label: "Pending Approval", value: pendingProducts, icon: Layers, color: "text-amber-600", bg: "bg-amber-50/80 border border-amber-100" },
                    { label: "Out of Stock", value: outOfStockCount, icon: Trash2, color: "text-rose-600", bg: "bg-rose-50/80 border border-rose-100" },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[1.5rem] bg-white group h-full">
                            <CardContent className="p-6 md:p-8 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] md:text-sm font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                                    <p className={`text-4xl md:text-5xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                                </div>
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-3 md:p-4 rounded-[1.5rem] border border-slate-100/80 shadow-sm relative z-10">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search products by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 md:h-14 bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-[#7b4623] hover:bg-white transition-all rounded-xl text-base font-medium"
                    />
                </div>
                
                <div className="flex w-full xl:w-auto flex-col sm:flex-row gap-3">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[220px] h-12 md:h-14 border-slate-200 bg-slate-50/80 hover:bg-white focus:ring-[#7b4623] rounded-xl font-bold text-slate-700 transition-colors">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            <SelectItem value="all" className="font-semibold text-slate-700">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="font-semibold text-slate-700">
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={stockStatus} onValueChange={setStockStatus}>
                        <SelectTrigger className="w-full sm:w-[200px] h-12 md:h-14 border-slate-200 bg-slate-50/80 hover:bg-white focus:ring-[#7b4623] rounded-xl font-bold text-slate-700 transition-colors">
                            <SelectValue placeholder="Stock Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            <SelectItem value="all" className="font-semibold text-slate-700">All Stock</SelectItem>
                            <SelectItem value="in_stock" className="font-semibold text-emerald-600">In Stock</SelectItem>
                            <SelectItem value="out_of_stock" className="font-semibold text-rose-600">Out of Stock</SelectItem>
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
                            className="h-12 md:h-14 px-6 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-[420px] bg-white rounded-[2rem] border border-slate-100 animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center">
                    <div className="bg-slate-50 p-6 rounded-3xl w-28 h-28 mx-auto flex items-center justify-center shadow-inner mb-6 border border-slate-100">
                        <Package className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 font-serif">No products found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">
                        Get started by adding your first product to the temple's marketplace inventory.
                    </p>
                    <Button
                        className="mt-8 bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-xl shadow-[#7b4623]/20 h-12 px-8 rounded-xl font-bold text-base transition-all hover:scale-105"
                        onClick={() => router.push('/temples/dashboard/products/create')}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add First Product
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
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
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    className="h-full"
                                >
                                    <Card className="group h-full flex flex-col overflow-hidden border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] bg-white">
                                        {/* Image Area */}
                                        <div className="relative aspect-square md:aspect-[4/3] bg-slate-50 overflow-hidden cursor-pointer" onClick={() => handleView(product)}>
                                            {product.image ? (
                                                <img
                                                    src={`${BASE_URL}${product.image}`}
                                                    alt={parseLocalizedValue(product.name)}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                    <Package className="w-16 h-16 text-slate-300" />
                                                </div>
                                            )}

                                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                                {getStatusBadge(product.status)}
                                            </div>

                                            <div className="absolute top-4 left-4">
                                                <Badge variant="secondary" className="bg-white/95 backdrop-blur-md shadow-sm text-[10px] font-black uppercase tracking-wider px-3 py-1 text-slate-700">
                                                    {variantsCount} {variantsCount === 1 ? 'Variant' : 'Variants'}
                                                </Badge>
                                            </div>

                                            {/* Hover Qucik Actions */}
                                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <Button
                                                    className="bg-white text-slate-900 hover:bg-slate-50 shadow-xl w-36 h-11 rounded-xl font-bold transition-all hover:scale-105"
                                                    onClick={(e) => { e.stopPropagation(); handleView(product); }}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Item
                                                </Button>
                                                <Button
                                                    className="bg-[#7b4623] text-white hover:bg-[#5d351a] shadow-xl w-36 h-11 rounded-xl font-bold transition-all hover:scale-105"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/temples/dashboard/products/edit/${product.id}`); }}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit Item
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <CardContent className="p-5 md:p-6 flex-1 flex flex-col">
                                            <div className="mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 inline-block shadow-sm">
                                                    {parseLocalizedValue(product.categoryObj?.name || "General")}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg md:text-xl text-slate-900 line-clamp-2 mb-2 leading-tight group-hover:text-[#7b4623] transition-colors" title={parseLocalizedValue(product.name)}>
                                                {parseLocalizedValue(product.name)}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1 font-medium leading-relaxed">
                                                {stripHtml(parseLocalizedValue(product.description))}
                                            </p>

                                            <Separator className="my-4 md:my-5 border-slate-100" />

                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starting from</p>
                                                    <p className="text-2xl font-black text-slate-900 tracking-tight">₹{minPrice}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Stock</p>
                                                    <p className={`text-sm font-black px-3 py-1.5 rounded-xl inline-block shadow-sm ${totalStock === 0 ? "text-rose-700 bg-rose-50 border border-rose-100" : "text-emerald-700 bg-emerald-50 border border-emerald-100"}`}>
                                                        {totalStock} units
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Footer Actions (Visible on mobile/tap) */}
                                        <div className="md:hidden p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 bg-white border-slate-200 text-slate-700 font-bold" onClick={() => handleView(product)}>View</Button>
                                            <Button variant="outline" size="sm" className="flex-1 bg-white border-slate-200 text-slate-700 font-bold" onClick={() => router.push(`/temples/dashboard/products/edit/${product.id}`)}>Edit</Button>
                                            <Button variant="outline" size="sm" className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100 font-bold" onClick={() => handleDelete(product.id)}>Delete</Button>
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

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    Store,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Package,
    TrendingUp,
    ShoppingBag,
    Edit2,
    Layers,
    IndianRupee,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { fetchSellerByIdAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BASE_URL } from "@/config/apiConfig";

export default function ViewSellerPage() {
    const router = useRouter();
    const { id } = useParams();
    const { toast } = useToast();
    const [isFetching, setIsFetching] = useState(true);
    const [seller, setSeller] = useState<any>(null);

    useEffect(() => {
        if (id) {
            loadSeller(id as string);
        }
    }, [id]);

    const loadSeller = async (sellerId: string) => {
        try {
            const data = await fetchSellerByIdAdmin(sellerId);
            console.log("Seller Data:", data);
            console.log("Seller Logo:", data.logo);
            console.log("Products:", data.products);
            setSeller(data);
        } catch (error: any) {
            console.error("Load Seller Error:", error);
            toast({
                title: "Error",
                description: "Failed to load seller details",
                variant: "destructive",
            });
        } finally {
            setIsFetching(false);
        }
    };

    if (isFetching || !seller) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#794A05] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#794A05] font-serif italic animate-pulse">Loading Seller Profile...</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
            case "pending":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1 rounded-full"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            default:
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1 rounded-full"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>;
        }
    };

    const getPriceDisplay = (product: any) => {
        if (!product.variants || product.variants.length === 0) return "N/A";

        const prices = product.variants.map((v: any) => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        if (minPrice === maxPrice) {
            return `₹${minPrice.toLocaleString()}`;
        }
        return `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`;
    };

    const getTotalStock = (product: any) => {
        if (!product.variants) return 0;
        return product.variants.reduce((acc: number, curr: any) => acc + (curr.stock || 0), 0);
    };

    return (
        <div className="space-y-8 max-w-8xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/admin/sellers")}
                        className="h-10 w-10 shrink-0"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-500" />
                    </Button>

                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                            <AvatarImage
                                src={seller.logo ? `${BASE_URL}${seller.logo}` : ''}
                                alt={seller.storeName}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-[#794A05] text-white text-xl font-bold">
                                {seller.storeName?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900">{seller.storeName}</h1>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">ID: {seller.sellerId || seller.id.slice(0, 8)}</span>
                                <span className="text-slate-300">|</span>
                                {getStatusBadge(seller.status)}
                                <span className="text-slate-300">|</span>
                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Joined {format(new Date(seller.joinDate), "dd MMM yyyy")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => router.push(`/admin/sellers/edit/${seller.id}`)}
                    className="bg-slate-900 text-white hover:bg-slate-800 shadow-md gap-2"
                >
                    <Edit2 className="w-4 h-4" />
                    Edit Details
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">₹{seller.totalSales?.toLocaleString()}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{seller.totalOrders}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{seller.totalProducts}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Package className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all rounded-2xl">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{seller.productCommissionRate}%</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <Layers className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact & Info Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-md rounded-[1.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-[#794A05]" />
                                Seller Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contact Person</p>
                                    <p className="font-semibold text-slate-900 text-sm mt-0.5">{seller.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                                    <a href={`mailto:${seller.email}`} className="font-semibold text-blue-600 text-sm mt-0.5 hover:underline truncate block">
                                        {seller.email}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                                    <a href={`tel:${seller.phone}`} className="font-semibold text-slate-900 text-sm mt-0.5 hover:underline">
                                        {seller.phone}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Address</p>
                                    <p className="font-medium text-slate-700 text-sm mt-0.5 leading-relaxed">
                                        {seller.address || "No address provided"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Table Column */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-md rounded-[1.5rem] overflow-hidden h-full">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-[#794A05]" />
                                    Product Inventory
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Listing {seller.products?.length || 0} products from this seller
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent bg-slate-50/50">
                                        <TableHead className="pl-6 w-[250px]">Product Details</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock / Variants</TableHead>
                                        <TableHead className="text-right pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {seller.products && seller.products.length > 0 ? (
                                        seller.products.map((product: any) => (
                                            <TableRow key={product.id} className="hover:bg-slate-50">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                            {product.image ? (
                                                                <img
                                                                    src={`${BASE_URL}${product.image}`}
                                                                    alt={product.name}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(e) => {
                                                                        console.log("Image failed to load:", product.image);
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.parentElement!.innerHTML = '<div class="h-full w-full flex items-center justify-center text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                                    <Package className="w-5 h-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900 line-clamp-1">{product.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{product.id.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal text-xs bg-slate-50 text-slate-600">
                                                        {product.categoryObj?.name || product.category || "Uncategorized"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-bold text-sm text-[#794A05]">{getPriceDisplay(product)}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900">{getTotalStock(product)} Units</span>
                                                        <span className="text-[10px] text-slate-500">
                                                            in {product.variants?.length || 0} variants
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Badge className={
                                                        product.status === 'active' || product.status === 'approved'
                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                                            : "bg-slate-100 text-slate-500 hover:bg-slate-100"
                                                    }>
                                                        {product.status || 'Draft'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-500 italic">
                                                No products found for this seller.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

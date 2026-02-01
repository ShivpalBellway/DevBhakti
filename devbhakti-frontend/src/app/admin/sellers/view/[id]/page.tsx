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
    CheckCircle,
    XCircle,
    Clock,
    ArrowUpRight,
    TrendingUp,
    ShoppingBag,
    ExternalLink,
    Edit2
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
            setSeller(data);
        } catch (error: any) {
            console.error("Load Selle Error:", error);
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Active</Badge>;
            case "pending":
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Pending</Badge>;
            default:
                return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Inactive</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/admin/sellers")}
                        className="h-9 w-9"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{seller.storeName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono text-muted-foreground">{seller.id}</span>
                            <span className="text-slate-300">•</span>
                            {getStatusBadge(seller.status)}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/admin/sellers/edit/${seller.id}`)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Seller
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-indigo-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Sales</p>
                            <h3 className="text-xl font-bold text-slate-900">₹{seller.totalSales}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Orders</p>
                            <h3 className="text-xl font-bold text-slate-900">{seller.totalOrders}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Live Products</p>
                            <h3 className="text-xl font-bold text-slate-900">{seller.totalProducts}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-slate-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Join Date</p>
                            <h3 className="text-xl font-bold text-slate-900">{new Date(seller.joinDate).toLocaleDateString()}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="p-4 border-b">
                            <CardTitle className="text-base">Seller Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500">Full Name</p>
                                    <p className="font-medium text-slate-900">{seller.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500">Email Address</p>
                                    <p className="font-medium text-slate-900">{seller.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500">Phone Number</p>
                                    <p className="font-medium text-slate-900">{seller.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500">Address</p>
                                    <p className="text-sm text-slate-900 leading-relaxed font-medium">
                                        {seller.address}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 border-t pt-4">
                                <TrendingUp className="w-5 h-5 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-slate-500">Platform Commission</p>
                                    <p className="font-bold text-slate-900">{seller.productCommissionRate}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Seller Products</CardTitle>
                                <CardDescription>Recently added or updated items</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-4">Product Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {seller.products && seller.products.length > 0 ? (
                                        seller.products.map((product: any) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="pl-4 font-medium">{product.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{product.category}</Badge>
                                                </TableCell>
                                                <TableCell>₹{product.price}</TableCell>
                                                <TableCell>{product.stock}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
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

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
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    IndianRupee,
    TrendingUp,
    Plus,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchSellerByIdAdmin, updateSellerAdmin, fetchCommissionSlabsAdmin } from "@/api/adminController";

export default function EditSellerPage() {
    const router = useRouter();
    const { id } = useParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [slabs, setSlabs] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        storeName: "",
        sellerName: "",
        email: "",
        phone: "",
        status: "",
        address: "",
        productCommissionRate: "",
    });

    useEffect(() => {
        if (id) {
            loadSeller(id as string);
        }
    }, [id]);

    const loadSeller = async (sellerId: string) => {
        try {
            const data = await fetchSellerByIdAdmin(sellerId);
            setFormData({
                storeName: data.storeName || "",
                sellerName: data.name || "",
                email: data.email || "",
                phone: data.phone || "",
                status: data.status || "inactive",
                address: data.address || "",
                productCommissionRate: data.productCommissionRate?.toString() || "10.0",
            });

            // Set slabs if they exist in the response
            if (data.commissionSlabs && data.commissionSlabs.length > 0) {
                setSlabs(data.commissionSlabs);
            } else {
                // Fallback to global slabs as template if no seller slabs exist
                loadDefaultSlabs();
            }
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

    const loadDefaultSlabs = async () => {
        try {
            const response = await fetchCommissionSlabsAdmin('GLOBAL');
            if (response.success) {
                const marketplaceSlabs = response.data.filter((s: any) => s.category === 'MARKETPLACE');
                setSlabs(marketplaceSlabs);
            }
        } catch (error) {
            console.error("Failed to load global slabs structure");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value: string) => {
        setFormData(prev => ({ ...prev, status: value }));
    };

    const handleAddSlab = () => {
        setSlabs([...slabs, { minAmount: 0, maxAmount: null, platformFee: 0, percentage: 0, category: 'MARKETPLACE' }]);
    };

    const handleRemoveSlab = (index: number) => {
        setSlabs(slabs.filter((_, i) => i !== index));
    };

    const handleSlabChange = (index: number, field: string, value: any) => {
        const newSlabs = [...slabs];
        newSlabs[index] = { ...newSlabs[index], [field]: value };
        setSlabs(newSlabs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateSellerAdmin(id as string, {
                ...formData,
                commissionSlabs: slabs
            });
            toast({
                title: "Success",
                description: "Seller updated successfully",
            });
            router.push("/admin/sellers");
        } catch (error: any) {
            console.error("Update Seller Error:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update seller",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading seller details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-9 w-9"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Seller</h1>
                    <p className="text-muted-foreground">Modify information for seller ID: <span className="font-mono text-primary">{id}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-lg">Store Information</CardTitle>
                                <CardDescription>Update details about the seller's storefront.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="storeName">Store Name</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="storeName"
                                            name="storeName"
                                            className="pl-10"
                                            value={formData.storeName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Physical Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Textarea
                                            id="address"
                                            name="address"
                                            className="pl-10 min-h-[100px]"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-lg">Platform Status</CardTitle>
                                <CardDescription>Control seller visibility and access.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <Label htmlFor="status">Account Status</Label>
                                    <Select value={formData.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    <span>Active</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="pending">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-amber-500" />
                                                    <span>Pending</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                    <span>Inactive</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Inactivating a seller will prevent them from adding new products and potentially hide their existing catalog.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                                            <IndianRupee className="w-5 h-5 text-amber-600" />
                                            Marketplace Commission Slabs
                                        </CardTitle>
                                        <CardDescription className="text-amber-800/70">Manage multi-tier commission structures for this seller.</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddSlab}
                                        className="bg-white hover:bg-amber-50 border-amber-200 text-amber-700 h-8 font-medium shadow-sm transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                                        Add Slab
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                                                <th className="px-4 py-3 font-semibold">Min (₹)</th>
                                                <th className="px-4 py-3 font-semibold">Max (₹)</th>
                                                <th className="px-4 py-3 font-semibold">Fixed (₹)</th>
                                                <th className="px-4 py-3 font-semibold">%</th>
                                                <th className="px-4 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {slabs.map((slab, index) => (
                                                <tr key={index} className="group hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            value={slab.minAmount}
                                                            onChange={(e) => handleSlabChange(index, "minAmount", e.target.value)}
                                                            className="h-8 py-0 focus-visible:ring-amber-500 text-sm font-medium border-slate-200"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            value={slab.maxAmount || ""}
                                                            placeholder="∞"
                                                            onChange={(e) => handleSlabChange(index, "maxAmount", e.target.value)}
                                                            className="h-8 py-0 focus-visible:ring-amber-500 text-sm font-medium border-slate-200"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            value={slab.platformFee}
                                                            onChange={(e) => handleSlabChange(index, "platformFee", e.target.value)}
                                                            className="h-8 py-0 focus-visible:ring-amber-500 text-sm font-medium border-slate-200"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            value={slab.percentage}
                                                            onChange={(e) => handleSlabChange(index, "percentage", e.target.value)}
                                                            className="h-8 py-0 focus-visible:ring-amber-500 text-sm font-medium border-slate-200"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveSlab(index)}
                                                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {slabs.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                                        No custom slabs defined. Using global defaults.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-4 py-3 bg-amber-50/30 border-t border-amber-100/50">
                                    <p className="text-[11px] leading-relaxed text-amber-700/70 font-medium">
                                        Commission tiers help define different platform fees based on order value. Leave Max empty for the highest tier.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-lg">Seller Details</CardTitle>
                                <CardDescription>Personal contact information.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sellerName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="sellerName"
                                            name="sellerName"
                                            className="pl-10"
                                            value={formData.sellerName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            className="pl-10"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            className="pl-10"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Update Seller
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11"
                                onClick={() => router.push("/admin/sellers")}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

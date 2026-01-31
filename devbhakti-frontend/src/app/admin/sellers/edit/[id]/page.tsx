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
    Clock
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
import { fetchSellerByIdAdmin, updateSellerAdmin } from "@/api/adminController";

export default function EditSellerPage() {
    const router = useRouter();
    const { id } = useParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState({
        storeName: "",
        sellerName: "",
        email: "",
        phone: "",
        status: "",
        address: "",
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
            });
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value: string) => {
        setFormData(prev => ({ ...prev, status: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateSellerAdmin(id as string, formData);
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

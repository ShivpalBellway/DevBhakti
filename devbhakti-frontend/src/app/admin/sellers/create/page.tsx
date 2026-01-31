"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Store,
    User,
    Mail,
    Phone,
    MapPin,
    Save,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createSellerAdmin } from "@/api/adminController";

export default function CreateSellerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        storeName: "",
        sellerName: "",
        email: "",
        phone: "",
        address: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            await createSellerAdmin(formData);
            toast({
                title: "Success",
                description: "Seller created successfully",
            });
            router.push("/admin/sellers");
        } catch (error: any) {
            console.error("Create Seller Error:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create seller",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Seller</h1>
                    <p className="text-muted-foreground">Onboard a new seller to the marketplace.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle className="text-lg">Store Information</CardTitle>
                                <CardDescription>Basic details about the seller's storefront.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="storeName">Store Name</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="storeName"
                                            name="storeName"
                                            placeholder="e.g. Sacred Items Store"
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
                                            placeholder="Enter the full business address"
                                            className="pl-10 min-h-[100px]"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
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
                                            placeholder="e.g. Rajesh Kumar"
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
                                            placeholder="rajesh@example.com"
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
                                            placeholder="+91 XXXXX XXXXX"
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
                                        Create Seller
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

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Store,
    User,
    Mail,
    Phone,
    MapPin,
    Save,
    Loader2,
    IndianRupee,
    Plus,
    Trash2,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createSellerAdmin, fetchCommissionSlabsAdmin } from "@/api/adminController";
import { checkSellerPhone, checkEmailExists } from "@/api/authController";

// ---------- inline field validation state type ----------
type FieldStatus = "idle" | "checking" | "ok" | "error";

interface FieldValidation {
    status: FieldStatus;
    message: string;
}

export default function CreateSellerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [slabs, setSlabs] = useState<any[]>([]);

    const [phoneValidation, setPhoneValidation] = useState<FieldValidation>({ status: "idle", message: "" });
    const [emailValidation, setEmailValidation] = useState<FieldValidation>({ status: "idle", message: "" });

    useEffect(() => {
        loadDefaultSlabs();
    }, []);

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

    const [formData, setFormData] = useState({
        storeName: "",
        sellerName: "",
        email: "",
        phone: "",
        address: "",
        productCommissionRate: "10.0",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset validation when user types again
        if (name === "phone") setPhoneValidation({ status: "idle", message: "" });
        if (name === "email") setEmailValidation({ status: "idle", message: "" });
    };

    // -------- Phone blur: check if already registered as SELLER only --------
    const handlePhoneBlur = useCallback(async () => {
        const rawPhone = formData.phone.replace(/\D/g, "");
        if (!rawPhone || rawPhone.length < 10) return;

        setPhoneValidation({ status: "checking", message: "" });
        try {
            const result = await checkSellerPhone(rawPhone);
            if (result.isSellerRegistered) {
                // ❌ Already a SELLER with this number — block
                setPhoneValidation({
                    status: "error",
                    message: "This number is already registered as a Seller. Please use a different number.",
                });
            } else {
                // ✅ Not a SELLER (could be not_found or wrong_role) — allow
                setPhoneValidation({ status: "ok", message: "Number is available." });
            }
        } catch {
            setPhoneValidation({ status: "idle", message: "" });
        }
    }, [formData.phone]);

    // -------- Email blur: check if already registered as SELLER only --------
    const handleEmailBlur = useCallback(async () => {
        const emailVal = formData.email.trim();
        if (!emailVal || !emailVal.includes("@")) return;

        setEmailValidation({ status: "checking", message: "" });
        try {
            const result = await checkEmailExists(emailVal);
            if (result.exists && result.role === "SELLER") {
                // ❌ Already a SELLER with this email — block
                setEmailValidation({
                    status: "error",
                    message: "This email is already registered as a Seller. Please use a different email.",
                });
            } else {
                // ✅ Not a SELLER (not found or other role) — allow
                setEmailValidation({ status: "ok", message: "Email is available." });
            }
        } catch {
            setEmailValidation({ status: "idle", message: "" });
        }
    }, [formData.email]);

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

        // Block submit if phone or email validation shows error
        if (phoneValidation.status === "error" || emailValidation.status === "error") {
            toast({
                title: "Validation Error",
                description: "Please fix the errors before submitting.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            await createSellerAdmin({
                ...formData,
                commissionSlabs: slabs
            });
            toast({
                title: "Success",
                description: "Seller created successfully",
            });
            router.push("/admin/sellers");
        } catch (error: any) {
            console.error("Create Seller Error:", error);
            const message = error.response?.data?.message || "Failed to create seller";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to render inline validation feedback
    const renderFieldFeedback = (validation: FieldValidation) => {
        if (validation.status === "idle") return null;
        if (validation.status === "checking") {
            return (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking...
                </p>
            );
        }
        if (validation.status === "error") {
            return (
                <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {validation.message}
                </p>
            );
        }
        if (validation.status === "ok") {
            return (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {validation.message}
                </p>
            );
        }
        return null;
    };

    const hasValidationError = phoneValidation.status === "error" || emailValidation.status === "error";

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

                        <Card className="border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100 pb-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                                            <IndianRupee className="w-5 h-5 text-amber-600" />
                                            Marketplace Commission Slabs
                                        </CardTitle>
                                        <CardDescription className="text-amber-800/70">Define multi-tier commission structures.</CardDescription>
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
                                            placeholder="e.g. Rajesh Kumar"
                                            className="pl-10"
                                            value={formData.sellerName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email field with inline validation */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                                            emailValidation.status === "error" ? "text-red-400" :
                                            emailValidation.status === "ok" ? "text-emerald-400" :
                                            "text-slate-400"
                                        }`} />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="rajesh@example.com"
                                            className={`pl-10 transition-colors ${
                                                emailValidation.status === "error"
                                                    ? "border-red-300 focus-visible:ring-red-200"
                                                    : emailValidation.status === "ok"
                                                    ? "border-emerald-300 focus-visible:ring-emerald-200"
                                                    : ""
                                            }`}
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={handleEmailBlur}
                                            required
                                        />
                                    </div>
                                    {renderFieldFeedback(emailValidation)}
                                </div>

                                {/* Phone field with inline validation */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                                            phoneValidation.status === "error" ? "text-red-400" :
                                            phoneValidation.status === "ok" ? "text-emerald-400" :
                                            "text-slate-400"
                                        }`} />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="+91 XXXXX XXXXX"
                                            className={`pl-10 transition-colors ${
                                                phoneValidation.status === "error"
                                                    ? "border-red-300 focus-visible:ring-red-200"
                                                    : phoneValidation.status === "ok"
                                                    ? "border-emerald-300 focus-visible:ring-emerald-200"
                                                    : ""
                                            }`}
                                            value={formData.phone}
                                            onChange={handleChange}
                                            onBlur={handlePhoneBlur}
                                            required
                                        />
                                    </div>
                                    {renderFieldFeedback(phoneValidation)}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Show banner if any field has error */}
                        {hasValidationError && (
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>
                                    This phone number or email is already registered in our system.
                                    Please use a <strong>different number or email</strong> to create a new seller account.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-semibold"
                                disabled={isLoading || hasValidationError || phoneValidation.status === "checking" || emailValidation.status === "checking"}
                            >
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

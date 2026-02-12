"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Save, ArrowLeft, Building2, CreditCard, User, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { fetchSellerProfile, updateSellerProfile } from "@/api/sellerController";

export default function BankDetailsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [verificationPending, setVerificationPending] = useState(false);

    const [formData, setFormData] = useState({
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        upiId: ""
    });

    useEffect(() => {
        loadBankDetails();
    }, []);

    const loadBankDetails = async () => {
        try {
            const response = await fetchSellerProfile();
            if (response.success && response.data) {
                const data = response.data;
                const store = data;

                // Assuming the backend returns verificationPending inside the seller profile object 
                // (which we modified getSellerProfile to do)
                setVerificationPending(!!store.verificationPending);

                setFormData({
                    accountHolderName: store.accountHolderName || "",
                    accountNumber: store.accountNumber || "",
                    ifscCode: store.ifscCode || "",
                    bankName: store.bankName || "",
                    upiId: store.upiId || ""
                });
            }
        } catch (error) {
            console.error("Failed to load bank details", error);
            // Don't show error toast on initial load if just empty
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "ifscCode" ? value.toUpperCase() : value
        }));
    };

    const handleSave = async () => {
        if (!formData.accountHolderName || !formData.accountNumber || !formData.ifscCode || !formData.bankName) {
            toast({
                title: "Missing Information",
                description: "Please fill in all the required fields.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);

        try {
            // Create FormData object as expected by the API
            const data = new FormData();
            data.append('bankName', formData.bankName);
            data.append('accountNumber', formData.accountNumber);
            data.append('accountHolderName', formData.accountHolderName);
            data.append('ifscCode', formData.ifscCode);
            if (formData.upiId) data.append('upiId', formData.upiId);

            const response = await updateSellerProfile(data);

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message || "Bank details submitted for verification.",
                });

                if (response.pendingApproval) {
                    setVerificationPending(true);
                }
            } else {
                throw new Error(response.message || 'Failed to save');
            }
        } catch (error: any) {
            console.error("Save Error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save bank details",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#794A05]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-[#794A05]" />
                        Bank Account Details
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Manage your bank account for receiving payouts.
                    </p>
                </div>
            </div>

            {verificationPending && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="bg-amber-100 p-2 rounded-full">
                        <Clock className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-amber-800">Verification Pending</h3>
                        <p className="text-amber-700/80 mt-1">
                            You have submitted changes to your bank details. These are currently under review by our admin team.
                            You cannot make further changes until this request is processed.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6 pt-8 px-8">
                            <CardTitle className="text-base font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#794A05]" />
                                Primary Account
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500 mt-1">
                                This account will be used for all settlement payouts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Account Holder Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        name="accountHolderName"
                                        value={formData.accountHolderName}
                                        onChange={handleChange}
                                        disabled={verificationPending}
                                        placeholder="e.g. Rahul Kumar"
                                        className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        disabled={verificationPending}
                                        placeholder="e.g. 12345678901234"
                                        className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono font-bold text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">IFSC Code</label>
                                    <div className="relative">
                                        <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            name="ifscCode"
                                            value={formData.ifscCode}
                                            onChange={handleChange}
                                            disabled={verificationPending}
                                            placeholder="HDFC0001234"
                                            className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono uppercase font-bold text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                                    <Input
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        disabled={verificationPending}
                                        placeholder="e.g. HDFC Bank"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-slate-100 pt-6">
                                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">UPI ID (Optional)</label>
                                <Input
                                    name="upiId"
                                    value={formData.upiId}
                                    onChange={handleChange}
                                    disabled={verificationPending}
                                    placeholder="e.g. rahul@upi"
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || verificationPending}
                            className="bg-[#794A05] hover:bg-[#5D3804] text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-[#794A05]/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : verificationPending ? "Validation Pending" : "Save Bank Details"}
                        </Button>
                    </div>
                </div>

                {/* Info / Preview Section */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg rounded-[2rem] bg-gradient-to-br from-[#794A05] to-[#5D3804] text-white">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <Landmark className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Linked Account</p>
                                    <p className="font-serif font-bold text-lg">
                                        {formData.bankName || "No Bank Added"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Account Holder</p>
                                    <p className="font-bold tracking-wide">{formData.accountHolderName || "---"}</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Account Number</p>
                                    <p className="font-mono font-bold tracking-wider">{formData.accountNumber || "---"}</p>
                                </div>
                                {formData.upiId && (
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">UPI ID</p>
                                        <p className="font-bold tracking-wide">{formData.upiId}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-amber-50 rounded-[1.5rem] p-6 border border-amber-100 flex gap-4">
                        <AlertCircle className="w-5 h-5 text-[#794A05] flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-[#794A05] mb-1">Important Note</p>
                            <p className="text-xs text-[#794A05]/80 font-medium leading-relaxed">
                                Please ensure that the bank account details provided are correct. DevBhakti is not responsible for payouts made to incorrect accounts.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

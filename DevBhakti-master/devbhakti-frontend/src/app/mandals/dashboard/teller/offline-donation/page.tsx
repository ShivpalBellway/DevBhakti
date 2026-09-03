"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Heart,
    User,
    Phone,
    Mail,
    X,
    IndianRupee,
    MapPin,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Printer,
    Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalProfile, createMandalDonation } from "@/api/mandalAdminController";
import { parseLocalizedValue } from "@/utils/textUtils";
import { generateReceiptHTML } from "@/utils/donationReceipt";

export default function MandalOfflineDonationPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [mandalId, setMandalId] = useState<string | null>(null);
    const [mandalName, setMandalName] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [createdDonation, setCreatedDonation] = useState<any>(null);

    // Form fields
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [donorName, setDonorName] = useState("");
    const [donorPhone, setDonorPhone] = useState("");
    const [donorEmail, setDonorEmail] = useState("");
    const [address, setAddress] = useState("");
    const [message, setMessage] = useState("");
    const [panNumber, setPanNumber] = useState("");

    const amountPresets = [101, 501, 1001, 2101, 5001, 11001];

    const sanitizePhone = (phone: string) => phone.replace(/\D/g, "").slice(0, 11);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await fetchMandalProfile();
                if (profile.success && profile.data.id) {
                    setMandalId(profile.data.id);
                    setMandalName(parseLocalizedValue(profile.data.name, "en") || "Mandal");
                }
            } catch (error) {
                console.error("Load Profile Error:", error);
            }
        };
        loadProfile();
    }, []);

    const resetForm = () => {
        setAmount("");
        setPaymentMethod("CASH");
        setDonorName("");
        setDonorPhone("");
        setDonorEmail("");
        setAddress("");
        setMessage("");
        setPanNumber("");
    };

    const handleSubmit = async () => {
        if (!amount || Number(amount) <= 0) {
            toast({ title: "Validation Error", description: "Please enter a valid donation amount.", variant: "destructive" });
            return;
        }
        if (!donorName.trim() || !donorPhone.trim()) {
            toast({ title: "Validation Error", description: "Please fill donor name and phone.", variant: "destructive" });
            return;
        }
        if (!/^\d{10,11}$/.test(donorPhone.trim())) {
            toast({ title: "Validation Error", description: "Please enter a 10 or 11 digit phone number.", variant: "destructive" });
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                amount: Number(amount),
                donorName: donorName.trim(),
                donorPhone: donorPhone.trim(),
                donorEmail: donorEmail.trim() || undefined,
                panNumber: panNumber.trim() || undefined,
                address: address.trim() || undefined,
                message: message.trim() || undefined,
                paymentMethod,
                status: "SUCCESS",
                donationType: "OFFLINE",
            };

            const response = await createMandalDonation(payload);
            if (response.success) {
                setCreatedDonation(response.data);
                setIsComplete(true);
                toast({ title: "Donation Recorded", description: "Offline donation entry saved successfully.", variant: "success" });
            } else {
                toast({ title: "Error", description: response.message || "Could not save donation.", variant: "destructive" });
            }
        } catch (error: any) {
            console.error("Create Donation Error:", error);
            toast({ title: "Error", description: error?.message || "Failed to create donation.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintReceipt = () => {
        if (!createdDonation) return;
        const html = generateReceiptHTML({
            ...createdDonation,
            templeName: mandalName || "Mandal",
        });
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    const handleNewDonation = () => {
        resetForm();
        setIsComplete(false);
        setCreatedDonation(null);
    };

    // ─── Success Screen ────────────────────────────────────────
    if (isComplete && createdDonation) {
        return (
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <div className="text-center space-y-4 py-8">
                    <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900">
                        Donation Recorded Successfully!
                    </h1>
                    <p className="text-muted-foreground">
                        Offline donation of <span className="font-bold text-emerald-700">₹{Number(createdDonation.amount).toLocaleString()}</span> from <span className="font-semibold">{createdDonation.donorName}</span> has been recorded.
                    </p>
                </div>

                <Card className="border-none shadow-sm rounded-2xl">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Donor</p>
                                <p className="font-semibold">{createdDonation.donorName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Phone</p>
                                <p className="font-semibold">{createdDonation.donorPhone}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Amount</p>
                                <p className="font-bold text-emerald-700">₹{Number(createdDonation.amount).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Payment</p>
                                <Badge variant="outline" className="capitalize">{createdDonation.paymentMethod?.toLowerCase()}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={handlePrintReceipt} variant="outline" className="rounded-xl h-12 border-slate-300 hover:bg-slate-50">
                        <Printer className="w-4 h-4 mr-2" /> Print Receipt
                    </Button>
                    <Button onClick={handlePrintReceipt} variant="outline" className="rounded-xl h-12 border-slate-300 hover:bg-slate-50">
                        <Printer className="w-4 h-4 mr-2" /> Download Receipt
                    </Button>
                </div>

                <Button onClick={handleNewDonation} className="w-full bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl h-12">
                    <Heart className="w-4 h-4 mr-2" /> Record Another Donation
                </Button>
            </div>
        );
    }

    // ─── Form Screen ───────────────────────────────────────────
    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-serif text-slate-900">Offline Donation Entry</h1>
                    <p className="text-sm text-muted-foreground">
                        Record an offline donation for {mandalName || "your mandal"}
                    </p>
                </div>
            </div>

            {/* Amount Section */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#7b4623]/5 to-amber-50 border-b">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b4623] flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" /> Donation Amount
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <Input
                        type="number"
                        placeholder="Enter amount (₹)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-14 text-2xl font-bold text-center border-2 border-slate-200 rounded-xl focus:border-[#7b4623]"
                    />
                    <div className="flex flex-wrap gap-2 justify-center">
                        {amountPresets.map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAmount(val.toString())}
                                className={cn(
                                    "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                                    amount === val.toString()
                                        ? "bg-[#7b4623] border-[#7b4623] text-white"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-[#7b4623]/50"
                                )}
                            >
                                ₹{val.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                        Payment Method
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {["CASH", "UPI", "CARD", "CHEQUE", "BANK"].map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={cn(
                                    "rounded-xl border px-3 py-3 text-sm font-semibold transition-all capitalize",
                                    paymentMethod === method
                                        ? "bg-[#7b4623] border-[#7b4623] text-white shadow-md"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-[#7b4623]/40"
                                )}
                            >
                                {method === "BANK" ? "Bank Transfer" : method.charAt(0) + method.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Donor Information */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <User className="w-4 h-4" /> Donor Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Full Name *</label>
                            <Input
                                placeholder="Donor's full name"
                                value={donorName}
                                onChange={(e) => setDonorName(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Phone *</label>
                            <Input
                                placeholder="10-digit phone number"
                                value={donorPhone}
                                onChange={(e) => setDonorPhone(sanitizePhone(e.target.value))}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Email</label>
                            <Input
                                placeholder="Email (optional)"
                                value={donorEmail}
                                onChange={(e) => setDonorEmail(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">PAN Number</label>
                            <Input
                                placeholder="PAN (optional)"
                                value={panNumber}
                                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Address</label>
                        <Input
                            placeholder="Address (optional)"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Message / Purpose</label>
                        <Textarea
                            placeholder="Purpose of donation (optional)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="rounded-xl min-h-[80px]"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !amount || !donorName || !donorPhone}
                className="w-full h-14 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl text-lg font-bold shadow-lg"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Recording...
                    </>
                ) : (
                    <>
                        <Heart className="w-5 h-5 mr-2" /> Record Donation — ₹{Number(amount || 0).toLocaleString()}
                    </>
                )}
            </Button>
        </div>
    );
}

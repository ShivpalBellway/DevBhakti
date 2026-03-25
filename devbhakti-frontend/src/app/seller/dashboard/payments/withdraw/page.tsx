"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    IndianRupee,
    ArrowLeft,
    TrendingUp,
    AlertCircle,
    Wallet,
    Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fetchSellerFinanceSummary, requestSellerWithdrawal, fetchSellerProfile } from "@/api/sellerController";
import { isPayoutAllowed, nextPayoutDate } from "@/utils/payoutSchedule";

export default function SellerWithdrawPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState({
        availableBalance: 0,
        pendingBalance: 0,
    });
    const [bankDetails, setBankDetails] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, profileRes] = await Promise.all([
                fetchSellerFinanceSummary(),
                fetchSellerProfile()
            ]);

            if (summaryRes.success) setSummary(summaryRes.data);

            if (profileRes.success && profileRes.data) {
                const profile = profileRes.data;
                if (profile.bankName && profile.accountNumber) {
                    setBankDetails({
                        bankName: profile.bankName,
                        accountNumber: profile.accountNumber,
                        accountHolderName: profile.accountHolderName,
                        ifscCode: profile.ifscCode,
                        upiId: profile.upiId
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load finance data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdrawal = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid transfer amount.", variant: "destructive" });
            return;
        }

        if (parseFloat(withdrawAmount) > summary.availableBalance) {
            toast({ title: "Insufficient Funds", description: "Amount exceeds available balance.", variant: "destructive" });
            return;
        }

        if (!bankDetails) {
            toast({
                title: "Bank Details Missing",
                description: "Please go to 'Bank Details' in sidebar to set up your account.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await requestSellerWithdrawal({
                amount: parseFloat(withdrawAmount),
                bankDetails: bankDetails
            });

            if (res.success) {
                toast({ title: "Request Submitted", description: "Your payout request is being processed." });
                setWithdrawAmount("");
                loadData(); // Reload data to update balance
            }
        } catch (error: any) {
            toast({
                title: "Request Failed",
                description: error.response?.data?.message || "Internal server error",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#794A05]/10 flex items-center justify-center mb-4">
                            <Wallet className="w-8 h-8 text-[#794A05]" />
                        </div>
                        <h1 className="text-2xl font-serif font-bold text-slate-900">
                            Request Payout
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Transfer your earnings to your bank account safely.
                        </p>
                    </div>
                </div>

                <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                    <div className="bg-[#794A05] h-2 w-full" />
                    <CardHeader className="pt-8 px-8 pb-0">
                        <CardTitle className="flex items-center justify-between">
                            <span className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Available Balance</span>
                            <div className="w-10 h-10 rounded-full bg-[#794A05]/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-[#794A05]" />
                            </div>
                        </CardTitle>
                        <div className="mt-2">
                            <span className="text-4xl font-extrabold text-slate-900 flex items-center gap-1">
                                <IndianRupee className="w-6 h-6 text-slate-300" />
                                {summary.availableBalance.toLocaleString()}
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        {/* Amount Input */}
                        <div className="space-y-4">
                            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-widest pl-1">Withdrawal Amount</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">₹</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="h-20 pl-12 rounded-[1.5rem] border-slate-100 bg-slate-50 focus:bg-white focus:border-[#794A05] focus:ring-[#794A05]/10 text-3xl font-extrabold transition-all"
                                />
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[11px] text-slate-400 font-bold italic">Min. transfer: ₹500</p>
                                <button
                                    onClick={() => setWithdrawAmount(summary.availableBalance.toString())}
                                    className="text-[11px] font-extrabold text-[#794A05] uppercase hover:underline tracking-wider"
                                >
                                    Withdraw Full Amount
                                </button>
                            </div>
                        </div>

                        {/* Bank Info Display */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                                <Landmark className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide truncate">
                                    {bankDetails ? bankDetails.bankName : "No Account Linked"}
                                </p>
                                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                    {bankDetails ? bankDetails.accountHolderName : "Please add bank details"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {bankDetails ?
                                        `${bankDetails.ifscCode} • ${bankDetails.accountNumber.slice(-4).padStart(bankDetails.accountNumber.length, '•')}`
                                        : "---"}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => router.push("/seller/dashboard/payments/bank-details")}
                                className="text-[10px] uppercase font-bold text-[#794A05] hover:bg-[#794A05]/5 shrink-0"
                            >
                                {bankDetails ? "Change" : "Add"}
                            </Button>
                        </div>

                        {/* Info Alert */}
                        {!isPayoutAllowed() ? (
                            <div className="flex gap-4 p-5 bg-orange-50 rounded-2xl border border-orange-100/50">
                                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                                <p className="text-xs text-orange-700 font-bold leading-relaxed">
                                    Payouts are only allowed on the 15th and 28th of each month.
                                    The next payout window opens on {nextPayoutDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.
                                </p>
                            </div>
                        ) : (
                            <div className="flex gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100/50">
                                <AlertCircle className="w-5 h-5 text-[#794A05] flex-shrink-0" />
                                <p className="text-xs text-[#794A05] font-bold leading-relaxed">
                                    Payout window is currently open (15th / 28th).
                                    Requests will be processed within 24 hours.
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={handleWithdrawal}
                            disabled={isSubmitting || summary.availableBalance <= 0 || !isPayoutAllowed()}
                            className="w-full bg-[#794A05] hover:bg-[#5D3804] text-white rounded-xl h-14 font-bold text-lg shadow-xl shadow-[#794A05]/20 gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowDownToLine,
    IndianRupee,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Wallet,
    TrendingUp,
    FileText,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSellerFinanceSummary, fetchSellerFinanceLedger, requestSellerWithdrawal } from "@/api/sellerController";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SellerWithdrawalsPage() {
    const { toast } = useToast();
    const [summary, setSummary] = useState<any>(null);
    const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, ledgerRes] = await Promise.all([
                fetchSellerFinanceSummary(),
                fetchSellerFinanceLedger()
            ]);

            if (summaryRes.success) setSummary(summaryRes.data);
            if (ledgerRes.success) {
                // Filter ledger for withdrawal history entries
                setWithdrawHistory(ledgerRes.data.filter((e: any) => e.type === "WITHDRAWAL"));
            }
        } catch (error) {
            console.error("Failed to load withdrawal data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdrawalRequest = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
            return;
        }

        if (amount > (summary?.availableBalance || 0)) {
            toast({ title: "Insufficient Balance", description: "You don't have enough available balance.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await requestSellerWithdrawal({
                amount,
                bankDetails: { type: "Default Registered Account" }
            });

            if (res.success) {
                toast({ title: "Success", description: "Your payout request has been submitted successfully." });
                setIsWithdrawModalOpen(false);
                setWithdrawAmount("");
                loadData();
            }
        } catch (error: any) {
            toast({ title: "Request Failed", description: error.response?.data?.message || "Internal server error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <ArrowDownToLine className="w-10 h-10 animate-pulse text-[#794A05]" />
                <p className="text-[#794A05] font-serif italic animate-pulse">Syncing Payout Status...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Payouts & Withdrawals</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your earnings and transfer funds to your bank account.</p>
                </div>
                <Button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="bg-[#794A05] hover:bg-[#5D3804] text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-[#794A05]/20 gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Withdrawal
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="w-16 h-16" />
                    </div>
                    <CardHeader>
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Current Available</CardDescription>
                        <CardTitle className="text-3xl font-black flex items-center gap-1">
                            <IndianRupee className="w-6 h-6 text-slate-500" />
                            {summary?.availableBalance?.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-400 font-medium italic">Ready for immediate transfer to your linked account.</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[2rem] border border-slate-100 relative group">
                    <CardHeader>
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing / Pending</CardDescription>
                        <CardTitle className="text-3xl font-black text-[#794A05] flex items-center gap-1">
                            <IndianRupee className="w-6 h-6 text-[#794A05]/40" />
                            {summary?.processingWithdrawals?.toLocaleString() || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <p className="text-[10px] text-amber-600 font-black uppercase tracking-tight">Requires Admin Approval</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[2rem] border border-slate-100 relative group">
                    <CardHeader>
                        <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Settled In Escrow</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-400 flex items-center gap-1">
                            <IndianRupee className="w-6 h-6 text-slate-300" />
                            {summary?.inEscrow?.toLocaleString() || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tight">Confirmed Revenue • On Hold</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Withdrawal Table */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 p-8">
                    <CardTitle className="text-xl font-bold font-serif flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[#794A05]" />
                        Transaction History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Ref</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {withdrawHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">
                                            No withdrawal history found.
                                        </td>
                                    </tr>
                                ) : (
                                    withdrawHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-slate-900 uppercase">#{item.id.slice(-8)}</p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Network Transfer</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-slate-600">{format(new Date(item.createdAt), "dd MMM, yyyy")}</p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{format(new Date(item.createdAt), "hh:mm a")}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-base font-black text-[#794A05]">₹{Math.abs(item.amount).toLocaleString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge className={
                                                    item.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase text-[9px]" :
                                                        item.status === 'CANCELLED' ? "bg-red-50 text-red-700 border-red-100 font-black uppercase text-[9px]" :
                                                            "bg-amber-50 text-amber-700 border-amber-100 font-black uppercase text-[9px]"
                                                }>
                                                    {item.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <Wallet className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-700">Stored Bank Account</p>
                                                        <p className="text-[9px] text-slate-400 tracking-widest uppercase font-medium">**********4582</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Withdrawal Dialog */}
            <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-[2rem] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black font-serif text-slate-900">Transfer Funds</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Withdraw your available balance to your registered bank account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="p-4 rounded-2xl bg-[#794A05]/5 border border-[#794A05]/10 flex flex-col items-center">
                            <span className="text-[10px] uppercase font-black text-[#794A05] tracking-widest mb-1">Available for Payout</span>
                            <h2 className="text-3xl font-black text-[#794A05]">₹{summary?.availableBalance?.toLocaleString()}</h2>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Transfer Amount</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl text-xl font-black focus:ring-[#794A05]"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold italic ml-1">* Payouts are usually processed within 24-48 working hours.</p>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between gap-4">
                        <Button variant="ghost" onClick={() => setIsWithdrawModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                        <Button
                            onClick={handleWithdrawalRequest}
                            disabled={isSubmitting}
                            className="bg-[#794A05] hover:bg-[#5D3804] text-white rounded-xl h-12 px-8 font-black shadow-lg shadow-[#794A05]/20 flex-1"
                        >
                            {isSubmitting ? "Processing..." : "Confirm Transfer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

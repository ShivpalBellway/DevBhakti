"use client";

import React, { useState, useEffect } from "react";
import {
    IndianRupee,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    History,
    Wallet,
    Search,
    Download,
    CheckCircle2,
    AlertCircle,
    Info,
    Filter
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    fetchSellerFinanceSummary,
    fetchSellerFinanceLedger,
    requestSellerWithdrawal
} from "@/api/sellerController";
import { useToast } from "@/hooks/use-toast";

<<<<<<< HEAD
import { useRouter } from "next/navigation";

export default function SellerPaymentsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
=======
export default function SellerPaymentsPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
    const [isLoading, setIsLoading] = useState(true);

    const [summary, setSummary] = useState({
        totalEarnings: 0,
        totalCommission: 0,
        netEarnings: 0,
        availableBalance: 0,
        inEscrow: 0,
        pendingBalance: 0,
        activeOrdersCount: 0,
        processingWithdrawals: 0
    });

    const [ledger, setLedger] = useState<any[]>([]);
<<<<<<< HEAD
=======
    // ... (omitting intermediate code for brevity, will provide in actual replacement)
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3

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
            if (ledgerRes.success) setLedger(ledgerRes.data);
        } catch (error) {
            console.error("Failed to load finance data", error);
        } finally {
            setIsLoading(false);
        }
    };

<<<<<<< HEAD
=======
    const handleWithdrawal = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid transfer amount.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await requestSellerWithdrawal({
                amount: parseFloat(withdrawAmount),
                bankDetails: { type: "Default Store Account" }
            });

            if (res.success) {
                toast({ title: "Request Submitted", description: "Your payout request is being processed." });
                setIsWithdrawModalOpen(false);
                setWithdrawAmount("");
                loadData();
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

>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
    const filteredLedger = ledger.filter(entry =>
        (entry.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

<<<<<<< HEAD
=======
    // if (isLoading) {
    //     return (
    //         <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    //             <IndianRupee className="w-10 h-10 animate-pulse text-[#794A05]" />
    //             <p className="text-[#794A05] font-serif font-bold italic tracking-wider">Syncing Ledger...</p>
    //         </div>
    //     );
    // }

>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-[#794A05]" />
<<<<<<< HEAD
                        Earnings & Settlements
=======
                        Financial Overview
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Monitor your marketplace revenue, platform commissions, and manage store payouts.
                    </p>
                </div>
                <Button
<<<<<<< HEAD
                    onClick={() => router.push("/seller/dashboard/payments/withdraw")}
=======
                    onClick={() => setIsWithdrawModalOpen(true)}
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                    className="bg-[#794A05] hover:bg-[#5D3804] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-[#794A05]/20 gap-2 transition-all active:scale-95"
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Request Payout
                </Button>
            </div>

            {/* Premium Stats Cards */}
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
<<<<<<< HEAD
                    <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[1.5rem] overflow-hidden relative group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Gross Sales</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-500 cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 text-white border-slate-700 text-[12px]">Total value of all orders before any deductions.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-slate-400" strokeWidth={3} />
=======
                    <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[1.5rem] overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Lifetime Revenue</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-500" /></TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 text-white border-slate-700">Total value of all orders before commission.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-slate-400" />
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                                {summary.totalEarnings.toLocaleString()}
                            </h2>
                        </CardContent>
                    </Card>

<<<<<<< HEAD
                    <Card className="border-none shadow-xl bg-red-50 text-red-900 rounded-[1.5rem] overflow-hidden border border-red-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-red-400 font-bold uppercase tracking-widest text-[10px]">Total Commission Paid</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-red-300 cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-red-100 text-[12px]">Total administrative fee paid to DevBhakti platform.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-red-600 flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-red-400" strokeWidth={3} />
=======
                    <Card className="border-none shadow-xl bg-red-50 text-red-900 rounded-[1.5rem] border border-red-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-red-400 font-bold uppercase tracking-widest text-[10px]">Platform Fees</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-red-300" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-red-100">Total commissions processed by DevBhakti.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-red-600 flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-red-300" />
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                                {summary.totalCommission.toLocaleString()}
                            </h2>
                        </CardContent>
                    </Card>

<<<<<<< HEAD
                    <Card className="border-none shadow-xl bg-white rounded-[1.5rem] overflow-hidden border border-slate-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Net Balance (Ready)</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-300 cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-slate-200 text-[12px]">Funds available for withdrawal after commission and 3-day escrow.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-[#794A05] flex items-center gap-1">
                                <IndianRupee className="w-6 h-6 text-[#794A05] opacity-80" strokeWidth={3} />
=======
                    <Card className="border-none shadow-xl bg-white rounded-[1.5rem] border border-slate-100 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#794A05]/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Available for Payout</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-300" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-slate-200">Net balance available for immediate withdrawal.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-[#794A05] flex items-center gap-1">
                                <IndianRupee className="w-6 h-6 text-[#794A05]/70" />
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                                {summary.availableBalance.toLocaleString()}
                            </h2>
                        </CardContent>
                    </Card>

<<<<<<< HEAD
                    <Card className="border-none shadow-xl bg-white rounded-[1.5rem] overflow-hidden border border-slate-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">In Settlement</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-300 cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-slate-200 text-[12px]">Orders delivered but within 3-day hold period for potential returns/disputes.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-600 flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
                                {summary.inEscrow.toLocaleString()}
                            </h2>
                            <p className="text-[8px] text-amber-600 font-bold mt-1 uppercase">3-day period</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white rounded-[1.5rem] overflow-hidden border border-slate-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Pending Fulfillment</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-300 cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-slate-200 text-[12px]">Revenue from orders that are yet to be shipped or delivered.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-400 flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
                                {summary.pendingBalance.toLocaleString()}
                            </h2>
=======
                    <Card className="border-none shadow-xl bg-white rounded-[1.5rem] border border-slate-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Under Settlement</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-300" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-slate-200">Delivered orders within the 3-day verification hold.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-600 flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-slate-400" />
                                {summary.inEscrow.toLocaleString()}
                            </h2>
                            <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase tracking-tighter flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> 3-day cooling
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white rounded-[1.5rem] border border-slate-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Active Orders</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-300" /></TooltipTrigger>
                                    <TooltipContent className="bg-white text-slate-900 border-slate-200">Current orders in processing status.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                {summary.activeOrdersCount || 0}
                                <span className="text-xs text-slate-300 font-medium">Orders</span>
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter flex items-center gap-1">
                                <IndianRupee className="w-2.5 h-2.5" /> {summary.pendingBalance.toLocaleString()} Pending
                            </p>
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                        </CardContent>
                    </Card>
                </div>
            </TooltipProvider>

<<<<<<< HEAD
            {/* Processing Payouts Info (If any) */}
            {summary.processingWithdrawals > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-2xl">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Payout in Progress</h4>
                            <p className="text-xs text-slate-500 font-medium">₹{summary.processingWithdrawals.toLocaleString()} is currently being processed by our finance team.</p>
                        </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-none font-bold">LOCKED</Badge>
                </div>
            )}

=======
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
            {/* Search and Ledger section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-[#794A05]" />
                        <h3 className="text-xl font-serif font-bold text-slate-900">Transaction History</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by description or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-[#794A05]/10"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

<<<<<<< HEAD
                <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white premium-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Date / Description</th>
                                    <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Type</th>
                                    <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Status</th>
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Gross</th>
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Commission</th>
                                    <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Net Earning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLedger.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <History className="w-12 h-12 opacity-20" />
                                                <p className="font-bold uppercase tracking-widest text-[10px]">No transactions recorded yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLedger.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 pl-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {format(new Date(entry.createdAt), "dd MMM, yyyy")}
                                                    </span>
                                                    <span className="text-sm font-extrabold text-slate-900">{entry.description}</span>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold border-slate-200 text-slate-600 bg-slate-50">
                                                    {entry.type.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="py-6 text-center">
                                                <Badge className={cn(
                                                    "rounded-full px-3 py-1 text-[10px] font-bold border",
                                                    entry.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                        entry.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                            "bg-red-50 text-red-700 border-red-200"
                                                )}>
                                                    {entry.status}
                                                </Badge>
                                            </td>
                                            <td className="py-6 text-right">
                                                <span className="text-xs font-bold text-slate-500">
                                                    {entry.grossAmount > 0 ? `₹${entry.grossAmount.toLocaleString()}` : "-"}
                                                </span>
                                            </td>
                                            <td className="py-6 text-right">
                                                <span className="text-xs font-bold text-red-400">
                                                    {entry.commission > 0 ? `-₹${entry.commission.toLocaleString()}` : "-"}
                                                </span>
                                            </td>
                                            <td className="py-6 pr-8 text-right">
                                                <span className={cn(
                                                    "text-base font-extrabold",
                                                    entry.amount < 0 ? "text-red-600" : "text-emerald-700"
                                                )}>
                                                    {entry.amount < 0 ? "-" : "+"}
                                                    ₹{Math.abs(entry.amount).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
=======
                <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
                    <div className="overflow-x-auto lg:overflow-x-hidden hover:overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Reference / Date</th>
                                    <th className="py-5 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="py-5 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group cursor-help">
                                        Gross <span className="text-[8px] group-hover:inline ml-1 hidden">(₹)</span>
                                    </th>
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        Comm. <span className="text-[8px] group-hover:inline ml-1 hidden">(₹)</span>
                                    </th>
                                    <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        Net Earning <span className="text-[8px] group-hover:inline ml-1 hidden">(₹)</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLedger.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                                        <td className="py-6 pl-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-[#794A05] transition-colors">{entry.id}</span>
                                                <span className="text-sm font-extrabold text-slate-900">{entry.description}</span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {format(new Date(entry.createdAt), "dd MMM, yyyy • hh:mm a")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold border-slate-200 text-slate-500 bg-white">
                                                {entry.type.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="py-6 text-center">
                                            <Badge className={cn(
                                                "rounded-full px-3 py-1 text-[10px] font-bold border shadow-sm",
                                                entry.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    entry.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" :
                                                        "bg-rose-50 text-rose-700 border-rose-100"
                                            )}>
                                                {entry.status}
                                            </Badge>
                                        </td>
                                        <td className="py-6 text-right">
                                            <span className="text-xs font-bold text-slate-500">
                                                {(entry.grossAmount || 0) > 0 ? entry.grossAmount.toLocaleString() : "-"}
                                            </span>
                                        </td>
                                        <td className="py-6 text-right">
                                            <span className="text-xs font-bold text-rose-400/70">
                                                {(entry.commission || 0) > 0 ? `-${entry.commission.toLocaleString()}` : "-"}
                                            </span>
                                        </td>
                                        <td className="py-6 pr-8 text-right">
                                            <div className={cn(
                                                "text-lg font-extrabold flex items-center justify-end gap-1",
                                                (entry.amount || 0) < 0 ? "text-rose-600" : "text-emerald-700"
                                            )}>
                                                {(entry.amount || 0) < 0 ? "-" : "+"}
                                                <IndianRupee className="w-3.5 h-3.5" />
                                                {Math.abs(entry.amount || 0).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
<<<<<<< HEAD
=======

            {/* Payout Modal */}
            <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-[#794A05]" />
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold text-slate-900">Request Payout</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Transfer your sacred marketplace earnings to your verified business bank account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-8 space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Available for Payout</p>
                                <p className="text-3xl font-extrabold text-slate-900">₹{summary.availableBalance.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-[#794A05]/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#794A05]" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-widest pl-1">Payout Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                <Input
                                    type="number"
                                    placeholder="Enter amount to transfer"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="h-14 pl-10 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:border-[#794A05] focus:ring-[#794A05]/10 text-xl font-bold transition-all"
                                />
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] text-slate-400 font-bold italic">Min. transfer: ₹500</p>
                                <button
                                    onClick={() => setWithdrawAmount(summary.availableBalance.toString())}
                                    className="text-[10px] font-extrabold text-[#794A05] uppercase hover:underline"
                                >
                                    Transfer Max
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100 shadow-inner">
                            <AlertCircle className="w-6 h-6 text-[#794A05] flex-shrink-0" />
                            <p className="text-[11px] text-[#794A05] font-bold leading-relaxed">
                                Payouts are manually audited for security. Funds typically reflect in your account within 1-2 business days.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsWithdrawModalOpen(false)}
                            className="rounded-xl font-bold text-slate-400"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleWithdrawal}
                            disabled={isSubmitting}
                            className="bg-[#794A05] hover:bg-[#5D3804] text-white rounded-xl px-10 h-12 font-bold shadow-lg shadow-[#794A05]/20"
                        >
                            {isSubmitting ? "Processing..." : "Sync with Bank Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
        </div>
    );
}

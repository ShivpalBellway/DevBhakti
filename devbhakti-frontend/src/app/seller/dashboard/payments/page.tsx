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
import { isPayoutAllowed, nextPayoutDate } from "@/utils/payoutSchedule";
import { useToast } from "@/hooks/use-toast";

import { useRouter } from "next/navigation";

export default function SellerPaymentsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
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


    const filteredLedger = ledger.filter(entry =>
        (entry.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );


    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-[#794A05]" />
                        Earnings & Settlements
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Monitor your marketplace revenue, platform commissions, and manage store payouts.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/seller/dashboard/payments/withdraw")}
                    className="bg-[#794A05] hover:bg-[#5D3804] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-[#794A05]/20 gap-2 transition-all active:scale-95"
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Request Payout
                </Button>
            </div>

            {/* Premium Stats Cards */}
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-none shadow-xl bg-primary text-dark rounded-[1.5rem] overflow-hidden relative group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Sales</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-500 cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 text-white border-slate-700 text-[12px]">Total value of all orders.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-slate-400" strokeWidth={3} />
                                {summary.totalEarnings.toLocaleString()}
                            </h2>
                        </CardContent>
                    </Card>

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
                                {summary.availableBalance.toLocaleString()}
                            </h2>
                        </CardContent>
                    </Card>

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
                        </CardContent>
                    </Card>
                </div>
            </TooltipProvider>

            {/* Payout Schedule Alert */}
            <div className={cn(
                "p-5 rounded-[2rem] border flex items-start gap-4 transition-all duration-500",
                isPayoutAllowed()
                    ? "bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-600/5 mt-4"
                    : "bg-amber-50 border-amber-100 shadow-lg shadow-amber-600/5 mt-4"
            )}>
                <div className={cn(
                    "p-3 rounded-2xl flex-shrink-0",
                    isPayoutAllowed() ? "bg-emerald-500/10" : "bg-amber-500/10"
                )}>
                    {isPayoutAllowed() ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                        <Clock className="w-6 h-6 text-amber-600" />
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <h4 className={cn(
                        "font-black text-sm uppercase tracking-wider",
                        isPayoutAllowed() ? "text-emerald-900" : "text-amber-900"
                    )}>
                        {isPayoutAllowed() ? "Payout Window Open" : "Payout Schedule"}
                    </h4>
                    <p className={cn(
                        "text-xs font-semibold leading-relaxed",
                        isPayoutAllowed() ? "text-emerald-700/80" : "text-amber-700/80"
                    )}>
                        {isPayoutAllowed()
                            ? "Marketplace payouts are currently being processed (15th / 28th). Your settled funds are ready for withdrawal."
                            : `Payouts are processed on the 15th and 28th of every month. The next window opens on ${format(nextPayoutDate(), "do MMMM yyyy")}.`
                        }
                    </p>
                </div>
            </div>

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

                <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white premium-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Date / Description</th>
                                    <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Type</th>
                                    <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Status</th>
                                    {/* Hiding Gross/Commission columns for cleaner look
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Gross</th>
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Commission</th>
                                    */}
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
                                            {/* Hiding cells for Gross/Commission
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
                                            */}
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
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

        </div>
    );
}

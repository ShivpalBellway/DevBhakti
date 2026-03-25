"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    IndianRupee,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    History,
    Wallet,
    Loader2,
    Calendar,
    Search,
    Download,
    CheckCircle2,
    AlertCircle,
    Info
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    fetchTempleLedger,
    fetchTempleFinanceSummary,
    fetchMyTempleProfile
} from "@/api/templeAdminController";
import { isPayoutAllowed, nextPayoutDate } from "@/utils/payoutSchedule";


export default function EarningsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const [templeId, setTempleId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        loadFinancials();
    }, []);

    const loadFinancials = async () => {
        setIsLoading(true);
        console.log("Loading temple financials...");
        try {
            // 1. Fetch Profile
            let profile;
            try {
                const profileRes = await fetchMyTempleProfile();
                if (profileRes.success && profileRes.data.id) {
                    profile = profileRes.data;
                    const id = profile.id;
                    setTempleId(id);

                    // 2. Fetch Finance Summary & Ledger in parallel
                    const [summaryRes, ledgerRes] = await Promise.allSettled([
                        fetchTempleFinanceSummary(id),
                        fetchTempleLedger(id)
                    ]);

                    if (summaryRes.status === 'fulfilled' && summaryRes.value.success) {
                        setSummary(summaryRes.value.data);
                    } else {
                        console.warn("Could not load finance summary");
                    }

                    if (ledgerRes.status === 'fulfilled' && ledgerRes.value.success) {
                        setLedger(ledgerRes.value.data);
                    } else {
                        console.warn("Could not load ledger data");
                    }
                }
            } catch (err: any) {
                console.error("Temple profile fetch failed:", err);
                // If it's a 404 or something, we just don't set templeId
                // No intrusive toast for simple background fetch failure
            }
        } catch (globalError) {
            console.error("Critical error in loadFinancials:", globalError);
            toast({
                title: "Information",
                description: "Financial dashboard is currently unavailable or your temple is pending approval.",
                variant: "default",
            });
        } finally {
            setIsLoading(false);
        }
    };



    const filteredLedger = ledger.filter(entry =>
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadCSV = () => {
        if (ledger.length === 0) {
            toast({
                title: "Error",
                description: "No data available to download",
                variant: "destructive",
            });
            return;
        }

        // CSV Headers
        const headers = ["Date", "Description", "Type", "Status", "Amount (₹)"];

        // Map data to rows
        const rows = ledger.map(entry => [
            format(new Date(entry.createdAt), "dd MMM yyyy"),
            entry.description.replace(/,/g, " "), // Escape commas
            entry.type.replace('_', ' '),
            entry.status,
            entry.amount
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `temple_ledger_${format(new Date(), "dd_MM_yyyy")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Success",
            description: "Ledger downloaded successfully",
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#794A05]" />
                <p className="text-[#794A05] font-medium font-serif">Calculating Sacred Earnings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-[#794A05]" />
                        Earnings & Settlements
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Track your revenue, commissions, and manage your payouts.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/temples/dashboard/finance/withdraw")}
                    className="bg-[#794A05] hover:bg-[#5D3804] text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-[#794A05]/20 gap-2"
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Request Payout
                </Button>
            </div>

            {/* Summary Cards */}
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-none shadow-xl bg-primary text-dark rounded-[1.5rem] overflow-hidden relative group">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Sales</p>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3 text-slate-500 cursor-help" /></TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 text-white border-slate-700 text-[12px]">Total value of all services.</TooltipContent>
                                </Tooltip>
                            </div>
                            <h2 className="text-2xl font-extrabold flex items-center gap-1">
                                <IndianRupee className="w-5 h-5 text-slate-400" strokeWidth={3} />
                                {summary?.totalEarnings?.toLocaleString() || "0"}
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
                                {summary?.availableBalance?.toLocaleString() || "0"}
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
                                {summary?.inEscrow?.toLocaleString() || "0"}
                            </h2>
                            <p className="text-[8px] text-amber-600 font-bold mt-1">3-day period</p>
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
                                {summary?.pendingBalance?.toLocaleString() || "0"}
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
                            ? "Sacred payouts are currently being processed (15th / 28th). Your settled funds are ready for withdrawal."
                            : `Payouts are processed on the 15th and 28th of every month. The next window opens on ${format(nextPayoutDate(), "do MMMM yyyy")}.`
                        }
                    </p>
                </div>
            </div>

            {/* Processing Payouts Info (If any) */}
            {summary?.processingWithdrawals > 0 && (
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

            {/* Ledger Table */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-[#794A05]" />
                        Transaction Ledger
                    </h3>
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 rounded-xl border-slate-200"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleDownloadCSV}
                            className="w-full md:w-auto h-10 rounded-xl border-slate-200 font-bold flex items-center gap-2 hover:bg-slate-50"
                        >
                            <Download className="w-4 h-4" />
                            Download CSV
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
                                        <td colSpan={5} className="py-20 text-center">
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
                                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900">
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

"use client";

import React, { useState, useEffect } from "react";
import {
    IndianRupee,
    Search,
    History as HistoryIcon,
    Loader2,
    Info,
    Calendar,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    Filter
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    fetchAllTransactionsAdmin,
    fetchPlatformFinanceSummary
} from "@/api/adminController";

export default function AdminTransactionLedgerPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [platformSummary, setPlatformSummary] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [transRes, sumRes] = await Promise.all([
                fetchAllTransactionsAdmin(),
                fetchPlatformFinanceSummary()
            ]);

            if (transRes.success) setTransactions(transRes.data);
            if (sumRes.success) setPlatformSummary(sumRes.data);

        } catch (error) {
            console.error("Failed to load ledger data:", error);
            toast({
                title: "Error",
                description: "Failed to load transaction records",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.temple?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.type?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-primary font-medium">Analyzing Sacred Transactions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                        <HistoryIcon className="w-8 h-8 text-primary" />
                        Platform Transaction Ledger
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Complete record of all sacred offerings, commissions, and payouts at platform level.</p>
                </div>
            </div>

            {/* Platform Summary Cards - Premium Style */}
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Sacred Volume (GMV)",
                            count: platformSummary?.totalPlatformGross || 0,
                            info: "Total volume of all spiritual transactions processed.",
                            highlight: true
                        },
                        {
                            label: "DevBhakti Net Commission",
                            count: platformSummary?.totalPlatformCommission || 0,
                            info: "Total revenue earned by the platform.",
                            color: "text-emerald-600"
                        },
                        {
                            label: "Merchant Disbursements",
                            count: platformSummary?.totalPaidOut || 0,
                            info: "Total funds successfully settled with temples/sellers.",
                            color: "text-[#794A05]"
                        },
                        {
                            label: "In Transit / Processing",
                            count: platformSummary?.inProcessing || 0,
                            info: "Funds current in escrow or processing state.",
                            color: "text-amber-600"
                        }
                    ].map((stat, i) => (
                        <Card key={i} className={cn(
                            "border-none shadow-xl rounded-[1.5rem] overflow-hidden relative group",
                            stat.highlight ? "bg-slate-900 text-white" : "bg-white text-slate-900 border border-slate-100"
                        )}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">{stat.label}</p>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="w-3 h-3 text-slate-500 cursor-help" /></TooltipTrigger>
                                        <TooltipContent className="bg-slate-800 text-white border-slate-700 text-[12px]">{stat.info}</TooltipContent>
                                    </Tooltip>
                                </div>
                                <h2 className={cn("text-2xl font-extrabold flex items-center gap-1", stat.color)}>
                                    <IndianRupee className={cn("w-5 h-5 opacity-70", stat.highlight ? "text-slate-400" : "text-slate-400")} strokeWidth={3} />
                                    {stat.count.toLocaleString()}
                                </h2>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TooltipProvider>

            {/* Ledger Tabular View */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by temple, ID or type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-xl border-slate-200"
                            />
                        </div>
                    </div>
                </div>

                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Transaction Date / Record</th>
                                    <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Merchant (Temple/Seller)</th>
                                    <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Type</th>
                                    <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Status</th>
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Gross</th>
                                    <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Comm.</th>
                                    <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Net Platform</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-slate-400 font-serif">
                                            No transaction entries found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-6 pl-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter">
                                                        {format(new Date(tx.createdAt), "dd MMM yyyy, hh:mm a")}
                                                    </span>
                                                    <span className="text-sm font-extrabold text-slate-900">{tx.description}</span>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-600">{tx.temple?.name || "DevBhakti"}</span>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-extrabold border-slate-200 text-slate-500 bg-slate-50 uppercase tracking-tighter">
                                                    {tx.type.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="py-6 text-center">
                                                <Badge className={cn(
                                                    "rounded-full px-3 py-1 text-[10px] font-bold border",
                                                    tx.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                        tx.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                            "bg-red-50 text-red-700 border-red-200"
                                                )}>
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                            <td className="py-6 text-right">
                                                <span className="text-xs font-bold text-slate-500">
                                                    ₹{tx.grossAmount?.toLocaleString() || "0"}
                                                </span>
                                            </td>
                                            <td className="py-6 text-right">
                                                <span className="text-xs font-bold text-slate-500">
                                                    ₹{tx.commission?.toLocaleString() || "0"}
                                                </span>
                                            </td>
                                            <td className="py-6 pr-8 text-right">
                                                <div className="flex items-center justify-end font-extrabold italic text-slate-900">
                                                    <IndianRupee className="w-3.5 h-3.5 opacity-40 mr-0.5" strokeWidth={3} />
                                                    {tx.amount.toLocaleString()}
                                                </div>
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

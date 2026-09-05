"use client";

import React, { useState, useEffect } from "react";
import {
    IndianRupee,
    TrendingUp,
    History,
    Wallet,
    Loader2,
    ArrowUpRight,
    Search,
    User,
    Globe,
    Building2,
    Clock,
    CreditCard,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fetchMandalFinanceSummary, fetchMandalLedger, fetchMandalFinancialReport } from "@/api/mandalAdminController";

export default function MandalFinancePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const { toast } = useToast();

    useEffect(() => {
        loadFinancials();
    }, []);

    const loadFinancials = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, ledgerRes, reportRes] = await Promise.allSettled([
                fetchMandalFinanceSummary(),
                fetchMandalLedger(),
                fetchMandalFinancialReport({ period: "this_month", limit: 50 })
            ]);

            if (summaryRes.status === "fulfilled" && summaryRes.value.success) {
                setSummary(summaryRes.value.data);
            }
            if (ledgerRes.status === "fulfilled" && ledgerRes.value.success) {
                setLedger(ledgerRes.value.data || []);
            }
            if (reportRes.status === "fulfilled" && reportRes.value.success) {
                setReportData(reportRes.value.data);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load financial data", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount ?? 0);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        try {
            return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
        } catch {
            return dateStr;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "POOJA_EARNING": return "Pooja & Seva";
            case "DONATION_EARNING": return "Donation";
            case "MARKETPLACE_EARNING": return "Sacred Items";
            case "DARSHAN_EARNING": return "Ticketing";
            case "WITHDRAWAL": return "Withdrawal";
            case "PLATFORM_FEE": return "Platform Fee";
            default: return type?.replace(/_/g, " ") || "General";
        }
    };

    const getTypeBadgeClass = (type: string) => {
        if (type === "WITHDRAWAL") return "bg-red-50 text-red-700 border-red-200";
        if (type === "PLATFORM_FEE") return "bg-slate-100 text-slate-700 border-slate-200";
        if (type === "DONATION_EARNING") return "bg-blue-50 text-blue-700 border-blue-200";
        if (type === "MARKETPLACE_EARNING") return "bg-purple-50 text-purple-700 border-purple-200";
        return "bg-amber-50 text-amber-800 border-amber-200";
    };

    // Extract receipt/ref ID safely from description or entry
    const extractReceiptId = (entry: any) => {
        if (entry.orderDetail?.displayId) return `#${entry.orderDetail.displayId}`;
        if (entry.description) {
            const match = entry.description.match(/#([A-Za-z0-9_-]+)/);
            if (match) return `#${match[1]}`;
            const refMatch = entry.description.match(/\[([A-Za-z0-9_-]+)\]/);
            if (refMatch) return `#${refMatch[1]}`;
        }
        return `#${entry.id?.slice(-8).toUpperCase() || 'TXN'}`;
    };

    // Extract devotee/customer name safely
    const extractDevoteeName = (entry: any) => {
        if (entry.orderDetail?.customerName) return entry.orderDetail.customerName;
        if (entry.description) {
            if (entry.description.includes("from ")) {
                return entry.description.split("from ")[1]?.trim() || "Devotee";
            }
        }
        return "Devotee / Guest";
    };

    // Extract payment method (Cash / UPI / Card)
    const extractPaymentMethod = (entry: any) => {
        const desc = (entry.description || "").toUpperCase();
        if (desc.includes("(CASH)") || desc.includes("CASH")) return "Cash";
        if (desc.includes("(UPI)") || desc.includes("UPI")) return "UPI";
        if (desc.includes("CARD")) return "Card";
        return "Online / Gateway";
    };

    const filteredLedger = ledger.filter((entry: any) => {
        const matchesType =
            typeFilter === "ALL"
                ? true
                : typeFilter === "EARNINGS"
                ? entry.type !== "WITHDRAWAL"
                : entry.type === "WITHDRAWAL";

        const search = searchTerm.toLowerCase().trim();
        const matchesSearch =
            !search ||
            (entry.description && entry.description.toLowerCase().includes(search)) ||
            (entry.type && entry.type.toLowerCase().includes(search)) ||
            extractReceiptId(entry).toLowerCase().includes(search) ||
            extractDevoteeName(entry).toLowerCase().includes(search);

        return matchesType && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#7b4623]" />
                    <p className="text-muted-foreground text-sm font-medium">Loading financial data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Earnings & Settlement
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track your mandal's total earnings, payouts, and detailed transaction ledger history.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Earnings</p>
                                <p className="text-2xl font-black text-emerald-900 mt-1">
                                    {formatCurrency(summary?.totalEarnings ?? 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-emerald-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Available Balance</p>
                                <p className="text-2xl font-black text-blue-900 mt-1">
                                    {formatCurrency(summary?.availableBalance ?? 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-100/80 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-blue-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Total Withdrawn</p>
                                <p className="text-2xl font-black text-amber-900 mt-1">
                                    {formatCurrency(summary?.totalWithdrawn ?? 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-amber-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Column-Wise Transaction Ledger Table */}
            <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="p-5 border-b border-gray-100 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <History className="w-5 h-5 text-[#7b4623]" />
                                Transaction Ledger
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500 mt-0.5">
                                Complete column-wise breakdown of all earnings and withdrawals for your mandal.
                            </CardDescription>
                        </div>

                        {/* Search & Type Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search receipt, devotee, type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 md:w-56"
                                />
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="ALL">All Transactions</option>
                                <option value="EARNINGS">Earnings Only</option>
                                <option value="WITHDRAWALS">Withdrawals Only</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4">Receipt / Ref ID</th>
                                    <th className="py-3 px-4">Transaction Details</th>
                                    <th className="py-3 px-4">Devotee Info</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Payment Mode</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {filteredLedger.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                                            No transactions match your search filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLedger.map((entry: any, idx: number) => {
                                        const isWithdrawal = entry.type === "WITHDRAWAL";
                                        const receiptId = extractReceiptId(entry);
                                        const devoteeName = extractDevoteeName(entry);
                                        const payMode = extractPaymentMethod(entry);

                                        return (
                                            <tr key={entry.id ?? idx} className="hover:bg-amber-50/20 transition-colors">
                                                {/* Date & Time */}
                                                <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                        {formatDate(entry.createdAt)}
                                                    </div>
                                                </td>

                                                {/* Receipt / Ref ID */}
                                                <td className="py-3.5 px-4 font-mono font-bold text-amber-900 whitespace-nowrap">
                                                    {receiptId}
                                                </td>

                                                {/* Transaction Details */}
                                                <td className="py-3.5 px-4 font-medium text-gray-800 max-w-[220px]">
                                                    <div className="truncate" title={entry.description || getTypeLabel(entry.type)}>
                                                        {entry.description || getTypeLabel(entry.type)}
                                                    </div>
                                                </td>

                                                {/* Devotee Info */}
                                                <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                                                        <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                                        {devoteeName}
                                                    </div>
                                                </td>

                                                {/* Category Badge */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <Badge variant="outline" className={`text-[10px] font-bold ${getTypeBadgeClass(entry.type)}`}>
                                                        {getTypeLabel(entry.type)}
                                                    </Badge>
                                                </td>

                                                {/* Payment Mode */}
                                                <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-600">
                                                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-[11px]">
                                                        <CreditCard className="w-3 h-3 text-gray-500" />
                                                        {payMode}
                                                    </span>
                                                </td>

                                                {/* Amount */}
                                                <td className="py-3.5 px-4 font-black text-right whitespace-nowrap text-sm">
                                                    <span className={isWithdrawal ? "text-red-600" : "text-emerald-700"}>
                                                        {isWithdrawal ? "-" : "+"}{formatCurrency(entry.amount)}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        entry.status === "CANCELLED"
                                                            ? "bg-red-100 text-red-800"
                                                            : entry.status === "PENDING"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-emerald-100 text-emerald-800"
                                                    }`}>
                                                        {entry.status || "COMPLETED"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

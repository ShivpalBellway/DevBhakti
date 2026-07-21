"use client";

import React, { useState, useEffect } from "react";
import {
    IndianRupee,
    TrendingUp,
    History,
    Wallet,
    Loader2,
    Info,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fetchMandalFinanceSummary, fetchMandalLedger } from "@/api/mandalAdminController";

export default function MandalFinancePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [ledger, setLedger] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        loadFinancials();
    }, []);

    const loadFinancials = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, ledgerRes] = await Promise.allSettled([
                fetchMandalFinanceSummary(),
                fetchMandalLedger(),
            ]);

            if (summaryRes.status === "fulfilled" && summaryRes.value.success) {
                setSummary(summaryRes.value.data);
            }
            if (ledgerRes.status === "fulfilled" && ledgerRes.value.success) {
                setLedger(ledgerRes.value.data || []);
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
        return format(new Date(dateStr), "dd MMM yyyy");
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "DONATION_EARNING": return "Donation";
            case "WITHDRAWAL": return "Withdrawal";
            case "PLATFORM_FEE": return "Platform Fee";
            default: return type?.replace(/_/g, " ") || "—";
        }
    };

    const getTypeBadgeClass = (type: string) => {
        if (type === "WITHDRAWAL") return "bg-red-50 text-red-700 border-red-100";
        if (type === "PLATFORM_FEE") return "bg-slate-100 text-slate-600 border-slate-200";
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#7b4623]" />
                    <p className="text-muted-foreground text-sm">Loading financial data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Earnings & Settlement
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track your mandal's earnings, payouts, and ledger history.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Total Earnings</p>
                                <p className="text-2xl font-bold text-emerald-800 mt-1">
                                    {formatCurrency(summary?.totalEarnings ?? 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Available Balance</p>
                                <p className="text-2xl font-bold text-blue-800 mt-1">
                                    {formatCurrency(summary?.availableBalance ?? 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Total Withdrawn</p>
                                <p className="text-2xl font-bold text-amber-800 mt-1">
                                    {formatCurrency(summary?.totalWithdrawn ?? 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Ledger */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <History className="w-5 h-5 text-[#7b4623]" />
                        Transaction Ledger
                    </CardTitle>
                    <CardDescription>All earnings and withdrawals for your mandal.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {ledger.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                            <History className="w-10 h-10 opacity-20" />
                            <p className="text-sm">No transactions yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {ledger.map((entry: any, idx: number) => (
                                <div key={entry.id ?? idx} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                            entry.type === "WITHDRAWAL" ? "bg-red-50" : "bg-emerald-50"
                                        }`}>
                                            {entry.type === "WITHDRAWAL" ? (
                                                <ArrowUpRight className="w-4 h-4 text-red-500" />
                                            ) : (
                                                <IndianRupee className="w-4 h-4 text-emerald-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {entry.description || getTypeLabel(entry.type)}
                                            </p>
                                            <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`text-xs ${getTypeBadgeClass(entry.type)}`}>
                                            {getTypeLabel(entry.type)}
                                        </Badge>
                                        <span className={`font-semibold text-sm ${
                                            entry.type === "WITHDRAWAL" ? "text-red-600" : "text-emerald-700"
                                        }`}>
                                            {entry.type === "WITHDRAWAL" ? "-" : "+"}{formatCurrency(entry.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

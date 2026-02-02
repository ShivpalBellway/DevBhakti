"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    IndianRupee,
    ArrowLeft,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSellerWithdrawals } from "@/api/sellerController";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function PayoutHistoryPage() {
    const router = useRouter();
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const historyRes = await fetchSellerWithdrawals();
            if (historyRes.success) setWithdrawals(historyRes.data);
        } catch (error) {
            console.error("Failed to load payout history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Processing</Badge>;
            case "APPROVED":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Approved</Badge>;
            case "PAID":
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Paid</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="max-w-6xl space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-[#794A05]" />
                        Payout History
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        View all your past withdrawal requests and their status.
                    </p>
                </div>
            </div>

            {/* Withdrawal History Table */}
            <div className="space-y-4">
                <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-500">Loading history...</div>
                        ) : withdrawals.length === 0 ? (
                            <div className="text-center py-12">
                                <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium italic">No payout history found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {withdrawals.map((withdrawal) => (
                                    <div key={withdrawal.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                <IndianRupee className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    Withdrawal Request
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {format(new Date(withdrawal.createdAt), "dd MMM yyyy, hh:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">
                                                ₹{withdrawal.amount.toLocaleString()}
                                            </p>
                                            <div className="mt-1">
                                                {getStatusBadge(withdrawal.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

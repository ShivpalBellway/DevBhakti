"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    IndianRupee,
    ArrowLeft,
    Wallet,
    AlertCircle,
    Download, // Added
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSellerWithdrawalHistory } from "@/api/sellerController";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { BASE_URL } from "@/config/apiConfig";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";

export default function PayoutHistoryPage() {
    const router = useRouter();
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const historyRes = await fetchSellerWithdrawalHistory();
            if (historyRes.success) setWithdrawals(historyRes.data);
        } catch (error) {
            console.error("Failed to load payout history", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-8 pb-12">
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
                <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-white w-full">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-500">Loading history...</div>
                        ) : withdrawals.length === 0 ? (
                            <div className="text-center py-12">
                                <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium italic">No payout history found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Ref</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {withdrawals.map((item) => (
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
                                                <td className="px-8 py-6 text-center">
                                                    <Badge className={
                                                        item.status === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase text-[9px]" :
                                                            item.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-100 font-black uppercase text-[9px]" :
                                                                item.status === 'APPROVED' ? "bg-blue-50 text-blue-700 border-blue-100 font-black uppercase text-[9px]" :
                                                                    "bg-amber-50 text-amber-700 border-amber-100 font-black uppercase text-[9px]"
                                                    }>
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl h-9 font-bold text-xs"
                                                        onClick={() => {
                                                            setSelectedTransaction(item);
                                                            setIsDetailModalOpen(true);
                                                        }}
                                                    >
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Transaction Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-lg bg-white rounded-[2rem] p-0 overflow-hidden border-none text-slate-900">
                    <div className="sr-only">
                        <DialogTitle>Transaction Details</DialogTitle>
                    </div>
                    <div className={
                        selectedTransaction?.status === 'PAID' ? "bg-emerald-600 h-24 relative overflow-hidden" :
                            selectedTransaction?.status === 'REJECTED' ? "bg-red-600 h-24 relative overflow-hidden" :
                                "bg-amber-500 h-24 relative overflow-hidden"
                    }>
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute bottom-6 left-8 text-white">
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Transaction Status</p>
                            <h2 className="text-2xl font-black">{selectedTransaction?.status}</h2>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start border-b border-slate-50 pb-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested Amount</p>
                                <p className="text-3xl font-black text-slate-900">₹{selectedTransaction?.amount?.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Request Date</p>
                                <p className="text-sm font-bold text-slate-700">{selectedTransaction && format(new Date(selectedTransaction.createdAt), "dd MMM yyyy")}</p>
                                <p className="text-xs font-medium text-slate-400">{selectedTransaction && format(new Date(selectedTransaction.createdAt), "hh:mm a")}</p>
                            </div>
                        </div>

                        {selectedTransaction?.adminNotes && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Admin Note
                                </p>
                                <p className="text-sm font-medium text-slate-700 italic">"{selectedTransaction.adminNotes}"</p>
                            </div>
                        )}

                        {selectedTransaction?.status === 'PAID' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Transaction ID</p>
                                        <p className="text-sm font-bold text-slate-900 font-mono">{selectedTransaction.transactionId || "N/A"}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Transfer Date</p>
                                        <p className="text-sm font-bold text-slate-900">{selectedTransaction.updatedAt ? format(new Date(selectedTransaction.updatedAt), "dd MMM yyyy") : "N/A"}</p>
                                    </div>
                                </div>

                                {selectedTransaction.receiptImage && (
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Proof</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(`${BASE_URL}${selectedTransaction.receiptImage}`, '_blank')}
                                                className="h-8 text-[11px] font-bold gap-2 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download Receipt
                                            </Button>
                                        </div>
                                        <div className="border rounded-[1.5rem] overflow-hidden bg-slate-50/50 border-slate-100 p-2 group relative cursor-pointer" onClick={() => window.open(`${BASE_URL}${selectedTransaction.receiptImage}`, '_blank')}>
                                            <img
                                                src={`${BASE_URL}${selectedTransaction.receiptImage}`}
                                                alt="Payment Receipt"
                                                className="w-full h-auto max-h-72 object-contain rounded-xl shadow-sm transition-transform duration-500 group-hover:scale-[1.02]"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                                <Download className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)} className="rounded-xl font-bold">
                                Close Details
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

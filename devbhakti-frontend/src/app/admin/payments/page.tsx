"use client";

import React, { useState, useEffect } from "react";
import {
    IndianRupee,
    Search,
    Filter,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Building2,
    Calendar,
    ArrowRight,
    Loader2,
    ExternalLink,
    AlertCircle,
    Check,
    Info,
    History as HistoryIcon,
    LayoutList as LayoutListIcon
} from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
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
    fetchWithdrawalRequestsAdmin,
    updateWithdrawalStatusAdmin,
    fetchPlatformFinanceSummary,
    fetchAllTransactionsAdmin
} from "@/api/adminController";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function PayoutsManagementPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [platformSummary, setPlatformSummary] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("withdrawals");
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "MARK_PAID">("APPROVE");
    const [transactionId, setTransactionId] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string>("");
    const { toast } = useToast();

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setIsLoading(true);
        console.log("Starting to load financial data...");
        try {
            // Fetch withdrawals
            try {
                const reqRes = await fetchWithdrawalRequestsAdmin();
                if (reqRes.success) {
                    setRequests(reqRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch withdrawal requests:", err);
            }

            // Fetch summary
            try {
                const sumRes = await fetchPlatformFinanceSummary();
                if (sumRes.success) {
                    setPlatformSummary(sumRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch platform summary:", err);
            }

            // Fetch transactions
            try {
                const transRes = await fetchAllTransactionsAdmin();
                if (transRes.success) {
                    setTransactions(transRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch platform transactions:", err);
            }

        } catch (globalError) {
            console.error("Global error in loadRequests:", globalError);
            toast({
                title: "Warning",
                description: "Some financial data could not be loaded completely.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedRequest) return;

        try {
            const statusMap = {
                "APPROVE": "APPROVED",
                "REJECT": "REJECTED",
                "MARK_PAID": "PAID"
            };

            const fd = new FormData();
            fd.append("status", statusMap[actionType]);
            fd.append("adminNotes", adminNotes);
            if (actionType === "MARK_PAID") {
                fd.append("transactionId", transactionId);
                if (receiptFile) {
                    fd.append("receiptImage", receiptFile);
                }
            }

            const res = await updateWithdrawalStatusAdmin(selectedRequest.id, fd);

            if (res.success) {
                toast({
                    title: "Success",
                    description: `Withdrawal request successfully ${statusMap[actionType].toLowerCase()}`,
                });
                setIsActionModalOpen(false);
                setSelectedRequest(null);
                setTransactionId("");
                setAdminNotes("");
                setReceiptFile(null);
                setReceiptPreview("");
                loadRequests();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.temple?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.temple?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.type?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "PENDING": return { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
            case "APPROVED": return { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
            case "REJECTED": return { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
            case "PAID": return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
            default: return { icon: Clock, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-primary font-medium">Fetching Payout Records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif flex items-center gap-3">
                    <IndianRupee className="w-8 h-8 text-primary" />
                    Payout Management
                </h1>
                <p className="text-muted-foreground mt-1">Review and process withdrawal requests from temples.</p>
            </div>

            {/* Quick Stats */}
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        {
                            label: "Total Platform GMV",
                            count: `₹${platformSummary?.totalPlatformGross?.toLocaleString() || "0"}`,
                            color: "slate",
                            info: "Gross Merchandise Value: Total value of all orders processed on the platform."
                        },
                        {
                            label: "Total Commission",
                            count: `₹${platformSummary?.totalPlatformCommission?.toLocaleString() || "0"}`,
                            color: "emerald",
                            highlight: true,
                            info: "Net platform earnings from temple commissions."
                        },
                        {
                            label: "Paid to Temples",
                            count: `₹${platformSummary?.totalPaidOut?.toLocaleString() || "0"}`,
                            color: "blue",
                            info: "Total amount successfully disbursed to temples."
                        },
                        {
                            label: "Pending Payouts",
                            count: requests.filter(r => r.status === "PENDING").length,
                            color: "amber",
                            info: "Number of withdrawal requests currently awaiting admin approval."
                        },
                    ].map((stat, i) => (
                        <Card key={i} className={cn(
                            "border-none shadow-sm rounded-2xl overflow-hidden",
                            stat.highlight ? "bg-emerald-900 text-white" : "bg-white text-slate-900"
                        )}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        stat.highlight ? "text-emerald-400" : "text-slate-400"
                                    )}>{stat.label}</p>
                                    <Tooltip>
                                        <TooltipTrigger><Info className={cn("w-3 h-3 cursor-help", stat.highlight ? "text-emerald-600" : "text-slate-300")} /></TooltipTrigger>
                                        <TooltipContent className="bg-slate-800 text-white border-slate-700 text-[10px]">{stat.info}</TooltipContent>
                                    </Tooltip>
                                </div>
                                <h3 className="text-2xl font-bold">{stat.count}</h3>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TooltipProvider>

            {/* Filters and Tabs */}
            <div className="space-y-6">
                <Tabs defaultValue="withdrawals" className="w-full" onValueChange={setActiveTab}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <TabsList className="bg-slate-100 p-1 rounded-2xl h-12 w-full md:w-auto">
                            <TabsTrigger value="withdrawals" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                                <LayoutListIcon className="w-4 h-4" />
                                Payout Requests
                            </TabsTrigger>
                            <TabsTrigger value="transactions" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                                <HistoryIcon className="w-4 h-4" />
                                Transaction Ledger
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-4 w-full md:w-auto flex-1 md:justify-end">
                            <div className="relative flex-1 md:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder={activeTab === "withdrawals" ? "Search requests..." : "Search transactions..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 rounded-xl border-slate-200"
                                />
                            </div>
                            {activeTab === "withdrawals" && (
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-40 h-11 rounded-xl border-slate-200 font-semibold">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="ALL">All Status</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="PAID">Paid</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <TabsContent value="withdrawals" className="mt-0 outline-none">
                        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80">
                                        <tr>
                                            <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Temple & Owner</th>
                                            <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Amount</th>
                                            <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Bank Details</th>
                                            <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Status</th>
                                            <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                                        <AlertCircle className="w-12 h-12 opacity-20" />
                                                        <p className="font-bold uppercase tracking-widest text-[10px]">No payout requests found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRequests.map((req) => {
                                                const config = getStatusConfig(req.status);
                                                const StatusIcon = config.icon;
                                                return (
                                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-6 pl-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                                    <Building2 className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-extrabold text-slate-900">{req.temple?.name}</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold">{req.temple?.user?.name} ({req.temple?.user?.phone})</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-6">
                                                            <span className="text-base font-extrabold text-slate-900 italic">₹{req.amount.toLocaleString()}</span>
                                                        </td>
                                                        <td className="py-6">
                                                            <div className="flex flex-col text-[11px] text-slate-500 font-medium">
                                                                <span>{req.bankDetails?.type || 'Manual Request'}</span>
                                                                <span className="text-[9px] text-slate-400">{format(new Date(req.createdAt), "dd MMM, hh:mm a")}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 text-center">
                                                            <Badge className={cn(
                                                                "rounded-full px-3 py-1 text-[10px] font-bold border",
                                                                config.bg, config.color, config.border
                                                            )}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {req.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-6 pr-8 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {req.status === "PENDING" && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => { setSelectedRequest(req); setActionType("APPROVE"); setIsActionModalOpen(true); }}
                                                                            className="h-8 rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                        >
                                                                            Approve
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => { setSelectedRequest(req); setActionType("REJECT"); setIsActionModalOpen(true); }}
                                                                            className="h-8 rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                                                                        >
                                                                            Reject
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {req.status === "APPROVED" && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                                        onClick={() => { setSelectedRequest(req); setActionType("MARK_PAID"); setIsActionModalOpen(true); }}
                                                                    >
                                                                        <Check className="w-3.5 h-3.5" />
                                                                        Mark Paid
                                                                    </Button>
                                                                )}
                                                                {req.status === "PAID" && (
                                                                    <div className="text-[10px] font-bold text-slate-400">
                                                                        TXN: {req.transactionId || 'N/A'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-0 outline-none">
                        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80">
                                        <tr>
                                            <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Date / Description</th>
                                            <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Temple</th>
                                            <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Type</th>
                                            <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Status</th>
                                            <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Gross</th>
                                            <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Commission</th>
                                            <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                                        <HistoryIcon className="w-12 h-12 opacity-20" />
                                                        <p className="font-bold uppercase tracking-widest text-[10px]">No ledger entries found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-6 pl-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {format(new Date(tx.createdAt), "dd MMM, yyyy")}
                                                            </span>
                                                            <span className="text-sm font-extrabold text-slate-900">{tx.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <span className="text-sm font-bold text-slate-600">{tx.temple?.name || "N/A"}</span>
                                                    </td>
                                                    <td className="py-6">
                                                        <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold border-slate-200 text-slate-600 bg-slate-50">
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
                                                            {tx.grossAmount > 0 ? `₹${tx.grossAmount.toLocaleString()}` : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <span className="text-xs font-bold text-emerald-600">
                                                            {tx.commission > 0 ? `₹${tx.commission.toLocaleString()}` : "-"}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 pr-8 text-right">
                                                        <span className={cn(
                                                            "text-base font-extrabold italic",
                                                            tx.amount < 0 ? "text-red-600" : "text-slate-900"
                                                        )}>
                                                            {tx.amount < 0 ? "-" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Action Modal */}
            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white overflow-hidden">
                    <div className={cn(
                        "absolute top-0 left-0 w-full h-2",
                        actionType === "APPROVE" ? "bg-blue-500" : actionType === "REJECT" ? "bg-red-500" : "bg-emerald-500"
                    )} />
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold text-slate-900">
                            {actionType === "APPROVE" ? "Approve Payout" : actionType === "REJECT" ? "Reject Payout" : "Confirm Payment"}
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            {actionType === "APPROVE" ? "This will mark the request as approved and ready for payment." :
                                actionType === "REJECT" ? "This will reject the request. Please provide a reason below." :
                                    "Please enter the transaction ID after performing the bank transfer."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount to Pay</p>
                                <p className="text-2xl font-extrabold text-slate-900 italic">₹{selectedRequest?.amount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Temple</p>
                                <p className="text-sm font-bold text-slate-700">{selectedRequest?.temple?.name}</p>
                            </div>
                        </div>

                        {actionType === "MARK_PAID" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">Transaction ID / Reference *</label>
                                    <Input
                                        placeholder="Enter reference number..."
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">Payment Receipt</label>
                                    <div className="relative h-11 border-2 border-dashed rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setReceiptFile(file);
                                                    setReceiptPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        {receiptPreview ? (
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px]">
                                                <Check className="w-3 h-3" /> Receipt Selected
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                                                <Eye className="w-3 h-3" /> Upload Receipt
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">
                                {actionType === "REJECT" ? "Rejection Reason *" : "Admin Notes (Internal)"}
                            </label>
                            <Input
                                placeholder={actionType === "REJECT" ? "Why is this being rejected?" : "Add any internal notes..."}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsActionModalOpen(false)}
                            className="rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateStatus}
                            className={cn(
                                "rounded-xl px-8 font-bold text-white",
                                actionType === "APPROVE" ? "bg-blue-600 hover:bg-blue-700" :
                                    actionType === "REJECT" ? "bg-red-600 hover:bg-red-700" :
                                        "bg-emerald-600 hover:bg-emerald-700"
                            )}
                        >
                            {actionType === "APPROVE" ? "Approve Request" :
                                actionType === "REJECT" ? "Reject Request" :
                                    "Confirm Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

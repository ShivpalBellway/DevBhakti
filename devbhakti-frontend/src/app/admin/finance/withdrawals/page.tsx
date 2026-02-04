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
    LayoutList as LayoutListIcon
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
    fetchWithdrawalRequestsAdmin,
    updateWithdrawalStatusAdmin,
    fetchPlatformFinanceSummary
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

export default function WithdrawalRequestsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [platformSummary, setPlatformSummary] = useState<any>(null);
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "MARK_PAID">("APPROVE");
    const [transactionId, setTransactionId] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string>("");
    const [fileError, setFileError] = useState<string>("");
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [reqRes, sumRes] = await Promise.all([
                fetchWithdrawalRequestsAdmin(),
                fetchPlatformFinanceSummary()
            ]);

            if (reqRes.success) setRequests(reqRes.data);
            if (sumRes.success) setPlatformSummary(sumRes.data);

        } catch (error) {
            console.error("Failed to load withdrawal data:", error);
            toast({
                title: "Error",
                description: "Failed to load withdrawal requests",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedRequest) return;
        if (actionType === "MARK_PAID" && fileError) {
            toast({
                title: "Invalid File",
                description: fileError,
                variant: "destructive",
            });
            return;
        }

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
                setFileError("");
                loadData();
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
        const nameToCheck = req.temple?.name || req.seller?.name || "";
        const matchesSearch = nameToCheck.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
        return matchesSearch && matchesStatus;
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                        <LayoutListIcon className="w-8 h-8 text-primary" />
                        Withdrawal Requests
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Review and process payout requests from temples and sellers.</p>
                </div>
            </div>

            {/* Quick Stats - Premium Style */}
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Total Gross Earning",
                            count: platformSummary?.totalPlatformGross || 0,
                            highlight: true,
                            info: "Gross Merchandise Value of the entire platform."
                        },
                        {
                            label: "Locked Commission",
                            count: platformSummary?.totalPlatformCommission || 0,
                            color: "text-[#794A05]",
                            info: "Total platform earnings from temple commissions."
                        },
                        {
                            label: "Successfully Paid",
                            count: platformSummary?.totalPaidOut || 0,
                            color: "text-emerald-600",
                            info: "Total amount successfully disbursed to vendors."
                        },
                        {
                            label: "Pending Requests",
                            count: requests.filter(r => r.status === "PENDING").length,
                            isCount: true,
                            info: "Number of withdrawal requests currently awaiting approval."
                        }
                    ].map((stat, i) => (
                        <Card key={i} className={cn(
                            "border-none shadow-xl rounded-[1.5rem] overflow-hidden relative group",
                            stat.highlight ? "bg-slate-900 text-white" : "bg-white text-slate-900 border border-slate-100"
                        )}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <p className={cn(
                                        "font-bold uppercase tracking-widest text-[10px]",
                                        stat.highlight ? "text-slate-400" : "text-slate-400"
                                    )}>{stat.label}</p>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="w-3 h-3 text-slate-500 cursor-help" /></TooltipTrigger>
                                        <TooltipContent className="bg-slate-800 text-white border-slate-700 text-[12px]">{stat.info}</TooltipContent>
                                    </Tooltip>
                                </div>
                                <h2 className={cn("text-2xl font-extrabold flex items-center gap-1", stat.color)}>
                                    {!stat.isCount && <IndianRupee className={cn("w-5 h-5 opacity-70", stat.highlight ? "text-slate-400" : "text-slate-400")} strokeWidth={3} />}
                                    {stat.isCount ? stat.count : stat.count.toLocaleString()}
                                </h2>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TooltipProvider>

            {/* Content Table */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by temple name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-xl border-slate-200"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 h-10 rounded-xl border-slate-200 font-semibold">
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
                    </div>
                </div>

                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Temple & Owner</th>
                                    <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Amount</th>
                                    <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Request Info</th>
                                    <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Status</th>
                                    <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-slate-400 font-serif">
                                            No payout requests found matching your filters.
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
                                                        <div className="w-10 h-10 rounded-[1rem] bg-slate-100 flex items-center justify-center text-slate-600">
                                                            <Building2 className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-extrabold text-slate-900">{req.temple?.name || req.seller?.name || "Unknown"}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                                {req.temple?.user?.name || req.seller?.user?.name || "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6">
                                                    <span className="text-base font-extrabold text-slate-900 flex items-center">
                                                        <IndianRupee className="w-3.5 h-3.5 opacity-50 mr-0.5" strokeWidth={3} />
                                                        {req.amount.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-6">
                                                    <div className="flex flex-col text-[11px] text-slate-500 font-medium">
                                                        <span className="font-bold text-slate-700">
                                                            {req.bankDetails?.bankName ? `${req.bankDetails.bankName} - ${req.bankDetails.accountNumber}` : req.bankDetails?.type || 'Standard Payout'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">{format(new Date(req.createdAt), "dd MMM yyyy, hh:mm a")}</span>
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
                                                                    className="h-8 rounded-[10px] text-blue-600 border-blue-200 hover:bg-blue-50 font-bold text-xs"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => { setSelectedRequest(req); setActionType("REJECT"); setIsActionModalOpen(true); }}
                                                                    className="h-8 rounded-[10px] text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs"
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {req.status === "APPROVED" && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-bold text-xs"
                                                                onClick={() => { setSelectedRequest(req); setActionType("MARK_PAID"); setIsActionModalOpen(true); }}
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                        {req.status === "PAID" && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reference ID</span>
                                                                <span className="text-xs font-bold text-slate-600 italic">#{req.transactionId || 'N/A'}</span>
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
                        <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount to Pay</p>
                                <p className="text-2xl font-extrabold text-slate-900 flex items-center">
                                    <IndianRupee className="w-5 h-5 opacity-40 mr-1" strokeWidth={3} />
                                    {selectedRequest?.amount.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vendor</p>
                                <p className="text-sm font-extrabold text-slate-700">{selectedRequest?.temple?.name}</p>
                            </div>
                        </div>

                        {actionType === "MARK_PAID" && (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest pl-1">Transaction Ref / UTR No *</label>
                                    <Input
                                        placeholder="Enter reference number..."
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        className="h-12 rounded-2xl border-slate-200 focus:border-emerald-500 px-4 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest pl-1">Payment Receipt (Image)</label>
                                    <div className={cn(
                                        "relative h-12 border-2 border-dashed rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer group",
                                        fileError ? "border-red-500 bg-red-50" : "border-slate-200"
                                    )}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                setFileError("");
                                                if (file) {
                                                    if (file.size > 3 * 1024 * 1024) {
                                                        setFileError("File size must be under 3MB");
                                                        setReceiptFile(null);
                                                        setReceiptPreview("");
                                                        return;
                                                    }
                                                    setReceiptFile(file);
                                                    setReceiptPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        {receiptPreview ? (
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[11px]">
                                                <Check className="w-4 h-4" /> Receipt Selected
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px]">
                                                <Eye className="w-4 h-4" /> Upload Bank Transfer Snapshot
                                            </div>
                                        )}
                                    </div>
                                    {fileError && (
                                        <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                                            {fileError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest pl-1">
                                {actionType === "REJECT" ? "Rejection Reason *" : "Internal Notes"}
                            </label>
                            <Input
                                placeholder={actionType === "REJECT" ? "Why is this being rejected?" : "Any internal notes for reference..."}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 px-4 font-medium"
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
                                "rounded-xl px-8 h-11 font-bold text-white",
                                actionType === "APPROVE" ? "bg-blue-600 hover:bg-blue-700" :
                                    actionType === "REJECT" ? "bg-red-600 hover:bg-red-700" :
                                        "bg-emerald-600 hover:bg-emerald-700"
                            )}
                        >
                            {actionType === "APPROVE" ? "Confirm Approval" :
                                actionType === "REJECT" ? "Confirm Reject" :
                                    "Submit Payment Info"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

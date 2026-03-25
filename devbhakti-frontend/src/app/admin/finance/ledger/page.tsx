"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
    IndianRupee,
    Search,
    History as HistoryIcon,
    Loader2,
    Info,
    Calendar as CalendarIcon,
    Building2,
    ArrowUpRight,
    X,
    ChevronDown,
    Download,
    ShoppingBag,
    Heart,
    Zap,
    TrendingUp,
    FileText
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
    fetchAllTransactionsAdmin,
    fetchPlatformFinanceSummary,
    exportTransactionsExcelAdmin
} from "@/api/adminController";

function LedgerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [platformSummary, setPlatformSummary] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [dateRangeSelection, setDateRangeSelection] = useState<any>({ from: undefined, to: undefined });
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Merchant Filter from URL
    const templeId = searchParams.get('templeId');
    const sellerId = searchParams.get('sellerId');
    const [merchantName, setMerchantName] = useState<string | null>(null);

    // Merchant detail modal
    const [selectedMerchant, setSelectedMerchant] = useState<{ id: string; name: string; type: 'temple' | 'seller' } | null>(null);
    const [merchantTxs, setMerchantTxs] = useState<any[]>([]);
    const [merchantLoading, setMerchantLoading] = useState(false);

    const openMerchantModal = async (id: string, name: string, type: 'temple' | 'seller') => {
        setSelectedMerchant({ id, name, type });
        setMerchantLoading(true);
        setMerchantTxs([]);
        try {
            const res = await fetchAllTransactionsAdmin({
                page: 1,
                limit: 100,
                ...(type === 'temple' ? { templeId: id } : { sellerId: id })
            });
            if (res.success) setMerchantTxs(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setMerchantLoading(false);
        }
    };

    const merchantSummary = {
        total: merchantTxs.length,
        gross: merchantTxs.reduce((s, t) => s + (t.grossAmount || 0), 0),
        commission: merchantTxs.reduce((s, t) => s + (t.commission || 0), 0),
        net: merchantTxs.reduce((s, t) => s + (t.amount || 0), 0),
    };

    const loadSummary = async () => {
        try {
            const sumRes = await fetchPlatformFinanceSummary();
            if (sumRes.success) setPlatformSummary(sumRes.data);
        } catch (error) {
            console.error("Failed to load summary:", error);
        }
    };

    const loadTransactions = async (pageNum: number, isInitial: boolean = false) => {
        if (isInitial) setIsLoading(true);
        else setIsMoreLoading(true);

        try {
            const params = {
                page: pageNum,
                limit: 20,
                templeId: templeId || undefined,
                sellerId: sellerId || undefined
            };

            const transRes = await fetchAllTransactionsAdmin(params);

            if (transRes.success) {
                if (isInitial) {
                    setTransactions(transRes.data);
                } else {
                    setTransactions(prev => [...prev, ...transRes.data]);
                }

                setTotalTransactions(transRes.pagination.total);
                setHasMore(transRes.pagination.page < transRes.pagination.totalPages);

                // Update Merchant Name if filtering
                if (templeId || sellerId) {
                    const firstTx = transRes.data[0];
                    if (firstTx) {
                        setMerchantName(firstTx.temple?.name || firstTx.seller?.name || "Merchant");
                    }
                } else {
                    setMerchantName(null);
                }
            }
        } catch (error) {
            console.error("Failed to load transactions:", error);
            toast({
                title: "Error",
                description: "Failed to load transaction records",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
        setPage(1);
        setTransactions([]);
        loadTransactions(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templeId, sellerId]);

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("ALL");
        setTypeFilter("ALL");
        setDateRangeSelection({ from: undefined, to: undefined });
        setSortBy("date");
        setSortOrder("desc");
        setPage(1);
        if (templeId || sellerId) {
            router.push('/admin/finance/ledger');
        }
    };

    const handleLoadMore = () => {
        if (!isMoreLoading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadTransactions(nextPage);
        }
    };

    const handleExportExcel = async () => {
        try {
            toast({ title: "Processing", description: "Preparing your Excel report..." });
            const data = await exportTransactionsExcelAdmin({
                templeId: templeId || undefined,
                sellerId: sellerId || undefined
            });

            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ledger_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({ title: "Success", description: "Excel report downloaded successfully" });
        } catch (error) {
            console.error("Export Error:", error);
            toast({ title: "Export Failed", description: "Failed to generate Excel report", variant: "destructive" });
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = (tx.temple?.name || tx.seller?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.type?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;
        const matchesType = typeFilter === "ALL" || tx.type === typeFilter;

        let matchesDate = true;
        if (dateRangeSelection.from || dateRangeSelection.to) {
            const txDate = new Date(tx.createdAt);
            if (dateRangeSelection.from && txDate < startOfDay(dateRangeSelection.from)) matchesDate = false;
            if (dateRangeSelection.to && txDate > endOfDay(dateRangeSelection.to)) matchesDate = false;
        }

        return matchesSearch && matchesStatus && matchesType && matchesDate;
    }).sort((a, b) => {
        let result = 0;
        if (sortBy === "date") {
            result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortBy === "amount") {
            result = a.amount - b.amount;
        }
        return sortOrder === "desc" ? -result : result;
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
                        Transaction Overview
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {merchantName ? `Detailed financial history for ${merchantName}` : 'Complete record of all sacred offerings, commissions, and payouts at platform level.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {merchantName && (
                        <Button
                            variant="outline"
                            onClick={() => router.push('/admin/finance/ledger')}
                            className="rounded-xl border-slate-200 hover:bg-slate-50"
                        >
                            View All Transactions
                        </Button>
                    )}
                    <Button
                        onClick={handleExportExcel}
                        className="bg-primary hover:bg-primary text-white rounded-xl flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export to Excel
                    </Button>
                </div>
            </div>

            {/* Platform Summary Cards */}
            <TooltipProvider>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Platform Financial Summary</h2>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 text-white border-slate-700 text-[12px]">
                            Overview of all financial activities across the platform.
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {[
                        { label: "Total Sales (GMV)", count: platformSummary?.totalPlatformGross || 0, info: "Total Gross Merchandise Value — sum of all payments processed across Poojas, Products, and Donations.", highlight: true },
                        { label: "Pooja & Seva Bookings", count: platformSummary?.totalPoojaBookings || 0, info: "Total revenue from Pooja and Seva ritual bookings made by devotees.", icon: <Zap className="w-4 h-4 text-purple-600" />, bg: "bg-purple-50" },
                        { label: "Product Sales", count: platformSummary?.totalProductSales || 0, info: "Total revenue generated from marketplace product orders.", icon: <ShoppingBag className="w-4 h-4 text-blue-600" />, bg: "bg-blue-50" },
                        { label: "Sacred Donations", count: platformSummary?.totalDonations || 0, info: "Total donation contributions received by temples from devotees.", icon: <Heart className="w-4 h-4 text-rose-600" />, bg: "bg-rose-50" },
                    ].map((stat, i) => (
                        <Card key={i} className={cn("border-none shadow-xl rounded-[1.5rem] overflow-hidden relative group", stat.highlight ? "bg-slate-900 text-white" : "bg-white text-slate-900 border border-slate-100")}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">{stat.label}</p>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-slate-800 text-white text-xs max-w-[220px]">
                                                {stat.info}
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    {stat.icon && <div className={cn("p-2 rounded-full", stat.bg)}>{stat.icon}</div>}
                                </div>
                                <h2 className="text-2xl font-extrabold flex items-center gap-1">
                                    <IndianRupee className={cn("w-5 h-5 opacity-70", stat.highlight ? "text-slate-400" : "text-slate-500")} strokeWidth={3} />
                                    {stat.count.toLocaleString()}
                                </h2>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: "DevBhakti Net Commission", count: platformSummary?.totalPlatformCommission || 0, info: "Total platform revenue earned as commission across all transaction types (Pooja, Products, Donations).", color: "text-emerald-600" },
                        { label: "Merchant Disbursements", count: platformSummary?.totalPaidOut || 0, info: "Total amount paid out/settled to temples and sellers after commission deduction.", color: "text-slate-700" },
                        { label: "Pending Payout Requests", count: platformSummary?.activePayouts || 0, info: "Number of payout requests raised by merchants currently awaiting admin approval.", color: "text-amber-600", isCurrency: false }
                    ].map((stat, i) => (
                        <Card key={i} className="bg-white text-slate-900 border border-slate-100 shadow-lg rounded-[1.5rem] overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400">{stat.label}</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help flex-shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-white text-xs max-w-[240px]">
                                            {stat.info}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <h2 className={cn("text-2xl font-extrabold flex items-center gap-1", stat.color)}>
                                    {stat.isCurrency !== false && <IndianRupee className="w-5 h-5 opacity-40 text-slate-400" strokeWidth={3} />}
                                    {stat.count.toLocaleString()}
                                </h2>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TooltipProvider>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 mt-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search IDs, merchants, descriptions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-slate-50 border-transparent transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] h-11 rounded-xl bg-slate-50 border-transparent">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100">
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[160px] h-11 rounded-xl bg-slate-50 border-transparent">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100">
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="POOJA_EARNING">Pooja Earnings</SelectItem>
                                <SelectItem value="MARKETPLACE_EARNING">Product Earnings</SelectItem>
                                <SelectItem value="DONATION_EARNING">Donations</SelectItem>
                                <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 justify-start text-left font-normal rounded-xl bg-slate-50 border-transparent min-w-[200px]">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRangeSelection.from ? (
                                        dateRangeSelection.to ? `${format(dateRangeSelection.from, "LLL dd")} - ${format(dateRangeSelection.to, "LLL dd")}` : format(dateRangeSelection.from, "LLL dd, y")
                                    ) : <span>Pick a date range</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-slate-100" align="end">
                                <Calendar mode="range" selected={dateRangeSelection} onSelect={setDateRangeSelection} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>

                        <Button variant="ghost" size="icon" onClick={resetFilters} className="h-11 w-11 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/80">
                            <TooltipProvider>
                            <tr>
                                <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Transaction Date / Record</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Merchant (Temple/Seller)</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Type</th>
                                <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Status</th>
                                <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 cursor-help">Gross <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-white text-xs max-w-[200px]">
                                            Total amount paid by the devotee before any platform commission is deducted.
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="py-5 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 cursor-help">Comm. <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-white text-xs max-w-[200px]">
                                            Platform commission deducted from the gross amount as per the applicable slab.
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 cursor-help">Net (Merchant) <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-slate-800 text-white text-xs max-w-[220px]">
                                            Net amount credited to the temple or seller after commission deduction (Gross − Commission).
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                            </tr>
                            </TooltipProvider>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400 font-serif">No transactions found.</td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-6 pl-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter">{format(new Date(tx.createdAt), "dd MMM yyyy, hh:mm a")}</span>
                                                <span className="text-sm font-extrabold text-slate-900">{tx.description}</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            {tx.templeId || tx.sellerId ? (
                                                <button
                                                    onClick={() => openMerchantModal(
                                                        tx.templeId || tx.sellerId,
                                                        tx.temple?.name || tx.seller?.name || "Merchant",
                                                        tx.templeId ? 'temple' : 'seller'
                                                    )}
                                                    className="flex items-center gap-2 hover:text-primary transition-colors group/merchant text-left"
                                                >
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover/merchant:text-primary" />
                                                    <span className="text-sm font-bold text-slate-600 group-hover/merchant:text-primary underline decoration-slate-200 underline-offset-4 decoration-dashed">
                                                        {tx.temple?.name || tx.seller?.name || "DevBhakti"}
                                                    </span>
                                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/merchant:opacity-100 transition-opacity" />
                                                </button>
                                            ) : (
                                                <span className="flex items-center gap-2 text-sm font-bold text-slate-400">
                                                    <Building2 className="w-3.5 h-3.5" /> DevBhakti
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-6">
                                            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-tighter">
                                                {tx.type.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="py-6 text-center">
                                            <Badge className={cn("rounded-full px-3 py-1 text-[10px] font-bold border", tx.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : tx.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200")}>
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="py-6 text-right text-xs font-bold text-slate-500">₹{tx.grossAmount?.toLocaleString() || "0"}</td>
                                        <td className="py-6 text-right text-xs font-bold text-slate-500">₹{tx.commission?.toLocaleString() || "0"}</td>
                                        <td className="py-6 pr-8 text-right font-extrabold text-slate-900 italic">
                                            <div className="flex items-center justify-end">
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

            {hasMore && (
                <div className="flex justify-center pt-8">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isMoreLoading}
                        className="rounded-2xl px-12 py-6 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm"
                    >
                        {isMoreLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...</> : "Load More Transactions"}
                    </Button>
                </div>
            )}

            {/* Merchant Detail Modal */}
            <Dialog open={!!selectedMerchant} onOpenChange={(open) => !open && setSelectedMerchant(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2rem] border-none shadow-2xl p-0">
                    <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                                    {selectedMerchant?.type === 'temple' ? 'Temple' : 'Seller'} Ledger
                                </p>
                                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-6 h-6 text-primary" />
                                    {selectedMerchant?.name}
                                </DialogTitle>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        {!merchantLoading && (
                            <div className="grid grid-cols-4 gap-3 mt-5">
                                {[
                                    { label: "Transactions", value: merchantSummary.total, isCurrency: false, color: "text-slate-900" },
                                    { label: "Gross Volume", value: merchantSummary.gross, color: "text-slate-700" },
                                    { label: "Commission", value: merchantSummary.commission, color: "text-amber-600" },
                                    { label: "Net Earned", value: merchantSummary.net, color: "text-emerald-600" },
                                ].map((s, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className={`text-xl font-extrabold ${s.color} flex items-center gap-0.5`}>
                                            {s.isCurrency !== false && <IndianRupee className="w-4 h-4 opacity-60" strokeWidth={3} />}
                                            {s.value.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 px-8 py-4">
                        {merchantLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-slate-500 font-medium">Loading transactions...</p>
                            </div>
                        ) : merchantTxs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                                <FileText className="w-10 h-10" />
                                <p className="font-medium">No transactions found for this merchant.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold border-b border-slate-100">
                                        <th className="py-3 text-left">Date</th>
                                        <th className="py-3 text-left">Description</th>
                                        <th className="py-3 text-center">Type</th>
                                        <th className="py-3 text-center">Status</th>
                                        <th className="py-3 text-right">Gross</th>
                                        <th className="py-3 text-right">Comm.</th>
                                        <th className="py-3 text-right">Net</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {merchantTxs.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 text-slate-500 text-[11px] font-bold whitespace-nowrap pr-4">
                                                {format(new Date(tx.createdAt), "dd MMM yy, hh:mm a")}
                                            </td>
                                            <td className="py-3 font-semibold text-slate-800 max-w-[180px] truncate">{tx.description}</td>
                                            <td className="py-3 text-center">
                                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase">
                                                    {tx.type?.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge className={cn(
                                                    "rounded-full px-2 py-0.5 text-[9px] font-bold border",
                                                    tx.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    tx.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                    "bg-red-50 text-red-700 border-red-200"
                                                )}>
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right text-slate-500 font-bold">₹{(tx.grossAmount || 0).toLocaleString()}</td>
                                            <td className="py-3 text-right text-amber-600 font-bold">₹{(tx.commission || 0).toLocaleString()}</td>
                                            <td className="py-3 text-right text-emerald-700 font-extrabold">₹{(tx.amount || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AdminTransactionLedgerPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-primary font-medium">Loading Ledger...</p>
            </div>
        }>
            <LedgerContent />
        </Suspense>
    );
}

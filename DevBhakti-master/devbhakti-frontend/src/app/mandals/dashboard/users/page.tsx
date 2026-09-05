"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Users,
    Search,
    User,
    Phone,
    Mail,
    Calendar as CalendarIcon,
    IndianRupee,
    Eye,
    X,
    Heart,
    MapPin,
    Filter,
    ShieldCheck,
    ArrowLeft,
    TrendingUp,
    FileText,
    Receipt,
    CheckCircle2,
    Clock,
    Share2,
    Copy,
    Building2,
    Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchMandalDevotees } from "@/api/mandalAdminController";
import * as XLSX from "xlsx";

interface DevoteeGroup {
    key: string;
    donorName: string;
    donorPhone: string;
    donorEmail: string;
    address?: string;
    panNumber?: string;
    is80GRequired?: boolean;
    totalAmount: number;
    donationCount: number;
    lastDonationDate: string;
    firstDonationDate: string;
    donations: any[];
}

export default function MandalUsersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 400);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [devoteeGroups, setDevoteeGroups] = useState<DevoteeGroup[]>([]);
    const [selectedDevotee, setSelectedDevotee] = useState<DevoteeGroup | null>(null);
    const [detailSearch, setDetailSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const { toast } = useToast();

    const [stats, setStats] = useState({
        totalAmount: 0,
        totalDonors: 0,
        successCount: 0,
    });

    const fetchDevoteesData = async (page: number) => {
        try {
            setLoading(true);
            const params: any = {
                search: debouncedSearch,
                page: page.toString(),
                limit: "50",
            };
            if (dateRange?.from) params.startDate = dateRange.from.toISOString();
            if (dateRange?.to) params.endDate = dateRange.to.toISOString();

            const response = await fetchMandalDevotees(params);
            if (response.success) {
                setDevoteeGroups(response.data || []);
                if (response.stats) {
                    setStats({
                        totalAmount: response.stats.totalAmount || 0,
                        totalDonors: response.stats.totalDonors || 0,
                        successCount: response.stats.successCount || 0
                    });
                }
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages || 1);
                    setTotalItems(response.pagination.total || 0);
                }
            }
        } catch (error) {
            console.error("Fetch Mandal Devotees Error:", error);
            toast({ title: "Error", description: "Failed to load devotees data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevoteesData(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, dateRange, currentPage]);

    // devoteeGroups is populated directly from GET /api/mandal-admin/devotees API response.

    const handleExportExcel = async () => {
        try {
            if (devoteeGroups.length === 0) {
                toast({ title: "No Data", description: "There are no devotees to export", variant: "destructive" });
                return;
            }

            toast({ title: "Exporting...", description: "Preparing data for export" });

            const exportData = devoteeGroups.map((d: any) => ({
                "Name": d.donorName || "Anonymous",
                "Phone": d.donorPhone || "N/A",
                "Email": d.donorEmail || "N/A",
                "Address": d.address || "N/A",
                "Total Donations": d.donationCount,
                "Total Amount (₹)": d.totalAmount,
                "PAN Number": d.panNumber || "N/A",
                "80G Required": d.is80GRequired ? "Yes" : "No",
                "First Contribution": format(new Date(d.firstDonationDate), "dd MMM yyyy"),
                "Last Contribution": format(new Date(d.lastDonationDate), "dd MMM yyyy")
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Devotees");
            XLSX.writeFile(wb, `Mandal_Devotees_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (error) {
            console.error("Export Error:", error);
            toast({ title: "Export Failed", description: "Failed to export data", variant: "destructive" });
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    };

    const getInitials = (name: string) => {
        if (!name || name === "Anonymous") return "D";
        const parts = name.split(" ");
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: `${label} copied to clipboard!` });
    };

    // Filtered donations for the selected devotee in detail view
    const filteredDevoteeDonations = useMemo(() => {
        if (!selectedDevotee) return [];
        if (!detailSearch.trim()) return selectedDevotee.donations;
        const q = detailSearch.toLowerCase();
        return selectedDevotee.donations.filter((d: any) =>
            d.id?.toLowerCase().includes(q) ||
            d.displayId?.toLowerCase().includes(q) ||
            d.amount?.toString().includes(q) ||
            d.paymentMethod?.toLowerCase().includes(q) ||
            d.message?.toLowerCase().includes(q)
        );
    }, [selectedDevotee, detailSearch]);

    // ==========================================
    // FULL PAGE DEVOTEE DETAIL VIEW
    // ==========================================
    if (selectedDevotee) {
        const avgDonation = selectedDevotee.donationCount > 0
            ? Math.round(selectedDevotee.totalAmount / selectedDevotee.donationCount)
            : 0;

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Navigation Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDevotee(null)}
                            className="rounded-full border-slate-200 hover:bg-[#7b4623] hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                                    {selectedDevotee.donorName || "Anonymous Devotee"}
                                </h1>
                                <Badge className="bg-[#7b4623] text-white border-0 font-medium">
                                    Devotee Profile
                                </Badge>
                                {selectedDevotee.is80GRequired && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold text-xs">
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                        80G Tax Benefits Claimed
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Viewing complete donation history and donor information for your mandal.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDevotee(null)}
                        className="self-start sm:self-auto border-slate-200"
                    >
                        <X className="w-4 h-4 mr-1" /> Close Details
                    </Button>
                </div>

                {/* Top Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Donated</p>
                            <p className="text-2xl font-bold text-emerald-800 mt-1">
                                {formatCurrency(selectedDevotee.totalAmount)}
                            </p>
                            <p className="text-[11px] text-emerald-600 mt-1">Across all contributions</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Donations</p>
                            <p className="text-2xl font-bold text-[#7b4623] mt-1">
                                {selectedDevotee.donationCount} {selectedDevotee.donationCount === 1 ? "Time" : "Times"}
                            </p>
                            <p className="text-[11px] text-amber-700 mt-1">Recorded contributions</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Average Donation</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                                {formatCurrency(avgDonation)}
                            </p>
                            <p className="text-[11px] text-blue-600 mt-1">Per transaction avg</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardContent className="p-4">
                            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">First Contribution</p>
                            <p className="text-sm font-bold text-purple-900 mt-2 truncate">
                                {format(new Date(selectedDevotee.firstDonationDate), "dd MMM yyyy")}
                            </p>
                            <p className="text-[11px] text-purple-600 mt-1">
                                Last: {format(new Date(selectedDevotee.lastDonationDate), "dd MMM yyyy")}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid: Left Profile Details, Right Donation Records */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Personal Info Card */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border shadow-sm overflow-hidden bg-white">
                            <div className="h-20 bg-gradient-to-r from-[#7b4623] to-[#a05a2c] relative" />
                            <CardContent className="pt-0 relative px-6 pb-6">
                                <div className="-mt-10 mb-4 flex justify-between items-end">
                                    <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg">
                                        <div className="w-full h-full rounded-xl bg-[#7b4623] text-white font-bold text-2xl flex items-center justify-center">
                                            {getInitials(selectedDevotee.donorName)}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-900 text-xl">
                                    {selectedDevotee.donorName || "Anonymous Devotee"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Devotee & Mandal Contributor</p>

                                <div className="mt-6 space-y-4 text-sm border-t pt-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Contact Information
                                    </h4>

                                    {selectedDevotee.donorPhone ? (
                                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                                    <Phone className="w-4 h-4 text-[#7b4623]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase">Phone Number</p>
                                                    <p className="font-medium text-slate-800 truncate">{selectedDevotee.donorPhone}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => copyToClipboard(selectedDevotee.donorPhone, "Phone number")}
                                                title="Copy Phone"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl text-slate-400 text-xs">
                                            <Phone className="w-4 h-4 shrink-0" /> No phone provided
                                        </div>
                                    )}

                                    {selectedDevotee.donorEmail ? (
                                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                    <Mail className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase">Email Address</p>
                                                    <p className="font-medium text-slate-800 truncate">{selectedDevotee.donorEmail}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => copyToClipboard(selectedDevotee.donorEmail, "Email address")}
                                                title="Copy Email"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl text-slate-400 text-xs">
                                            <Mail className="w-4 h-4 shrink-0" /> No email provided
                                        </div>
                                    )}

                                    {selectedDevotee.address && (
                                        <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <MapPin className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase">Postal Address</p>
                                                <p className="font-medium text-slate-800 text-xs leading-relaxed mt-0.5">
                                                    {selectedDevotee.address}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 80G Tax & PAN Details */}
                                {(selectedDevotee.panNumber || selectedDevotee.is80GRequired) && (
                                    <div className="mt-6 border-t pt-4 space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Tax Exempt & Compliance
                                        </h4>
                                        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-2">
                                            {selectedDevotee.panNumber && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 font-medium">PAN Card Number:</span>
                                                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                                                        {selectedDevotee.panNumber}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedDevotee.is80GRequired && (
                                                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium pt-1 border-t border-amber-200/50">
                                                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                                                    Requires 80G Tax Certificate Receipt
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Donation History Table */}
                    <div className="lg:col-span-8 space-y-4">
                        <Card className="border shadow-sm bg-white">
                            <CardHeader className="p-4 sm:p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-[#7b4623]" />
                                        Donation Records ({selectedDevotee.donations.length})
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Complete transaction breakdown for this devotee
                                    </p>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Search records..."
                                        className="pl-9 h-9 text-xs border-slate-200"
                                        value={detailSearch}
                                        onChange={(e) => setDetailSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {filteredDevoteeDonations.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 text-sm">
                                        No donation records match your search.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {filteredDevoteeDonations.map((item: any) => (
                                            <div
                                                key={item.id}
                                                className="p-4 hover:bg-slate-50/80 transition-colors space-y-3"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                            <IndianRupee className="w-5 h-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-emerald-800">
                                                                    {formatCurrency(item.amount)}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    {item.status || "SUCCESS"}
                                                                </Badge>
                                                                {item.is80GRequired && (
                                                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[9px]">
                                                                        80G
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                                <span>ID: #{item.displayId || item.id?.slice(-8).toUpperCase()}</span>
                                                                <span>•</span>
                                                                <span className="capitalize">{item.paymentMethod || "ONLINE"}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-left sm:text-right text-xs text-slate-500">
                                                        <p className="font-medium text-slate-700">{formatDate(item.createdAt)}</p>
                                                        {item.razorpayOrderId && (
                                                            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                                                Order: {item.razorpayOrderId}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Optional Devotional Note / Message */}
                                                {item.message && (
                                                    <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl text-xs text-slate-700 italic">
                                                        <span className="font-semibold not-italic text-amber-900 mr-1">Devotional Note:</span>
                                                        "{item.message}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LIST VIEW (ALL DEVOTEES TABLE)
    // ==========================================
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Devotees & Donors
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View devotees and donors who have donated to your mandal.
                    </p>
                </div>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50/70">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-800 font-medium">Total Devotees / Donors</p>
                                <p className="text-2xl font-bold text-[#7b4623] mt-1">
                                    {stats.totalDonors.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-[#7b4623]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50/70">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-700 font-medium">Total Collection</p>
                                <p className="text-2xl font-bold text-emerald-800 mt-1">
                                    {formatCurrency(stats.totalAmount)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50/70">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Successful Donations</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                    {stats.successCount.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by devotee name, phone, or email..."
                        className="pl-10 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10 h-10"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <div className="flex gap-2 shrink-0">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-[240px] justify-start text-left font-normal border-slate-200 h-10",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "dd MMM")} –{" "}
                                        {format(dateRange.to, "dd MMM, yyyy")}
                                    </>
                                ) : (
                                    format(dateRange.from, "dd MMM, yyyy")
                                )
                            ) : (
                                "Filter by Date"
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        {dateRange && (
                            <div className="p-3 border-t flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDateRange(undefined)}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>

                <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    className="h-10 px-4 rounded-md border-slate-200 hover:bg-[#7b4623]/5 text-[#7b4623] gap-2 flex items-center shrink-0"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline font-semibold">Export</span>
                </Button>
                </div>
            </div>

            {/* Devotees List / Table */}
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Devotee</span>
                    <span>Contact Info</span>
                    <span>Donations</span>
                    <span>Total Donated</span>
                    <span>Last Active</span>
                    <span className="text-right">Action</span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-8 h-8 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading devotees...</p>
                    </div>
                ) : devoteeGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                        <Users className="w-12 h-12 opacity-20 text-[#7b4623]" />
                        <p className="font-medium">No devotees found</p>
                        <p className="text-sm text-center max-w-xs">
                            {debouncedSearch || dateRange
                                ? "No devotees match your search criteria."
                                : "Devotees who contribute to your mandal will be listed here."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {devoteeGroups.map((devotee) => (
                            <div
                                key={devotee.key}
                                className="flex flex-col md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-4 py-4 hover:bg-amber-50/30 transition-colors items-center cursor-pointer"
                                onClick={() => setSelectedDevotee(devotee)}
                            >
                                {/* Devotee Name & Avatar */}
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded-full bg-[#7b4623]/10 text-[#7b4623] font-semibold text-sm flex items-center justify-center shrink-0">
                                        {getInitials(devotee.donorName)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-semibold text-slate-900 text-sm truncate">
                                                {devotee.donorName || "Anonymous Devotee"}
                                            </p>
                                            {devotee.is80GRequired && (
                                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0"  />
                                            )}
                                        </div>
                                        {devotee.address && (
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]" title={devotee.address}>
                                                {devotee.address}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="w-full text-xs text-slate-600 space-y-0.5">
                                    {devotee.donorPhone ? (
                                        <p className="flex items-center gap-1.5 font-medium text-slate-800">
                                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                            {devotee.donorPhone}
                                        </p>
                                    ) : null}
                                    {devotee.donorEmail ? (
                                        <p className="flex items-center gap-1.5 text-slate-500 truncate max-w-[180px]">
                                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                            {devotee.donorEmail}
                                        </p>
                                    ) : null}
                                    {!devotee.donorPhone && !devotee.donorEmail && (
                                        <span className="text-slate-400 italic">No contact info</span>
                                    )}
                                </div>

                                {/* Total Donations Count */}
                                <div className="flex items-center md:block w-full">
                                    <span className="text-xs text-slate-500 md:hidden mr-2">Donations:</span>
                                    <Badge variant="secondary" className="bg-amber-100/60 text-[#7b4623] hover:bg-amber-100 border-0 font-medium">
                                        {devotee.donationCount} {devotee.donationCount === 1 ? "Contribution" : "Contributions"}
                                    </Badge>
                                </div>

                                {/* Total Amount */}
                                <div className="flex items-center md:block w-full">
                                    <span className="text-xs text-slate-500 md:hidden mr-2">Total Donated:</span>
                                    <span className="font-bold text-emerald-700 text-sm">
                                        {formatCurrency(devotee.totalAmount)}
                                    </span>
                                </div>

                                {/* Last Active Date */}
                                <div className="flex items-center md:block w-full">
                                    <span className="text-xs text-slate-500 md:hidden mr-2">Last Active:</span>
                                    <span className="text-xs text-slate-500">
                                        {format(new Date(devotee.lastDonationDate), "dd MMM yyyy")}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end w-full md:w-auto">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:bg-[#7b4623] hover:text-white text-slate-700 gap-1 border border-slate-200 sm:border-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDevotee(devotee);
                                        }}
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span className="text-xs font-medium">View Profile</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
                        <p className="text-xs text-slate-500">
                            Page {currentPage} of {totalPages} ({totalItems} records)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Heart,
    Search,
    CheckCircle2,
    Eye,
    User,
    Phone,
    Mail,
    X,
    IndianRupee,
    Download,
    TrendingUp,
    Users,
    Calendar as CalendarIcon,
    Filter,
    MapPin,
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
import { fetchMandalDonations, fetchMandalDonationStats } from "@/api/mandalAdminController";
import * as XLSX from "xlsx";

export default function MandalDonationClient() {
    const searchParams = useSearchParams();
    const typeParam = searchParams.get("type")?.toUpperCase();

    const [donationType, setDonationType] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [donations, setDonations] = useState<any[]>([]);
    const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        if (typeParam === "ONLINE" || typeParam === "OFFLINE") {
            setDonationType(typeParam);
        } else {
            setDonationType("all");
        }
    }, [typeParam]);

    const [stats, setStats] = useState({
        totalAmount: 0,
        totalDonors: 0,
        successCount: 0,
    });

    // Load donations
    const fetchDonationsData = async (page: number) => {
        try {
            setLoading(true);
            const params: any = {
                search: debouncedSearch,
                page: page.toString(),
                limit: "10",
            };
            if (donationType && donationType !== "all") {
                params.donationType = donationType;
            }
            if (dateRange?.from) params.startDate = dateRange.from.toISOString();
            if (dateRange?.to) params.endDate = dateRange.to.toISOString();

            const response = await fetchMandalDonations(params);
            if (response.success) {
                setDonations(response.data || []);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages || 1);
                    setTotalItems(response.pagination.total || 0);
                }
            }
        } catch (error) {
            console.error("Fetch Donations Error:", error);
            toast({ title: "Error", description: "Failed to load donations", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatsData = async () => {
        try {
            const response = await fetchMandalDonationStats();
            if (response.success) {
                const s = response.data;
                setStats({
                    totalAmount: s.totalAmount || 0,
                    totalDonors: s.totalDonors || 0,
                    successCount: s.successCount || 0,
                });
            }
        } catch (error) {
            console.error("Fetch Stats Error:", error);
        }
    };

    useEffect(() => {
        fetchDonationsData(currentPage);
        fetchStatsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, dateRange, donationType, currentPage]);

    // Export full data
    const handleExportExcel = async () => {
        try {
            const params: any = {
                search: debouncedSearch,
                limit: "5000",
            };
            if (donationType && donationType !== "all") {
                params.donationType = donationType;
            }
            if (dateRange?.from) params.startDate = dateRange.from.toISOString();
            if (dateRange?.to) params.endDate = dateRange.to.toISOString();

            toast({ title: "Exporting...", description: "Preparing data for export" });
            const response = await fetchMandalDonations(params);
            
            if (response.success && response.data) {
                if (response.data.length === 0) {
                    toast({ title: "No Data", description: "There are no donations to export", variant: "destructive" });
                    return;
                }

                const exportData = response.data.map((d: any) => ({
                    "Donation ID": d.displayId || d.id,
                    "Donor Name": d.donorName || "Anonymous",
                    "Phone": d.donorPhone || "N/A",
                    "Email": d.donorEmail || "N/A",
                    "Amount (₹)": d.amount,
                    "Date": format(new Date(d.createdAt), "dd MMM yyyy, hh:mm a"),
                    "Payment Method": d.paymentMethod || "ONLINE",
                    "Status": d.status || "SUCCESS",
                    "Message": d.message || "N/A",
                    "Address": d.address || "N/A"
                }));

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Donations");
                XLSX.writeFile(wb, `Mandal_Donations_${new Date().toISOString().slice(0, 10)}.xlsx`);
            }
        } catch (error) {
            console.error("Export Error:", error);
            toast({ title: "Export Failed", description: "Failed to export donations data", variant: "destructive" });
        }
    };

    // Format currency
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Donations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {typeParam === "ONLINE"
                            ? "Viewing online donations received by your mandal."
                            : typeParam === "OFFLINE"
                            ? "Viewing offline donations recorded for your mandal."
                            : "All donations received by your mandal."}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Total Collected</p>
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

                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total Donors</p>
                                <p className="text-2xl font-bold text-blue-800 mt-1">
                                    {stats.totalDonors.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Successful</p>
                                <p className="text-2xl font-bold text-amber-800 mt-1">
                                    {stats.successCount.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search by donor name or ID..."
                        className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:border-[#7b4623] transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 shrink-0 flex-wrap">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm min-w-0">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <select
                            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-slate-700"
                            value={donationType}
                            onChange={(e) => {
                                setDonationType(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">All Donations</option>
                            <option value="ONLINE">Online Donations</option>
                            <option value="OFFLINE">Offline Donations</option>
                        </select>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-[240px] justify-start text-left font-medium border-slate-200 h-12 rounded-xl shadow-sm hover:bg-slate-50 transition-colors",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "MMM dd")} –{" "}
                                            {format(dateRange.to, "MMM dd, yyyy")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "MMM dd, yyyy")
                                    )
                                ) : (
                                    "Filter by date"
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
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
                        className="h-12 px-6 rounded-xl border-slate-200 shadow-sm hover:bg-[#7b4623]/5 text-[#7b4623] font-bold flex items-center gap-2 shrink-0 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export All</span>
                    </Button>
                </div>
            </div>

            {/* Donations Table */}
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Donor</span>
                    <span>Amount</span>
                    <span>Method</span>
                    <span>Date</span>
                    <span>Actions</span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-8 h-8 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading donations...</p>
                    </div>
                ) : donations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                        <Heart className="w-12 h-12 opacity-20" />
                        <p className="font-medium">No donations found</p>
                        <p className="text-sm text-center max-w-xs">
                            {debouncedSearch || dateRange
                                ? "No results match your filters. Try adjusting your search."
                                : "Donations made to your mandal will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {donations.map((donation) => (
                            <div
                                key={donation.id}
                                className="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-4 py-4 hover:bg-slate-50/70 transition-colors"
                            >
                                {/* Donor */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#7b4623]/10 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-[#7b4623]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm truncate">
                                            {donation.donorName || "Anonymous"}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            #{donation.id?.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="flex items-center md:block">
                                    <span className="text-xs text-slate-500 md:hidden mr-2 w-16 shrink-0">Amount:</span>
                                    <span className="font-bold text-emerald-700">
                                        {formatCurrency(donation.amount)}
                                    </span>
                                </div>

                                {/* Method */}
                                <div className="flex items-center md:block">
                                    <span className="text-xs text-slate-500 md:hidden mr-2 w-16 shrink-0">Method:</span>
                                    <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-600 capitalize">
                                        {(donation.paymentMethod || "ONLINE").toLowerCase()}
                                    </Badge>
                                </div>

                                {/* Date */}
                                <div className="flex items-center md:block">
                                    <span className="text-xs text-slate-500 md:hidden mr-2 w-16 shrink-0">Date:</span>
                                    <span className="text-sm text-slate-500">
                                        {formatDate(donation.createdAt)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-[#7b4623]/10 hover:text-[#7b4623]"
                                        onClick={() => setSelectedDonation(donation)}
                                        title="View details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
                        <p className="text-sm text-muted-foreground">
                            Showing {donations.length} of {totalItems} donations
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    const newPage = currentPage - 1;
                                    setCurrentPage(newPage);
                                    fetchDonationsData(newPage);
                                }}
                            >
                                Previous
                            </Button>
                            <span className="flex items-center text-sm text-slate-600 px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    const newPage = currentPage + 1;
                                    setCurrentPage(newPage);
                                    fetchDonationsData(newPage);
                                }}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Donation Detail Modal */}
            {selectedDonation && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedDonation(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#7b4623]/10 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-[#7b4623]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Donation Details</h3>
                                    <p className="text-xs text-slate-500">
                                        #{selectedDonation.id?.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedDonation(null)}
                                className="rounded-full hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            {/* Amount */}
                            <div className="text-center py-4 bg-emerald-50 rounded-xl">
                                <p className="text-sm text-emerald-600 font-medium">Donation Amount</p>
                                <p className="text-3xl font-bold text-emerald-700 mt-1">
                                    {formatCurrency(selectedDonation.amount)}
                                </p>
                                <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {selectedDonation.status || "SUCCESS"}
                                </Badge>
                            </div>

                            {/* Donor Info */}
                            <div className="space-y-3">
                                {selectedDonation.donorName && (
                                    <div className="flex items-start gap-3">
                                        <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500">Donor Name</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {selectedDonation.donorName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedDonation.donorPhone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500">Phone</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {selectedDonation.donorPhone}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedDonation.donorEmail && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500">Email</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {selectedDonation.donorEmail}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedDonation.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500">Address</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {selectedDonation.address}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedDonation.message && (
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 mb-1">Message</p>
                                        <p className="text-sm text-slate-700 italic">
                                            "{selectedDonation.message}"
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <CalendarIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Date & Time</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {formatDate(selectedDonation.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                        <span className="text-slate-400 text-xs">₹</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Payment Method</p>
                                        <p className="text-sm font-medium text-slate-900 capitalize">
                                            {(selectedDonation.paymentMethod || "ONLINE").toLowerCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t">
                            <Button
                                className="w-full bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl"
                                onClick={() => setSelectedDonation(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

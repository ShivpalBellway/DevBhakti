"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    Search,
    Filter,
    MoreVertical,
    Clock,
    CheckCircle,
    CheckCircle2,
    XCircle,
    Eye,
    Building2,
    User,
    Phone,
    Mail,
    X,
    Trash2,
    ChevronDown,
    IndianRupee,
    Gift,
    Sparkles,
    FileText,
    MapPin,
    Calendar as CalendarIcon,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { API_URL } from "@/config/apiConfig";
import { parseLocalizedValue } from "@/utils/textUtils";
import { generateReceiptHTML } from "@/utils/donationReceipt";
import { Download } from "lucide-react";
import axios from "axios";
import { fetchAllTemplesAdmin, fetchAllDonationsAdmin, createDonationAdmin } from "@/api/adminController";
import * as XLSX from 'xlsx';

const statusConfig = {
    SUCCESS: {
        label: "Success",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
    },
    PENDING: {
        label: "Pending",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
    },
    FAILED: {
        label: "Failed",
        color: "bg-rose-100 text-rose-700 border-rose-200",
        icon: XCircle,
    },
};

export default function DonationClient() {
    const [donationType, setDonationType] = useState<"ONLINE" | "OFFLINE">("ONLINE");
    const [donationSource, setDonationSource] = useState<"ALL" | "TEMPLE" | "MANDAL">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState("SUCCESS");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    
    const [temples, setTemples] = useState<any[]>([]);
    const [selectedTempleId, setSelectedTempleId] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });
    const { toast } = useToast();
    const router = useRouter();

    const [stats, setStats] = useState({
        totalAmount: 0,
        successCount: 0,
        pendingCount: 0,
        failedCount: 0,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const data = await fetchAllDonationsAdmin({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter,
                startDate: startDate,
                endDate: endDate,
                templeId: selectedTempleId,
                sortBy: sortBy,
                sortOrder: sortOrder,
                donationType: donationType,
                donationSource: donationSource,
            });

            if (data.success) {
                setDonations(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.total);
            }
        } catch (error) {
            console.error("Fetch Donations Error:", error);
            toast({ title: "Error", description: "Failed to fetch donations", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const loadTemples = async () => {
        try {
            const res = await fetchAllTemplesAdmin({ page: 1, limit: 1000, isVerified: true, isActive: true });
            const data = Array.isArray(res) ? res : (res.data || []);
            setTemples(data);
        } catch (error) {
            console.error("Load Temples Error:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/donations/stats`, { validateStatus: () => true });
            const data = response.data;
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error("Fetch Stats Error:", error);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, [debouncedSearch, statusFilter, selectedTempleId, currentPage, startDate, endDate, sortBy, sortOrder, donationType, donationSource]);

    useEffect(() => {
        if (dateRange?.from) {
            setStartDate(format(dateRange.from, "yyyy-MM-dd"));
        } else {
            setStartDate("");
        }
        if (dateRange?.to) {
            setEndDate(format(dateRange.to, "yyyy-MM-dd"));
        } else {
            setEndDate("");
        }
    }, [dateRange]);

    useEffect(() => {
        fetchStats();
        loadTemples();
    }, []);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePrintReceipt = (donation: any) => {
        const parsedName = parseLocalizedValue(donation.templeName, "en");
        const mappedTemple = temples.find(t => (t.temple?.id || t.id) === donation.templeId);
        const fallbackName = mappedTemple ? parseLocalizedValue(mappedTemple.temple?.name || mappedTemple.name, "en") : "Sacred Temple Offering";
        const finalName = (parsedName && parsedName !== "N/A") ? parsedName : fallbackName;

        const html = generateReceiptHTML({
            ...donation,
            templeName: finalName
        });
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            const response = await axios.delete(`${API_URL}/admin/donations/${id}`, { validateStatus: () => true });
            const data = response.data;
            if (data.success) {
                setDonations(donations.filter(d => d.id !== id));
                toast({ title: "Success", description: data.message || "Donation record removed", variant: "success" });
                fetchStats();
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Delete Error:", error);
            toast({ title: "Error", description: "Failed to delete donation", variant: "destructive" });
        }
    };

    const handleDownloadExcel = async () => {
        try {
            toast({ title: "Exporting...", description: "Gathering donation data. Please wait." });
            const res = await fetchAllDonationsAdmin({
                page: 1, limit: 10000,
                search: debouncedSearch,
                status: statusFilter,
                templeId: selectedTempleId,
                startDate, endDate,
                sortBy, sortOrder,
                donationType: donationType,
                donationSource: donationSource,
            });

            const rawData = res.data || [];
            if (rawData.length === 0) {
                toast({ title: "No Data", description: "No records found to export.", variant: "destructive" });
                return;
            }

            const exportData = rawData.map((d: any) => ({
                "Donation_ID": d.displayId || d.id,
                "Donor_Name": parseLocalizedValue(d.donorName),
                "Donor_Email": d.donorEmail || "",
                "Donor_Phone": d.donorPhone || "",
                "Amount": d.amount,
                "Temple_Name": d.templeName || "DevBhakti",
                "Temple_ID": d.templeId || "",
                "Status": d.status,
                "Payment_Method": d.paymentMethod || "ONLINE",
                "Date": new Date(d.createdAt).toLocaleString(),
                "Address": d.address || "",
                "Message": d.message || "",
                "80G_Required": d.is80GRequired ? "YES" : "NO",
                "PAN": d.panNumber || "",
                "Anonymous": d.isAnonymous ? "YES" : "NO"
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
            XLSX.writeFile(workbook, `donations_export_${new Date().getTime()}.xlsx`);
            toast({ title: "Success", description: "Export downloaded successfully!", variant: "success" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to export data.", variant: "destructive" });
        }
    };

    const handleSendEmail = async (id: string) => {
        try {
            setSendingEmail(true);
            const response = await axios.post(`${API_URL}/admin/donations/send-email/${id}`, {}, { validateStatus: () => true });
            const data = response.data;
            if (data.success) {
                toast({ title: "Success", description: data.message || "Receipt sent successfully via email!", variant: "success" });
            } else {
                toast({ title: "Error", description: data.message || "Failed to send email", variant: "destructive" });
            }
        } catch (error) {
            console.error("Send Email Error:", error);
            toast({ title: "Error", description: "An error occurred while sending email", variant: "destructive" });
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-foreground break-words">
                        Donation
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                        View and manage all sacred contributions from devotees
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {donationType === "OFFLINE" && (
                        <Button
                            onClick={() => router.push("/admin/donation/add-offline")}
                            variant="outline"
                            className="w-full sm:w-auto flex-shrink-0 border-primary/20 hover:bg-primary/5 hover:text-primary"
                        >
                            <Gift className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Add Offline Donation</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    )}
                    <Button
                        onClick={handleDownloadExcel}
                        variant="sacred"
                        className="w-full sm:w-auto flex-shrink-0"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Export All</span>
                        <span className="sm:hidden">Export</span>
                    </Button>
                </div>
            </div>

            {/* Donation Type Tabs */}
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-border shadow-sm w-fit flex-wrap">
                <button
                    onClick={() => {
                        setDonationType("ONLINE");
                        setCurrentPage(1);
                    }}
                    className={cn(
                        "px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        donationType === "ONLINE"
                            ? "bg-primary text-white shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    💳 Online Donations
                </button>
                <button
                    onClick={() => {
                        setDonationType("OFFLINE");
                        setCurrentPage(1);
                    }}
                    className={cn(
                        "px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        donationType === "OFFLINE"
                            ? "bg-primary text-white shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    📝 Offline Donations
                </button>

                {/* Separator */}
                <div className="w-px bg-border mx-1" />

                <button
                    onClick={() => { setDonationSource("ALL"); setCurrentPage(1); }}
                    className={cn(
                        "px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        donationSource === "ALL"
                            ? "bg-amber-600 text-white shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    🙏 All Sources
                </button>
                <button
                    onClick={() => { setDonationSource("TEMPLE"); setCurrentPage(1); }}
                    className={cn(
                        "px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        donationSource === "TEMPLE"
                            ? "bg-amber-600 text-white shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    🛕 Temple Donations
                </button>
                <button
                    onClick={() => { setDonationSource("MANDAL"); setCurrentPage(1); }}
                    className={cn(
                        "px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                        donationSource === "MANDAL"
                            ? "bg-amber-600 text-white shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    🔱 Mandal Donations
                </button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <Card className="bg-white border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Success</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">₹{stats.totalAmount.toLocaleString()}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Success Count</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">{stats.successCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pending</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">{stats.pendingCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Failed</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">{stats.failedCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar and Donations Table - Keep your existing working code here */}
            <div className="flex flex-col gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Donation ID, Name, Temple, Donor ID..."
                            className="pl-10 h-10 sm:h-11 bg-muted/20 border-none rounded-xl text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-transparent hover:border-border transition-all min-w-0">
                            <Filter className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                            <select
                                className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-2 min-w-0"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-transparent hover:border-border transition-all min-w-0">
                            <Building2 className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                            <select
                                className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-2 min-w-0 max-w-[150px]"
                                value={selectedTempleId}
                                onChange={(e) => setSelectedTempleId(e.target.value)}
                            >
                                <option value="all">All Temples</option>
                                {temples.map((t: any) => (
                                    <option key={t.temple?.id || t.id} value={t.temple?.id || t.id}>
                                        {parseLocalizedValue(t.temple?.name || t.name)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-10 sm:h-11 justify-start text-left font-normal bg-muted/20 border-none rounded-xl w-full lg:w-64",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
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
                                            className="text-xs"
                                            onClick={() => setDateRange(undefined)}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-transparent hover:border-border transition-all min-w-0">
                            <Clock className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                            <select
                                className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none cursor-pointer pr-2 min-w-0"
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split("-");
                                    setSortBy(field);
                                    setSortOrder(order);
                                }}
                            >
                                <option value="createdAt-desc">Newest First</option>
                                <option value="createdAt-asc">Oldest First</option>
                                <option value="amount-desc">Amount: High to Low</option>
                                <option value="amount-asc">Amount: Low to High</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Donations Table - Keep your existing working code here */}
            <Card className="border-none shadow-sacred overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full min-w-[1200px]">
                            <thead className="border-b border-primary/10 bg-primary/5">
                                <tr>
                                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">Donation ID</th>
                                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">Donor</th>
                                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">Temple / Mandal</th>
                                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">Date</th>
                                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">Status</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-bold text-primary/80 uppercase tracking-wider whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                                <p className="text-muted-foreground font-medium italic">Loading sacred records...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : donations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 sm:p-12 text-center text-muted-foreground italic text-sm sm:text-base">No donations found in this realm</td>
                                    </tr>
                                ) : donations.map((donation, index) => {
                                    const status = statusConfig[donation.status as keyof typeof statusConfig] || statusConfig.SUCCESS;
                                    return (
                                        <motion.tr
                                            key={donation.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="border-b border-primary/5 hover:bg-primary/5 transition-colors group"
                                        >
                                            <td className="p-3 sm:p-4">
                                                <p className="font-mono text-xs font-bold text-primary/60 group-hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-none">
                                                    {donation.displayId ? donation.displayId : `#${donation.id.slice(-8).toUpperCase()}`}
                                                </p>
                                            </td>
                                            <td className="p-3 sm:p-4">
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm flex-shrink-0 ${donation.isAnonymous ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary border border-primary/20"}`}>
                                                        {donation.isAnonymous ? "?" : donation.donorName?.split(' ')[0]?.[0] || "D"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base truncate">{parseLocalizedValue(donation.donorName)}</p>
                                                        {donation.isAnonymous && <span className="text-[8px] sm:text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-black text-slate-400 tracking-tighter inline-block">Anonymous</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 sm:p-4">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                                                        donation.donationSource === 'MANDAL'
                                                            ? 'bg-orange-50 border-orange-100'
                                                            : 'bg-slate-50 border-slate-100'
                                                    }`}>
                                                        {donation.donationSource === 'MANDAL'
                                                            ? <span className="text-xs">🔱</span>
                                                            : <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs sm:text-sm font-semibold text-foreground truncate block">
                                                            {donation.donationSource === 'MANDAL'
                                                                ? (donation.mandalName || 'Mandal Donation')
                                                                : (donation.templeName || 'Temple Donation')
                                                            }
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                                            donation.donationSource === 'MANDAL'
                                                                ? 'bg-orange-100 text-orange-600'
                                                                : 'bg-blue-50 text-blue-500'
                                                        }`}>
                                                            {donation.donationSource === 'MANDAL' ? 'Mandal' : 'Temple'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 sm:p-4">
                                                <p className="font-bold text-sm sm:text-lg text-primary whitespace-nowrap">₹{donation.amount.toLocaleString()}</p>
                                            </td>
                                            <td className="p-3 sm:p-4">
                                                <div className="flex flex-col">
                                                    <p className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">
                                                        {new Date(donation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                                                        {new Date(donation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-3 sm:p-4">
                                                <Badge variant="outline" className={`text-[8px] sm:text-[10px] uppercase font-black tracking-widest px-1.5 sm:px-2 py-1 rounded-lg border-2 whitespace-nowrap ${status.color}`}>
                                                    <status.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="p-3 sm:p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all flex-shrink-0"
                                                        onClick={() => setSelectedDonation(donation)}
                                                    >
                                                        <Eye className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex-shrink-0"
                                                        onClick={() => handleDelete(donation.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>

                {totalPages > 1 && (
                    <div className="p-4 sm:p-6 border-t border-primary/5 bg-primary/2">
                        <div className="overflow-x-auto">
                            <Pagination>
                                <PaginationContent className="flex-wrap justify-center gap-1 sm:gap-2">
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10 hover:text-primary rounded-xl transition-all min-w-[40px] sm:min-w-auto"}
                                        />
                                    </PaginationItem>
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <PaginationItem key={pageNum}>
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => { e.preventDefault(); handlePageChange(pageNum); }}
                                                        isActive={currentPage === pageNum}
                                                        className={currentPage === pageNum ? "bg-primary text-white hover:bg-primary/90 border-none rounded-xl min-w-[32px] sm:min-w-auto" : "cursor-pointer hover:bg-primary/10 hover:text-primary border-none rounded-xl transition-all min-w-[32px] sm:min-w-auto"}
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return (
                                                <PaginationItem key={pageNum}>
                                                    <PaginationEllipsis className="hidden sm:flex" />
                                                    <span className="sm:hidden px-2 text-muted-foreground">...</span>
                                                </PaginationItem>
                                            );
                                        }
                                        return null;
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10 hover:text-primary rounded-xl transition-all min-w-[40px] sm:min-w-auto"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                        <p className="text-center mt-3 sm:mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest break-words px-2">
                            Showing page <span className="text-primary">{currentPage}</span> of <span className="text-primary">{totalPages}</span> — <span className="text-primary">{totalItems}</span> sacred entries found
                        </p>
                    </div>
                )}
            </Card>

            {/* Donation Detail Modal - Keep your existing working code here */}
            <AnimatePresence>
                {selectedDonation && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDonation(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[20px] sm:rounded-[32px] w-full max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
                        >
                            <div className="bg-[#7c4624] p-4 sm:p-8 text-white relative flex-shrink-0">
                                <button
                                    onClick={() => setSelectedDonation(null)}
                                    className="absolute right-3 sm:right-6 top-3 sm:top-1/2 sm:-translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-20"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <div className="flex items-center gap-3 sm:gap-4 pr-10 sm:pr-0">
                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md flex-shrink-0">
                                        <Heart className="w-4 h-4 sm:w-7 sm:h-7" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm sm:text-2xl font-serif font-bold truncate">Donation Details</h3>
                                        <p className="text-white/80 text-[10px] sm:text-sm truncate">Ref: {selectedDonation.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-8 space-y-5 sm:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 sm:gap-3 border-r border-slate-200 pr-2">
                                        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 shadow-sm ${(statusConfig[selectedDonation.status as keyof typeof statusConfig] || statusConfig.SUCCESS).color}`}>
                                            {React.createElement((statusConfig[selectedDonation.status as keyof typeof statusConfig] || statusConfig.SUCCESS).icon, { className: "w-3.5 h-3.5 sm:w-5 sm:h-5" })}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                                            <p className="font-bold text-slate-700 text-[10px] sm:text-sm truncate uppercase">{selectedDonation.status}</p>
                                        </div>
                                    </div>
                                    <div className="pl-2">
                                        <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Method</p>
                                        <p className="font-bold text-slate-700 text-[10px] sm:text-sm truncate uppercase">{selectedDonation.paymentMethod || 'ONLINE'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    <div className="space-y-5">
                                        <div>
                                            <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 shadow-sm inline-block px-1.5 py-0.5 bg-slate-100 rounded">Donor Info</p>
                                            <div className="space-y-2 mt-2">
                                                <p className="text-slate-800 font-bold flex items-center gap-2 text-xs sm:text-base">
                                                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7c4624] flex-shrink-0" />
                                                    <span className="truncate">{parseLocalizedValue(selectedDonation.donorName)}</span>
                                                </p>
                                                {!selectedDonation.isAnonymous && (
                                                    <div className="flex flex-col gap-1.5 pl-5 border-l border-slate-100">
                                                        <p className="text-[10px] sm:text-sm text-slate-600 flex items-center gap-2">
                                                            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-slate-400" />
                                                            <span className="truncate">{selectedDonation.donorPhone}</span>
                                                        </p>
                                                        <p className="text-[10px] sm:text-sm text-slate-600 flex items-center gap-2">
                                                            <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-slate-400" />
                                                            <span className="truncate break-all">{selectedDonation.donorEmail}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 shadow-sm inline-block px-1.5 py-0.5 bg-slate-100 rounded">Temple</p>
                                            <p className="text-slate-800 font-bold flex items-center gap-2 mt-2 text-xs sm:text-base">
                                                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7c4624] flex-shrink-0" />
                                                <span className="truncate">{selectedDonation.templeName}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 shadow-sm inline-block px-1.5 py-0.5 bg-slate-100 rounded">Amount Details</p>
                                            <div className="bg-[#7c4624]/5 p-3 sm:p-4 rounded-xl border border-[#7c4624]/10 mt-2 relative overflow-hidden group">
                                                <div className="absolute right-0 top-0 opacity-5 -rotate-12 transform group-hover:rotate-0 transition-transform duration-500">
                                                    <IndianRupee className="w-16 h-16 text-[#7c4624]" />
                                                </div>
                                                <div className="mb-3">
                                                    <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Sacred Contribution:</span>
                                                    <p className="text-xl sm:text-3xl font-black text-[#7c4624]">₹{selectedDonation.amount.toLocaleString()}</p>
                                                </div>
                                                <div className="space-y-1.5 border-t border-[#7c4624]/10 pt-3">
                                                    <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                                        <span className="text-slate-500">Platform Fee:</span>
                                                        <span className="font-bold text-rose-500">- ₹{(selectedDonation.commissionAmount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                                        <span className="font-bold text-slate-700">Temple Earning:</span>
                                                        <span className="font-black text-emerald-600">₹{(selectedDonation.netEarning || selectedDonation.amount).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[9px] sm:text-[11px] text-slate-400 italic mt-2 text-center">Received on {new Date(selectedDonation.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-slate-100">
                                    {(selectedDonation.address && !selectedDonation.isAnonymous) && (
                                        <div>
                                            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Postal Address</p>
                                            <p className="text-slate-700 font-medium bg-slate-50 p-3 sm:p-4 rounded-xl border border-dashed border-slate-200 text-xs sm:text-sm leading-relaxed break-words">
                                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline-block mr-2 text-slate-400 flex-shrink-0" />
                                                {selectedDonation.address}
                                            </p>
                                        </div>
                                    )}
                                    {selectedDonation.message && (
                                        <div>
                                            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Prayer / Sankalp Message</p>
                                            <div className="bg-yellow-50/50 p-3 sm:p-4 rounded-xl border border-dashed border-yellow-200 text-slate-700 italic text-xs sm:text-sm leading-relaxed break-words">
                                                "{selectedDonation.message}"
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 sm:pt-10 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-auto">
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-slate-200 text-slate-600 h-10 sm:h-11 px-4 w-full sm:w-auto flex items-center justify-center font-bold"
                                            onClick={() => handlePrintReceipt(selectedDonation)}
                                        >
                                            <Download className="w-4 h-4 mr-2" /> 
                                            <span className="text-xs sm:text-sm">Receipt</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-slate-200 text-slate-600 h-10 sm:h-11 px-4 w-full sm:w-auto flex items-center justify-center font-bold"
                                            onClick={() => handleSendEmail(selectedDonation.id)}
                                            disabled={sendingEmail}
                                        >
                                            {sendingEmail ? (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" /> 
                                                    <span className="text-xs sm:text-sm">Sending...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="w-4 h-4 mr-2" /> 
                                                    <span className="text-xs sm:text-sm">Email</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => setSelectedDonation(null)}
                                        className="bg-[#7c4624] hover:bg-[#63361c] rounded-xl px-10 h-10 sm:h-11 w-full sm:w-auto font-black shadow-sacred"
                                    >
                                        CLOSE
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
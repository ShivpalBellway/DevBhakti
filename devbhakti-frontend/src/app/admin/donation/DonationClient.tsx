"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
    Calendar,
    ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { generateReceiptHTML } from "@/utils/donationReceipt";
import { Download } from "lucide-react";
import axios from "axios";

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
    const { toast } = useToast();

    // Stats state
    const [stats, setStats] = useState({
        totalAmount: 0,
        successCount: 0,
        pendingCount: 0,
        failedCount: 0,
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;


    const fetchDonations = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                search: debouncedSearch,
                status: statusFilter,
                startDate: startDate,
                endDate: endDate,
                sortBy: sortBy,
                sortOrder: sortOrder
            });

            const response = await axios.get(`${API_URL}/admin/donations?${query}`, { validateStatus: () => true });
            const data = response.data;

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
    }, [debouncedSearch, statusFilter, currentPage, startDate, endDate, sortBy, sortOrder]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePrintReceipt = (donation: any) => {
        const html = generateReceiptHTML({
            ...donation,
            templeName: donation.templeName || "Sacred Temple Offering"
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
                toast({ title: "Success", description: "Donation record removed" });
                fetchStats(); // Update stats
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Delete Error:", error);
            toast({ title: "Error", description: "Failed to delete donation", variant: "destructive" });
        }
    };




    // ... handleDelete function ends here ...

    const handleDownloadExcel = async () => {
        try {
            toast({ title: "Generating Excel...", description: "Please wait." });

            // URL me 'excel' lagaya hai
            const response = await axios.get(`${API_URL}/admin/donations/export/excel`, {
                responseType: 'blob',
                validateStatus: () => true
            });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;

                // File extension .xlsx kar di
                link.setAttribute('download', `donations_report_${new Date().toISOString().slice(0, 10)}.xlsx`);

                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);

                toast({ title: "Success", description: "Excel file downloaded!" });
            } else {
                throw new Error("Download failed");
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to download Excel", variant: "destructive" });
        }
    };


    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Donation
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all sacred contributions from devotees
                    </p>
                </div>
                <Button
                    onClick={handleDownloadExcel}
                    variant="sacred"
                >
                    <Download className="w-4 h-4" />
                    Export All
                </Button>
            </div>



            {/* Donations Table */}            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Success</p>
                                <h3 className="text-2xl font-bold text-foreground">₹{stats.totalAmount.toLocaleString()}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Success Count</p>
                                <h3 className="text-2xl font-bold text-foreground">{stats.successCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                <h3 className="text-2xl font-bold text-foreground">{stats.pendingCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                                <h3 className="text-2xl font-bold text-foreground">{stats.failedCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Donation ID, Name, Temple, Donor ID..."
                            className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-transparent hover:border-border transition-all">
                            <Filter className="w-4 h-4 text-muted-foreground ml-2" />
                            <select
                                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer pr-2"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-transparent hover:border-border transition-all">
                            <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
                            <div className="flex items-center gap-1">
                                <Input
                                    type="date"
                                    className="h-8 bg-transparent border-none text-xs focus-visible:ring-0 p-0 w-24"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <span className="text-muted-foreground font-bold">-</span>
                                <Input
                                    type="date"
                                    className="h-8 bg-transparent border-none text-xs focus-visible:ring-0 p-0 w-24"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-xl border border-transparent hover:border-border transition-all">
                            <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                            <select
                                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer pr-2"
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
            {/* Donations Table */}
            <Card className="border-none shadow-sacred overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-primary/10 bg-primary/5">
                                <tr>
                                    <th className="text-left p-4 text-sm font-bold text-primary/80 uppercase tracking-wider">Donation ID</th>
                                    <th className="text-left p-4 text-sm font-bold text-primary/80 uppercase tracking-wider">Donor</th>
                                    <th className="text-left p-4 text-sm font-bold text-primary/80 uppercase tracking-wider">Temple</th>
                                    <th className="text-left p-4 text-sm font-bold text-primary/80 uppercase tracking-wider">Amount</th>
                                    <th className="text-left p-4 text-sm font-bold text-primary/80 uppercase tracking-wider">Date</th>
                                    <th className="text-left p-4 text-sm font-bold text-primary/80 uppercase tracking-wider">Status</th>
                                    <th className="text-right p-4 text-sm font-bold text-primary/80 uppercase tracking-wider">Actions</th>
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
                                        <td colSpan={8} className="p-12 text-center text-muted-foreground italic">No donations found in this realm</td>
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
                                            <td className="p-4">
                                                <p className="font-mono text-xs font-bold text-primary/60 group-hover:text-primary transition-colors">
                                                    {donation.displayId ? donation.displayId : `#${donation.id.slice(-8).toUpperCase()}`}
                                                </p>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${donation.isAnonymous ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary border border-primary/20"}`}>
                                                        {donation.isAnonymous ? "?" : donation.donorName.split(' ')[0][0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{donation.donorName}</p>
                                                        {donation.isAnonymous && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-black text-slate-400 tracking-tighter">Anonymous</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground italic">
                                                        {donation.templeName}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <p className="font-bold text-lg text-primary">₹{donation.amount.toLocaleString()}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-foreground">
                                                        {new Date(donation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        {new Date(donation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-lg border-2 ${status.color}`}>
                                                    <status.icon className="w-3 h-3 mr-1" />
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-9 h-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                        onClick={() => setSelectedDonation(donation)}
                                                    >
                                                        <Eye className="w-4.5 h-4.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-9 h-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                        onClick={() => handleDelete(donation.id)}
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-primary/5 bg-primary/2">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10 hover:text-primary rounded-xl transition-all"}
                                    />
                                </PaginationItem>

                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Logic to show only a few page numbers if totalPages is large
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
                                                    className={currentPage === pageNum ? "bg-primary text-white hover:bg-primary/90 border-none rounded-xl" : "cursor-pointer hover:bg-primary/10 hover:text-primary border-none rounded-xl transition-all"}
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-primary/10 hover:text-primary rounded-xl transition-all"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                        <p className="text-center mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Showing page <span className="text-primary">{currentPage}</span> of <span className="text-primary">{totalPages}</span> — <span className="text-primary">{totalItems}</span> sacred entries found
                        </p>
                    </div>
                )}
            </Card>

            {/* Donation Detail Modal */}
            <AnimatePresence>
                {selectedDonation && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                            className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="bg-[#7c4624] p-8 text-white relative">
                                <button
                                    onClick={() => setSelectedDonation(null)}
                                    className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Heart className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold">Donation Details</h3>
                                        <p className="text-white/80 text-sm">Sacred Contribution Ref: {selectedDonation.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
                                {/* Status & ID */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${(statusConfig[selectedDonation.status as keyof typeof statusConfig] || statusConfig.SUCCESS).color}`}>
                                            {React.createElement((statusConfig[selectedDonation.status as keyof typeof statusConfig] || statusConfig.SUCCESS).icon, { className: "w-5 h-5" })}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Payment Status</p>
                                            <p className="font-bold text-slate-700">{selectedDonation.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Method</p>
                                        <p className="font-bold text-slate-700">{selectedDonation.paymentMethod}</p>
                                    </div>
                                </div>

                                {/* Main Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Donor Information</p>
                                            <div className="space-y-2">
                                                <p className="text-slate-800 font-bold flex items-center gap-2">
                                                    <User className="w-4 h-4 text-[#7c4624]" />
                                                    {selectedDonation.donorName}
                                                </p>
                                                {!selectedDonation.isAnonymous && (
                                                    <>
                                                        <p className="text-sm text-slate-600 flex items-center gap-2">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            {selectedDonation.donorPhone}
                                                        </p>
                                                        <p className="text-sm text-slate-600 flex items-center gap-2">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            {selectedDonation.donorEmail}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Temple</p>
                                            <p className="text-slate-800 font-bold flex items-center gap-2 mb-1">
                                                <Building2 className="w-4 h-4 text-[#7c4624]" />
                                                {selectedDonation.templeName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Amount Details</p>
                                            <p className="text-3xl font-display font-bold text-[#7c4624]">
                                                ₹ {selectedDonation.amount.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Received on {new Date(selectedDonation.createdAt).toLocaleString()}
                                            </p>
                                        </div>

                                        {selectedDonation.is80GRequired && (
                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-tight mb-1">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    80G Tax Exemption Requested
                                                </div>
                                                <p className="text-sm text-blue-900 font-mono font-bold">PAN: {selectedDonation.panNumber}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Long Text Fields */}
                                <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-100">
                                    {(selectedDonation.address && !selectedDonation.isAnonymous) && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Postal Address</p>
                                            <p className="text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-sm leading-relaxed">
                                                <MapPin className="w-4 h-4 inline-block mr-2 text-slate-400" />
                                                {selectedDonation.address}
                                            </p>
                                        </div>
                                    )}

                                    {selectedDonation.message && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Prayer / Sankalp Message</p>
                                            <div className="bg-yellow-50/50 p-4 rounded-xl border border-dashed border-yellow-200 text-slate-700 italic text-sm leading-relaxed">
                                                "{selectedDonation.message}"
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-slate-200 text-slate-600 h-10 px-4"
                                            onClick={() => handlePrintReceipt(selectedDonation)}
                                        >
                                            <Download className="w-4 h-4 mr-2" /> Print Receipt
                                        </Button>
                                        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 h-10 px-4">
                                            Send Email
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => setSelectedDonation(null)}
                                        className="bg-[#7c4624] hover:bg-[#63361c] rounded-xl px-8"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}

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
    const [statusFilter, setStatusFilter] = useState("all");
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
                status: statusFilter
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
    }, [debouncedSearch, statusFilter, currentPage]);

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



            {/* Donations Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Donation ID</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Donor</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Temple</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Amount</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Date</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Status</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground text-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">Loading donations...</td>
                                    </tr>
                                ) : donations.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">No donations found</td>
                                    </tr>
                                ) : donations.map((donation, index) => {
                                    const status = statusConfig[donation.status as keyof typeof statusConfig] || statusConfig.SUCCESS;
                                    return (
                                        <motion.tr
                                            key={donation.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="border-b border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <p className="font-mono text-xs font-medium text-primary">
                                                    {donation.id}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${donation.isAnonymous ? "bg-slate-200 text-slate-500" : "bg-[#f5ebe0] text-[#7c4624]"}`}>
                                                        {donation.isAnonymous ? "?" : donation.donorName.split(' ')[0][0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{donation.donorName}</p>
                                                        {donation.isAnonymous && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">Anonymous</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">
                                                        {donation.templeName}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <p className="font-semibold text-foreground">₹{donation.amount.toLocaleString()}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-foreground">
                                                    {new Date(donation.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={`text-[11px] uppercase font-bold flex items-center gap-1 w-fit ${status.color}`}>
                                                    <status.icon className="w-3 h-3" />
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setSelectedDonation(donation)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(donation.id)}>
                                                        <Trash2 className="w-4 h-4" />
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
        </div>
    );
}

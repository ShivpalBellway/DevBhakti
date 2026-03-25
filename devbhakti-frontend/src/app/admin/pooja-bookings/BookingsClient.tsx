"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Search,
    Filter,
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
    Plus,
    ChevronDown,
    Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAllBookingsAdmin, deleteBookingAdmin, updateBookingStatusAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_URL } from "@/config/apiConfig";

const statusConfig = {
    BOOKED: { label: "Booked", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
    COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
    CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-700 border-slate-200", icon: X },
    PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
};

const formatDateDDMMYYYY = (dateString: string | null | undefined, includeTime = false) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();

        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = weekdays[date.getDay()];

        let result = `${dayName} ${dd}/${mm}/${yyyy}`;
        if (includeTime) {
            let hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
            result += ` ${strTime}`;
        }
        return result;
    } catch {
        return dateString;
    }
};

function BookingsContent() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");
    const qParam = searchParams.get("q");

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState("all");
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [proofPhotos, setProofPhotos] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();


    const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [stats, setStats] = useState({ booked: 0, completed: 0, cancelled: 0, rejected: 0 });

    const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year" | "custom">("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [showCustomDate, setShowCustomDate] = useState(false);

    // New filters
    const [filterDateType, setFilterDateType] = useState<"bookingDate" | "ritualDate">("bookingDate");
    const [sortBy, setSortBy] = useState<"bookingDate" | "ritualDate">("bookingDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const loadBookings = async (page: number) => {
        setLoading(true);
        try {
            let startDate, endDate;
            if (dateRange !== "all") {
                if (dateRange === "custom") {
                    startDate = customStartDate ? new Date(customStartDate).toISOString() : undefined;
                    endDate = customEndDate ? new Date(customEndDate).toISOString() : undefined;
                } else {
                    const now = new Date();
                    const end = new Date();
                    const start = new Date();
                    if (dateRange === "week") start.setDate(now.getDate() - 7);
                    else if (dateRange === "month") start.setMonth(now.getMonth() - 1);
                    else if (dateRange === "year") start.setFullYear(now.getFullYear() - 1);
                    startDate = start.toISOString();
                    endDate = end.toISOString();
                }
            }

            const res = await fetchAllBookingsAdmin({
                page,
                limit: 10,
                search: debouncedSearch,
                bookingId: idParam || undefined,
                status: statusFilter,
                startDate,
                endDate,
                dateType: filterDateType,
                sortBy: sortBy,
                sortOrder: sortOrder
            });

            if (res && res.success) {
                setBookings(res.data || []);
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages || 1);
                    setTotalItems(res.pagination.total || 0);
                }
                if (res.stats) setStats(res.stats);
            }
        } catch (error) {
            console.error("Booking Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (qParam) setSearchQuery(qParam);
        else if (idParam) setSearchQuery(idParam);
    }, [idParam, qParam]);

    useEffect(() => {
        loadBookings(currentPage);
    }, [debouncedSearch, statusFilter, dateRange, customStartDate, customEndDate, currentPage, filterDateType, sortBy, sortOrder]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;
        try {
            const res = await deleteBookingAdmin(id);
            if (res && res.success) {
                toast({ title: "Success", description: "Booking deleted successfully" });
                loadBookings(currentPage);
            } else {
                toast({ title: "Error", description: res?.message || "Failed to delete booking", variant: "destructive" });
            }
        } catch (error) {
            console.error("Delete Error:", error);
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
        }
    };

    const handleUpdateStatus = async (id: string, status: string, files?: File[]) => {
        setIsProcessing(true);
        try {
            let data: any = { status };

            if (status === 'COMPLETED' && files && files.length > 0) {
                const formData = new FormData();
                formData.append('status', status);
                files.forEach((file) => {
                    formData.append('photos', file);
                });
                data = formData;
            }

            const res = await updateBookingStatusAdmin(id, data);
            if (res && res.success) {
                toast({
                    title: `Booking ${status === 'BOOKED' ? 'Accepted' : (status === 'COMPLETED' ? 'Completed' : 'Rejected')}`,
                    description: res.message
                });
                loadBookings(currentPage);
                setSelectedBooking(null);
                setProofPhotos([]);
            } else {
                toast({ title: "Update Failed", description: res?.message || "Failed to update status", variant: "destructive" });
            }
        } catch (error) {
            console.error("Status Update Error:", error);
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };


    const handleExportBookings = async () => {
        try {
            toast({ title: "Exporting...", description: "Please wait while we prepare the Excel file." });


            const token = localStorage.getItem('admin_token') || localStorage.getItem('staff_token');


            const response = await axios.get(`${API_URL}/admin/bookings/export/excel`, {
                responseType: 'blob',
                validateStatus: () => true,

                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `pooja_bookings_${new Date().toISOString().slice(0, 10)}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);

                toast({ title: "Success", description: "Bookings exported successfully!" });
            } else {
                throw new Error("Download failed (Unauthorized or Server Error)");
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to download Excel. Check Login.", variant: "destructive" });
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#794A05]">Pooja & Seva Bookings</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage all sacred service reservations</p>
                </div>
            </div>

            <Button
                onClick={handleExportBookings}
                variant="sacred"
            >
                <Download className="w-4 h-4" />
                Export Excel
            </Button>


            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: totalItems, color: "text-slate-900" },
                    { label: "Booked", value: stats.booked, color: "text-blue-600" },
                    { label: "Completed", value: stats.completed, color: "text-emerald-700" },
                    { label: "Rejections", value: stats.cancelled + stats.rejected, color: "text-rose-600" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
                {/* Search & Status Filters */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search IDs, Devotees, Temples..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-slate-50 border-transparent focus-visible:ring-2 focus-visible:ring-[#794A05] transition-all"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {["all", "BOOKED", "COMPLETED", "CANCELLED", "REJECTED"].map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "rounded-xl px-4 h-11 font-semibold transition-all shadow-sm border",
                                    statusFilter === status
                                        ? "bg-[#794A05] hover:bg-[#5d3904] text-white border-transparent"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                {status === "all" ? "All" : statusConfig[status as keyof typeof statusConfig]?.label || status}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-slate-100"></div>

                {/* Date & Sort Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-slate-300">
                            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
                            <select
                                className="h-8 bg-transparent text-sm font-medium focus:outline-none text-slate-700 cursor-pointer pr-1"
                                value={filterDateType}
                                onChange={(e) => setFilterDateType(e.target.value as any)}
                            >
                                <option value="bookingDate">Booking Date</option>
                                <option value="ritualDate">Ritual Date</option>
                            </select>
                            <span className="text-slate-300">|</span>
                            <select
                                className="h-8 bg-transparent text-sm font-medium focus:outline-none text-slate-700 cursor-pointer pl-1 pr-2"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                            >
                                <option value="all">All Time</option>
                                <option value="week">Past Week</option>
                                <option value="month">Past Month</option>
                                <option value="year">Past Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {dateRange === "custom" && (
                            <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shadow-sm">
                                <input
                                    type="date"
                                    className="text-sm h-8 bg-transparent border-none focus:ring-0 cursor-pointer text-slate-700 font-medium px-2"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                                <span className="text-slate-400 text-sm font-medium">to</span>
                                <input
                                    type="date"
                                    className="text-sm h-8 bg-transparent border-none focus:ring-0 cursor-pointer text-slate-700 font-medium px-2"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-slate-300 w-full md:w-auto justify-end">
                        {/* <Clock className="w-4 h-4 text-slate-400 ml-2" /> */}
                        <span className="text-sm text-slate-500 font-medium">Sort by:</span>
                        {/* <select
                            className="h-8 bg-transparent text-sm font-semibold focus:outline-none text-slate-800 cursor-pointer pr-1"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="bookingDate">Booking Date</option>
                            <option value="ritualDate">Ritual Date</option>
                        </select> */}
                        <span className="text-slate-300">|</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="h-8 px-2 text-sm font-medium text-slate-700 hover:text-[#794A05] hover:bg-orange-50 rounded-lg"
                        >
                            {sortOrder === 'desc' ? (
                                <span className="flex items-center gap-1">Latest First <ChevronDown className="w-4 h-4 ml-0.5" /></span>
                            ) : (
                                <span className="flex items-center gap-1">Oldest First <ChevronDown className="w-4 h-4 ml-0.5 rotate-180" /></span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-[24px] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#FAF9F6] border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">ID</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Service</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Temple</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Devotee</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap" title="DDMMYYYY format">Booking Date & Time</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap" title="DDMMYYYY format">Ritual Date</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="p-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="p-12 text-center text-slate-400">Loading Sacred Data...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan={9} className="p-12 text-center text-slate-400">No results found</td></tr>
                            ) : bookings.map((booking) => {
                                const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.BOOKED;
                                return (
                                    <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-[11px] font-bold text-[#794A05]">#{booking.id.slice(-8).toUpperCase()}</td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-slate-900">{booking.pooja?.name}</p>
                                            {booking.packageName && <p className="text-xs text-slate-500 mt-0.5">{booking.packageName}</p>}
                                        </td>
                                        <td className="p-4">
                                            {booking.temple ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-slate-400" />
                                                    <p className="text-sm font-bold text-slate-900">{booking.temple.name}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-bold text-slate-400">N/A</p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <p className="text-sm font-bold text-slate-900">{booking.devoteeName}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-900" title="Date is in DDMMYYYY format">
                                                {formatDateDDMMYYYY(booking.createdAt, true)}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-900" title="Date is in DDMMYYYY format">
                                                {formatDateDDMMYYYY(booking.bookingDate, false)}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-slate-900">₹{booking.packagePrice}</p>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={`rounded-full px-3 py-1 font-extrabold text-[10px] ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)} className="h-8 w-8 rounded-lg">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {hasPermission('bookings.delete') && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)} className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pb-12">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                    <span className="flex items-center text-sm font-bold px-4">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}

            {selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 relative">
                        <h3 className="text-xl font-bold font-serif mb-6 text-[#794A05]">Booking Details</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Devotee Information</p>
                                <p className="font-bold text-slate-800 text-lg">{selectedBooking.devoteeName}</p>
                                <p className="text-sm text-slate-500">{selectedBooking.devoteePhone}</p>
                                <p className="text-sm text-slate-500">{selectedBooking.devoteeEmail}</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-2xl">
                                <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">Pooja Service</p>
                                <p className="font-bold text-[#794A05] text-lg">{selectedBooking.pooja?.name}</p>
                                <p className="text-sm text-[#794A05]">{selectedBooking.packageName}</p>
                                <p className="text-2xl font-black text-[#794A05] mt-2">₹{selectedBooking.packagePrice}</p>
                            </div>
                            {selectedBooking.bookingDate && (
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Scheduled Date</p>
                                    <p className="font-bold text-slate-800">{selectedBooking.bookingDate}</p>
                                </div>
                            )}

                            {/* Status Management for Admin */}
                            {hasPermission('bookings.manage') && selectedBooking.status === 'BOOKED' && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Update Status</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* <Button
                                            variant="outline"
                                            className="rounded-2xl h-12 border-rose-200 text-rose-600 hover:bg-rose-50"
                                            onClick={() => handleUpdateStatus(selectedBooking.id, 'REJECTED')}
                                            disabled={isProcessing}
                                        >
                                            Reject Booking
                                        </Button> */}
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-bold"
                                            onClick={() => setConfirmCompleteId(selectedBooking.id)}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? "Processing..." : "Mark Completed"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* View Existing Proof Photos */}
                            {selectedBooking.status === 'COMPLETED' && selectedBooking.proofPhotos && selectedBooking.proofPhotos.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pooja Proof Photos</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedBooking.proofPhotos.map((photo: string, i: number) => (
                                            <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 group">
                                                <img src={photo} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye className="w-5 h-5 text-white" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button className="w-full mt-8 bg-[#794A05] hover:bg-[#5d3904] text-white h-12 rounded-2xl font-bold" onClick={() => {
                            setSelectedBooking(null);
                            setProofPhotos([]);
                        }}>Close Details</Button>
                    </div>
                </div>
            )}

            {/* Mark Complete Confirmation Dialog */}
            <AnimatePresence>
                {confirmCompleteId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setConfirmCompleteId(null);
                                setProofPhotos([]);
                            }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="bg-[#7b4623] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-[#63391c]"
                        >
                            {/* Warning Header */}
                            <div className="bg-[#63391c]/50 p-6 text-white border-b border-[#63391c]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Warning</h3>
                                        <p className="text-slate-400 text-sm">Irreversible Action</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Are you sure you want to mark this booking as <span className="font-bold text-emerald-400">complete</span>? This is an <span className="font-bold text-red-400">irreversible action</span> and cannot be undone.
                                </p>

                                {/* Proof Photos Upload */}
                                <div className="space-y-3 pt-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                        Upload Proof Photos
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[0, 1].map((index) => (
                                            <div key={index} className="relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    id={`proof-photo-${index}`}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const newPhotos = [...proofPhotos];
                                                            newPhotos[index] = file;
                                                            setProofPhotos(newPhotos);
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`proof-photo-${index}`}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer",
                                                        proofPhotos[index]
                                                            ? "border-emerald-500/50 bg-emerald-500/5"
                                                            : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                                                    )}
                                                >
                                                    {proofPhotos[index] ? (
                                                        <div className="text-center p-2">
                                                            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                                                            <span className="text-[10px] text-emerald-300 font-medium truncate w-full block">
                                                                {proofPhotos[index].name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-6 h-6 text-slate-500 group-hover:text-slate-400 mb-1" />
                                                            <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-medium">
                                                                Add Photo
                                                            </span>
                                                        </>
                                                    )}
                                                </label>
                                                {proofPhotos[index] && (
                                                    <button
                                                        onClick={() => {
                                                            const newPhotos = [...proofPhotos];
                                                            newPhotos.splice(index, 1);
                                                            setProofPhotos(newPhotos);
                                                        }}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setConfirmCompleteId(null);
                                        setProofPhotos([]);
                                    }}
                                    className="rounded-xl px-6 text-white/60 hover:text-white hover:bg-[#63391c]"
                                    disabled={isProcessing}
                                >
                                    No
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (confirmCompleteId) {
                                            await handleUpdateStatus(confirmCompleteId, 'COMPLETED', proofPhotos.filter(Boolean));
                                            setConfirmCompleteId(null);
                                        }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 border-none"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Yes, Complete"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function BookingsClient() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-[#794A05] font-serif">Loading Records...</div>}>
            <BookingsContent />
        </Suspense>
    );
}

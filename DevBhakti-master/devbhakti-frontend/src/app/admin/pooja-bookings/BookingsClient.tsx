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
    Download, MapPin, AlertCircle, RefreshCw, Archive, IndianRupee,
    Edit, Printer, ChevronRight,
    ArrowLeft, ListFilter
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { fetchAllBookingsAdmin, deleteBookingAdmin, updateBookingStatusAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import { parseLocalizedValue } from "@/utils/textUtils";

const statusConfig = {
    BOOKED: { label: "Booked", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
    COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
    CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-700 border-slate-200", icon: X },
    PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
};

const formatDateDDMMYYYY = (dateString: any, includeTime = false) => {
    if (!dateString) return "N/A";
    try {
        // If it's a localized object, try to extract a string
        const actualDateStr = (typeof dateString === 'object') 
            ? (dateString.en || dateString.hi || dateString.mr || String(dateString))
            : String(dateString);

        const date = new Date(actualDateStr);
        if (isNaN(date.getTime())) return String(actualDateStr);

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
            hours = hours ? hours : 12; 
            const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
            result += ` ${strTime}`;
        }
        return result;
    } catch {
        return typeof dateString === 'string' ? dateString : "Invalid Date";
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
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
    const [showCustomDate, setShowCustomDate] = useState(false);

    // New filters
    const [filterDateType, setFilterDateType] = useState<"bookingDate" | "ritualDate">("bookingDate");
    const [sortBy, setSortBy] = useState<"bookingDate" | "ritualDate">("bookingDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const loadBookings = async (page: number) => {
        setLoading(true);
        try {
            let startDate, endDate;
            if (selectedDateRange?.from) startDate = selectedDateRange.from.toISOString();
            if (selectedDateRange?.to) endDate = selectedDateRange.to.toISOString();

            if (!startDate && !endDate && dateRange !== "all") {
                const now = new Date();
                const end = new Date();
                const start = new Date();
                if (dateRange === "week") start.setDate(now.getDate() - 7);
                else if (dateRange === "month") start.setMonth(now.getMonth() - 1);
                else if (dateRange === "year") start.setFullYear(now.getFullYear() - 1);
                startDate = start.toISOString();
                endDate = end.toISOString();
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
    }, [debouncedSearch, statusFilter, dateRange, selectedDateRange, currentPage, filterDateType, sortBy, sortOrder]);

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
                    description: res.message,
                    variant: status === 'COMPLETED' ? 'success' : 'default'
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

            const params = {
                status: statusFilter,
                search: searchQuery,
                startDate: selectedDateRange?.from?.toISOString(),
                endDate: selectedDateRange?.to?.toISOString(),
                dateType: filterDateType,
                sortBy: sortBy,
                sortOrder: sortOrder
            };

            const response = await axios.get(`${API_URL}/admin/bookings/export/excel`, {
                params,
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#794A05]">Pooja & Seva Bookings</h1>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm font-medium">Manage all sacred service reservations</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {hasPermission('bookings.manage') && (
                        <Button
                            onClick={() => window.location.href = '/admin/pooja-bookings/add-offline'}
                            variant="sacred"
                            className="flex-1 sm:flex-none"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline ml-2">Add Offline Booking</span>
                            <span className="sm:hidden ml-2">Add</span>
                        </Button>
                    )}
                    <Button
                        onClick={handleExportBookings}
                        variant="outline"
                        className="flex-1 sm:flex-none"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">Export Excel</span>
                        <span className="sm:hidden ml-2">Export</span>
                    </Button>
                </div>
            </div>


            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: "Total Bookings", value: totalItems, color: "text-white" },
                    { label: "Active", value: stats.booked, color: "text-white" },
                    { label: "Finished", value: stats.completed, color: "text-white" },
                    { label: "Cancelled", value: stats.cancelled + stats.rejected, color: "text-white" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-xl bg-[#794A05] text-white rounded-[1.5rem] overflow-hidden relative group">
                        <CardContent className="p-3 sm:p-6">
                            <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{String(stat.value)}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-widest">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
                {/* Search & Status Filters */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                    <div className="relative w-full xl:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search IDs, Devotees, Temples..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 sm:h-11 rounded-xl bg-slate-50 border-transparent focus-visible:ring-2 focus-visible:ring-[#794A05] transition-all"
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
                                    "rounded-xl px-3 sm:px-4 h-10 sm:h-11 font-semibold transition-all shadow-sm border text-xs sm:text-sm",
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
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "h-8 px-2 justify-start text-left font-medium text-slate-700 hover:bg-transparent text-sm",
                                            !selectedDateRange && "text-slate-500"
                                        )}
                                    >
                                        <span className="truncate">
                                            {selectedDateRange?.from ? (
                                                selectedDateRange.to ? (
                                                    <>
                                                        {format(selectedDateRange.from, "LLL dd, y")} - {format(selectedDateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(selectedDateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                "Filter by Date"
                                            )}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-primary/5" align="start">
                                    <div className="p-3 border-b flex items-center justify-between bg-slate-50/50">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Select</span>
                                        <div className="flex gap-1.5">
                                            {["all", "today", "week", "month", "year"].map((r) => (
                                                <Button
                                                    key={r}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDateRange(r as any);
                                                        if (r === "today") {
                                                            setSelectedDateRange({ from: new Date(), to: new Date() });
                                                        } else {
                                                            setSelectedDateRange(undefined);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all",
                                                        dateRange === r ? "bg-[#794A05] text-white" : "text-slate-500 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {r === "all" ? "All" : r === "today" ? "Today" : r === "week" ? "Week" : r === "month" ? "Month" : "Year"}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <UICalendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={selectedDateRange?.from}
                                        selected={selectedDateRange}
                                        onSelect={(range) => {
                                            setSelectedDateRange(range);
                                            if (range) setDateRange("custom");
                                        }}
                                        numberOfMonths={2}
                                    />
                                    {selectedDateRange && (
                                        <div className="p-3 border-t flex justify-end bg-slate-50/50 rounded-b-2xl">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" 
                                                onClick={() => {
                                                    setSelectedDateRange(undefined);
                                                    setDateRange("all");
                                                }}
                                            >
                                                Clear Filter
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-slate-300 w-full lg:w-auto justify-end">
                        <span className="text-sm text-slate-500 font-medium">Sort by:</span>
                        <span className="text-slate-300">|</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="h-8 px-2 text-sm font-medium text-slate-700 hover:text-[#794A05] hover:bg-orange-50 rounded-lg"
                        >
                            {sortOrder === 'desc' ? (
                                <span className="flex items-center gap-1 text-xs sm:text-sm">Latest First <ChevronDown className="w-4 h-4 ml-0.5" /></span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs sm:text-sm">Oldest First <ChevronDown className="w-4 h-4 ml-0.5 rotate-180" /></span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-[16px] sm:rounded-[24px] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-[#FAF9F6] border-b border-slate-100">
                            <tr>

                                <th className="py-5 pl-8 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">ID</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Service</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Temple</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Devotee</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Booking Date & Time</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Ritual Date</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Pkg Price</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Prasad Fee</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Platform Fee</th>
                                <th className="py-5 text-left text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Total Paid</th>
                                <th className="py-5 text-center text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="py-5 pr-8 text-right text-[11px] font-extrabold text-slate-900 uppercase tracking-widest whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={12} className="p-8 sm:p-12 text-center text-slate-400 text-sm sm:text-base">Loading Sacred Data...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan={12} className="p-8 sm:p-12 text-center text-slate-400 text-sm sm:text-base">No results found</td></tr>
                            ) : bookings.map((booking) => {
                                const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.BOOKED;
                                return (
                                    <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-6 pl-8">
                                            <span className="text-[10px] font-extrabold text-[#794A05] uppercase tracking-tighter">
                                                {booking.displayId || `#${String(booking.id).slice(-8).toUpperCase()}`}
                                            </span>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                                                    {parseLocalizedValue(booking.pooja?.name)}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                                    {parseLocalizedValue(booking.packageName) || "Single"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded-lg">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                                                    {booking.temple ? parseLocalizedValue(booking.temple.name) : "N/A"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded-lg">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                                                    {parseLocalizedValue(booking.devoteeName)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-[11px] font-bold text-slate-600">
                                                {formatDateDDMMYYYY(booking.createdAt, false)}
                                            </span>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-[11px] font-bold text-slate-700">
                                                {formatDateDDMMYYYY(typeof booking.bookingDate === 'string' ? booking.bookingDate : (booking.bookingDate?.en || booking.bookingDate?.hi || booking.bookingDate?.mr || "N/A"), false)}
                                            </span>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-sm font-bold text-slate-900">₹{booking.packagePrice || 0}</span>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-sm font-bold text-emerald-600">₹{booking.prasadAmount || 0}</span>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-sm font-bold text-slate-600">₹{booking.platformFee || 0}</span>
                                        </td>
                                        <td className="py-6">
                                            <p className="text-sm font-black text-[#794A05]">₹{(booking.packagePrice || 0) + (booking.prasadAmount || 0) + (booking.platformFee || 0)}</p>
                                        </td>
                                        <td className="py-6 text-center">
                                            <Badge variant="outline" className={`rounded-full px-3 py-1 font-extrabold text-[9px] uppercase tracking-wider ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                        </td>
                                        <td className="py-6 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)} className="h-8 w-8 rounded-full hover:bg-slate-100">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                </Button>
                                                {hasPermission('bookings.delete') && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)} className="h-8 w-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50">
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
                <div className="flex justify-center gap-2 mt-4 pb-8 sm:pb-12">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="text-xs sm:text-sm px-3 sm:px-4">Prev</Button>
                    <span className="flex items-center text-xs sm:text-sm font-bold px-2 sm:px-4">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="text-xs sm:text-sm px-3 sm:px-4">Next</Button>
                </div>
            )}

            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden relative border border-slate-100 max-h-[90vh] overflow-y-auto premium-scrollbar"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-[#794A05] to-[#5d3904] p-6 md:p-8 text-white sticky top-0 z-10">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Calendar className="w-6 h-6 md:w-7 md:h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-serif font-bold">Booking Details</h3>
                                        <p className="text-white/80 text-xs md:text-sm">Comprehensive reservation summary</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">
                                {/* Status Overview */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${statusConfig[selectedBooking.status as keyof typeof statusConfig]?.color}`}>
                                            {React.createElement(statusConfig[selectedBooking.status as keyof typeof statusConfig]?.icon || CheckCircle, { className: "w-5 h-5" })}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current Status</p>
                                            <p className="font-bold text-slate-700">{selectedBooking.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ritual Date</p>
                                        <Badge variant="outline" className="px-3 py-1 bg-white font-bold text-[#794A05] w-fit">
                                            {formatDateDDMMYYYY(typeof selectedBooking.bookingDate === 'string' ? selectedBooking.bookingDate : (selectedBooking.bookingDate?.en || selectedBooking.bookingDate?.hi || selectedBooking.bookingDate?.mr || "N/A"), false)}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Service & Temple</p>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                                                    {parseLocalizedValue(selectedBooking.pooja?.name)}
                                                </div>
                                                <p className="text-sm font-semibold text-[#794A05] flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    {selectedBooking.temple ? parseLocalizedValue(selectedBooking.temple.name) : "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">{parseLocalizedValue(selectedBooking.packageName)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Primary Devotee</p>
                                            <p className="text-slate-800 font-bold flex items-center gap-1.5 text-lg">
                                                <User className="w-4 h-4 text-slate-400" />
                                                {selectedBooking.devoteeName}
                                            </p>
                                            {selectedBooking.gothra && (
                                                <p className="text-xs font-semibold text-slate-500 mt-1 ml-0.5">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gothra: </span>
                                                    {selectedBooking.gothra}
                                                </p>
                                            )}
                                            <p className="text-xs font-semibold text-slate-500 mt-1 ml-0.5">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Prasad Requested: </span>
                                                {selectedBooking.isPrasadRequested ? (
                                                    <span className="text-emerald-600 font-bold">
                                                        {selectedBooking.prasadAmount > 0 ? (
                                                            `Paid Prasad: ${selectedBooking.prasadQuantity || 1} x ₹${Math.round(selectedBooking.prasadAmount / (selectedBooking.prasadQuantity || 1))} (+₹${selectedBooking.prasadAmount})`
                                                        ) : (
                                                            "Free Prasad (Included)"
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 font-medium">No</span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Contact Information</p>
                                            <div className="space-y-1">
                                                <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    {selectedBooking.devoteePhone}
                                                </p>
                                                <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    {selectedBooking.devoteeEmail || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Spiritual & Personal Info */}
                                {(selectedBooking.gothra || selectedBooking.dob || selectedBooking.anniversary || selectedBooking.kuldevi || selectedBooking.kuldevta || selectedBooking.nativePlace) && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                        {selectedBooking.dob && (
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Birthday</p>
                                                <p className="text-slate-700 font-bold">{format(new Date(selectedBooking.dob), "dd MMM yyyy")}</p>
                                            </div>
                                        )}
                                        {selectedBooking.anniversary && (
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Anniversary</p>
                                                <p className="text-slate-700 font-bold">{format(new Date(selectedBooking.anniversary), "dd MMM yyyy")}</p>
                                            </div>
                                        )}
                                        {selectedBooking.kuldevi && (
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Kuldevi</p>
                                                <p className="text-slate-700 font-bold">{selectedBooking.kuldevi}</p>
                                            </div>
                                        )}
                                        {selectedBooking.kuldevta && (
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Kuldevta</p>
                                                <p className="text-slate-700 font-bold">{selectedBooking.kuldevta}</p>
                                            </div>
                                        )}
                                        {selectedBooking.nativePlace && (
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Native Place</p>
                                                <p className="text-slate-700 font-bold">{selectedBooking.nativePlace}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Additional Devotees */}
                                {selectedBooking.additionalDevotees && selectedBooking.additionalDevotees.length > 0 && (
                                    <div className="pt-6 border-t border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Additional Devotees</p>
                                        <div className="space-y-3">
                                            {selectedBooking.additionalDevotees.map((dev: any, i: number) => (
                                                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Name</p>
                                                        <p className="text-sm font-bold text-slate-700">{dev.name}</p>
                                                    </div>
                                                    {dev.gothra && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Gotra</p>
                                                            <p className="text-sm font-bold text-slate-700">{dev.gothra}</p>
                                                        </div>
                                                    )}
                                                    {dev.kuldevi && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Kuldevi</p>
                                                            <p className="text-sm font-bold text-slate-700">{dev.kuldevi}</p>
                                                        </div>
                                                    )}
                                                    {dev.kuldevta && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Kuldevta</p>
                                                            <p className="text-sm font-bold text-slate-700">{dev.kuldevta}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Extended Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Delivery Address</p>
                                        <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 min-h-[80px]">
                                            {selectedBooking.address || "No physical address provided."}
                                        </p>
                                    </div>
                                   
                                </div>

                                {/* Prasad Section */}
                                {selectedBooking.isPrasadRequested && (
                                    <div className="pt-6 border-t border-slate-100 space-y-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Prasad Delivery & Tracking</p>
                                        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Prasad Status</label>
                                                <select
                                                    className="w-full h-10 px-3 rounded-lg border bg-white text-sm font-medium mt-1 focus:ring-1 focus:ring-primary focus:outline-none"
                                                    value={selectedBooking.prasadStatus || 'PREPARING'}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        try {
                                                            const res = await updateBookingStatusAdmin(selectedBooking.id, { prasadStatus: newStatus });
                                                            if (res.success) {
                                                                setSelectedBooking({ ...selectedBooking, prasadStatus: newStatus });
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to update status");
                                                        }
                                                    }}
                                                >
                                                    <option value="PREPARING">Preparing</option>
                                                    <option value="DISPATCHED">Dispatched</option>
                                                    <option value="IN_TRANSIT">In Transit</option>
                                                    <option value="DELIVERED">Delivered</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Courier Name</label>
                                                <input
                                                    className="w-full h-10 px-3 rounded-lg border bg-white text-sm font-medium mt-1"
                                                    placeholder="e.g. BlueDart"
                                                    value={selectedBooking.courierName || ""}
                                                    onChange={(e) => setSelectedBooking({ ...selectedBooking, courierName: e.target.value })}
                                                    onBlur={async () => {
                                                        await updateBookingStatusAdmin(selectedBooking.id, { courierName: selectedBooking.courierName });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">AWB/Tracking Code</label>
                                                <input
                                                    className="w-full h-10 px-3 rounded-lg border bg-white text-sm font-medium mt-1"
                                                    placeholder="Tracking Code"
                                                    value={selectedBooking.awbCode || ""}
                                                    onChange={(e) => setSelectedBooking({ ...selectedBooking, awbCode: e.target.value })}
                                                    onBlur={async () => {
                                                        await updateBookingStatusAdmin(selectedBooking.id, { awbCode: selectedBooking.awbCode });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Tracking Link</label>
                                                <input
                                                    className="w-full h-10 px-3 rounded-lg border bg-white text-sm font-medium mt-1"
                                                    placeholder="https://..."
                                                    value={selectedBooking.trackingUrl || ""}
                                                    onChange={(e) => setSelectedBooking({ ...selectedBooking, trackingUrl: e.target.value })}
                                                    onBlur={async () => {
                                                        await updateBookingStatusAdmin(selectedBooking.id, { trackingUrl: selectedBooking.trackingUrl });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Proof Photos */}
                                {selectedBooking.status === 'COMPLETED' && selectedBooking.proofPhotos && selectedBooking.proofPhotos.length > 0 && (
                                    <div className="pt-6 border-t border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Pooja Proof Photos</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedBooking.proofPhotos.map((photo: string, i: number) => (
                                                <a key={i} href={photo.startsWith('http') ? photo : `${BASE_URL}${photo}`} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 group">
                                                    <img src={photo.startsWith('http') ? photo : `${BASE_URL}${photo}`} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Payment & Pricing Breakdown */}
                                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/60 space-y-2">
                                    <p className="text-[10px] text-amber-900/60 font-extrabold uppercase tracking-widest mb-2">Payment & Pricing Breakdown</p>
                                    <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                                        <span>Pooja Package Price</span>
                                        <span className="font-bold text-slate-900">₹{selectedBooking.packagePrice || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                                        <span>
                                            Prasad Fee {selectedBooking.isPrasadRequested ? (selectedBooking.prasadQuantity ? `(${selectedBooking.prasadQuantity} Pkts)` : '') : ''}
                                        </span>
                                        <span className="font-bold text-emerald-600">
                                            {selectedBooking.isPrasadRequested ? (selectedBooking.prasadAmount ? `₹${selectedBooking.prasadAmount}` : 'Free / Included') : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                                        <span>Platform Fee</span>
                                        <span className="font-bold text-slate-600">₹{selectedBooking.platformFee || 0}</span>
                                    </div>
                                    <div className="border-t border-amber-200/60 pt-2 flex justify-between items-center text-base font-bold text-slate-900">
                                        <span>Total Amount Paid</span>
                                        <span className="text-xl font-black text-[#794A05]">₹{(selectedBooking.packagePrice || 0) + (selectedBooking.prasadAmount || 0) + (selectedBooking.platformFee || 0)}</span>
                                    </div>
                                </div>

                                {/* Admin Actions */}
                                <div className="pt-6 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Payment</p>
                                            <p className="text-2xl font-black text-[#794A05]">₹{String((selectedBooking.packagePrice || 0) + (selectedBooking.prasadAmount || 0) + (selectedBooking.platformFee || 0))}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {hasPermission('bookings.manage') && selectedBooking.status === 'BOOKED' && (
                                                <Button
                                                    onClick={() => setConfirmCompleteId(selectedBooking.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-12 font-bold"
                                                    disabled={isProcessing}
                                                >
                                                    Mark Completed
                                                </Button>
                                            )}
                                            <Button 
                                                variant="outline" 
                                                className="rounded-xl h-12 px-6 font-bold border-slate-200 text-slate-600"
                                                onClick={() => setSelectedBooking(null)}
                                            >
                                                Close Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mark Complete Confirmation Dialog */}
            <AnimatePresence>
                {confirmCompleteId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
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
                            className="bg-[#7b4623] w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-[#63391c] max-h-[90vh] overflow-y-auto"
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

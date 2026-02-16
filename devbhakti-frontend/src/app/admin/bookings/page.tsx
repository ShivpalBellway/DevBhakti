"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
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
    ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAllBookingsAdmin, deleteBookingAdmin } from "@/api/adminController";
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

const statusConfig = {
    BOOKED: {
        label: "Confirmed",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
    },
    COMPLETED: {
        label: "Completed",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
    },
    REJECTED: {
        label: "Rejected",
        color: "bg-rose-100 text-rose-700 border-rose-200",
        icon: XCircle,
    },
    CANCELLED: {
        label: "Cancelled",
        color: "bg-slate-100 text-slate-700 border-slate-200",
        icon: X,
    },
};

export default function AdminBookingsPage() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState("all");
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const { toast } = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);

    const [stats, setStats] = useState({ booked: 0, completed: 0, cancelled: 0, rejected: 0 });

    // Date filtering state
    const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year" | "custom">("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [showCustomDate, setShowCustomDate] = useState(false);

    useEffect(() => {
        if (idParam) {
            setSearchQuery(idParam);
        }
        loadBookings(1);
    }, [debouncedSearch, statusFilter, idParam, dateRange, customStartDate, customEndDate]);

    useEffect(() => {
        loadBookings(currentPage);
    }, [currentPage]);

    useEffect(() => {
        if (idParam && bookings.length > 0) {
            const booking = bookings.find(b => b.id === idParam);
            if (booking) {
                setSelectedBooking(booking);
            }
        }
    }, [idParam, bookings]);

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
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter,
                startDate,
                endDate
            });
            if (res.success) {
                setBookings(res.data);
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages);
                    setTotalItems(res.pagination.total);
                    setCurrentPage(res.pagination.page);
                }
                if (res.stats) {
                    setStats(res.stats);
                }
            }
        } catch (error) {
            console.error("Failed to load bookings", error);
            toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;
        try {
            const res = await deleteBookingAdmin(id);
            if (res.success) {
                toast({ title: "Success", description: "Booking deleted successfully" });
                loadBookings(currentPage);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete booking", variant: "destructive" });
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Bookings
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all pooja and seva bookings across all temples
                    </p>
                </div>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Bookings", value: totalItems, color: "text-foreground" },
                    { label: "Confirmed", value: stats.booked, color: "text-emerald-600" },
                    { label: "Completed", value: stats.completed, color: "text-emerald-700" },
                    { label: "Cancelled/Rejected", value: stats.cancelled + stats.rejected, color: "text-rose-600" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID, service, temple or devotee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "BOOKED", "COMPLETED", "CANCELLED", "REJECTED"].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "sacred" : "outline"}
                            size="sm"
                            onClick={() => {
                                setStatusFilter(status);
                                setCurrentPage(1);
                            }}
                            className="capitalize"
                        >
                            {status === "all" ? "All Status" : status === "BOOKED" ? "Confirmed" : status.toLowerCase()}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Date Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2">
                    <Calendar className="w-4 h-4" />
                    <span>Duration:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: "All Time", value: "all" },
                        { label: "This Week", value: "week" },
                        { label: "This Month", value: "month" },
                        { label: "This Year", value: "year" },
                        { label: "Custom Range", value: "custom" },
                    ].map((range) => (
                        <Button
                            key={range.value}
                            variant={dateRange === range.value ? "sacred" : "outline"}
                            size="sm"
                            onClick={() => {
                                setDateRange(range.value as any);
                                if (range.value !== "custom") {
                                    setShowCustomDate(false);
                                } else {
                                    setShowCustomDate(!showCustomDate);
                                }
                                setCurrentPage(1);
                            }}
                            className="text-xs"
                        >
                            {range.label}
                            {range.value === "custom" && <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showCustomDate ? 'rotate-180' : ''}`} />}
                        </Button>
                    ))}
                </div>

                <AnimatePresence>
                    {(dateRange === "custom" || showCustomDate) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col md:flex-row items-end gap-3 w-full md:w-auto overflow-hidden"
                        >
                            <div className="space-y-1 w-full md:w-auto">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1 w-full md:w-auto">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">End Date</label>
                                <Input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-xs"
                                onClick={() => {
                                    setCustomStartDate("");
                                    setCustomEndDate("");
                                }}
                            >
                                Clear
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bookings Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Booking ID</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Service</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Temple</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Devotee</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Schedule</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Amount</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground text-nowrap">Status</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground text-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">Loading bookings...</td>
                                    </tr>
                                ) : bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">No bookings found</td>
                                    </tr>
                                ) : bookings.map((booking, index) => {
                                    const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.BOOKED;
                                    return (
                                        <motion.tr
                                            key={booking.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="border-b border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <p className="font-mono text-xs font-medium text-primary">
                                                    {booking.id.toUpperCase()}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium text-foreground">{booking.pooja?.name}</p>
                                                <p className="text-[14px] text-muted-foreground">{booking.packageName}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">
                                                        {booking.temple?.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">{booking.devoteeName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="text-sm text-foreground">
                                                        {booking.bookingDate || new Date(booking.createdAt).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-[13px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Booked: {new Date(booking.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-semibold text-foreground">₹{booking.packagePrice}</p>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={`text-[13px] uppercase font-bold ${status.color}`}>
                                                    <status.icon className="w-4 h-4 mr-1" />
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(booking.id)}>
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

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                        <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                        </span>{" "}
                        of <span className="font-medium">{totalItems}</span> results
                    </p>
                    <Pagination className="justify-end w-auto mx-0">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {/* Simple pagination logic */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((page, idx, array) => (
                                    <React.Fragment key={page}>
                                        {idx > 0 && array[idx - 1] !== page - 1 && (
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )}
                                        <PaginationItem>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(page);
                                                }}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </React.Fragment>
                                ))}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(currentPage + 1);
                                    }}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Booking Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="bg-primary p-8 text-white relative">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Building2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold">Booking Details</h3>
                                        <p className="text-white/80 text-sm">Full information for {selectedBooking.id.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${(statusConfig[selectedBooking.status as keyof typeof statusConfig] || statusConfig.BOOKED).color}`}>
                                            {React.createElement((statusConfig[selectedBooking.status as keyof typeof statusConfig] || statusConfig.BOOKED).icon, { className: "w-5 h-5" })}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                                            <p className="font-bold text-slate-700">{selectedBooking.status}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="px-3 py-1 bg-white font-mono text-xs">
                                        {selectedBooking.id.toUpperCase()}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Service & Temple</p>
                                            <p className="text-slate-800 font-bold">{selectedBooking.pooja?.name}</p>
                                            <p className="text-sm text-primary flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {selectedBooking.temple?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Package Type</p>
                                            <p className="text-slate-700 font-medium">{selectedBooking.packageName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Schedule Date</p>
                                            <p className="text-slate-700 font-medium flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedBooking.bookingDate || "Not Specified"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Devotee Information</p>
                                            <p className="text-slate-800 font-bold flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                {selectedBooking.devoteeName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Contact Details</p>
                                            <div className="space-y-1">
                                                <p className="text-slate-700 font-medium flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    {selectedBooking.devoteePhone}
                                                </p>
                                                <p className="text-slate-700 font-medium flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    {selectedBooking.devoteeEmail || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Delivery Address</p>
                                        <p className="text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                            {selectedBooking.address || "No address provided"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Special Requests / Gotra</p>
                                        <p className="text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                            {selectedBooking.specialRequests || "No special requests"}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Offering</p>
                                        <p className="text-2xl font-bold text-primary">₹{selectedBooking.packagePrice}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedBooking(null)}
                                        className="rounded-xl px-6 border-slate-200 text-slate-600"
                                    >
                                        Close Details
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

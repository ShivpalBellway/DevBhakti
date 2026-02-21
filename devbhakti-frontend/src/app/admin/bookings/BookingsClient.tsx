"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
    ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAllBookingsAdmin, deleteBookingAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminAuth } from "@/hooks/use-admin-auth";


const statusConfig = {
    BOOKED: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
    COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
    CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-700 border-slate-200", icon: X },
    PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
};

function BookingsContent() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState("all");
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();


    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [stats, setStats] = useState({ booked: 0, completed: 0, cancelled: 0, rejected: 0 });

    const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year" | "custom">("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [showCustomDate, setShowCustomDate] = useState(false);

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
                status: statusFilter,
                startDate,
                endDate
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
        if (idParam) setSearchQuery(idParam);
    }, [idParam]);

    useEffect(() => {
        loadBookings(currentPage);
    }, [debouncedSearch, statusFilter, dateRange, customStartDate, customEndDate, currentPage]);

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#794A05]">Pooja Bookings</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage all sacred service reservations</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: totalItems, color: "text-slate-900" },
                    { label: "Confirmed", value: stats.booked, color: "text-emerald-600" },
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

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search IDs, Devotees, Temples..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-11 rounded-xl"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "BOOKED", "COMPLETED", "CANCELLED", "REJECTED"].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="rounded-xl px-4 h-10"
                        >
                            {status === "all" ? "All" : status}
                        </Button>
                    ))}
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-[24px] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#FAF9F6] border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Service</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Devotee</th>
                                <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400">Loading Sacred Data...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400">No results found</td></tr>
                            ) : bookings.map((booking) => {
                                const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.BOOKED;
                                return (
                                    <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-[11px] font-bold text-[#794A05]">#{booking.id.slice(-8).toUpperCase()}</td>
                                        <td className="p-4"><p className="text-sm font-bold text-slate-900">{booking.pooja?.name}</p></td>
                                        <td className="p-4"><p className="text-sm font-bold text-slate-900">{booking.devoteeName}</p></td>
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
                        </div>
                        <Button className="w-full mt-8 bg-[#794A05] hover:bg-[#5d3904] text-white h-12 rounded-2xl font-bold" onClick={() => setSelectedBooking(null)}>Close Details</Button>
                    </div>
                </div>
            )}
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

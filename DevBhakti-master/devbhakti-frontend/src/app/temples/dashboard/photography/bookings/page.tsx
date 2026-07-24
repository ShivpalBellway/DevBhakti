"use client";

import React, { useState, useEffect } from "react";
import { Camera, Search, Filter, Calendar, Clock, MapPin, User, QrCode, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fetchPhotoBookings, verifyPhotoTicket } from "@/api/photoAdminController";
import Link from "next/link";

export default function PhotographyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const res = await fetchPhotoBookings();
            if (res.success) {
                setBookings(res.data || []);
            }
        } catch (error) {
            toast.error("Failed to fetch photography bookings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleQuickVerify = async (booking: any) => {
        if (!confirm(`Mark ticket ${booking.displayId} as COMPLETED (Entry Allowed)?`)) return;
        try {
            setVerifyingId(booking.id);
            const res = await verifyPhotoTicket({ displayId: booking.displayId });
            if (res.success) {
                toast.success(`Ticket ${booking.displayId} marked as COMPLETED!`);
                loadBookings();
            } else {
                toast.error(res.message || "Failed to verify ticket");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to verify ticket");
        } finally {
            setVerifyingId(null);
        }
    };

    const filteredBookings = bookings.filter((b) => {
        const matchesQuery =
            (b.displayId && b.displayId.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.userName && b.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.userPhone && b.userPhone.includes(searchQuery)) ||
            (b.area && b.area.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Camera className="w-7 h-7 text-amber-600" />
                        Photography Bookings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View, search, and verify all devotee photography passes & gate entries.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={loadBookings} variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                    <Link href="/temples/dashboard/photography">
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                            Manage Settings & Slots
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border p-4 rounded-2xl shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Ticket ID, Name, Phone, Area..."
                        className="pl-9 rounded-xl text-sm"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-xl text-sm bg-background outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-auto"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="APPROVED">APPROVED (Active Pass)</option>
                        <option value="COMPLETED">COMPLETED (Used Entry)</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground space-y-2">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs">Loading photography bookings...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
                                    <th className="p-4">Pass Code / QR</th>
                                    <th className="p-4">Devotee Details</th>
                                    <th className="p-4">Package</th>
                                    <th className="p-4">Allowed Area</th>
                                    <th className="p-4">Date & Slot</th>
                                    <th className="p-4">Payment Breakdown</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Gate Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900">
                                                {b.displayId}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-foreground">{b.userName}</div>
                                            <div className="text-[11px] text-muted-foreground">{b.userPhone}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-foreground">
                                            {b.package?.name?.en || b.package?.name || "Standard Pass"}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[11px] font-medium">
                                                <MapPin className="w-3 h-3 text-amber-600" />
                                                {b.area}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-foreground">
                                                {new Date(b.bookingDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {b.slotTime}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-foreground">₹{b.totalAmount}</div>
                                            <div className="text-[10px] text-muted-foreground">
                                                (Temple: ₹{b.templeAmount} + Fee: ₹{b.platformFee})
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                                b.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" :
                                                b.status === "APPROVED" || b.status === "CONFIRMED" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" :
                                                "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                            }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {b.status === "APPROVED" || b.status === "CONFIRMED" ? (
                                                <Button
                                                    onClick={() => handleQuickVerify(b)}
                                                    disabled={verifyingId === b.id}
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl h-8 px-3"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Allow Entry
                                                </Button>
                                            ) : b.status === "COMPLETED" ? (
                                                <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Used
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {filteredBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-muted-foreground">
                                            <Camera className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                                            No photography bookings found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

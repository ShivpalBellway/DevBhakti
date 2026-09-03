"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Calendar,
    IndianRupee,
    Loader2,
    Eye,
    Printer,
    Download,
    ArrowLeft,
    Filter,
    X,
    Phone,
    Mail,
    CheckCircle2,
    BookOpen,
    TrendingUp,
    Users,
    CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchMyMandalBookings } from "@/api/mandalAdminController";
import { parseLocalizedValue } from "@/utils/textUtils";
import { generatePoojaReceiptHTML, downloadPoojaReceiptPDF } from "@/utils/poojaReceipt";
import AddOfflineBookingPage from "./AddOfflineBookingPage";

const statusColors: Record<string, string> = {
    BOOKED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
    CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function MandalOfflinePoojaPage() {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<"list" | "add">("list");
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const loadBookings = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyMandalBookings();
            if (response.success) {
                // Filter strictly for offline bookings (excluding online Razorpay bookings)
                const offlineList = (response.data || []).filter((b: any) => {
                    return b.isOffline === true || b.bookingSource === "OFFLINE" || (b.paymentMethod === "CASH" && !b.razorpayPaymentId);
                });
                setBookings(offlineList);
            } else {
                toast({ title: "Error", description: response.message || "Failed to load bookings", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to load bookings:", error);
            toast({ title: "Error", description: "Failed to fetch offline pooja bookings", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === "list") {
            loadBookings();
        }
    }, [viewMode]);

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        let todayCount = 0;
        let todayTotal = 0;
        let grandTotal = 0;

        bookings.forEach((b) => {
            const amount = Number(b.packagePrice || b.totalAmount || 0);
            grandTotal += amount;

            const bDate = b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 10) : b.bookingDate;
            if (bDate === todayStr) {
                todayCount += 1;
                todayTotal += amount;
            }
        });

        return {
            totalBookings: bookings.length,
            todayCount,
            todayTotal,
            grandTotal,
        };
    }, [bookings]);

    // Filtered bookings list
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const devoteeName = (b.devoteeName || "").toLowerCase();
            const devoteePhone = (b.devoteePhone || "").toLowerCase();
            const poojaName = (b.pooja ? parseLocalizedValue(b.pooja.name) : "").toLowerCase();
            const displayId = (b.displayId || b.id || "").toLowerCase();

            const query = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || devoteeName.includes(query) || devoteePhone.includes(query) || poojaName.includes(query) || displayId.includes(query);

            const matchesPayment = paymentFilter === "ALL" || (b.paymentMethod || "").toUpperCase() === paymentFilter.toUpperCase();
            const matchesStatus = statusFilter === "ALL" || (b.status || "").toUpperCase() === statusFilter.toUpperCase();

            return matchesSearch && matchesPayment && matchesStatus;
        });
    }, [bookings, searchQuery, paymentFilter, statusFilter]);

    const handlePrintReceipt = (booking: any) => {
        const receiptData = {
            id: booking.displayId || booking.id,
            devoteeName: booking.devoteeName || "Devotee",
            devoteePhone: booking.devoteePhone || "N/A",
            devoteeEmail: booking.devoteeEmail || "",
            poojaName: booking.pooja ? parseLocalizedValue(booking.pooja.name) : "Offline Pooja",
            templeName: booking.mandal?.name ? parseLocalizedValue(booking.mandal.name) : "DevBhakti Mandal",
            packageName: booking.packageName || "Standard Package",
            packagePrice: Number(booking.packagePrice || 0),
            platformFee: Number(booking.platformFee || 0),
            totalAmount: Number((booking.packagePrice || 0) + (booking.platformFee || 0)),
            status: booking.status || "CONFIRMED",
            bookingDate: booking.bookingDate || new Date(booking.createdAt).toLocaleDateString(),
            createdAt: booking.createdAt || new Date().toISOString(),
            gothra: booking.gothra,
            kuldevi: booking.kuldevi,
            kuldevta: booking.kuldevta,
        };

        const t = (k: string) => k;
        const html = generatePoojaReceiptHTML(receiptData as any, t);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 400);
        }
    };

    const handleDownloadReceipt = (booking: any) => {
        const receiptData = {
            id: booking.displayId || booking.id,
            devoteeName: booking.devoteeName || "Devotee",
            devoteePhone: booking.devoteePhone || "N/A",
            devoteeEmail: booking.devoteeEmail || "",
            poojaName: booking.pooja ? parseLocalizedValue(booking.pooja.name) : "Offline Pooja",
            templeName: booking.mandal?.name ? parseLocalizedValue(booking.mandal.name) : "DevBhakti Mandal",
            packageName: booking.packageName || "Standard Package",
            packagePrice: Number(booking.packagePrice || 0),
            platformFee: Number(booking.platformFee || 0),
            totalAmount: Number((booking.packagePrice || 0) + (booking.platformFee || 0)),
            status: booking.status || "CONFIRMED",
            bookingDate: booking.bookingDate || new Date(booking.createdAt).toLocaleDateString(),
            createdAt: booking.createdAt || new Date().toISOString(),
            gothra: booking.gothra,
            kuldevi: booking.kuldevi,
            kuldevta: booking.kuldevta,
        };
        const t = (k: string) => k;
        downloadPoojaReceiptPDF(receiptData as any, t);
    };

    if (viewMode === "add") {
        return <AddOfflineBookingPage onBack={() => setViewMode("list")} />;
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
            {/* Top Breadcrumb Navigation */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/mandals/dashboard/teller" className="hover:text-[#7b4623] flex items-center gap-1 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Teller Module
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">Offline Pooja Management</span>
                </div>
                <Button onClick={() => setViewMode("add")} className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-md rounded-xl">
                    <Plus className="w-4 h-4 mr-2" /> Add Offline Pooja Booking
                </Button>
            </div>

            {/* Header Title */}
            <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Offline Pooja Bookings</h1>
                <p className="text-sm text-slate-500">View, manage, and record manual pooja bookings for your mandal.</p>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white shadow-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Bookings</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalBookings}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{stats.todayCount} added today</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                            <BookOpen className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Today's Collection</p>
                            <h3 className="text-2xl font-bold text-emerald-700 mt-1">₹{stats.todayTotal.toLocaleString()}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Offline bookings today</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Collection</p>
                            <h3 className="text-2xl font-bold text-blue-700 mt-1">₹{stats.grandTotal.toLocaleString()}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Cumulative offline revenue</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by devotee, phone, pooja, or booking ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 rounded-xl border-slate-200 focus:border-[#7b4623]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20"
                            >
                                <option value="ALL">All Payment Methods</option>
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                            </select>
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20"
                        >
                            <option value="ALL">All Status</option>
                            <option value="BOOKED">Booked</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="PENDING">Pending</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Bookings List Table */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5 text-left font-semibold">Booking ID</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Devotee Name</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Phone</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Pooja Service</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Booking Date</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Amount</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Payment</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Status</th>
                                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#7b4623]" />
                                            <span>Loading offline pooja bookings...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                        <p className="font-medium text-base text-slate-700">No offline bookings found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try adjusting search query or filter criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-700">
                                            {booking.displayId || booking.id?.slice(-8) || "N/A"}
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                                            {booking.devoteeName || "Devotee"}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600">
                                            {booking.devoteePhone || "N/A"}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                                            {booking.pooja ? parseLocalizedValue(booking.pooja.name) : "Pooja Service"}
                                            {booking.packageName && <span className="block text-xs text-slate-400">{booking.packageName}</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600">
                                            {booking.bookingDate || (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-IN") : "N/A")}
                                        </td>
                                        <td className="px-4 py-3.5 font-bold text-emerald-700">
                                            ₹{Number(booking.packagePrice || booking.totalAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Badge variant="outline" className="uppercase text-xs font-semibold bg-slate-50 text-slate-700">
                                                {booking.paymentMethod || "CASH"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Badge className={`border text-xs ${statusColors[booking.status] || "bg-emerald-100 text-emerald-800 border-emerald-200"}`}>
                                                {booking.status || "BOOKED"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                    title="View Booking Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handlePrintReceipt(booking)}
                                                    className="h-8 w-8 text-slate-700 hover:bg-slate-100"
                                                    title="Print Receipt"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownloadReceipt(booking)}
                                                    className="h-8 w-8 text-emerald-700 hover:bg-emerald-50"
                                                    title="Download PDF Receipt"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-serif font-bold text-slate-900">Offline Booking Details</h2>
                            <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Booking ID</p>
                                    <p className="font-mono font-bold text-slate-800">{selectedBooking.displayId || selectedBooking.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Payment Method</p>
                                    <Badge variant="outline" className="uppercase text-xs mt-0.5">{selectedBooking.paymentMethod || "CASH"}</Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Devotee Name</p>
                                    <p className="font-semibold text-slate-900">{selectedBooking.devoteeName || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                                    <p className="font-semibold text-slate-900">{selectedBooking.devoteePhone || "N/A"}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Pooja Service</span>
                                    <span className="font-semibold text-slate-900">{selectedBooking.pooja ? parseLocalizedValue(selectedBooking.pooja.name) : "N/A"}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Package Name</span>
                                    <span className="font-semibold text-slate-900">{selectedBooking.packageName || "Standard"}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Booking Date</span>
                                    <span className="font-semibold text-slate-900">{selectedBooking.bookingDate || "N/A"}</span>
                                </div>
                                {selectedBooking.gothra && (
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Gotra</span>
                                        <span className="font-semibold text-slate-900">{selectedBooking.gothra}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 space-y-2">
                                <div className="flex justify-between text-slate-700">
                                    <span>Pooja Package Price</span>
                                    <span className="font-bold text-slate-900">₹{selectedBooking.packagePrice || 0}</span>
                                </div>
                                <div className="border-t border-amber-200 pt-2 flex justify-between font-bold text-base text-slate-900">
                                    <span>Total Paid Amount</span>
                                    <span className="text-emerald-700">₹{Number(selectedBooking.packagePrice || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t flex gap-3">
                            <Button onClick={() => handlePrintReceipt(selectedBooking)} variant="outline" className="flex-1 rounded-xl">
                                <Printer className="w-4 h-4 mr-2" /> Print Receipt
                            </Button>
                            <Button onClick={() => setSelectedBooking(null)} className="flex-1 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

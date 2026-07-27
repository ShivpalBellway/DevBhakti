"use client";

import React, { useState, useEffect } from "react";
import { Camera, Search, Filter, Calendar, Clock, MapPin, User, QrCode, CheckCircle2, AlertCircle, RefreshCw, Trash2, Eye, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchPhotoBookings, verifyPhotoTicket, deletePhotoBooking } from "@/api/photoAdminController";
import Link from "next/link";
import QRCode from "qrcode";

export default function PhotographyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [modalQrUrl, setModalQrUrl] = useState<string>("");

    useEffect(() => {
        if (!selectedBooking) {
            setModalQrUrl("");
            return;
        }
        const generateQr = async () => {
            try {
                const qrUrl = `${window.location.origin}/temples/dashboard/verify-photo-ticket/${selectedBooking.id}`;
                const dataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 220 });
                setModalQrUrl(dataUrl);
            } catch (e) {
                console.error("QR Generation Error:", e);
            }
        };
        generateQr();
    }, [selectedBooking]);

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

    const handleDeleteBooking = async (booking: any) => {
        if (!confirm(`Are you sure you want to permanently delete ticket ${booking.displayId}?`)) return;
        try {
            const res = await deletePhotoBooking(booking.id);
            if (res.success) {
                toast.success(`Ticket ${booking.displayId} deleted successfully.`);
                loadBookings();
            } else {
                toast.error(res.message || "Failed to delete ticket");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete ticket");
        }
    };

    const filteredBookings = bookings.filter((b) => {
        const matchesQuery =
            (b.displayId && b.displayId.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.user?.name && b.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (b.user?.phone && b.user.phone.includes(searchQuery)) ||
            (b.selectedArea && b.selectedArea.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    return (
        <div className="space-y-6">
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
                        <option value="BOOKED">BOOKED (Active Pass)</option>
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
                                            <div className="font-bold text-foreground">{b.user?.name || "Guest"}</div>
                                            <div className="text-[11px] text-muted-foreground">{b.user?.phone || "N/A"}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-foreground">
                                            {b.package?.name?.en || b.package?.name || "Standard Pass"}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[11px] font-medium">
                                                <MapPin className="w-3 h-3 text-amber-600" />
                                                {b.selectedArea}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-foreground">
                                                {new Date(b.bookingDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {b.timeSlot}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-foreground">₹{b.totalAmount}</div>
                                            <div className="text-[10px] text-muted-foreground">
                                                (Temple: ₹{b.packagePrice} + Fee: ₹{b.platformFee})
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                                b.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" :
                                                b.status === "BOOKED" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" :
                                                "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                            }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {b.status === "BOOKED" ? (
                                                    <Button
                                                        onClick={() => handleQuickVerify(b)}
                                                        disabled={verifyingId === b.id}
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl h-8 px-3"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Allow Entry
                                                    </Button>
                                                ) : b.status === "COMPLETED" ? (
                                                    <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1 px-3">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Used
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground px-3">-</span>
                                                )}
                                                
                                                <Button
                                                    onClick={() => setSelectedBooking(b)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl"
                                                    title="View Full Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                <Button
                                                    onClick={() => handleDeleteBooking(b)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                    title="Delete Booking"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
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

            {/* View Full Details Dialog */}
            <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="bg-amber-50 p-6 border-b border-amber-100">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-900">
                            <QrCode className="w-6 h-6 text-amber-600" />
                            Pass Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="p-6 space-y-6">
                            {/* Status & ID Badge */}
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Ticket ID</p>
                                    <p className="font-mono font-bold text-amber-700 text-lg">{selectedBooking.displayId}</p>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                                    selectedBooking.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                                    selectedBooking.status === "BOOKED" ? "bg-blue-100 text-blue-700" :
                                    "bg-amber-100 text-amber-700"
                                }`}>
                                    {selectedBooking.status}
                                </span>
                            </div>

                            {/* Scannable Pass QR Code */}
                            <div className="bg-[#f8f4f1] p-4 rounded-2xl flex flex-col items-center justify-center border border-amber-200/60 shadow-inner">
                                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-2">Scannable Pass QR Code</p>
                                {modalQrUrl ? (
                                    <img src={modalQrUrl} alt="Pass QR Code" className="h-44 w-44 object-contain rounded-xl bg-white p-2 shadow-sm border border-amber-100" />
                                ) : (
                                    <div className="h-44 w-44 bg-white border border-amber-300 rounded-xl flex items-center justify-center">
                                        <Camera className="h-10 w-10 text-amber-600 animate-pulse" />
                                    </div>
                                )}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Devotee</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedBooking.user?.name || "Guest"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Phone</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedBooking.user?.phone || "N/A"}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Slot</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedBooking.timeSlot}</p>
                                </div>

                                <div className="space-y-1 col-span-2">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Allowed Area</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedBooking.selectedArea}</p>
                                </div>
                            </div>

                            <hr className="border-dashed" />

                            {/* Payment Info */}
                            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Payment Breakdown</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>{selectedBooking.package?.name?.en || selectedBooking.package?.name || "Pass"} Fee</span>
                                        <span className="font-medium">₹{selectedBooking.packagePrice}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Platform Fee</span>
                                        <span className="font-medium">₹{selectedBooking.platformFee}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-orange-200">
                                        <span>Total Amount</span>
                                        <span className="text-amber-700">₹{selectedBooking.totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button onClick={() => setSelectedBooking(null)} className="rounded-xl px-8" variant="outline">Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { fetchMyBookings, downloadBookingReceipt, fetchPrasadTracking } from "@/api/userController";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
    Calendar,
    ChevronRight,
    CheckCircle2,
    Church,
    Clock,
    ArrowLeft,
    Phone,
    Mail,
    User,
    MapPin,
    AlertCircle,
    Sparkles,
    Users,
    IndianRupee,
    Camera,
    QrCode
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/config/apiConfig";
import { useLanguage } from "@/context/LanguageContext";
import QRCode from "qrcode";

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useLanguage();

    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [activeTrackingBooking, setActiveTrackingBooking] = useState<any | null>(null);
    const [trackingDetails, setTrackingDetails] = useState<any | null>(null);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);
    const [manualAwb, setManualAwb] = useState("");
    const [isManualTracking, setIsManualTracking] = useState(false);

    const [selectedPassBooking, setSelectedPassBooking] = useState<any | null>(null);
    const [passQrUrl, setPassQrUrl] = useState<string>("");

    const handleViewTracking = async (booking: any) => {
        setIsTrackingModalOpen(true);
        setActiveTrackingBooking(booking);
        
        if (!booking.awbCode) {
            setIsTrackingLoading(false);
            setTrackingDetails(null);
            return;
        }

        setIsTrackingLoading(true);
        setTrackingDetails(null);
        try {
            const res = await fetchPrasadTracking(booking.id);
            if (res.success && res.trackingData) {
                setTrackingDetails(res.trackingData);
            } else {
                toast({
                    title: "Tracking Details",
                    description: res.message || "Failed to fetch live tracking details. Using status estimation.",
                });
            }
        } catch (error) {
            console.error("Tracking fetch error:", error);
        } finally {
            setIsTrackingLoading(false);
        }
    };

    const handleManualAwbTrack = async () => {
        const code = manualAwb.trim();
        if (!code) return;
        setIsManualTracking(true);
        setTrackingDetails(null);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/bookings/track-awb?awb=${encodeURIComponent(code)}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.success && data.trackingData) {
                setTrackingDetails(data.trackingData);
            } else {
                toast({ title: "Not Found", description: data.message || "No tracking data found for this AWB code." });
            }
        } catch {
            toast({ title: "Error", description: "Could not fetch tracking info. Please try again." });
        } finally {
            setIsManualTracking(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const response = await fetchMyBookings();
            if (response.success) {
                setBookings(response.data);
            }
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (bookingId: string) => {
        setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
    };

    const handleDownloadReceipt = async (booking: any) => {
        setDownloadingId(booking.id);
        try {
            const res = await downloadBookingReceipt(booking.id);
            if (res.success) {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Receipt-${booking.id.slice(-6)}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                toast({
                    title: t("bookings.download_failed_title"),
                    description: t("bookings.download_failed_desc"),
                    variant: "destructive"
                });
            }
        } catch (e) {
            console.error(e);
            toast({
                title: t("bookings.download_error_title"),
                description: t("bookings.download_error_desc"),
                variant: "destructive"
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "BOOKED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "REJECTED":
            case "CANCELLED": return "bg-rose-100 text-rose-700 border-rose-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING": return t("bookings.status_pending");
            case "BOOKED": return t("bookings.status_booked");
            case "COMPLETED": return t("bookings.status_completed");
            case "REJECTED": return t("bookings.status_rejected");
            case "CANCELLED": return t("bookings.status_cancelled");
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF6]">
            <Navbar />
            <main className="pt-28 pb-20 container mx-auto px-4 relative">
                <div className="absolute inset-0 pattern-sacred opacity-40 pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} className="rounded-full">
                            <ArrowLeft className="w-5 h-5 text-[#794A05]" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900">{t("bookings.page_title")}</h1>
                            <p className="text-slate-500">{t("bookings.page_subtitle")}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-slate-100" />
                            ))}
                        </div>
                    ) : bookings.length === 0 ? (
                        <Card className="rounded-[2.5rem] border-dashed border-2 p-12 text-center bg-white/50">
                            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{t("bookings.empty_title")}</h3>
                            <p className="text-slate-500 mb-6">{t("bookings.empty_subtitle")}</p>
                            <Button onClick={() => router.push("/poojas")} className="bg-[#794A05] hover:bg-[#5d3804] text-white rounded-full px-8 h-12">
                                {t("bookings.empty_cta")}
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {bookings.map((booking, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={booking.id}
                                    className={cn(
                                        "group bg-white rounded-[2rem] border border-orange-100/50 shadow-lg shadow-orange-900/5 transition-all duration-500 overflow-hidden",
                                        expandedBookingId === booking.id ? "ring-2 ring-orange-200" : "hover:border-orange-200"
                                    )}
                                >
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-orange-50 rounded-2xl">
                                                    <Calendar className="w-6 h-6 text-[#794A05]" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                            {format(new Date(booking.createdAt), "dd MMM yyyy")}
                                                        </span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <Badge variant="secondary" className="bg-orange-100 text-[#794A05] hover:bg-orange-200 border-none px-2 py-0 h-4 text-[9px] font-bold uppercase tracking-tighter">
                                                            {booking.packageName}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t("bookings.label_booking_id")}</p>
                                                        <p className="font-mono text-sm font-bold text-slate-900 leading-none">#{booking.id.slice(-8).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t("bookings.label_status")}</p>
                                                <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 font-bold text-[10px]", getStatusColor(booking.status))}>
                                                    {getStatusLabel(booking.status)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6 border-y border-slate-50">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={booking.pooja?.image ? (booking.pooja.image.startsWith('http') ? booking.pooja.image : `${BASE_URL.replace('/api', '')}${booking.pooja.image}`) : "/placeholder.png"}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t("bookings.label_pooja_seva")}</p>
                                                    <p className="text-sm font-bold text-slate-900">{booking.pooja?.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">@{booking.temple?.name}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t("bookings.label_devotee_name")}</p>
                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    {booking.devoteeName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t("bookings.label_total_offering")}</p>
                                                <p className="text-xl font-bold text-[#794A05]">₹{( (booking.packagePrice || 0) + (booking.platformFee || 0) ).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {format(new Date(booking.createdAt), "hh:mm a")}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {booking.type === 'PHOTOGRAPHY' && (
                                                    <Button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            setSelectedPassBooking(booking);
                                                            try {
                                                                const qrUrl = `${window.location.origin}/temples/dashboard/verify-photo-ticket/${booking.id}`;
                                                                const dataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 220 });
                                                                setPassQrUrl(dataUrl);
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                        className="bg-[#7c4624] hover:bg-[#5c3a21] text-white rounded-full px-4 h-9 text-xs font-bold transition-all flex items-center gap-1.5"
                                                    >
                                                        <Camera className="w-3.5 h-3.5" />
                                                        View Pass & QR
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadReceipt(booking);
                                                    }}
                                                    disabled={downloadingId === booking.id}
                                                    variant="outline"
                                                    className="border-primary/20 text-primary hover:bg-primary/5 rounded-full px-4 h-9 text-xs font-bold transition-all"
                                                >
                                                    {downloadingId === booking.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Download className="w-3.5 h-3.5 mr-1.5" />
                                                            {t("bookings.btn_receipt")}
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => toggleExpand(booking.id)}
                                                    variant="ghost"
                                                    className={cn(
                                                        "text-primary font-bold hover:bg-orange-50 rounded-full group transition-all h-9 px-4 text-xs",
                                                        expandedBookingId === booking.id && "bg-orange-50"
                                                    )}
                                                >
                                                    {expandedBookingId === booking.id ? t("bookings.btn_hide_details") : t("bookings.btn_view_details")}
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 ml-1 transition-transform",
                                                        expandedBookingId === booking.id ? "rotate-90" : "group-hover:translate-x-1"
                                                    )} />
                                                </Button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedBookingId === booking.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-8 space-y-8">
                                                        <div className="grid md:grid-cols-2 gap-6">
                                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <Phone className="w-4 h-4 text-[#794A05]" />
                                                                    {t("bookings.section_contact")}
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_phone")}</p>
                                                                        <p className="text-sm font-bold text-slate-700">{booking.devoteePhone}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_email")}</p>
                                                                        <p className="text-sm font-bold text-slate-700">{booking.devoteeEmail || t("bookings.not_provided")}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <IndianRupee className="w-4 h-4 text-[#794A05]" />
                                                                    {t("bookings.section_payment_breakdown") || "Payment Breakdown"}
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_package_price") || "Package Price"}</p>
                                                                        <p className="text-sm font-bold text-slate-700">₹{booking.packagePrice?.toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_platform_fee") || "Platform Fee"}</p>
                                                                        <p className="text-sm font-bold text-slate-700">+ ₹{booking.platformFee?.toLocaleString() || 0}</p>
                                                                    </div>
                                                                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-900 font-bold uppercase tracking-tighter">{t("bookings.label_total_paid") || "Total Paid"}</p>
                                                                        <p className="text-sm font-bold text-[#794A05]">₹{((booking.packagePrice || 0) + (booking.platformFee || 0)).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {booking.isPrasadRequested && (
                                                                <div className="md:col-span-2 bg-[#FAF9F6] p-6 rounded-3xl border border-orange-100/50 flex flex-col gap-6">
                                                                    <div className="flex items-center justify-between border-b pb-3">
                                                                        <h4 className="text-sm font-bold text-[#794A05] uppercase tracking-wider flex items-center gap-2">
                                                                            <Sparkles className="w-4 h-4" />
                                                                            Prasad Delivery & Tracking
                                                                        </h4>
                                                                        <Badge className="bg-orange-100 text-[#794A05] hover:bg-orange-200 border-none">
                                                                            {booking.prasadStatus || "PREPARING"}
                                                                        </Badge>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <div className="space-y-1">
                                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                                                                                Delivery Address
                                                                            </span>
                                                                            {booking.prasadStreet ? (
                                                                                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                                                                                    {booking.prasadStreet}<br />
                                                                                    {booking.prasadCity}, {booking.prasadState} - <span className="font-bold">{booking.prasadPincode}</span>
                                                                                </p>
                                                                            ) : (
                                                                                <p className="text-sm font-medium text-slate-700">{booking.address || "No delivery address provided."}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center justify-start sm:justify-end">
                                                                            <Button 
                                                                                onClick={() => handleViewTracking(booking)}
                                                                                className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xs py-2 px-4 shadow-md transition-all duration-300 flex items-center gap-2"
                                                                            >
                                                                                🚚 Track Live Shipment
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 py-4">
                                                                        {[
                                                                            { key: 'PREPARING', label: 'Preparing', icon: '🥣' },
                                                                            { key: 'DISPATCHED', label: 'Dispatched', icon: '📦' },
                                                                            { key: 'IN_TRANSIT', label: 'In Transit', icon: '🚚' },
                                                                            { key: 'DELIVERED', label: 'Delivered', icon: '🎁' }
                                                                        ].map((step, sIdx, arr) => {
                                                                            const statuses = ['PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
                                                                            const currentIdx = statuses.indexOf(booking.prasadStatus || 'PREPARING');
                                                                            const isCompleted = sIdx <= currentIdx;
                                                                            const isActive = sIdx === currentIdx;

                                                                            return (
                                                                                <React.Fragment key={step.key}>
                                                                                    <div className="flex flex-col items-center z-10">
                                                                                        <div className={cn(
                                                                                            "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border transition-all duration-300",
                                                                                            isActive ? "bg-orange-500 border-orange-600 scale-110 text-white font-bold" :
                                                                                            isCompleted ? "bg-[#794A05] border-[#794A05] text-white" :
                                                                                            "bg-white border-slate-200 text-slate-400"
                                                                                        )}>
                                                                                            {step.icon}
                                                                                        </div>
                                                                                        <span className={cn(
                                                                                            "text-xs font-semibold mt-2",
                                                                                            isActive ? "text-orange-600 font-bold" :
                                                                                            isCompleted ? "text-slate-800" :
                                                                                            "text-slate-400"
                                                                                        )}>
                                                                                            {step.label}
                                                                                        </span>
                                                                                    </div>
                                                                                    {sIdx < arr.length - 1 && (
                                                                                        <div className={cn(
                                                                                            "hidden md:block flex-1 h-1 rounded transition-all duration-300",
                                                                                            sIdx < currentIdx ? "bg-[#794A05]" : "bg-slate-200"
                                                                                        )} />
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {booking.courierName && (
                                                                        <div className="mt-2 p-4 bg-white rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                            <div>
                                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Courier Partner</span>
                                                                                <p className="text-sm font-bold text-slate-800">{booking.courierName}</p>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AWB / Tracking ID</span>
                                                                                <p className="text-sm font-bold text-[#794A05] tracking-widest">{booking.awbCode || "Awaiting"}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {(booking.gothra || booking.kuldevi || booking.kuldevta || booking.dob || booking.anniversary || booking.nativePlace) && (
                                                            <div className="bg-orange-50/20 p-6 rounded-3xl border border-orange-100/50">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <Sparkles className="w-4 h-4 text-[#794A05]" />
                                                                    {t("bookings.section_spiritual")}
                                                                </h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                                    {booking.gothra && (
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_gothra")}</p>
                                                                            <p className="text-sm font-bold text-slate-700">{booking.gothra}</p>
                                                                        </div>
                                                                    )}
                                                                    {booking.kuldevi && (
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_kuldevi")}</p>
                                                                            <p className="text-sm font-bold text-slate-700">{booking.kuldevi}</p>
                                                                        </div>
                                                                    )}
                                                                    {booking.kuldevta && (
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_kuldevta")}</p>
                                                                            <p className="text-sm font-bold text-slate-700">{booking.kuldevta}</p>
                                                                        </div>
                                                                    )}
                                                                    {booking.dob && (
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_dob")}</p>
                                                                            <p className="text-sm font-bold text-slate-700">{booking.dob}</p>
                                                                        </div>
                                                                    )}
                                                                    {booking.anniversary && (
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_anniversary")}</p>
                                                                            <p className="text-sm font-bold text-slate-700">{booking.anniversary}</p>
                                                                        </div>
                                                                    )}
                                                                    {booking.nativePlace && (
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t("bookings.label_native_place")}</p>
                                                                            <p className="text-sm font-bold text-slate-700">{booking.nativePlace}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {booking.additionalDevotees && booking.additionalDevotees.length > 0 && (
                                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-[#794A05]" />
                                                                    {t("bookings.section_add_devotees")}
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    {booking.additionalDevotees.map((devotee: any, i: number) => (
                                                                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100/50 shadow-sm">
                                                                            <p className="text-sm font-bold text-[#794A05] mb-2">{t("bookings.devotee_prefix")}{i + 2}: {devotee.name}</p>
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                                {devotee.gothra && (
                                                                                    <div>
                                                                                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">{t("bookings.label_gothra")}</p>
                                                                                        <p className="text-xs font-medium text-slate-600">{devotee.gothra}</p>
                                                                                    </div>
                                                                                )}
                                                                                {devotee.kuldevi && (
                                                                                    <div>
                                                                                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">{t("bookings.label_kuldevi")}</p>
                                                                                        <p className="text-xs font-medium text-slate-600">{devotee.kuldevi}</p>
                                                                                    </div>
                                                                                )}
                                                                                {devotee.kuldevta && (
                                                                                    <div>
                                                                                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">{t("bookings.label_kuldevta")}</p>
                                                                                        <p className="text-xs font-medium text-slate-600">{devotee.kuldevta}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {booking.specialRequests && (
                                                            <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-100/50">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                    {t("bookings.section_special_requests")}
                                                                </h4>
                                                                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">
                                                                    {booking.specialRequests}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {booking.status === 'COMPLETED' && booking.proofPhotos && booking.proofPhotos.length > 0 && (
                                                            <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                    {t("bookings.section_proof")}
                                                                </h4>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {booking.proofPhotos.map((photo: string, i: number) => (
                                                                        <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-100 shadow-sm group">
                                                                            <img
                                                                                src={photo}
                                                                                alt={`Proof ${i + 1}`}
                                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                            />
                                                                            <a
                                                                                href={photo}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                                            >
                                                                                <span className="bg-white/90 text-emerald-700 text-xs font-bold py-2 px-4 rounded-full shadow-lg">{t("bookings.view_full_size")}</span>
                                                                            </a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between p-6 bg-[#794A05] rounded-[2rem] text-white shadow-lg shadow-orange-900/10">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                                                    <Church className="w-6 h-6 text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{t("bookings.label_ritual_by")}</p>
                                                                    <p className="font-serif font-bold text-lg">{booking.temple?.name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right hidden sm:block">
                                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{t("bookings.label_booking_date")}</p>
                                                                <p className="font-bold">{format(new Date(booking.createdAt), "PPPP")}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            {/* Live Prasad Tracking Dialog */}
            <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
                <DialogContent className="max-w-md w-full bg-white rounded-3xl p-6 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#794A05] flex items-center gap-2">
                            🚚 Live Prasad Tracking
                        </DialogTitle>
                    </DialogHeader>

                    {isTrackingLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                            <p className="text-sm font-semibold text-slate-500">Fetching live shipment logs...</p>
                        </div>
                    ) : trackingDetails?.tracking_data?.shipment_track_activities ? (
                        <div className="space-y-6 mt-4">
                            {/* Header Info */}
                            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-orange-100/50 space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Location / Status</p>
                                <p className="text-sm font-bold text-slate-800">
                                    {trackingDetails?.tracking_data?.shipment_track?.[0]?.current_status || "In Transit"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    AWB: <span className="font-semibold text-slate-700">{trackingDetails?.tracking_data?.shipment_track?.[0]?.awb_code}</span>
                                </p>
                            </div>

                            {/* Timeline Log */}
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                {trackingDetails.tracking_data.shipment_track_activities.map((act: any, idx: number) => (
                                    <div key={idx} className="flex gap-4">
                                        {/* Dot & Line */}
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm",
                                                idx === 0 ? "bg-orange-500 border-orange-600 scale-110" : "bg-white border-slate-300"
                                            )}>
                                                {idx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            {idx < trackingDetails.tracking_data.shipment_track_activities.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-slate-200 min-h-[40px] my-1" />
                                            )}
                                        </div>
                                        {/* Details */}
                                        <div className="flex-1 pb-4">
                                            <p className={cn(
                                                "text-xs font-bold",
                                                idx === 0 ? "text-orange-600" : "text-slate-800"
                                            )}>
                                                {act.activity || act.status}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                                📍 {act.location || "In Transit"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                {act.date}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : activeTrackingBooking ? (
                        <div className="space-y-5 mt-4">
                            {/* Header Info */}
                            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-orange-100/50 space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Status</p>
                                <p className="text-sm font-bold text-[#794A05]">
                                    {activeTrackingBooking.prasadStatus || "PREPARING"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    AWB Code: <span className="font-semibold text-[#794A05] tracking-widest">{activeTrackingBooking.awbCode || "Awaiting Dispatch"}</span>
                                </p>
                            </div>

                            {/* Manual AWB Search */}
                            <div className="space-y-2">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Got your AWB? Track right here 👇</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualAwb}
                                        onChange={(e) => setManualAwb(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleManualAwbTrack()}
                                        placeholder={activeTrackingBooking.awbCode || "Enter AWB / Tracking ID"}
                                        className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-[#FAF9F6] text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                                    />
                                    <Button
                                        onClick={handleManualAwbTrack}
                                        disabled={isManualTracking}
                                        className="h-10 px-4 bg-[#794A05] hover:bg-[#5a3504] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                                    >
                                        {isManualTracking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                        Track
                                    </Button>
                                </div>
                            </div>

                            {/* Timeline Log */}
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                {[
                                    { key: 'PREPARING', label: 'Pooja Completed & Prasad Preparing', desc: 'Prasad is being prepared and packed with blessings.', activeStatuses: ['PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] },
                                    { key: 'DISPATCHED', label: 'Dispatched from Temple', desc: 'Handed over to courier partner. Awaiting tracking info.', activeStatuses: ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'] },
                                    { key: 'IN_TRANSIT', label: 'In Transit', desc: 'Package is on the way to the delivery terminal.', activeStatuses: ['IN_TRANSIT', 'DELIVERED'] },
                                    { key: 'DELIVERED', label: 'Prasad Delivered Successfully', desc: 'Delivered at your address. Jai Mata Di! 🙏', activeStatuses: ['DELIVERED'] },
                                ].map((step, idx, arr) => {
                                    const currentStatus = activeTrackingBooking.prasadStatus || 'PREPARING';
                                    const isStepPassed = step.activeStatuses.includes(currentStatus);
                                    const isStepCurrent = currentStatus === step.key;

                                    if (!isStepPassed && !isStepCurrent) return null;

                                    return (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm",
                                                    isStepCurrent ? "bg-orange-500 border-orange-600 scale-110" : "bg-[#794A05] border-[#794A05]"
                                                )}>
                                                    {isStepCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                                {idx < arr.length - 1 && (
                                                    <div className="w-0.5 flex-1 bg-slate-200 min-h-[40px] my-1" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className={cn(
                                                    "text-xs font-bold",
                                                    isStepCurrent ? "text-orange-600" : "text-slate-800"
                                                )}>
                                                    {step.label}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                    {step.desc}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                                    📍 {activeTrackingBooking.prasadCity || activeTrackingBooking.address || "Temple Location"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                            <span className="text-3xl">📦</span>
                            <p className="text-sm font-bold text-slate-700">No active shipment updates yet.</p>
                            <p className="text-xs text-slate-400 max-w-[250px]">Once the courier service updates the status, logs will appear here.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* QR Pass Dialog Modal */}
            <Dialog open={!!selectedPassBooking} onOpenChange={(open) => !open && setSelectedPassBooking(null)}>
                <DialogContent className="max-w-xs w-[90vw] p-6 text-center rounded-3xl bg-white space-y-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-serif font-bold text-[#5c3a21] text-center">
                            📸 Photography Pass
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPassBooking && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-b from-[#7c4624] to-[#5c3a21] text-white p-3 rounded-2xl">
                                <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Pass ID</p>
                                <p className="text-lg font-mono font-black">{selectedPassBooking.displayId || `#${selectedPassBooking.id.slice(-6).toUpperCase()}`}</p>
                            </div>

                            <div className="bg-[#f8f4f1] p-4 rounded-2xl flex justify-center border border-orange-100">
                                {passQrUrl ? (
                                    <img src={passQrUrl} alt="QR Code Pass" className="h-44 w-44 object-contain" />
                                ) : (
                                    <div className="h-44 w-44 bg-white border border-[#7c4624] rounded-xl flex items-center justify-center">
                                        <Camera className="h-10 w-10 text-[#7c4624]" />
                                    </div>
                                )}
                            </div>

                            <div className="text-left text-xs space-y-1.5 bg-orange-50/60 p-3 rounded-2xl border border-orange-100 text-slate-800">
                                <p><span className="font-bold text-[#5c3a21]">Temple:</span> {selectedPassBooking.temple?.name || "N/A"}</p>
                                <p><span className="font-bold text-[#5c3a21]">Package:</span> {selectedPassBooking.packageName || selectedPassBooking.package?.name}</p>
                                <p><span className="font-bold text-[#5c3a21]">Date:</span> {selectedPassBooking.bookingDate}</p>
                                <p><span className="font-bold text-[#5c3a21]">Time Slot:</span> {selectedPassBooking.timeSlot || selectedPassBooking.slot?.slotName || "N/A"}</p>
                                <p><span className="font-bold text-[#5c3a21]">Area:</span> {selectedPassBooking.selectedArea || "Allowed Areas"}</p>
                            </div>

                            <Button
                                onClick={() => handleDownloadReceipt(selectedPassBooking)}
                                disabled={downloadingId === selectedPassBooking.id}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download Pass PDF
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

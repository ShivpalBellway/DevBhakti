"use client";

import React, { useState, useEffect } from "react";
import { fetchMyBookings, downloadBookingReceipt } from "@/api/userController";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
    Calendar,
    ChevronRight,
    Church,
    Clock,
    ArrowLeft,
    Phone,
    Mail,
    User,
    MapPin,
    AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/config/apiConfig";

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

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
                    title: "Download Failed",
                    description: "Could not download receipt. Please try again.",
                    variant: "destructive"
                });
            }
        } catch (e) {
            console.error(e);
            toast({
                title: "Error",
                description: "An unexpected error occurred during download.",
                variant: "destructive"
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "BOOKED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
            case "REJECTED":
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
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
                            <h1 className="text-3xl font-serif font-bold text-slate-900">My Pooja Bookings</h1>
                            <p className="text-slate-500">View and track your sacred rituals and spiritual services</p>
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
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No bookings yet</h3>
                            <p className="text-slate-500 mb-6">Experience divine connection through our wide range of Poojas and Sevas.</p>
                            <Button onClick={() => router.push("/poojas")} className="bg-[#794A05] hover:bg-[#5d3804] text-white rounded-full px-8 h-12">
                                Browse Poojas
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
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-orange-50 rounded-2xl">
                                                    <Calendar className="w-6 h-6 text-[#794A05]" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Booking ID</p>
                                                    <p className="font-mono text-sm font-bold text-slate-900">#{booking.id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 font-bold text-[10px]", getStatusColor(booking.status))}>
                                                    {booking.status}
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
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pooja / Seva</p>
                                                    <p className="text-sm font-bold text-slate-900">{booking.pooja?.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">@{booking.temple?.name}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Devotee Name</p>
                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    {booking.devoteeName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Offering</p>
                                                <p className="text-xl font-bold text-[#794A05]">₹{booking.packagePrice?.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {format(new Date(booking.createdAt), "dd MMM yyyy")}
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="font-bold text-primary">{booking.packageName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
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
                                                            Receipt
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
                                                    {expandedBookingId === booking.id ? "Hide Details" : "View Details"}
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
                                                                    Contact Information
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Phone Number</p>
                                                                        <p className="text-sm font-bold text-slate-700">{booking.devoteePhone}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Email Address</p>
                                                                        <p className="text-sm font-bold text-slate-700">{booking.devoteeEmail || "Not provided"}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100/50 flex flex-col gap-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4 text-[#794A05]" />
                                                                    Prasad Delivery Address
                                                                </h4>
                                                                <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                                                                    {booking.address || "No physical prasad delivery requested or address not provided."}
                                                                </p>
                                                            </div> */}
                                                        </div>

                                                        {booking.specialRequests && (
                                                            <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-100/50">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                    Special Requests / Gotra
                                                                </h4>
                                                                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">
                                                                    {booking.specialRequests}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                                                    <Church className="w-6 h-6 text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Ritual Conducted By</p>
                                                                    <p className="font-serif font-bold text-lg">{booking.temple?.name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right hidden sm:block">
                                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Booking Date</p>
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
        </div>
    );
}

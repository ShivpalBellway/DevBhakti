"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QrCode, CheckCircle2, XCircle, ShieldCheck, ArrowLeft, Camera, User, Calendar, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { verifyPhotoTicket } from "@/api/photoAdminController";

export default function VerifyPhotoTicketPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params?.id as string;

    const [loading, setLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleVerifyTicket = async () => {
        if (!ticketId) return;
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await verifyPhotoTicket({ displayId: ticketId });
            if (res.success) {
                setBookingDetails(res.booking);
                toast.success("Ticket verified & entry allowed successfully!");
            } else {
                setErrorMsg(res.message || "Invalid or expired ticket.");
                toast.error(res.message || "Ticket verification failed");
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Ticket verification failed or already used.";
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticketId) {
            handleVerifyTicket();
        }
    }, [ticketId]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-card border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <button
                        onClick={() => router.push("/temples/dashboard/photography")}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground flex items-center gap-1 text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                </div>

                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 mx-auto flex items-center justify-center">
                        <Camera className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Photography Gate Scanner</h1>
                    <p className="text-xs text-muted-foreground">Verifying ticket booking pass for entry approval</p>
                </div>

                {loading && (
                    <div className="py-12 text-center text-muted-foreground space-y-2">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs">Verifying QR Ticket against database...</p>
                    </div>
                )}

                {!loading && bookingDetails && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 text-center space-y-1">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                            <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">ENTRY APPROVED</h3>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">Ticket verified & status marked as COMPLETED.</p>
                        </div>

                        <div className="space-y-3 bg-muted/30 border rounded-2xl p-4 text-xs">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-1"><User className="w-3.5 h-3.5" /> Devotee Name</span>
                                <span className="font-bold text-foreground">{bookingDetails.userName}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Package</span>
                                <span className="font-semibold text-amber-600">{bookingDetails.package?.name}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Area Allowed</span>
                                <span className="font-semibold text-foreground">{bookingDetails.area}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Slot & Date</span>
                                <span className="font-semibold text-foreground">
                                    {new Date(bookingDetails.bookingDate).toLocaleDateString()} ({bookingDetails.slotTime})
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Total Amount</span>
                                <span className="font-bold text-emerald-600">₹{bookingDetails.totalAmount} (PAID)</span>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && errorMsg && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl p-5 text-center space-y-3">
                        <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                        <div>
                            <h3 className="font-bold text-red-800 dark:text-red-200 text-lg">ENTRY DENIED</h3>
                            <p className="text-xs text-red-600 dark:text-red-300 mt-1">{errorMsg}</p>
                        </div>
                        <Button
                            onClick={handleVerifyTicket}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                            Retry Verification
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

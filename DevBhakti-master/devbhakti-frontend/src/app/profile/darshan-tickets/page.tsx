"use client";

import React, { useState, useEffect } from "react";
import { fetchMyDarshanTickets } from "@/api/userController";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Camera, User, Phone, MapPin, Calendar, Clock, ChevronRight, CheckCircle2, Ticket } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseLocalizedValue } from "@/utils/textUtils";

export default function MyDarshanTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const { t, language } = useLanguage();

    const [selectedPassTicket, setSelectedPassTicket] = useState<any | null>(null);
    const [passQrUrl, setPassQrUrl] = useState<string>("");

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const response = await fetchMyDarshanTickets();
            if (response.success) {
                setTickets(response.data);
            }
        } catch (error) {
            console.error("Failed to load darshan tickets", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (ticketId: string) => {
        setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "BOOKED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "CANCELLED": return "bg-rose-100 text-rose-700 border-rose-200";
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
                            <h1 className="text-3xl font-serif font-bold text-slate-900">My Darshan Tickets</h1>
                            <p className="text-slate-500">View and manage your Darshan bookings.</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none rounded-[2rem]">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                    <Ticket className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">No Darshan Tickets Found</h3>
                                <p className="text-slate-500 mb-6 max-w-sm text-center">You haven't booked any darshan tickets yet. Explore temples to book darshan.</p>
                                <Button onClick={() => router.push("/temples")} className="rounded-full px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
                                    Explore Temples
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="bg-white rounded-[2rem] border border-orange-100/50 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative cursor-pointer"
                                    onClick={() => toggleExpand(ticket.id)}
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <Badge className={cn("px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] border", getStatusColor(ticket.status))}>
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                                        <div className="shrink-0 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-[#FDF8F3] rounded-2xl border border-orange-100/50">
                                            <Calendar className="w-8 h-8 text-[#794A05]" />
                                        </div>

                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                            <div className="col-span-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Darshan</p>
                                                <div className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">
                                                    {ticket.slot?.date ? format(new Date(ticket.slot.date), "dd MMM, yyyy") : "Date TBD"} - {ticket.slot?.startTime} to {ticket.slot?.endTime}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    <p className="text-[10px] text-slate-500 font-medium">@{parseLocalizedValue(ticket.temple?.name, language)}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Visitor</p>
                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    {ticket.visitorName}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total</p>
                                                <p className="text-xl font-bold text-[#794A05]">₹{(ticket.totalAmount || 0).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setSelectedPassTicket(ticket);
                                                        try {
                                                            const dataUrl = await QRCode.toDataURL(ticket.qrToken, { margin: 1, width: 220 });
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
                                                <Button
                                                    onClick={() => toggleExpand(ticket.id)}
                                                    variant="ghost"
                                                    className={cn(
                                                        "text-primary font-bold hover:bg-orange-50 rounded-full group transition-all h-9 px-4 text-xs",
                                                        expandedTicketId === ticket.id && "bg-orange-50"
                                                    )}
                                                >
                                                    {expandedTicketId === ticket.id ? "Hide Details" : "View Details"}
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 ml-1 transition-transform",
                                                        expandedTicketId === ticket.id ? "rotate-90" : "group-hover:translate-x-1"
                                                    )} />
                                                </Button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedTicketId === ticket.id && (
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
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Phone</p>
                                                                        <p className="text-sm font-bold text-slate-700">{ticket.visitorPhone}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Email</p>
                                                                        <p className="text-sm font-bold text-slate-700">{ticket.visitorEmail || "Not Provided"}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <Ticket className="w-4 h-4 text-[#794A05]" />
                                                                    Ticket Details
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Visitor Count</p>
                                                                        <p className="text-sm font-bold text-slate-700">{ticket.visitorCount}</p>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Ticket Price</p>
                                                                        <p className="text-sm font-bold text-slate-700">₹{(ticket.totalAmount - (ticket.platformFee || 0)).toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Platform Fee</p>
                                                                        <p className="text-sm font-bold text-slate-700">+ ₹{(ticket.platformFee || 0).toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-900 font-bold uppercase tracking-tighter">Total Paid</p>
                                                                        <p className="text-sm font-bold text-[#794A05]">₹{(ticket.totalAmount || 0).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            <Dialog open={!!selectedPassTicket} onOpenChange={() => setSelectedPassTicket(null)}>
                <DialogContent className="max-w-sm rounded-[2rem] p-0 overflow-hidden bg-[#FAF9F6] border-none shadow-2xl">
                    <div className="bg-[#794A05] text-white p-6 pb-12 rounded-b-[3rem] shadow-inner text-center relative overflow-hidden">
                        <div className="absolute inset-0 pattern-sacred opacity-10 pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-serif font-bold mb-1 tracking-tight">Darshan Pass</h2>
                            <p className="text-orange-200 text-sm font-medium uppercase tracking-widest">{parseLocalizedValue(selectedPassTicket?.temple?.name, language)}</p>
                        </div>
                    </div>
                    <div className="px-8 pb-8 pt-0 -mt-8 relative z-20">
                        <div className="bg-white p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center mx-auto mb-6 max-w-[240px] border border-orange-50">
                            {passQrUrl ? (
                                <img src={passQrUrl} alt="QR Code" className="w-full h-auto rounded-xl" />
                            ) : (
                                <div className="w-full aspect-square flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-200" />
                                </div>
                            )}
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Scan at Entrance</p>
                        </div>
                        <div className="space-y-4 px-2">
                            <div className="flex justify-between items-center border-b border-orange-100/50 pb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Name</span>
                                <span className="text-sm font-bold text-slate-800">{selectedPassTicket?.visitorName}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-orange-100/50 pb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Token</span>
                                <span className="text-sm font-bold text-primary font-mono tracking-wider">{selectedPassTicket?.displayId || selectedPassTicket?.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visitors</span>
                                <span className="text-sm font-bold text-slate-800">{selectedPassTicket?.visitorCount}</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

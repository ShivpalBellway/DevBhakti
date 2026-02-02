"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {

    Search,
    Filter,
    MoreVertical,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    User,
    Plus,
    CheckCircle2,
    Trash2,
    X,
    Church,
    Phone,
    Mail,
    Ban,
    PlayCircle,
    Calendar as CalendarIcon
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import AvailabilityManager from "@/components/temple/AvailabilityManager";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogTrigger // Added DialogTrigger
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AnimatePresence } from "framer-motion";
import {
    fetchMyTempleBookings,
    updateBookingStatus,
    deleteBooking,
    setTempleAvailability,
    getTempleAvailability
} from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig = {
    BOOKED: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: CheckCircle,
    },
    COMPLETED: {
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
    },
    REJECTED: {
        color: "bg-rose-100 text-rose-700 border-rose-200",
        icon: XCircle,
    },
    CANCELLED: {
        color: "bg-slate-100 text-slate-700 border-slate-200",
        icon: X,
    },
};

export default function TempleBookingsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [isTodayClosed, setIsTodayClosed] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadBookings();
        checkTodayAvailability();
    }, []);

    const checkTodayAvailability = async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const res = await getTempleAvailability({
                month: todayStr.split('-')[1],
                year: todayStr.split('-')[0]
            });
            if (res.success && res.data) {
                // Find global rule for today (poojaId: null)
                const todayRule = res.data.find((r: any) => r.date === todayStr && r.poojaId === null);
                if (todayRule && todayRule.isClosed) {
                    setIsTodayClosed(true);
                } else {
                    setIsTodayClosed(false);
                }
            }
        } catch (error) {
            console.error("Failed to check availability", error);
        }
    };

    const handleToggleToday = async () => {
        setIsProcessing(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const newStatus = !isTodayClosed;

            // Set global availability (poojaId: null)
            const res = await setTempleAvailability({
                date: todayStr,
                isClosed: newStatus,
                poojaId: undefined // Global
            });

            if (res.success) {
                setIsTodayClosed(newStatus);
                toast({
                    title: newStatus ? "Bookings Stopped" : "Bookings Resumed",
                    description: newStatus
                        ? "No new bookings will be accepted for today."
                        : "You are now accepting bookings for today.",
                    variant: newStatus ? "destructive" : "default"
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update availability", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const loadBookings = async () => {
        setLoading(true);
        try {
            const res = await fetchMyTempleBookings();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            console.error("Failed to load bookings", error);
            toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        setIsProcessing(true);
        try {
            const res = await updateBookingStatus(id, status);
            if (res.success) {
                toast({ title: `Booking ${status === 'BOOKED' ? 'Accepted' : 'Rejected'}`, description: res.message });
                loadBookings();
                if (selectedBooking?.id === id) setSelectedBooking(null);
            } else {
                toast({ title: "Update Failed", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this booking? This action cannot be undone.")) return;

        setIsProcessing(true);
        try {
            const res = await deleteBooking(id);
            if (res.success) {
                toast({ title: "Booking Deleted", description: res.message });
                loadBookings();
                if (selectedBooking?.id === id) setSelectedBooking(null);
            } else {
                toast({ title: "Delete Failed", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete booking", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const searchParams = useSearchParams();
    const statusFilter = searchParams.get("status");

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.devoteeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.pooja?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.id?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter ? b.status === statusFilter : true;

        const bookingDate = new Date(b.createdAt);
        const matchesDate = date
            ? bookingDate.toDateString() === date.toDateString()
            : true;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const isToday = (dateString: string) => {
        return new Date(dateString).toDateString() === new Date().toDateString();
    };

    const stats = {
        total: bookings.length,
        todayCount: bookings.filter(b => isToday(b.createdAt)).length,
        todayRevenue: bookings
            .filter(b => isToday(b.createdAt))
            .reduce((acc, b) => acc + (b.packagePrice || 0), 0),
        completed: bookings.filter(b => b.status === "COMPLETED").length,
        revenue: bookings.reduce((acc, b) => acc + (b.packagePrice || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Pooja Bookings
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage ritual and ceremony bookings for your temple.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                Manage Calendar
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <AvailabilityManager />
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant={isTodayClosed ? "destructive" : "outline"}
                        onClick={handleToggleToday}
                        disabled={isProcessing}
                        className={isTodayClosed ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" : "text-amber-600 border-amber-200 hover:bg-amber-50"}
                    >
                        {isTodayClosed ? (
                            <>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Resume Today
                            </>
                        ) : (
                            <>
                                <Ban className="w-4 h-4 mr-2" />
                                Stop Today
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={() => loadBookings()} disabled={loading}>
                        Refresh
                    </Button>
                    {/* <Button variant="sacred">
                        <Plus className="w-4 h-4 mr-2" />
                        New Booking
                    </Button> */}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-primary">{stats.todayCount}</p>
                        <p className="text-sm text-muted-foreground">Bookings Today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-emerald-600">₹{stats.todayRevenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Today's Earnings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-emerald-700">₹{stats.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by devotee or pooja name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[240px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Filter by date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {date && (
                        <Button
                            variant="ghost"
                            className="ml-2 px-2 text-xs h-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setDate(undefined)}
                        >
                            <X className="w-3 h-3 mr-1" /> Clear Date
                        </Button>
                    )}
                </div>
            </div>

            {/* Bookings Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Booking ID</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Devotee</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pooja/Ritual</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                            <p className="text-muted-foreground mt-2">Loading bookings...</p>
                                        </td>
                                    </tr>
                                ) : filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking, index) => {
                                        const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.BOOKED;
                                        return (
                                            <motion.tr
                                                key={booking.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="border-b border-border hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="p-4 font-mono text-xs font-medium text-primary">
                                                    #{booking.id?.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-foreground font-medium">{booking.devoteeName}</span>
                                                        <span className="text-xs text-muted-foreground">{booking.devoteePhone}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-foreground">{booking.pooja?.name}</span>
                                                        <span className="text-xs text-muted-foreground">{booking.packageName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-foreground">
                                                        {new Date(booking.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-bold text-foreground">₹{booking.packagePrice}</span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={status.color}>
                                                        <status.icon className="w-3 h-3 mr-1" />
                                                        {booking.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setSelectedBooking(booking)}
                                                            className="hover:bg-primary/10 text-primary"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                                                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                                                </DropdownMenuItem>

                                                                {booking.status === 'BOOKED' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                                                                        className="text-emerald-600 focus:text-emerald-600 font-bold"
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {booking.status === 'BOOKED' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                                                                        className="text-slate-600 focus:text-slate-600"
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-2" /> Cancel Booking
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(booking.id)}
                                                                    className="text-red-600 focus:text-red-600 transition-colors"
                                                                    disabled={isProcessing}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Record
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                            No bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Booking Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="absolute inset-0 bg-transparent"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                        <Church className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold">Booking Summary</h3>
                                        <p className="text-white/80 text-sm">Review devotee information</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Status Overview */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${statusConfig[selectedBooking.status as keyof typeof statusConfig]?.color}`}>
                                            {React.createElement(statusConfig[selectedBooking.status as keyof typeof statusConfig]?.icon || CheckCircle, { className: "w-5 h-5" })}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                                            <p className="font-bold text-slate-700">{selectedBooking.status}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="px-3 py-1 bg-white">
                                        {new Date(selectedBooking.createdAt).toLocaleDateString()}
                                    </Badge>
                                </div>

                                {/* Information Grid */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ritual Service</p>
                                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                {selectedBooking.pooja?.name}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Package Type</p>
                                            <p className="text-slate-700 font-medium">{selectedBooking.packageName}</p>
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

                                {/* Extended Details */}
                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Delivery Address</p>
                                        <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 min-h-[80px]">
                                            {selectedBooking.address || "No physical address provided."}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Special Requests / Gotra</p>
                                        <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 min-h-[80px] italic">
                                            "{selectedBooking.specialRequests || "No specific instructions."}"
                                        </p>
                                    </div>
                                </div>

                                {/* Summary & Actions */}
                                <div className="pt-6 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Offering</p>
                                            <p className="text-2xl font-bold text-primary">₹{selectedBooking.packagePrice}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedBooking.status === 'BOOKED' && (
                                                <Button
                                                    onClick={() => handleUpdateStatus(selectedBooking.id, 'COMPLETED')}
                                                    className="bg-gradient-to-r from-gold to-gold hover:bg-gold text-white rounded-xl px-6"
                                                    disabled={isProcessing}
                                                >
                                                    Mark Completed
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => setSelectedBooking(null)}
                                                className="rounded-xl px-6 border-slate-200 text-slate-600"
                                            >
                                                Close View
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                                        <span>Reference ID: {selectedBooking.id?.toUpperCase()}</span>
                                        <span>Secured payment with GST invoice</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


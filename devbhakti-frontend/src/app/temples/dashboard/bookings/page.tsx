"use client";

import React, { useState, useEffect, useMemo } from "react";
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
    ArrowUpDown,
    CalendarRange,
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
    DialogTrigger
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
import { format, isWithinInterval, startOfDay, endOfDay, subWeeks, subMonths, subYears, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig = {
    BOOKED: {
        label: "Booked",
        color: "bg-blue-100 text-blue-700 border-blue-200",
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

export default function TempleBookingsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTodayClosed, setIsTodayClosed] = useState(false);

    // Confirmation dialog for Mark Complete
    const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
    const [proofPhotos, setProofPhotos] = useState<File[]>([]);

    // View toggle: sort/display by ritual date or booking date
    const [viewMode, setViewMode] = useState<"ritual" | "booking">("ritual");

    // Advanced filter state
    const [filterType, setFilterType] = useState<"ritual" | "booking">("ritual");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [statsPeriod, setStatsPeriod] = useState<"week" | "month" | "year" | "lifetime">("week");
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

    const handleUpdateStatus = async (id: string, status: string, files?: File[]) => {
        setIsProcessing(true);
        try {
            let data: any = { status };

            if (status === 'COMPLETED' && files && files.length > 0) {
                const formData = new FormData();
                formData.append('status', status);
                files.forEach((file) => {
                    formData.append('photos', file);
                });
                data = formData;
            }

            const res = await updateBookingStatus(id, data);
            if (res.success) {
                toast({
                    title: `Booking ${status === 'BOOKED' ? 'Accepted' : (status === 'COMPLETED' ? 'Completed' : 'Rejected')}`,
                    description: res.message
                });
                loadBookings();
                if (selectedBooking?.id === id) setSelectedBooking(null);
                setProofPhotos([]); // Reset files
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

    const filteredBookings = useMemo(() => {
        const filtered = bookings.filter((b) => {
            const matchesSearch =
                b.devoteeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.pooja?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.id?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter ? b.status === statusFilter : true;

            // Date range filter (Manual priority, then statsPeriod)
            let matchesDate = true;
            if (startDate) {
                const targetDate = filterType === "ritual"
                    ? (b.bookingDate ? new Date(b.bookingDate) : null)
                    : new Date(b.createdAt);

                if (targetDate) {
                    const from = startOfDay(startDate);
                    const to = endDate ? endOfDay(endDate) : endOfDay(startDate);
                    matchesDate = isWithinInterval(targetDate, { start: from, end: to });
                } else {
                    matchesDate = false;
                }
            } else if (statsPeriod !== "lifetime") {
                // If no manual date is selected, use statsPeriod
                const now = new Date();
                let periodStart: Date;
                switch (statsPeriod) {
                    case "week": periodStart = subWeeks(now, 1); break;
                    case "month": periodStart = subMonths(now, 1); break;
                    case "year": periodStart = subYears(now, 1); break;
                    default: periodStart = new Date(0);
                }
                const createdAtDate = new Date(b.createdAt);
                matchesDate = isAfter(createdAtDate, periodStart);
            }

            return matchesSearch && matchesStatus && matchesDate;
        });

        // Sort based on viewMode
        return filtered.sort((a, b) => {
            if (viewMode === "ritual") {
                const dateA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
                const dateB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
                return dateA - dateB; // ascending — upcoming rituals first
            } else {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA; // descending — newest bookings first
            }
        });
    }, [bookings, searchQuery, statusFilter, startDate, endDate, filterType, viewMode, statsPeriod]);

    const isToday = (dateString: string) => {
        return new Date(dateString).toDateString() === new Date().toDateString();
    };

    const stats = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        switch (statsPeriod) {
            case "week":
                startDate = subWeeks(now, 1);
                break;
            case "month":
                startDate = subMonths(now, 1);
                break;
            case "year":
                startDate = subYears(now, 1);
                break;
            case "lifetime":
                startDate = new Date(0);
                break;
            default:
                startDate = subWeeks(now, 1);
        }

        const periodBookings = bookings.filter(b => isAfter(new Date(b.createdAt), startDate));
        const activePeriodBookings = periodBookings.filter(b => b.status !== 'CANCELLED');

        return {
            total: periodBookings.length,
            todayCount: bookings.filter(b => isToday(b.createdAt)).length,
            todayRevenue: bookings
                .filter(b => isToday(b.createdAt) && b.status !== 'CANCELLED')
                .reduce((acc, b) => acc + (b.packagePrice || 0), 0),
            completed: periodBookings.filter(b => b.status === "COMPLETED").length,
            revenue: activePeriodBookings.reduce((acc, b) => acc + (b.packagePrice || 0), 0)
        };
    }, [bookings, statsPeriod]);

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

            {/* Stats Header with Filter */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Performance Overview
                    <Badge variant="outline" className="text-[12px] uppercase tracking-wider px-2 py-0 border-primary/20 bg-primary/5 text-dark-border">
                        {statsPeriod}ly
                    </Badge>
                </h2>
                <div className="flex items-center bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setStatsPeriod("week")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            statsPeriod === "week" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setStatsPeriod("month")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            statsPeriod === "month" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setStatsPeriod("year")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            statsPeriod === "year" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Year
                    </button>
                    <button
                        onClick={() => setStatsPeriod("lifetime")}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all",
                            statsPeriod === "lifetime" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Lifetime
                    </button>
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

            {/* View Toggle */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                <div className="flex items-center bg-muted rounded-full p-0.5">
                    <button
                        onClick={() => setViewMode("ritual")}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                            viewMode === "ritual"
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Ritual Date
                    </button>
                    <button
                        onClick={() => setViewMode("booking")}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                            viewMode === "booking"
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Booking Date
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by devotee or pooja name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filter Type Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-sm shrink-0">
                            <Filter className="w-4 h-4" />
                            {filterType === "ritual" ? "By Ritual Date" : "By Booking Date"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter Criteria</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => { setFilterType("ritual"); setStartDate(undefined); setEndDate(undefined); }}
                            className={cn(filterType === "ritual" && "bg-primary/10 text-primary font-semibold")}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Filter by Ritual Date
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => { setFilterType("booking"); setStartDate(undefined); setEndDate(undefined); }}
                            className={cn(filterType === "booking" && "bg-primary/10 text-primary font-semibold")}
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Filter by Booking Date
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Start Date Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-[150px] justify-start text-left font-normal text-sm gap-2 shrink-0",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            {startDate ? format(startDate, "dd MMM yyyy") : "Start Date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* End Date Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-[150px] justify-start text-left font-normal text-sm gap-2 shrink-0",
                                !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            {endDate ? format(endDate, "dd MMM yyyy") : "End Date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(day) => startDate ? day < startDate : false}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Clear Dates */}
                {(startDate || endDate) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 text-xs h-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
                    >
                        <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Active filter indicator */}
            {startDate && (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5 text-xs font-medium py-1 px-3">
                        <Filter className="w-3 h-3" />
                        {filterType === "ritual" ? "Ritual Date" : "Booking Date"}:
                        {" "}{format(startDate, "dd MMM yyyy")}
                        {endDate && ` – ${format(endDate, "dd MMM yyyy")}`}
                        <button onClick={() => { setStartDate(undefined); setEndDate(undefined); }} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""} found
                    </span>
                </div>
            )}

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
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        <button
                                            onClick={() => setViewMode("ritual")}
                                            className={cn("flex items-center gap-1 hover:text-foreground transition-colors", viewMode === "ritual" && "text-primary font-semibold")}
                                        >
                                            Ritual Date
                                            {viewMode === "ritual" && <ArrowUpDown className="w-3 h-3" />}
                                        </button>
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        <button
                                            onClick={() => setViewMode("booking")}
                                            className={cn("flex items-center gap-1 hover:text-foreground transition-colors", viewMode === "booking" && "text-primary font-semibold")}
                                        >
                                            Booked On
                                            {viewMode === "booking" && <ArrowUpDown className="w-3 h-3" />}
                                        </button>
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground w-[150px]">Status</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center">
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
                                                animate={{
                                                    opacity: booking.status === 'CANCELLED' ? 0.5 : 1,
                                                    y: 0,
                                                    filter: booking.status === 'CANCELLED' ? 'grayscale(100%)' : 'grayscale(0%)'
                                                }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className={cn(
                                                    "border-b border-border hover:bg-muted/30 transition-colors",
                                                    booking.status === 'CANCELLED' && "bg-slate-50/50"
                                                )}
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
                                                    <span className={cn("text-sm font-medium", viewMode === "ritual" ? "text-primary" : "text-foreground")}>
                                                        {booking.bookingDate ? format(new Date(booking.bookingDate), "dd MMM yyyy") : "N/A"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn("text-sm font-medium", viewMode === "booking" ? "text-primary" : "text-foreground")}>
                                                        {format(new Date(booking.createdAt), "dd MMM yyyy")}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm font-bold text-foreground">₹{booking.packagePrice}</span>
                                                </td>
                                                <td className="p-4 w-[150px]">
                                                    <Badge variant="outline" className={cn("whitespace-nowrap", status.color)}>
                                                        <status.icon className="w-3 h-3 mr-1" />
                                                        {status.label || booking.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right w-[100px]">
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
                                                                        onClick={() => setConfirmCompleteId(booking.id)}
                                                                        className="text-emerald-600 focus:text-emerald-600 font-bold"
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {booking.status === 'BOOKED' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => setConfirmCancelId(booking.id)}
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
                                                                    {/* <Trash2 className="w-4 h-4 mr-2" /> Delete Record */}
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
                                        <td colSpan={8} className="p-12 text-center text-muted-foreground">
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
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ritual Date</p>
                                        <Badge variant="outline" className="px-3 py-1 bg-white font-bold text-primary">
                                            {selectedBooking.bookingDate ? format(new Date(selectedBooking.bookingDate), "PPPP") : "N/A"}
                                        </Badge>
                                    </div>
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

                                {selectedBooking.status === 'COMPLETED' && selectedBooking.proofPhotos && selectedBooking.proofPhotos.length > 0 && (
                                    <div className="pt-6 border-t border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Pooja Completion Proof</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedBooking.proofPhotos.map((photo: string, i: number) => (
                                                <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 group">
                                                    <img src={photo} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
                                                    onClick={() => setConfirmCompleteId(selectedBooking.id)}
                                                    className="bg-gradient-to-r from-gold to-gold hover:bg-gold text-white rounded-xl px-6"
                                                    disabled={isProcessing}
                                                >
                                                    Mark Completed
                                                </Button>
                                            )}
                                            {/* <Button
                                                variant="outline"
                                                onClick={() => setSelectedBooking(null)}
                                                className="rounded-xl px-6 border-slate-200 text-slate-600"
                                            >
                                                Close View
                                            </Button> */}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                                        {/* <span>Reference ID: {selectedBooking.id?.toUpperCase()}</span> */}
                                        {/* <span>Secured payment with GST invoice</span> */}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cancel Confirmation Dialog */}
            <AnimatePresence>
                {confirmCancelId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmCancelId(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="bg-[#7b4623] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-[#63391c]"
                        >
                            {/* Warning Header */}
                            <div className="bg-[#63391c]/50 p-6 text-white border-b border-[#63391c]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                        <XCircle className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Cancel Booking</h3>
                                        <p className="text-slate-400 text-sm">Confirmation Required</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Are you sure you want to <span className="font-bold text-white underline decoration-red-500/50">cancel</span> this booking? This will mark the record as cancelled and remove it from revenue totals.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 px-6 pb-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmCancelId(null)}
                                    className="rounded-xl px-6 text-white/60 hover:text-white hover:bg-[#63391c]"
                                    disabled={isProcessing}
                                >
                                    No
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (confirmCancelId) {
                                            await handleUpdateStatus(confirmCancelId, 'CANCELLED');
                                            setConfirmCancelId(null);
                                        }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 border-none"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Yes, Cancel"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mark Complete Confirmation Dialog */}
            <AnimatePresence>
                {confirmCompleteId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmCompleteId(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="bg-[#7b4623] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-[#63391c]"
                        >
                            {/* Warning Header */}
                            <div className="bg-[#63391c]/50 p-6 text-white border-b border-[#63391c]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Warning</h3>
                                        <p className="text-slate-400 text-sm">Irreversible Action</p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Are you sure you want to mark this booking as <span className="font-bold text-emerald-400">complete</span>? This is an <span className="font-bold text-red-400">irreversible action</span> and cannot be undone.
                                </p>

                                {/* Proof Photos Upload */}
                                <div className="space-y-3 pt-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                        Upload Proof Photos (Max 2, Optional)
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[0, 1].map((index) => (
                                            <div key={index} className="relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    id={`proof-photo-${index}`}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const newPhotos = [...proofPhotos];
                                                            newPhotos[index] = file;
                                                            setProofPhotos(newPhotos);
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`proof-photo-${index}`}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer",
                                                        proofPhotos[index]
                                                            ? "border-emerald-500/50 bg-emerald-500/5"
                                                            : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                                                    )}
                                                >
                                                    {proofPhotos[index] ? (
                                                        <div className="text-center p-2">
                                                            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                                                            <span className="text-[10px] text-emerald-300 font-medium truncate w-full block">
                                                                {proofPhotos[index].name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-6 h-6 text-slate-500 group-hover:text-slate-400 mb-1" />
                                                            <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-medium">
                                                                Add Photo
                                                            </span>
                                                        </>
                                                    )}
                                                </label>
                                                {proofPhotos[index] && (
                                                    <button
                                                        onClick={() => {
                                                            const newPhotos = [...proofPhotos];
                                                            newPhotos.splice(index, 1);
                                                            setProofPhotos(newPhotos);
                                                        }}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setConfirmCompleteId(null);
                                        setProofPhotos([]);
                                    }}
                                    className="rounded-xl px-6 text-white/60 hover:text-white hover:bg-[#63391c]"
                                    disabled={isProcessing}
                                >
                                    No
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (confirmCompleteId) {
                                            await handleUpdateStatus(confirmCompleteId, 'COMPLETED', proofPhotos.filter(Boolean));
                                            setConfirmCompleteId(null);
                                        }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 border-none"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Processing..." : "Yes, Complete"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


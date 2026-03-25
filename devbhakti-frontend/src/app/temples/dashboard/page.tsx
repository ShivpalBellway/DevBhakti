"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Users,
    Calendar,
    ShoppingBag,
    Package,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Video,
    Heart,
    IndianRupee,
    Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMyTempleBookings, fetchTempleOrders, fetchMyTempleProfile, fetchMyProducts, fetchMyEvents } from "@/api/templeAdminController";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadDonationsExcel, downloadDonationsPdf } from "@/api/templeAdminController";
import { toast } from "@/hooks/use-toast";
import { FileText, FileSpreadsheet } from "lucide-react";



const recentOrders = [
    {
        id: "ORD-7821",
        user: "Amit Kumar",
        product: "Panchamrit Set",
        amount: "₹550",
        status: "Delivered",
    },
    {
        id: "ORD-7822",
        user: "Priya Singh",
        product: "Brass Diya",
        amount: "₹1,200",
        status: "Processing",
    },
    {
        id: "ORD-7823",
        user: "Rahul Sharma",
        product: "Incense Sticks",
        amount: "₹250",
        status: "Shipped",
    },
];

const upcomingBookings = [
    {
        id: "BK-1024",
        user: "Suresh Raina",
        pooja: "Rudrabhishek",
        date: "Oct 25, 2024",
        time: "08:00 AM",
    },
    {
        id: "BK-1025",
        user: "Meena Devi",
        pooja: "Satyanarayan Katha",
        date: "Oct 26, 2024",
        time: "10:30 AM",
    },
];

export default function TempleDashboardPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [templeProfile, setTempleProfile] = useState<any>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [profileRes, bookingsRes, productsRes, eventsRes] = await Promise.all([
                fetchMyTempleProfile(),
                fetchMyTempleBookings(),
                fetchMyProducts(),
                fetchMyEvents()
            ]);

            if (profileRes.success) {
                setTempleProfile(profileRes.data);
            }

            if (bookingsRes.success) {
                setBookings(bookingsRes.data || []);
            }

            if (eventsRes.success) {
                setEvents(eventsRes.data || []);
            }

            if (productsRes.success) {
                const productsData = productsRes.data?.products || productsRes.data || [];

                if (productsRes.data?.pagination?.total !== undefined) {
                    setTotalProducts(productsRes.data.pagination.total);
                } else {
                    setTotalProducts(Array.isArray(productsData) ? productsData.length : 0);
                }
            }

            if (profileRes.success && profileRes.data.id) {
                const ordersRes = await fetchTempleOrders(profileRes.data.id);
                if (ordersRes.success) {
                    setOrders(ordersRes.data || []); // Ensure array
                }
            }
        } catch (error) {
            console.error("Dashboard data load error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (type: 'excel' | 'pdf') => {
        if (!templeProfile?.id) {
            toast({
                title: "Error",
                description: "Temple profile not loaded. Please refresh.",
                variant: "destructive",
            });
            return;
        }

        try {
            toast({
                title: "Processing",
                description: `Preparing your ${type.toUpperCase()} report...`,
            });
            
            const data = type === 'excel' 
                ? await downloadDonationsExcel(templeProfile.id)
                : await downloadDonationsPdf(templeProfile.id);
            
            const blob = new Blob([data], { 
                type: type === 'excel' 
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    : 'application/pdf' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `donations_report_${new Date().toISOString().slice(0, 10)}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast({
                title: "Success",
                description: "Report downloaded successfully.",
            });
        } catch (error) {
            console.error("Download Error:", error);
            toast({
                title: "Download Failed",
                description: "There was an error generating your report.",
                variant: "destructive",
            });
        }
    };

    // Dynamic calculation for stats (Lifetime and Today)
    const today = new Date().setHours(0, 0, 0, 0);

    const poojaRevenue = bookings.reduce((acc, b) => acc + (b.packagePrice || 0), 0);
    const productRevenue = orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
    
    // Today's data filtering
    const todayBookings = bookings.filter(b => new Date(b.createdAt).setHours(0, 0, 0, 0) === today);
    const todayOrders = orders.filter(o => new Date(o.createdAt).setHours(0, 0, 0, 0) === today);
    
    const todayPoojaRevenue = todayBookings.reduce((acc, b) => acc + (b.packagePrice || 0), 0);
    const todayProductRevenue = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    const uniqueDevotees = new Set([
        ...bookings.map(b => b.devoteePhone || b.devoteeEmail || b.devoteeName).filter(Boolean),
        ...orders.map(o => o.order?.user?.phone || o.order?.user?.email || o.order?.user?.name).filter(Boolean)
    ]).size;

    const todayNewDevotees = new Set([
        ...todayBookings.map(b => b.devoteePhone || b.devoteeEmail || b.devoteeName).filter(Boolean),
        ...todayOrders.map(o => o.order?.user?.phone || o.order?.user?.email || o.order?.user?.name).filter(Boolean)
    ]).size;

    const lifetimeStats = [
        { 
            title: "Gross Revenue", 
            value: `₹${(poojaRevenue + productRevenue).toLocaleString()}`, 
            icon: TrendingUp, 
            color: "text-amber-600", 
            bg: "bg-amber-100/50",
            tooltip: "Total cumulative revenue generated from all sources including poojas and marketplace sales."
        },
        { 
            title: "Total Service Sales", 
            value: `₹${poojaRevenue.toLocaleString()}`, 
            icon: Calendar, 
            color: "text-orange-600", 
            bg: "bg-orange-100/50",
            tooltip: "Lifetime revenue specifically from Pooja and Seva bookings."
        },
        { 
            title: "Total Product Sales", 
            value: `₹${productRevenue.toLocaleString()}`, 
            icon: ShoppingBag, 
            color: "text-emerald-600", 
            bg: "bg-emerald-100/50",
            tooltip: "Lifetime revenue generated from physical product sales in the marketplace."
        },
        { 
            title: "Total Donation", 
            value: "₹0", 
            icon: Heart, 
            color: "text-rose-600", 
            bg: "bg-rose-100/50",
            tooltip: "Total direct donations received by the temple through the platform."
        },
        { 
            title: "Total Devotees", 
            value: uniqueDevotees.toString(), 
            icon: Users, 
            color: "text-blue-600", 
            bg: "bg-blue-100/50",
            tooltip: "Unique count of all devotees who have interacted with your temple."
        },
    ];

    const todayStats = [
        { 
            title: "Todays Total Revenue", 
            value: `₹${(todayPoojaRevenue + todayProductRevenue).toLocaleString()}`, 
            icon: TrendingUp, 
            color: "text-amber-600", 
            bg: "bg-amber-50",
            tooltip: "Total income generated solely within the current 24-hour period."
        },
        { 
            title: "Service Sales", 
            value: `₹${todayPoojaRevenue.toLocaleString()}`, 
            icon: Calendar, 
            color: "text-orange-600", 
            bg: "bg-orange-50",
            tooltip: "Today's revenue from Pooja and Seva bookings."
        },
        { 
            title: "Product Sales", 
            value: `₹${todayProductRevenue.toLocaleString()}`, 
            icon: ShoppingBag, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50",
            tooltip: "Today's revenue from marketplace product sales."
        },
        { 
            title: "Donations", 
            value: "₹0", 
            icon: Heart, 
            color: "text-rose-600", 
            bg: "bg-rose-50",
            tooltip: "Direct donations received today."
        },
        { 
            title: "New Devotees", 
            value: todayNewDevotees.toString(), 
            icon: Users, 
            color: "text-blue-600", 
            bg: "bg-blue-50",
            tooltip: "Count of unique devotees who visited or transacted for the first time today."
        },
    ];

    const recentOrdersData = [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const upcomingBookingsData = [...bookings]
        .filter(b => b.status === 'BOOKED')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 5);

    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const upcomingEventsData = [...events]
        .filter(e => {
            if (!e.date) return false;
            try {
                const date = new Date(e.date);
                if (isNaN(date.getTime())) return false; // Invalid date
                const eventDateStr = date.toISOString().slice(0, 10);
                return eventDateStr >= todayStr;
            } catch (err) {
                return false;
            }
        })
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return dateA - dateB;
        })
        .slice(0, 5);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-sidebar-primary" />
                <p className="text-sidebar-primary font-medium font-serif">Loading Dashboard Stats...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 bg-orange-50/20 p-4 md:p-8 rounded-[2rem] min-h-screen">
            {/* Page header - Premium Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-10 rounded-[2.5rem] shadow-sm border border-orange-100/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="relative z-10 space-y-2">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-amber-600 tracking-tight uppercase">
                        Temple Dashboard
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-2 bg-amber-600 rounded-full" />
                        <p className="text-2xl md:text-3xl font-black text-slate-800 font-serif">
                            {templeProfile?.name || "Sacred Temple"}
                        </p>
                    </div>
                    <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Administrator Control Center
                    </p>
                </div>
            </div>

            {/* Total Lifetime Numbers */}
            <div className="space-y-4">
                <h2 className="text-2xl font-serif font-black text-slate-700/80 ml-4">Total Lifetime Numbers:</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {lifetimeStats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <Card className="hover:shadow-lg transition-all border-none bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                                                    <Info className="w-3 h-3 text-slate-400 hover:text-amber-500" />
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 bg-slate-900 text-white border-none p-4 rounded-xl shadow-2xl z-[100]">
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                                        <Info className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1">{stat.title}</p>
                                                        <p className="text-xs font-medium leading-relaxed opacity-90">{stat.tooltip}</p>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                    <div className={cn("mt-4 w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Today's Numbers */}
            <div className="space-y-4">
                <h2 className="text-2xl font-serif font-black text-slate-700/80 ml-4">Today's Numbers:</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {todayStats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: (index + 5) * 0.1 }}
                        >
                            <Card className="hover:shadow-lg transition-all border-none bg-white/60 backdrop-blur-sm rounded-2xl group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                                                    <Info className="w-3 h-3 text-slate-400 hover:text-amber-500" />
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 bg-slate-900 text-white border-none p-4 rounded-xl shadow-2xl z-[100]">
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                                        <Info className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1">{stat.title}</p>
                                                        <p className="text-xs font-medium leading-relaxed opacity-90">{stat.tooltip}</p>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Main content grid - 3 columns */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Todays Product Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <Card className="border-none shadow-sm h-full rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                            <CardTitle className="text-xl font-black text-slate-800 font-serif">Todays Product Orders</CardTitle>
                            <button
                                onClick={() => router.push('/temples/dashboard/orders')}
                                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 uppercase tracking-widest"
                            >
                                View all
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {recentOrdersData.length > 0 ? recentOrdersData.map((subOrder, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => router.push('/temples/dashboard/orders')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                                <ShoppingBag className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">Order #{subOrder.id?.slice(-4).toUpperCase()}</p>
                                                <p className="text-xs font-bold text-slate-400">By {subOrder.order?.user?.name || 'Customer'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">₹{subOrder.totalAmount?.toLocaleString()}</p>
                                            <Badge variant="outline" className="mt-1 font-black text-[9px] uppercase tracking-tighter">
                                                {subOrder.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-slate-400 text-sm italic font-medium">No recent orders found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Upcoming Events */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.45 }}
                >
                    <Card className="border-none shadow-sm h-full rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                            <CardTitle className="text-xl font-black text-slate-800 font-serif">Upcoming Events</CardTitle>
                            <button
                                onClick={() => router.push('/temples/dashboard/events')}
                                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 uppercase tracking-widest"
                            >
                                View all
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {upcomingEventsData.length > 0 ? upcomingEventsData.map((event, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 border border-rose-100/50 hover:bg-white hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => router.push('/temples/dashboard/events')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
                                                <Video className="w-6 h-6 text-rose-600 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{event.name || 'Event'}</p>
                                                <p className="text-xs font-bold text-slate-400">
                                                    {event.date ? format(new Date(event.date), "MMM d, yyyy") : 'Date TBD'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Upcoming</span>
                                            {event.location && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{event.location}</p>}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-slate-400 text-sm italic font-medium">No upcoming events.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Upcoming Bookings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <Card className="border-none shadow-sm h-full rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                            <CardTitle className="text-xl font-black text-slate-800 font-serif">Upcoming Poojas</CardTitle>
                            <button
                                onClick={() => router.push('/temples/dashboard/bookings')}
                                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 uppercase tracking-widest"
                            >
                                View all
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {upcomingBookingsData.length > 0 ? upcomingBookingsData.map((booking, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/50 border border-orange-100/50 hover:bg-white hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => router.push('/temples/dashboard/bookings')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                                                <Calendar className="w-6 h-6 text-orange-600 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{booking.pooja?.name || 'Sacred Pooja'}</p>
                                                <p className="text-xs font-bold text-slate-400">For {booking.devoteeName || 'Devotee'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">
                                                {booking.createdAt ? format(new Date(booking.createdAt), "MMM d, yyyy") : 'TBD'}
                                            </p>
                                            <p className="text-[10px] font-black text-orange-600 mt-1 uppercase tracking-widest">Scheduled</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-slate-400 text-sm italic font-medium">No upcoming bookings found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
            >
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black text-slate-800 font-serif">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "Add Product", icon: Package, color: "bg-emerald-500", href: "/temples/dashboard/products" },
                                { label: "Offer Pooja", icon: Calendar, color: "bg-orange-500", href: "/temples/dashboard/poojas/create" },
                                { label: "New Event", icon: Calendar, color: "bg-rose-500", href: "/temples/dashboard/events" },
                                { 
                                    label: "Download Excel Report", 
                                    subtext: "Donation",
                                    icon: TrendingUp, 
                                    color: "bg-sky-500", 
                                    isExcel: true,
                                    href: "#" 
                                },
                            ].map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => {
                                        if (action.isExcel) {
                                            handleDownload('excel');
                                        } else {
                                            router.push(action.href);
                                        }
                                    }}
                                    className="relative flex flex-col items-center gap-4 p-6 rounded-[2rem] border border-slate-100 hover:border-amber-200 hover:bg-orange-50/30 transition-all group overflow-hidden"
                                >
                                    <div
                                        className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg",
                                            action.color
                                        )}
                                    >
                                        <action.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm font-black text-slate-800 block leading-tight">{action.label}</span>
                                        {action.subtext && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.subtext}</span>}
                                    </div>
                                    {action.isExcel && (
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-emerald-100 transition-colors cursor-pointer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-md">
                                                    <DropdownMenuLabel className="text-xs font-black text-slate-400 uppercase tracking-widest px-3 py-2">Select Format</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-slate-100 mb-1" />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDownload('excel')}
                                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 group/item transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">Excel Report</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDownload('pdf')}
                                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-rose-50 focus:bg-rose-50 group/item transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                                            <FileText className="w-4 h-4 text-rose-600" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">PDF Report</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

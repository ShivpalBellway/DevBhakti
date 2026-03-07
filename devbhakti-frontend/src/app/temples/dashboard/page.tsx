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
import { fetchMyTempleBookings, fetchTempleOrders, fetchMyTempleProfile, fetchMyProducts } from "@/api/templeAdminController";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";



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
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [templeProfile, setTempleProfile] = useState<any>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [profileRes, bookingsRes, productsRes] = await Promise.all([
                fetchMyTempleProfile(),
                fetchMyTempleBookings(),
                fetchMyProducts() // Fetch products for count
            ]);

            if (profileRes.success) {
                setTempleProfile(profileRes.data);
            }

            if (bookingsRes.success) {
                setBookings(bookingsRes.data || []); // Ensure array
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

    // Calculate dynamic stats
    const uniqueDevotees = new Set([
        ...bookings.map(b => b.devoteePhone || b.devoteeEmail || b.devoteeName).filter(Boolean),
        ...orders.map(o => o.order?.user?.phone || o.order?.user?.email || o.order?.user?.name).filter(Boolean)
    ]).size;

    const poojaRevenue = bookings.reduce((acc, b) => acc + (b.packagePrice || 0), 0);
    const productRevenue = orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

    // Calculate total items sold if needed, but user asked for "Total Product" (Count of active/listed products?)
    // Given "Total Product bhi show karo" and context of dashboard inventory/sales, listed products seems appropriate.
    // However, if they meant "Total Products Sold" (count), that would be different.
    // I'll show "Total Products" as inventory count for now as per common dashboard patterns, 
    // or better, I'll label it "Total Inventory" or "Active Products" if that's what it is.
    // But "Total Product" label is what was asked.

    const dynamicStats = [
        {
            title: "Total Service Sales",
            value: `₹${poojaRevenue.toLocaleString()}`,
            change: "+8.2%",
            trend: "up",
            icon: Calendar,
            color: "bg-orange-500",
            href: "/temples/dashboard/bookings",
            tooltip: "Total revenue generated from all Pooja and Seva bookings made by devotees."
        },
        {
            title: "Total Products",
            value: totalProducts.toString(),
            change: "+4",
            trend: "up",
            icon: Package,
            color: "bg-purple-500",
            href: "/temples/dashboard/products",
            tooltip: "Total number of products currently listed in the temple marketplace."
        },
        {
            title: "Product Sales",
            value: `₹${productRevenue.toLocaleString()}`,
            change: "+15.3%",
            trend: "up",
            icon: ShoppingBag,
            color: "bg-emerald-500",
            href: "/temples/dashboard/orders",
            tooltip: "Total revenue generated from marketplace product orders."
        },
        {
            title: "Total Devotees",
            value: uniqueDevotees.toString(),
            change: "+12.5%",
            trend: "up",
            icon: Users,
            color: "bg-blue-500",
            href: "/temples/dashboard/users",
            tooltip: "Total unique devotees who have booked poojas or placed orders."
        },
    ];

    const recentOrdersData = [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const upcomingBookingsData = [...bookings]
        .filter(b => b.status === 'BOOKED')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-sidebar-border/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sidebar-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-serif font-black text-sidebar-primary tracking-tight uppercase">
                        Temple Dashboard
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="h-6 w-1.5 bg-sidebar-primary rounded-full shadow-[0_0_10px_rgba(var(--sidebar-primary),0.5)]" />
                        <p className="text-xl md:text-2xl font-bold text-slate-800">
                            {templeProfile?.name || "Sacred Temple"}
                        </p>
                    </div>
                    <p className="text-slate-500 mt-2 text-sm font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Administrator Control Center
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <TooltipProvider delayDuration={100}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dynamicStats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <Card
                                className="hover:shadow-warm transition-all duration-300 border-none shadow-sm cursor-pointer hover:bg-slate-50"
                                onClick={() => router.push(stat.href)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center bg-opacity-10`}
                                        >
                                            <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* <div
                                                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    }`}
                                            >
                                                {stat.trend === "up" ? (
                                                    <TrendingUp className="w-3 h-3" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3" />
                                                )}
                                                {stat.change}
                                            </div> */}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className="p-1 rounded-full hover:bg-slate-200 transition-colors cursor-help"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="max-w-[240px] bg-[#1e293b] text-white border-none shadow-2xl p-3 rounded-xl animate-in fade-in zoom-in duration-200">
                                                    <div className="flex gap-2">
                                                        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                                        <p className="text-[11px] leading-relaxed font-medium">{stat.tooltip}</p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </TooltipProvider>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold text-slate-800">Recent Shop Orders</CardTitle>
                            <button
                                onClick={() => router.push('/temples/dashboard/orders')}
                                className="text-xs font-bold text-sidebar-primary hover:text-sidebar-primary/80 flex items-center gap-1 uppercase tracking-wider"
                            >
                                View all
                                <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentOrdersData.length > 0 ? recentOrdersData.map((subOrder, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-sidebar-primary/20 hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => router.push('/temples/dashboard/orders')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                                <ShoppingBag className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Order #{subOrder.id?.slice(-4).toUpperCase()}</p>
                                                <p className="text-xs text-slate-500">By {subOrder.order?.user?.name || 'Customer'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">₹{subOrder.totalAmount?.toLocaleString()}</p>
                                            <p className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1",
                                                subOrder.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                                                    subOrder.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                            )}>{subOrder.status}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center text-slate-400 text-sm italic">No recent orders found.</div>
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
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold text-slate-800">Upcoming Poojas</CardTitle>
                            <button
                                onClick={() => router.push('/temples/dashboard/bookings')}
                                className="text-xs font-bold text-sidebar-primary hover:text-sidebar-primary/80 flex items-center gap-1 uppercase tracking-wider"
                            >
                                View all
                                <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {upcomingBookingsData.length > 0 ? upcomingBookingsData.map((booking, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-xl bg-orange-50/50 border border-orange-100/50 hover:bg-white hover:border-sidebar-primary/20 hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => router.push('/temples/dashboard/bookings')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                                                <Calendar className="w-5 h-5 text-orange-600 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{booking.pooja?.name || 'Sacred Pooja'}</p>
                                                <p className="text-xs text-slate-500">For {booking.devoteeName || 'Devotee'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">
                                                {booking.createdAt ? format(new Date(booking.createdAt), "MMM d, yyyy") : 'TBD'}
                                            </p>
                                            <p className="text-xs font-bold text-orange-600 mt-1 uppercase tracking-tighter">Scheduled</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center text-slate-400 text-sm italic">No upcoming bookings found.</div>
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
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TooltipProvider delayDuration={100}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Add Product", icon: Package, color: "bg-green-500", href: "/temples/dashboard/products", tooltip: "Add new products to your temple marketplace for devotees to purchase." },
                                    { label: "Offer Pooja", icon: Calendar, color: "bg-orange-500", href: "/temples/dashboard/poojas/create", tooltip: "Create a new Pooja or Seva offering for devotees to book online." },
                                    { label: "New Event", icon: Calendar, color: "bg-red-500", href: "/temples/dashboard/events", tooltip: "Create and manage upcoming temple events, festivals, and celebrations." },
                                    { label: "Donation", icon: TrendingUp, color: "bg-blue-500", href: "/temples/dashboard/donation", tooltip: "View detailed Donation reports of your temple." },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={() => router.push(action.href)}
                                        className="relative flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-sidebar-primary/30 hover:bg-muted/50 transition-all group"
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="absolute top-2 right-2 p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-help"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-[240px] bg-[#1e293b] text-white border-none shadow-2xl p-3 rounded-xl animate-in fade-in zoom-in duration-200">
                                                <div className="flex gap-2">
                                                    <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] leading-relaxed font-medium">{action.tooltip}</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                        <div
                                            className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                                        >
                                            <action.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Package,
    ShoppingBag,
    IndianRupee,
    TrendingUp,
    TrendingDown,
    Store,
    ArrowUpRight,
    LayoutDashboard,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSellerFinanceSummary, fetchSellerOrders, fetchSellerProducts } from "@/api/sellerController";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SellerDashboard() {
    const [user, setUser] = useState<any>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [productsCount, setProductsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("seller_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, ordersRes, productsRes] = await Promise.all([
                fetchSellerFinanceSummary(),
                fetchSellerOrders(),
                fetchSellerProducts()
            ]);

            if (summaryRes.success) setStatsData(summaryRes.data);
            if (ordersRes.success) setRecentOrders(ordersRes.data);
            if (productsRes.success) setProductsCount(productsRes.data.length);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = [
        {
            title: "Total Revenue",
            value: `₹${(statsData?.totalEarnings || 0).toLocaleString()}`,
            change: "+12%", // Placeholder for now
            trend: "up",
            icon: IndianRupee,
            color: "bg-amber-500",
        },
        {
            title: "Pending Orders",
            value: statsData?.activeOrdersCount || 0,
            change: "Action Required",
            trend: "up",
            icon: ShoppingBag,
            color: "bg-blue-500",
        },
        {
            title: "Active Products",
            value: productsCount,
            change: "Live",
            trend: "up",
            icon: Package,
            color: "bg-indigo-500",
        },
        {
            title: "Available Balance",
            value: `₹${(statsData?.availableBalance || 0).toLocaleString()}`,
            change: "Withdrawable",
            trend: "up",
            icon: TrendingUp,
            color: "bg-emerald-500",
        },
    ];

    const recentActivity = recentOrders.slice(0, 5).map(order => ({
        type: "order",
        title: `Order #${order.orderId.slice(-6).toUpperCase()} received`,
        time: format(new Date(order.createdAt), "dd MMM, hh:mm a"),
        icon: ShoppingBag,
        status: order.status
    }));

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <LayoutDashboard className="w-10 h-10 animate-pulse text-[#794A05]" />
                <p className="text-[#794A05] font-serif italic animate-pulse">Syncing Store Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
                        Store Insights
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Welcome back, <span className="text-amber-700 font-bold">{user?.name}</span>. Here's your store's performance today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            {format(new Date(), "EEEE, dd MMM")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[1.5rem] overflow-hidden group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <stat.icon className={cn("w-6 h-6", stat.color.replace('bg-', 'text-'))} />
                                    </div>
                                    <Badge variant="outline" className="border-slate-100 text-[10px] font-bold uppercase tracking-tighter">
                                        {stat.change}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.title}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                            <CardTitle className="text-lg font-bold font-serif flex items-center gap-2 text-slate-800">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {recentActivity.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-medium italic">No recent activity found.</p>
                                    </div>
                                ) : (
                                    recentActivity.map((activity, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-amber-50">
                                                <activity.icon className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">
                                                    {activity.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400">{activity.time}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        activity.status === "DELIVERED" ? "text-emerald-500" : "text-amber-600"
                                                    )}>
                                                        {activity.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-50 rounded-lg">
                                                <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Store Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-[#794A05]/5 border-b border-[#794A05]/10">
                            <CardTitle className="text-lg font-bold font-serif text-[#794A05]">Store Health</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#794A05]">
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">
                                            {(user as any)?.name || "Your Store"}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400">
                                            Status: <span className="text-emerald-500">Active Seller</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Quick Stats</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-400">Total Products</span>
                                            <span className="text-slate-900">{productsCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-400">Total Orders</span>
                                            <span className="text-slate-900">{recentOrders.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-400">Net Revenue</span>
                                            <span className="text-[#794A05]">₹{(statsData?.netEarnings || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Payout Status</span>
                                    </div>
                                    <p className="text-xs text-emerald-800 font-bold">₹{(statsData?.availableBalance || 0).toLocaleString()} ready for withdrawal</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

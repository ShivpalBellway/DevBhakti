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
    IndianRupee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
    {
        title: "Total Devotees",
        value: "1,284",
        change: "+5.4%",
        trend: "up",
        icon: Users,
        color: "bg-blue-500",
    },
    {
        title: "Pooja Bookings",
        value: "156",
        change: "+12%",
        trend: "up",
        icon: Calendar,
        color: "bg-orange-500",
    },
    {
        title: "Product Sales",
        value: "₹45,200",
        change: "+8.2%",
        trend: "up",
        icon: ShoppingBag,
        color: "bg-green-500",
    },
    {
        title: "Donations",
        value: "₹1.2L",
        change: "+15%",
        trend: "up",
        icon: Heart,
        color: "bg-red-500",
    },
];

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

export default function InstitutionDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    Temple Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage your temple's digital presence, devotees, and offerings.
                </p>
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
                        <Card className="hover:shadow-warm transition-shadow duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div
                                        className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
                                    >
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"
                                            }`}
                                    >
                                        {stat.trend === "up" ? (
                                            <TrendingUp className="w-4 h-4" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4" />
                                        )}
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Recent Marketplace Orders</CardTitle>
                            <button className="text-sm text-primary hover:underline flex items-center gap-1">
                                View all
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.map((order, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <ShoppingBag className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{order.product}</p>
                                                <p className="text-xs text-muted-foreground">By {order.user}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-foreground">{order.amount}</p>
                                            <p className="text-xs text-muted-foreground">{order.status}</p>
                                        </div>
                                    </div>
                                ))}
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Upcoming Pooja Bookings</CardTitle>
                            <button className="text-sm text-primary hover:underline flex items-center gap-1">
                                View all
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingBookings.map((booking, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{booking.pooja}</p>
                                                <p className="text-xs text-muted-foreground">For {booking.user}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-foreground">{booking.date}</p>
                                            <p className="text-xs text-muted-foreground">{booking.time}</p>
                                        </div>
                                    </div>
                                ))}
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Add Product", icon: Package, color: "bg-green-500" },
                                { label: "Schedule Pooja", icon: Calendar, color: "bg-orange-500" },
                                { label: "Start Live Stream", icon: Video, color: "bg-red-500" },
                                { label: "View Reports", icon: TrendingUp, color: "bg-blue-500" },
                            ].map((action) => (
                                <button
                                    key={action.label}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all group"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                                    >
                                        <action.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

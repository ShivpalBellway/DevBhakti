"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingBag, IndianRupee, TrendingUp, TrendingDown, Store, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SellerDashboard() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("seller_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const stats = [
        {
            title: "Total Revenue",
            value: "₹0",
            change: "+0%",
            trend: "up",
            icon: IndianRupee,
            color: "bg-primary",
        },
        {
            title: "Total Orders",
            value: "0",
            change: "+0%",
            trend: "up",
            icon: ShoppingBag,
            color: "bg-secondary",
        },
        {
            title: "Active Products",
            value: "0",
            change: "+0%",
            trend: "up",
            icon: Package,
            color: "bg-accent",
        },
        {
            title: "Growth",
            value: "0%",
            change: "+0%",
            trend: "up",
            icon: TrendingUp,
            color: "bg-success",
        },
    ];

    const recentActivity = [
        {
            type: "order",
            title: "New order #1001 received",
            time: "Waiting for first order",
            icon: ShoppingBag,
        },
        {
            type: "product",
            title: "Add your first product",
            time: "Get started with your store",
            icon: Package,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    Dashboard Overview
                </h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Here's what's happening in your store today.
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
                                        <stat.icon className="w-6 h-6 text-primary-foreground" />
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up" ? "text-success" : "text-destructive"
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
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                            <button className="text-sm text-primary hover:underline flex items-center gap-1">
                                View all
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <activity.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Store Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-lg border border-border">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Store className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {user?.name || "Your Store"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user?.phone || "Seller Account"}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <p className="text-sm font-medium text-foreground mb-2">Quick Stats</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Products</span>
                                            <span className="font-medium">0</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Orders</span>
                                            <span className="font-medium">0</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Revenue</span>
                                            <span className="font-medium">₹0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recent Orders Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
                            No orders yet. Start adding products to your store!
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

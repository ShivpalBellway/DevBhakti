"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const orders = [
    {
        id: "ORD-7821",
        user: "Amit Kumar",
        product: "Panchamrit Set",
        amount: "₹550",
        date: "Oct 15, 2024",
        status: "Delivered",
    },
    {
        id: "ORD-7822",
        user: "Priya Singh",
        product: "Brass Diya",
        amount: "₹1,200",
        date: "Oct 15, 2024",
        status: "Processing",
    },
    {
        id: "ORD-7823",
        user: "Rahul Sharma",
        product: "Incense Sticks",
        amount: "₹250",
        date: "Oct 14, 2024",
        status: "Shipped",
    },
];

const statusConfig = {
    Delivered: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle,
    },
    Processing: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Clock,
    },
    Shipped: {
        color: "bg-orange-100 text-orange-700 border-orange-200",
        icon: Truck,
    },
    Cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
    },
};

export default function InstitutionOrdersPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredOrders = orders.filter((o) =>
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.user.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Order Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track and process marketplace orders for your temple.
                    </p>
                </div>
                <Button variant="sacred">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Export Orders
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Orders", value: "1,254", color: "text-foreground" },
                    { label: "Pending", value: "12", color: "text-blue-600" },
                    { label: "Processing", value: "8", color: "text-orange-600" },
                    { label: "Revenue", value: "₹45,200", color: "text-green-600" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by order ID or customer name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Status
                </Button>
            </div>

            {/* Orders Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Order ID
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Customer
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Product
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Amount
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Date
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order, index) => {
                                    const status = statusConfig[order.status as keyof typeof statusConfig];
                                    return (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="border-b border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4 font-mono text-sm font-medium text-primary">
                                                {order.id}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground font-medium">{order.user}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-foreground">{order.product}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-bold text-foreground">{order.amount}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-muted-foreground">{order.date}</span>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={status.color}>
                                                    <status.icon className="w-3 h-3 mr-1" />
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

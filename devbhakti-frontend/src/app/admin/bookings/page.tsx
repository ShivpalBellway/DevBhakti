"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Search,
    Filter,
    MoreVertical,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Building2,
    User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const bookings = [
    {
        id: "BK-001234",
        service: "Morning Aarti",
        temple: "Kashi Vishwanath Temple",
        user: "Rahul Sharma",
        date: "Dec 25, 2024",
        time: "5:00 AM",
        amount: "₹251",
        status: "confirmed",
    },
    {
        id: "BK-001235",
        service: "Rudrabhishek Pooja",
        temple: "Tirupati Balaji Temple",
        user: "Priya Patel",
        date: "Dec 26, 2024",
        time: "9:00 AM",
        amount: "₹1,100",
        status: "pending",
    },
    {
        id: "BK-001236",
        service: "Satyanarayan Katha",
        temple: "ISKCON Mumbai",
        user: "Amit Kumar",
        date: "Dec 27, 2024",
        time: "7:00 PM",
        amount: "₹501",
        status: "confirmed",
    },
    {
        id: "BK-001237",
        service: "VIP Darshan",
        temple: "Shirdi Sai Baba Temple",
        user: "Neha Gupta",
        date: "Dec 28, 2024",
        time: "10:00 AM",
        amount: "₹2,100",
        status: "cancelled",
    },
    {
        id: "BK-001238",
        service: "Special Pooja",
        temple: "Vaishno Devi Temple",
        user: "Vikram Singh",
        date: "Dec 29, 2024",
        time: "6:00 AM",
        amount: "₹5,100",
        status: "confirmed",
    },
];

const statusConfig = {
    confirmed: {
        label: "Confirmed",
        color: "bg-success/10 text-success border-success/20",
        icon: CheckCircle,
    },
    pending: {
        label: "Pending",
        color: "bg-secondary/20 text-secondary-foreground border-secondary/30",
        icon: Clock,
    },
    cancelled: {
        label: "Cancelled",
        color: "bg-destructive/10 text-destructive border-destructive/20",
        icon: XCircle,
    },
};

export default function AdminBookingsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");

    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.user.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Bookings
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all pooja and seva bookings
                    </p>
                </div>
                <Button variant="sacred">
                    <Calendar className="w-4 h-4 mr-2" />
                    Export Bookings
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Bookings", value: "12,543", color: "text-foreground" },
                    { label: "Confirmed", value: "10,234", color: "text-success" },
                    { label: "Pending", value: "1,856", color: "text-secondary" },
                    { label: "Today's Revenue", value: "₹2.3L", color: "text-primary" },
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
                        placeholder="Search by booking ID, service, or user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "confirmed", "pending", "cancelled"].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "sacred" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status as typeof statusFilter)}
                            className="capitalize"
                        >
                            {status === "all" ? "All" : status}
                        </Button>
                    ))}
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Date Range
                </Button>
            </div>

            {/* Bookings Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Booking ID
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Service
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Temple
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        User
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Schedule
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Amount
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
                                {filteredBookings.map((booking, index) => {
                                    const status = statusConfig[booking.status as keyof typeof statusConfig];
                                    return (
                                        <motion.tr
                                            key={booking.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="border-b border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <p className="font-mono text-sm font-medium text-primary">
                                                    {booking.id}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium text-foreground">{booking.service}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">
                                                        {booking.temple}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">{booking.user}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="text-sm text-foreground">{booking.date}</p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {booking.time}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-semibold text-foreground">{booking.amount}</p>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={status.color}>
                                                    <status.icon className="w-3 h-3 mr-1" />
                                                    {status.label}
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

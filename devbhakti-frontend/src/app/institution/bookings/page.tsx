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
    User,
    Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const bookings = [
    {
        id: "BK-1024",
        user: "Suresh Raina",
        pooja: "Rudrabhishek",
        date: "Oct 25, 2024",
        time: "08:00 AM",
        amount: "₹1,100",
        status: "Confirmed",
    },
    {
        id: "BK-1025",
        user: "Meena Devi",
        pooja: "Satyanarayan Katha",
        date: "Oct 26, 2024",
        time: "10:30 AM",
        amount: "₹501",
        status: "Pending",
    },
    {
        id: "BK-1026",
        user: "Vikram Singh",
        pooja: "Maha Aarti",
        date: "Oct 27, 2024",
        time: "06:00 PM",
        amount: "₹251",
        status: "Confirmed",
    },
];

const statusConfig = {
    Confirmed: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle,
    },
    Pending: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Clock,
    },
    Cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
    },
};

export default function InstitutionBookingsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredBookings = bookings.filter((b) =>
        b.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pooja.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <Button variant="sacred">
                    <Plus className="w-4 h-4 mr-2" />
                    New Booking
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Bookings", value: "1,284", color: "text-foreground" },
                    { label: "Today's Rituals", value: "12", color: "text-primary" },
                    { label: "Pending Requests", value: "8", color: "text-blue-600" },
                    { label: "Monthly Revenue", value: "₹2.4L", color: "text-green-600" },
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
                        placeholder="Search by devotee or pooja name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
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
                                        Devotee
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Pooja/Ritual
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
                                            <td className="p-4 font-mono text-sm font-medium text-primary">
                                                {booking.id}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground font-medium">{booking.user}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-foreground">{booking.pooja}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm text-foreground">{booking.date}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {booking.time}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-bold text-foreground">{booking.amount}</span>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={status.color}>
                                                    <status.icon className="w-3 h-3 mr-1" />
                                                    {booking.status}
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

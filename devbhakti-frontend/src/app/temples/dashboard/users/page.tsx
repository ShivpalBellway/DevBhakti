"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    Eye,
    UserPlus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const devotees = [
    {
        id: 1,
        name: "Rahul Sharma",
        email: "rahul.sharma@email.com",
        phone: "+91 98765 43210",
        lastVisit: "Oct 12, 2024",
        totalBookings: 12,
        totalDonations: "₹5,200",
        avatar: "RS",
    },
    {
        id: 2,
        name: "Priya Patel",
        email: "priya.patel@email.com",
        phone: "+91 87654 32109",
        lastVisit: "Oct 14, 2024",
        totalBookings: 8,
        totalDonations: "₹3,100",
        avatar: "PP",
    },
    {
        id: 3,
        name: "Amit Kumar",
        email: "amit.kumar@email.com",
        phone: "+91 76543 21098",
        lastVisit: "Oct 15, 2024",
        totalBookings: 5,
        totalDonations: "₹1,500",
        avatar: "AK",
    },
];

export default function TempleUsersPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredDevotees = devotees.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Devotee Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and connect with devotees of your temple.
                    </p>
                </div>
                <Button variant="sacred">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Devotee
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Devotees", value: "1,284", color: "text-foreground" },
                    { label: "Active This Week", value: "456", color: "text-primary" },
                    { label: "New Registrations", value: "24", color: "text-green-600" },
                    { label: "Total Donations", value: "₹1.2L", color: "text-orange-600" },
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
                        placeholder="Search devotees by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                </Button>
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Devotee
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Contact
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Activity
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Last Visit
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevotees.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="border-b border-border hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                    {user.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">ID: #DEV-{user.id}00</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-foreground flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                                    {user.email}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {user.phone}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-sm text-foreground">
                                                    {user.totalBookings} bookings
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.totalDonations} donations
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                <Calendar className="w-3 h-3" />
                                                {user.lastVisit}
                                            </div>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

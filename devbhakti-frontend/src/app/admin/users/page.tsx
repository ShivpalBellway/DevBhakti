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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const users = [
    {
        id: 1,
        name: "Rahul Sharma",
        email: "rahul.sharma@email.com",
        phone: "+91 98765 43210",
        type: "devotee",
        bookings: 12,
        donations: "₹5,200",
        joinedDate: "Mar 15, 2024",
        avatar: "RS",
    },
    {
        id: 2,
        name: "Priya Patel",
        email: "priya.patel@email.com",
        phone: "+91 87654 32109",
        type: "devotee",
        bookings: 8,
        donations: "₹3,100",
        joinedDate: "Apr 20, 2024",
        avatar: "PP",
    },
    {
        id: 3,
        name: "Kashi Temple Admin",
        email: "admin@kashitemple.org",
        phone: "+91 76543 21098",
        type: "institution",
        bookings: 1234,
        donations: "₹12.5L",
        joinedDate: "Jan 15, 2024",
        avatar: "KT",
    },
    {
        id: 4,
        name: "Amit Kumar",
        email: "amit.kumar@email.com",
        phone: "+91 65432 10987",
        type: "devotee",
        bookings: 5,
        donations: "₹1,500",
        joinedDate: "May 10, 2024",
        avatar: "AK",
    },
    {
        id: 5,
        name: "Tirupati Admin",
        email: "admin@tirupati.org",
        phone: "+91 54321 09876",
        type: "institution",
        bookings: 5678,
        donations: "₹45.2L",
        joinedDate: "Feb 20, 2024",
        avatar: "TA",
    },
];

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "devotee" | "institution">("all");

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || user.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Users
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage devotees and Temple Admins on DevBhakti
                    </p>
                </div>
                <Button variant="sacred">
                    <Users className="w-4 h-4 mr-2" />
                    Export Users
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: "52,847", color: "text-foreground" },
                    { label: "Devotees", value: "52,321", color: "text-primary" },
                    { label: "Temple Admins", value: "526", color: "text-secondary" },
                    { label: "New This Month", value: "1,234", color: "text-success" },
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
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {["all", "devotee", "institution"].map((type) => (
                        <Button
                            key={type}
                            variant={typeFilter === type ? "sacred" : "outline"}
                            size="sm"
                            onClick={() => setTypeFilter(type as typeof typeFilter)}
                            className="capitalize"
                        >
                            {type === "all" ? "All" : type === "institution" ? "Temple Admin" : "Devotee"}
                        </Button>
                    ))}
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
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
                                        User
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Type
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Contact
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Activity
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Joined
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
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
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    user.type === "institution"
                                                        ? "bg-secondary/10 text-secondary-foreground border-secondary/20"
                                                        : "bg-primary/10 text-primary border-primary/20"
                                                }
                                            >
                                                {user.type === "institution" ? "Temple Admin" : "Devotee"}
                                            </Badge>
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
                                                    {user.bookings.toLocaleString()} bookings
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.donations} donations
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                <Calendar className="w-3 h-3" />
                                                {user.joinedDate}
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

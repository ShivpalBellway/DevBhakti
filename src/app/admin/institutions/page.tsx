"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Building2,
    Search,
    Filter,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const institutions = [
    {
        id: 1,
        name: "Kashi Vishwanath Temple",
        location: "Varanasi, UP",
        status: "verified",
        bookings: 1234,
        revenue: "₹12.5L",
        joinedDate: "Jan 15, 2024",
    },
    {
        id: 2,
        name: "Tirupati Balaji Temple",
        location: "Tirumala, AP",
        status: "verified",
        bookings: 5678,
        revenue: "₹45.2L",
        joinedDate: "Feb 20, 2024",
    },
    {
        id: 3,
        name: "ISKCON Mumbai",
        location: "Mumbai, MH",
        status: "pending",
        bookings: 0,
        revenue: "₹0",
        joinedDate: "Dec 18, 2024",
    },
    {
        id: 4,
        name: "Shirdi Sai Baba Temple",
        location: "Shirdi, MH",
        status: "verified",
        bookings: 3456,
        revenue: "₹28.7L",
        joinedDate: "Mar 10, 2024",
    },
    {
        id: 5,
        name: "Vaishno Devi Temple",
        location: "Katra, J&K",
        status: "rejected",
        bookings: 0,
        revenue: "₹0",
        joinedDate: "Nov 25, 2024",
    },
];

const statusConfig = {
    verified: {
        label: "Verified",
        color: "bg-success/10 text-success border-success/20",
        icon: CheckCircle,
    },
    pending: {
        label: "Pending",
        color: "bg-secondary/20 text-secondary-foreground border-secondary/30",
        icon: Clock,
    },
    rejected: {
        label: "Rejected",
        color: "bg-destructive/10 text-destructive border-destructive/20",
        icon: XCircle,
    },
};

export default function AdminInstitutionsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredInstitutions = institutions.filter((inst) =>
        inst.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Institutions
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage temples and institutions registered on DevBhakti
                    </p>
                </div>
                <Button variant="sacred">
                    <Building2 className="w-4 h-4 mr-2" />
                    Add Institution
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: "524", color: "text-foreground" },
                    { label: "Verified", value: "486", color: "text-success" },
                    { label: "Pending", value: "32", color: "text-secondary" },
                    { label: "Rejected", value: "6", color: "text-destructive" },
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
                        placeholder="Search institutions..."
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

            {/* Institutions Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Institution
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Bookings
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Revenue
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
                                {filteredInstitutions.map((institution, index) => {
                                    const status = statusConfig[institution.status as keyof typeof statusConfig];
                                    return (
                                        <motion.tr
                                            key={institution.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="border-b border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {institution.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {institution.location}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={status.color}>
                                                    <status.icon className="w-3 h-3 mr-1" />
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-foreground font-medium">
                                                {institution.bookings.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-foreground font-medium">
                                                {institution.revenue}
                                            </td>
                                            <td className="p-4 text-muted-foreground text-sm">
                                                {institution.joinedDate}
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

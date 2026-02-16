"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAllUsersAdmin } from "@/api/adminController";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "devotee" | "institution" | "seller">("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDevotees: 0,
        totalInstitutions: 0,
        newThisMonth: 0,
    });
    const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("all");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            let startDate, endDate;
            if (dateRange !== "all") {
                const now = new Date();
                endDate = now.toISOString();
                const start = new Date();
                if (dateRange === "week") start.setDate(now.getDate() - 7);
                else if (dateRange === "month") start.setMonth(now.getMonth() - 1);
                else if (dateRange === "year") start.setFullYear(now.getFullYear() - 1);
                startDate = start.toISOString();
            }

            const response = await fetchAllUsersAdmin({
                page,
                limit: 10,
                search: debouncedSearch,
                role: typeFilter,
                startDate,
                endDate
            });
            if (response.success) {
                setUsers(response.data.users);
                setTotalPages(response.data.pagination.totalPages);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, typeFilter, dateRange]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const formatAvatar = (name: string) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

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
                {/* <Button variant="sacred">
                    <Users className="w-4 h-4 mr-2" />
                    Export Users
                </Button> */}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", value: stats.totalUsers.toLocaleString(), color: "text-foreground" },
                    { label: "Devotees", value: stats.totalDevotees.toLocaleString(), color: "text-primary" },
                    { label: "Temple Admins", value: stats.totalInstitutions.toLocaleString(), color: "text-secondary" },
                    { label: "New This Month", value: stats.newThisMonth.toLocaleString(), color: "text-success" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            {loading ? (
                                <div className="space-y-2">
                                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                </div>
                            ) : (
                                <>
                                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search users by name or email or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {["all", "devotee", "institution", "seller"].map((type) => (
                        <Button
                            key={type}
                            variant={typeFilter === type ? "sacred" : "outline"}
                            size="sm"
                            onClick={() => {
                                setTypeFilter(type as any);
                                setPage(1);
                            }}
                            className="capitalize whitespace-nowrap"
                        >
                            {type === "all" ? "All" : type === "institution" ? "Temple Admin" : type === "seller" ? "Seller" : "Devotee"}
                        </Button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {["all", "week", "month", "year"].map((range) => (
                        <Button
                            key={range}
                            variant={dateRange === range ? "sacred" : "outline"}
                            size="sm"
                            onClick={() => {
                                setDateRange(range as any);
                                setPage(1);
                            }}
                            className="capitalize whitespace-nowrap"
                        >
                            {range === "all" ? "All Time" : range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
                        </Button>
                    ))}
                </div>
                {/* <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
                </Button> */}
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
                                        User   Type
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Contact
                                    </th>
                                    {/* <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Activity

                                    </th> */}
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Joined
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                <p className="text-muted-foreground">Loading users...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <p className="text-muted-foreground">No users found matching your criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {user.profileImage ? (
                                                        <img
                                                            src={user.profileImage}
                                                            alt={user.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                            {formatAvatar(user.name || "User")}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-foreground">{user.name || "N/A"}</p>
                                                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">{user.email || "No Email"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        user.role === "INSTITUTION"
                                                            ? "bg-secondary/10 text-secondary-foreground border-secondary/20"
                                                            : user.role === "SELLER"
                                                                ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                                                : "bg-primary/10 text-primary border-primary/20"
                                                    }
                                                >
                                                    {user.role === "INSTITUTION" ? "Temple Admin" : user.role === "SELLER" ? "Seller" : "Devotee"}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-foreground flex items-center gap-1">
                                                        <Mail className="w-3 h-3 text-muted-foreground" />
                                                        <span className="truncate max-w-[150px]">{user.email || "N/A"}</span>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {user.phone || "N/A"}
                                                    </p>
                                                </div>
                                            </td>
                                            {/* <td className="p-4">
                                                <div>
                                                    <p className="text-sm text-foreground">
                                                        {(user.bookings || 0).toLocaleString()} bookings
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {(user.orders || 0).toLocaleString()} orders
                                                    </p>
                                                </div>
                                            </td> */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(user.joinedDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        if (user.role === "INSTITUTION") {
                                                            window.location.href = `/admin/temples/${user.id}`;
                                                        } else if (user.role === "SELLER") {
                                                            window.location.href = `/admin/sellers/view/${user.id}`;
                                                        } else {
                                                            window.location.href = `/admin/users/${user.id}`;
                                                        }
                                                    }}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="p-4 border-t border-border">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                onClick={() => setPage(i + 1)}
                                                isActive={page === i + 1}
                                                className="cursor-pointer"
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

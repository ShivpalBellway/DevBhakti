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
    CheckSquare,
    Trash2,
    Download
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAllUsersAdmin, downloadUsersExcelAdmin } from "@/api/adminController";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"devotee">("devotee");
    const [dobFilter, setDobFilter] = useState("");
    const [anniversaryFilter, setAnniversaryFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDevotees: 0,
        totalInstitutions: 0,
        newThisMonth: 0,
        filteredCount: 0,
        filteredBookings: 0,
        filteredOrders: 0
    });
    const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("all");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const { hasPermission } = useAdminAuth();

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
                endDate,
                dob: dobFilter,
                anniversary: anniversaryFilter
            });
            if (response.success) {
                setUsers(response.data.users);
                setSelectedUserIds([]); // Clear selection on page/filter change
                setTotalPages(response.data.pagination.totalPages);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, typeFilter, dateRange, dobFilter, anniversaryFilter]);

    const handleExportExcel = async () => {
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

            const response = await downloadUsersExcelAdmin({
                search: debouncedSearch,
                role: typeFilter,
                startDate,
                endDate,
                dob: dobFilter,
                anniversary: anniversaryFilter
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const formatAvatar = (name: string) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.length === users.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(users.map(u => u.id));
        }
    };

    const toggleSelectUser = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleExportSelected = async () => {
        // Here we could implement a specific export for selected IDs
        // For now, let's keep it simple or use the filtered export logic
        handleExportExcel();
    };

    return (
        <div className="space-y-6 relative">
            {/* Bulk Action Bar */}
            {selectedUserIds.length > 0 && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700 backdrop-blur-lg"
                >
                    <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/20">
                            {selectedUserIds.length}
                        </div>
                        <p className="text-sm font-bold tracking-wide">Selected</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/10 gap-2 h-10 px-4 rounded-xl font-bold"
                            onClick={handleExportSelected}
                        >
                            <Download className="w-4 h-4" />
                            Export Data
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2 h-10 px-4 rounded-xl font-bold"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-slate-700 text-slate-400 hover:bg-white/5 h-10 px-4 rounded-xl font-bold"
                            onClick={() => setSelectedUserIds([])}
                        >
                            Deselect All
                        </Button>
                    </div>
                </motion.div>
            )}
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Devotee Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all devotees registered on DevBhakti
                    </p>
                </div>
                <Button variant="sacred" onClick={handleExportExcel}>
                    <Users className="w-4 h-4 mr-2" />
                    Export Users
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: `Total Devotees`, value: stats.filteredCount.toLocaleString(), color: "text-primary" },
                    { label: "Bookings", value: stats.filteredBookings.toLocaleString(), color: "text-blue-600" },
                    { label: "Orders", value: stats.filteredOrders.toLocaleString(), color: "text-amber-600" },
                    { label: "New This Month", value: stats.newThisMonth.toLocaleString(), color: "text-emerald-600" },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm bg-white/50 backdrop-blur-md">
                        <CardContent className="p-4">
                            {loading ? (
                                <div className="space-y-2">
                                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                </div>
                            ) : (
                                <>
                                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
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
                    <Button
                        variant="sacred"
                        size="sm"
                        className="capitalize whitespace-nowrap h-10 px-4 rounded-xl"
                    >
                        Devotees Only
                    </Button>
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
                <div className="flex flex-col gap-1 min-w-[150px]">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Birthday Filter</p>
                    <Input
                        type="date"
                        value={dobFilter}
                        onChange={(e) => {
                            setDobFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 text-xs"
                    />
                </div>
                <div className="flex flex-col gap-1 min-w-[150px]">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Anniversary Filter</p>
                    <Input
                        type="date"
                        value={anniversaryFilter}
                        onChange={(e) => {
                            setAnniversaryFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 text-xs"
                    />
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
                                    <th className="p-4 w-12">
                                        <Checkbox
                                            checked={selectedUserIds.length === users.length && users.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Devotee
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
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                <p className="text-muted-foreground">Loading users...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
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
                                                <Checkbox
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onCheckedChange={() => toggleSelectUser(user.id)}
                                                    className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {user.profileImage ? (
                                                        <img
                                                            src={user.profileImage}
                                                            alt={user.name}
                                                            className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                                                            {formatAvatar(user.name || "User")}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-none">{user.name || "N/A"}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter font-bold">UID: {user.id.substring(user.id.length - 6)}</p>
                                                    </div>
                                                </div>
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
                                                    {hasPermission("users.view") && (
                                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => {
                                                            window.location.href = `/admin/users/${user.id}`;
                                                        }}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission("users.manage") && (
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    )}
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

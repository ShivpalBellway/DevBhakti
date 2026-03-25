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
    Send,
    Download
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchAllUsersAdmin, downloadUsersExcelAdmin, downloadUsersAiSensyCSVAdmin, toggleUserStatusAdmin, bulkToggleUserStatusAdmin, sendBulkWhatsAppAdmin } from "@/api/adminController";
import { toast } from "sonner"; // Assuming sonner is used for notifications

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useAdminAuth } from "@/hooks/use-admin-auth";

const formatImpDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch (e) {
        return dateStr;
    }
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [dobFilter, setDobFilter] = useState("");
    const [dobStart, setDobStart] = useState("");
    const [dobEnd, setDobEnd] = useState("");
    const [anniversaryFilter, setAnniversaryFilter] = useState("");
    const [anniversaryStart, setAnniversaryStart] = useState("");
    const [anniversaryEnd, setAnniversaryEnd] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDevotees: 0,
        totalInstitutions: 0,
        totalSellers: 0,
        newThisMonth: 0,
        filteredCount: 0,
        filteredBookings: 0,
        filteredOrders: 0
    });
    const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("all");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string>("");
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
                if (dateRange === "week") {
                    // Start of the week (Sunday)
                    start.setDate(now.getDate() - now.getDay());
                    start.setHours(0, 0, 0, 0);
                } else if (dateRange === "month") {
                    // Start of the month
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                } else if (dateRange === "year") {
                    // Start of the year
                    start.setMonth(0, 1);
                    start.setHours(0, 0, 0, 0);
                }
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
                dobStart,
                dobEnd,
                anniversary: anniversaryFilter,
                anniversaryStart,
                anniversaryEnd,
                filterType: filterType
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
    }, [page, debouncedSearch, typeFilter, dateRange, dobFilter, dobStart, dobEnd, anniversaryFilter, anniversaryStart, anniversaryEnd, filterType]);

    const handleExportExcel = async () => {
        // ... (existing handleExportExcel logic remains)
        try {
            let startDate, endDate;
            if (dateRange !== "all") {
                const now = new Date();
                endDate = now.toISOString();
                const start = new Date();
                if (dateRange === "week") {
                    start.setDate(now.getDate() - now.getDay());
                    start.setHours(0, 0, 0, 0);
                } else if (dateRange === "month") {
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                } else if (dateRange === "year") {
                    start.setMonth(0, 1);
                    start.setHours(0, 0, 0, 0);
                }
                startDate = start.toISOString();
            }

            const response = await downloadUsersExcelAdmin({
                search: debouncedSearch,
                role: typeFilter,
                startDate,
                endDate,
                dob: dobFilter === 'upcoming' ? 'upcoming' : dobFilter,
                dobStart,
                dobEnd,
                anniversary: anniversaryFilter === 'upcoming' ? 'upcoming' : anniversaryFilter,
                anniversaryStart,
                anniversaryEnd,
                filterType: filterType
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

    const handleExportAiSensy = async () => {
        try {
            const response = await downloadUsersAiSensyCSVAdmin({
                ids: selectedUserIds.length > 0 ? selectedUserIds.join(',') : undefined,
                search: selectedUserIds.length > 0 ? undefined : debouncedSearch,
                role: selectedUserIds.length > 0 ? undefined : typeFilter,
                dob: dobFilter,
                dobStart,
                dobEnd,
                anniversary: anniversaryFilter,
                anniversaryStart,
                anniversaryEnd,
                filterType: filterType
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `aisensy_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("AiSensy CSV exported successfully!");
        } catch (error) {
            console.error("AiSensy Export failed:", error);
            toast.error("Failed to export AiSensy CSV");
        }
    };

    useEffect(() => {
        loadUsers();
    }, [loadUsers, filterType]);

    const formatAvatar = (name: string) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const formatRoleLabel = (role: string) => {
        if (role === 'INSTITUTION') return 'Temple Admin';
        if (role === 'SELLER') return 'Seller';
        if (role === 'DEVOTEE') return 'Devotee';
        if (role === 'ADMIN') return 'Admin';
        return role?.replace('_', ' ') || 'Devotee';
    };

    const getRoleBadgeClass = (role: string) => {
        if (role === 'ADMIN') return 'bg-rose-50 text-rose-600 border-rose-200';
        if (role === 'INSTITUTION') return 'bg-amber-50 text-amber-600 border-amber-200';
        if (role === 'SELLER') return 'bg-blue-50 text-blue-600 border-blue-200';
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
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
        handleExportExcel();
    };


    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const response = await toggleUserStatusAdmin(userId, !currentStatus);
            if (response.success) {
                toast.success(response.message);
                loadUsers();
            }
        } catch (err) {
            console.error('Failed to toggle user status', err);
            toast.error("Failed to update user status");
        }
    };

    const handleBulkToggleStatus = async (status: boolean) => {
        try {
            const response = await bulkToggleUserStatusAdmin(selectedUserIds, status);
            if (response.success) {
                toast.success(response.message);
                setSelectedUserIds([]);
                loadUsers();
            }
        } catch (err) {
            console.error('Failed to bulk toggle status', err);
            toast.error("Failed to update users status");
        }
    };

    const handleSendWhatsAppCampaign = async (campaign: 'birthday_reminder' | 'anniversary_reminder_lugrs') => {
        if (selectedUserIds.length === 0) {
            toast.error("Please select at least one user to send a message.");
            return;
        }

        const promise = sendBulkWhatsAppAdmin({
            userIds: selectedUserIds,
            campaignName: campaign,
            templateParams: ['{{name}}'] // Personalized with name
        });

        toast.promise(promise, {
            loading: `Sending ${campaign.replace('_', ' ')}s...`,
            success: (data) => `Successfully sent ${data.results.filter((r: any) => r.success).length} messages!`,
            error: "Failed to send WhatsApp messages"
        });

        try {
            await promise;
            setSelectedUserIds([]);
        } catch (err) {
            console.error("WhatsApp Campaign Error:", err);
        }
    };



    return (
        <div className="space-y-6 relative">
            {/* Removed Bulk Action Bar */}
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        User Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all users registered on DevBhakti
                    </p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary/5 h-10 px-4 rounded-xl font-bold"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send WhatsApp
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white rounded-xl shadow-xl border-slate-200">
                            <DropdownMenuLabel>Choose Template</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendWhatsAppCampaign('birthday_reminder')}>
                                <Calendar className="mr-2 h-4 w-4 text-emerald-500" />
                                <span>Birthday Reminder</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleSendWhatsAppCampaign('anniversary_reminder_lugrs')}>
                                <Calendar className="mr-2 h-4 w-4 text-rose-500" />
                                <span>Anniversary Reminder</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 h-10 px-4 rounded-xl font-bold" onClick={handleExportAiSensy}>
                        <Send className="w-4 h-4 mr-2" />
                        AiSensy CSV
                    </Button>
                    <Button variant="sacred" onClick={handleExportExcel} className="h-10 px-4 rounded-xl">
                        <Users className="w-4 h-4 mr-2" />
                        Export Users
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: `Total Users`, value: stats.filteredCount?.toLocaleString() || "0", color: "text-primary" },
                    { label: "Total Temple", value: stats.totalInstitutions.toLocaleString(), color: "text-blue-600" },
                    { label: "Total Seller", value: stats.totalSellers.toLocaleString(), color: "text-amber-600" },
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
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 premium-scrollbar">
                        {[
                            { label: "All Users", value: "all" },
                            { label: "Devotees", value: "devotee" },
                            { label: "Temple Admins", value: "temple_admin" },
                            { label: "Sellers", value: "seller" }
                        ].map((type) => (
                            <Button
                                key={type.value}
                                variant={typeFilter === type.value ? "sacred" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setTypeFilter(type.value);
                                    setPage(1);
                                }}
                                className="capitalize whitespace-nowrap h-11 px-4 rounded-xl"
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant={filterType === 'pooja_last_year' ? "sacred" : "outline"}
                        size="sm"
                        onClick={() => {
                            setFilterType(filterType === 'pooja_last_year' ? "" : "pooja_last_year");
                            setPage(1);
                        }}
                        className="h-11 px-4 rounded-xl"
                    >
                        Last Year Pooja
                    </Button>
                </div>

                <div className="flex flex-wrap items-end gap-4 overflow-x-auto pb-2 md:pb-0 premium-scrollbar">
                    <div className="flex gap-2 bg-muted/20 p-1 rounded-xl">
                        {["all", "week", "month", "year"].map((range) => (
                            <Button
                                key={range}
                                variant={dateRange === range ? "sacred" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setDateRange(range as any);
                                    setPage(1);
                                }}
                                className="capitalize whitespace-nowrap h-9 px-4 rounded-lg border-none shadow-none"
                            >
                                {range === "all" ? "All Time" : range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
                            </Button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1 min-w-[280px] flex-1 sm:flex-initial">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Birthday Range</p>
                        <div className="flex gap-1 items-center">
                            <Input
                                type="date"
                                value={dobStart}
                                onChange={(e) => {
                                    setDobStart(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 text-xs rounded-lg"
                                disabled={dobFilter === 'upcoming'}
                            />
                            <span className="text-muted-foreground text-xs">-</span>
                            <Input
                                type="date"
                                value={dobEnd}
                                onChange={(e) => {
                                    setDobEnd(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 text-xs rounded-lg"
                                disabled={dobFilter === 'upcoming'}
                            />
                            <Button
                                size="sm"
                                variant={dobFilter === 'upcoming' ? 'sacred' : 'outline'}
                                className="h-9 text-[10px]"
                                onClick={() => {
                                    if (dobFilter === 'upcoming') {
                                        setDobFilter('');
                                    } else {
                                        setDobFilter('upcoming');
                                        setDobStart('');
                                        setDobEnd('');
                                    }
                                    setPage(1);
                                }}
                            >
                                Upcoming
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-[280px] flex-1 sm:flex-initial">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Anniversary Range</p>
                        <div className="flex gap-1 items-center">
                            <Input
                                type="date"
                                value={anniversaryStart}
                                onChange={(e) => {
                                    setAnniversaryStart(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 text-xs rounded-lg"
                                disabled={anniversaryFilter === 'upcoming'}
                            />
                            <span className="text-muted-foreground text-xs">-</span>
                            <Input
                                type="date"
                                value={anniversaryEnd}
                                onChange={(e) => {
                                    setAnniversaryEnd(e.target.value);
                                    setPage(1);
                                }}
                                className="h-9 text-xs rounded-lg"
                                disabled={anniversaryFilter === 'upcoming'}
                            />
                            <Button
                                size="sm"
                                variant={anniversaryFilter === 'upcoming' ? 'sacred' : 'outline'}
                                className="h-9 text-[10px]"
                                onClick={() => {
                                    if (anniversaryFilter === 'upcoming') {
                                        setAnniversaryFilter('');
                                    } else {
                                        setAnniversaryFilter('upcoming');
                                        setAnniversaryStart('');
                                        setAnniversaryEnd('');
                                    }
                                    setPage(1);
                                }}
                            >
                                Upcoming
                            </Button>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant={dateRange === 'all' && debouncedSearch === '' && typeFilter === 'all' && dobFilter === '' && anniversaryFilter === '' ? 'outline' : 'sacred'}
                        className="h-9 px-4 rounded-lg self-end"
                        onClick={() => {
                            setSearchQuery("");
                            setTypeFilter("all");
                            setDobFilter("");
                            setDobStart("");
                            setDobEnd("");
                            setAnniversaryFilter("");
                            setAnniversaryStart("");
                            setAnniversaryEnd("");
                            setDateRange("all");
                            setPage(1);
                        }}
                    >
                        Reset All
                    </Button>
                </div>
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
                                        User
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Type
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Contact
                                    </th>
                                    {/* <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Activity

                                    </th> */}
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        IMP Dates
                                    </th>
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
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className={`font-bold text-[10px] ${getRoleBadgeClass(user.role)}`}>
                                                        {formatRoleLabel(user.role)}
                                                    </Badge>
                                                    <Badge variant="outline" className={`w-fit text-[9px] font-bold ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                    </Badge>
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
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {user.dob && (
                                                        <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Bdy: {formatImpDate(user.dob)}</span>
                                                        </div>
                                                    )}
                                                    {user.anniversary && (
                                                        <div className="flex items-center gap-1 text-rose-600 text-[11px] font-bold">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Ann: {formatImpDate(user.anniversary)}</span>
                                                        </div>
                                                    )}
                                                    {!user.dob && !user.anniversary && (
                                                        <span className="text-muted-foreground text-[10px] italic">Not set</span>
                                                    )}
                                                </div>
                                            </td>
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
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                                <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}`}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Profile
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    className={`${user.isActive ? 'text-rose-600 focus:text-rose-600' : 'text-emerald-600 focus:text-emerald-600'}`}
                                                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                                >
                                                                    {user.isActive ? (
                                                                        <>
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Deactivate
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckSquare className="mr-2 h-4 w-4" />
                                                                            Activate
                                                                        </>
                                                                    )}
                                                                </DropdownMenuItem>

                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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

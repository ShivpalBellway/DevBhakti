"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Search,
    MoreVertical,
    Phone,
    Calendar as CalendarIcon,
    Loader2,
    CheckSquare,
    Trash2,
    Sparkles,
    ShieldCheck,
    Target,
    Download, // ✅ NEW: Export icon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    fetchAllLeadsAdmin, 
    updateLeadStatusAdmin, 
    deleteLeadAdmin,
    exportLeadsAdmin // ✅ NEW: Export function
} from "@/api/adminLeadController";
import { toast } from "sonner";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [exporting, setExporting] = useState(false); // ✅ NEW: Export loading state
    const [stats, setStats] = useState({
        totalCount: 0,
        newLeads: 0,
        contactedLeads: 0,
        convertedLeads: 0
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchAllLeadsAdmin({
                page,
                limit: 10,
                search: debouncedSearch,
                status: statusFilter
            });
            if (response.success) {
                setLeads(response.data.leads);
                setTotalPages(response.data.pagination.totalPages);
                // Fake stats calculation for demo (in production backend should send these)
                setStats({
                    totalCount: response.data.pagination.total,
                    newLeads: response.data.leads.filter((l: any) => l.status === 'NEW').length,
                    contactedLeads: response.data.leads.filter((l: any) => l.status === 'CONTACTED').length,
                    convertedLeads: response.data.leads.filter((l: any) => l.status === 'CONVERTED').length
                });
            }
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, statusFilter]);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const response = await updateLeadStatusAdmin(id, newStatus);
            if (response.success) {
                toast.success("Lead status updated");
                loadLeads();
            }
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm("Are you sure you want to delete this lead?")) return;
        try {
            const response = await deleteLeadAdmin(id);
            if (response.success) {
                toast.success("Lead deleted successfully");
                loadLeads();
            }
        } catch (err) {
            toast.error("Failed to delete lead");
        }
    };

    // ✅ NEW: Export handler function
    const handleExportLeads = async () => {
        setExporting(true);
        try {
            await exportLeadsAdmin({
                search: debouncedSearch,
                status: statusFilter,
            });
            toast.success("Leads exported successfully!");
        } catch (error: any) {
            console.error("Export failed:", error);
            toast.error(error.message || "Failed to export leads");
        } finally {
            setExporting(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        if (status === 'NEW') return 'bg-blue-50 text-blue-600 border-blue-200';
        if (status === 'CONTACTED') return 'bg-amber-50 text-amber-600 border-amber-200';
        if (status === 'CONVERTED') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        if (status === 'DEAD') return 'bg-red-50 text-red-600 border-red-200';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    };

    return (
        <div className="space-y-6 relative">
            {/* Page header - ✅ Export button added here */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-foreground break-words">
                        Leads Management
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                        Track and convert temple onboarding drops
                    </p>
                </div>
                
                {/* ✅ EXPORT BUTTON */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExportLeads}
                        disabled={exporting}
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl px-4 py-2 h-10 gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Export Leads
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-white border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Leads</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">{stats.totalCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">New Leads</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">{stats.newLeads}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Contacted</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">{stats.contactedLeads}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Converted</p>
                                <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate">{stats.convertedLeads}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-4 bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-primary/10 shadow-sacred relative overflow-hidden group">
                <div className="flex flex-col xl:flex-row gap-3 justify-between items-start xl:items-center relative z-20">
                    <div className="relative w-full xl:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-xl bg-slate-50 border-transparent focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-xs"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                        <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-slate-50 border-transparent focus:ring-2 focus:ring-primary/20 text-xs font-bold uppercase tracking-wider">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-primary/5 shadow-xl">
                                <SelectItem value="all" className="text-xs font-bold uppercase tracking-wider text-slate-500">All Status</SelectItem>
                                <SelectItem value="NEW" className="text-xs font-bold uppercase tracking-wider text-blue-600">New</SelectItem>
                                <SelectItem value="CONTACTED" className="text-xs font-bold uppercase tracking-wider text-amber-600">Contacted</SelectItem>
                                <SelectItem value="CONVERTED" className="text-xs font-bold uppercase tracking-wider text-emerald-600">Converted</SelectItem>
                                <SelectItem value="DEAD" className="text-xs font-bold uppercase tracking-wider text-red-600">Dead</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Leads Table */}
            <Card className="border-none shadow-sacred overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="border-b border-primary/10 bg-primary/5">
                                <tr>
                                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-primary/70">Lead Info</th>
                                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-primary/70">Source</th>
                                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-primary/70">Date</th>
                                    <th className="p-4 text-left text-xs font-black uppercase tracking-widest text-primary/70">Status</th>
                                    <th className="p-4 text-right text-xs font-black uppercase tracking-widest text-primary/70">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                                                <p className="text-sm font-medium text-muted-foreground">Loading leads...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                                            No leads found.
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                    <Phone className="w-4 h-4 text-primary/60" />
                                                    {lead.phone}
                                                </div>
                                                {lead.name && (
                                                    <div className="text-xs font-semibold text-foreground mt-1">
                                                        {lead.name}
                                                    </div>
                                                )}
                                                {lead.email && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {lead.email}
                                                    </div>
                                                )}
                                                {lead.metadata?.mandalName && (
                                                    <div className="text-xs font-semibold text-amber-800 mt-0.5">
                                                        Mandal: {lead.metadata.mandalName} {lead.metadata?.mandalType ? `(${lead.metadata.mandalType})` : ''}
                                                    </div>
                                                )}
                                                {lead.metadata?.templeName && (
                                                    <div className="text-xs font-semibold text-orange-800 mt-0.5">
                                                        Temple: {lead.metadata.templeName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`font-bold text-[10px] ${
                                                        lead.source === 'MANDAL_ONBOARDING'
                                                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                                                            : lead.source === 'TEMPLE_ONBOARDING'
                                                            ? 'bg-orange-100 text-orange-900 border-orange-300'
                                                            : 'bg-slate-50 text-slate-700'
                                                    }`}
                                                >
                                                    {lead.source.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    {new Date(lead.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest border-2 py-0.5 ${getStatusBadgeClass(lead.status)}`}>
                                                    {lead.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'NEW')}>
                                                            Mark as New
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'CONTACTED')}>
                                                            Mark as Contacted
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'FOLLOW_UP_REQUIRED')}>
                                                            Needs Follow Up
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'CONVERTED')}>
                                                            Mark as Converted
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'DEAD')}>
                                                            Mark as Dead
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setPage(i + 1); }}
                                        isActive={page === i + 1}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
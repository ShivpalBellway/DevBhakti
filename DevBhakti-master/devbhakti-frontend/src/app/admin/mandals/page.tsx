"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search, Plus, Trash2, Edit, Eye, ToggleLeft, ToggleRight,
    ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Filter,
    Download, Upload, FileSpreadsheet, Loader2, ShieldCheck
} from "lucide-react";
import * as XLSX from "xlsx";
import {
    fetchAllMandalsAdmin,
    deleteMandalAdmin,
    toggleMandalStatusAdmin,
    createMandalAdmin,
    fetchCommissionSlabsAdmin
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-3 h-3" />,
    APPROVED: <CheckCircle className="w-3 h-3" />,
    REJECTED: <XCircle className="w-3 h-3" />,
};

function getName(name: any): string {
    if (!name) return "—";
    if (typeof name === "string") {
        try {
            const parsed = JSON.parse(name);
            return parsed?.en || parsed?.hi || "—";
        } catch {
            return name;
        }
    }
    return name?.en || name?.hi || "—";
}

export default function AdminMandalsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mandals, setMandals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const limit = 15;

    // Modal state for Approval / Verification
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [loadingSlabs, setLoadingSlabs] = useState(false);
    const [submittingApproval, setSubmittingApproval] = useState(false);
    const [approvalData, setApprovalData] = useState<any>({
        id: "",
        mandalName: "",
        isActive: true,
        slug: "",
        subdomain: "",
        urlType: "slug",
        poojaSlabs: [],
        marketplaceSlabs: [],
        donationSlabs: [],
        offlinePoojaSlabs: [],
        offlineMarketplaceSlabs: [],
        offlineDonationSlabs: [],
        poojaRateType: "DEFAULT",
        marketplaceRateType: "DEFAULT",
        donationRateType: "DEFAULT",
        offlinePoojaRateType: "DEFAULT",
        offlineMarketplaceRateType: "DEFAULT",
        offlineDonationRateType: "DEFAULT",
        activeSlabTab: "online"
    });

    const fetchMandals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAllMandalsAdmin({
                page,
                limit,
                search: search || undefined,
                status: statusFilter !== "ALL" ? statusFilter : undefined,
            });
            if (res.success) {
                setMandals(res.data || []);
                setPagination(res.pagination || { total: 0, totalPages: 1 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchMandals, 300);
        return () => clearTimeout(timer);
    }, [fetchMandals]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this mandal?")) return;
        try {
            await deleteMandalAdmin(id);
            setDeleteId(null);
            fetchMandals();
        } catch (err) {
            alert("Failed to delete mandal.");
        }
    };

    const handleToggleActive = async (mandal: any) => {
        try {
            await toggleMandalStatusAdmin(mandal.id, { isActive: !mandal.isActive });
            fetchMandals();
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    const handleOpenApprovalModal = async (mandal: any) => {
        const mandalId = mandal.id;
        const rawName = getName(mandal.name);
        setLoadingSlabs(true);

        try {
            let onlineSlabs: any[] = [];
            let offlineSlabs: any[] = [];

            const mandalOnlineResponse = await fetchCommissionSlabsAdmin('MANDAL', mandalId, undefined, false);
            const mandalOfflineResponse = await fetchCommissionSlabsAdmin('MANDAL', mandalId, undefined, true);

            if (mandalOnlineResponse.success && mandalOnlineResponse.data && mandalOnlineResponse.data.length > 0) {
                onlineSlabs = mandalOnlineResponse.data;
            } else {
                const mandalDefaultResponse = await fetchCommissionSlabsAdmin('MANDAL', undefined, undefined, false);
                onlineSlabs = mandalDefaultResponse.success ? mandalDefaultResponse.data : [];
            }

            if (mandalOfflineResponse.success && mandalOfflineResponse.data && mandalOfflineResponse.data.length > 0) {
                offlineSlabs = mandalOfflineResponse.data;
            } else {
                const mandalDefaultOfflineResponse = await fetchCommissionSlabsAdmin('MANDAL', undefined, undefined, true);
                offlineSlabs = mandalDefaultOfflineResponse.success ? mandalDefaultOfflineResponse.data : [];
            }

            const hasMandalOnline = mandalOnlineResponse.success && mandalOnlineResponse.data && mandalOnlineResponse.data.length > 0;
            const hasMandalOffline = mandalOfflineResponse.success && mandalOfflineResponse.data && mandalOfflineResponse.data.length > 0;

            const hasOnlinePooja = hasMandalOnline && mandalOnlineResponse.data.some((s: any) => s.category === 'POOJA');
            const hasOnlineMarketplace = hasMandalOnline && mandalOnlineResponse.data.some((s: any) => s.category === 'MARKETPLACE' || !s.category);
            const hasOnlineDonation = hasMandalOnline && mandalOnlineResponse.data.some((s: any) => s.category === 'DONATION');

            const hasOfflinePooja = hasMandalOffline && mandalOfflineResponse.data.some((s: any) => s.category === 'POOJA');
            const hasOfflineMarketplace = hasMandalOffline && mandalOfflineResponse.data.some((s: any) => s.category === 'MARKETPLACE' || !s.category);
            const hasOfflineDonation = hasMandalOffline && mandalOfflineResponse.data.some((s: any) => s.category === 'DONATION');

            const generatedSlug = mandal.slug || (rawName ? rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "");

            const filterSlabs = (slabsList: any[], cat: string) => {
                return slabsList
                    .filter((s: any) => cat === 'MARKETPLACE' ? (s.category === 'MARKETPLACE' || !s.category) : s.category === cat)
                    .map((s: any) => ({
                        minAmount: s.minAmount,
                        maxAmount: s.maxAmount,
                        platformFee: s.platformFee.toString(),
                        percentage: s.percentage.toString(),
                        category: cat
                    }));
            };

            setApprovalData({
                id: mandal.id,
                mandalName: rawName,
                isActive: mandal.isActive,
                slug: generatedSlug,
                subdomain: mandal.subdomain || generatedSlug,
                urlType: mandal.urlType || "slug",
                poojaSlabs: filterSlabs(onlineSlabs, 'POOJA'),
                marketplaceSlabs: filterSlabs(onlineSlabs, 'MARKETPLACE'),
                donationSlabs: filterSlabs(onlineSlabs, 'DONATION'),
                offlinePoojaSlabs: filterSlabs(offlineSlabs, 'POOJA'),
                offlineMarketplaceSlabs: filterSlabs(offlineSlabs, 'MARKETPLACE'),
                offlineDonationSlabs: filterSlabs(offlineSlabs, 'DONATION'),
                poojaRateType: hasOnlinePooja ? "CUSTOM" : "DEFAULT",
                marketplaceRateType: hasOnlineMarketplace ? "CUSTOM" : "DEFAULT",
                donationRateType: hasOnlineDonation ? "CUSTOM" : "DEFAULT",
                offlinePoojaRateType: hasOfflinePooja ? "CUSTOM" : "DEFAULT",
                offlineMarketplaceRateType: hasOfflineMarketplace ? "CUSTOM" : "DEFAULT",
                offlineDonationRateType: hasOfflineDonation ? "CUSTOM" : "DEFAULT",
                activeSlabTab: "online",
            });

            setApprovalModalOpen(true);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load commission slabs", variant: "destructive" });
        } finally {
            setLoadingSlabs(false);
        }
    };

    const handleConfirmApproval = async () => {
        setSubmittingApproval(true);
        try {
            let onlineSlabs: any[] = [];
            let offlineSlabs: any[] = [];

            if (approvalData.poojaRateType === 'CUSTOM') {
                onlineSlabs.push(...approvalData.poojaSlabs.map((s: any) => ({ ...s, isOffline: false, category: 'POOJA' })));
            }
            if (approvalData.marketplaceRateType === 'CUSTOM') {
                onlineSlabs.push(...approvalData.marketplaceSlabs.map((s: any) => ({ ...s, isOffline: false, category: 'MARKETPLACE' })));
            }
            if (approvalData.donationRateType === 'CUSTOM') {
                onlineSlabs.push(...approvalData.donationSlabs.map((s: any) => ({ ...s, isOffline: false, category: 'DONATION' })));
            }

            if (approvalData.offlinePoojaRateType === 'CUSTOM') {
                offlineSlabs.push(...approvalData.offlinePoojaSlabs.map((s: any) => ({ ...s, isOffline: true, category: 'POOJA' })));
            }
            if (approvalData.offlineMarketplaceRateType === 'CUSTOM') {
                offlineSlabs.push(...approvalData.offlineMarketplaceSlabs.map((s: any) => ({ ...s, isOffline: true, category: 'MARKETPLACE' })));
            }
            if (approvalData.offlineDonationRateType === 'CUSTOM') {
                offlineSlabs.push(...approvalData.offlineDonationSlabs.map((s: any) => ({ ...s, isOffline: true, category: 'DONATION' })));
            }

            const res = await toggleMandalStatusAdmin(approvalData.id, {
                status: "APPROVED",
                slug: approvalData.slug,
                subdomain: approvalData.subdomain,
                urlType: approvalData.urlType,
                commissionSlabs: [...onlineSlabs, ...offlineSlabs]
            });

            if (res.success) {
                toast({ title: "Success", description: "Mandal verified & approved successfully!" });
                setApprovalModalOpen(false);
                fetchMandals();
            } else {
                toast({ title: "Failed", description: res.message || "Failed to verify mandal", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "An unexpected error occurred", variant: "destructive" });
        } finally {
            setSubmittingApproval(false);
        }
    };

    const handleStatusChange = async (mandal: any, status: string) => {
        if (status === "APPROVED") {
            handleOpenApprovalModal(mandal);
        } else {
            try {
                await toggleMandalStatusAdmin(mandal.id, { status });
                fetchMandals();
            } catch (err) {
                alert("Failed to update status.");
            }
        }
    };

    const downloadTemplate = () => {
        const templateData = [{
            "Name_EN": "Ganesh Mandal",
            "Name_HI": "गणेश मंडल",
            "Name_MR": "गणेश मंडळ",
            "Mandal_Type": "Ganesh",
            "Established_Year": "1990",
            "Contact_Number": "9876543210",
            "Email": "contact@mandal.com",
            "Presiding_Deity": "Lord Ganesha",
            "Festivals": "Ganesh Chaturthi",
            "City": "Mumbai",
            "State": "Maharashtra",
            "Pincode": "400001",
            "Address": "Mumbai central",
            "President_Name": "Rahul Sharma",
            "Registration_No": "REG123456",
            "Status": "APPROVED",
            "Is_Active": "YES"
        }];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mandal Template");
        XLSX.writeFile(wb, "admin_mandal_import_template.xlsx");
    };

    const handleExportExcel = async () => {
        try {
            toast({ title: "Exporting...", description: "Gathering mandal data. Please wait." });
            const res = await fetchAllMandalsAdmin({ page: 1, limit: 10000 });
            const data = (res.data || []) as any[];

            if (!data.length) {
                toast({ title: "No Data", description: "No mandals found to export.", variant: "destructive" });
                return;
            }

            const exportData = data.map(m => ({
                "ID": m.id,
                "Name_EN": getName({ en: m.name?.en || m.name }),
                "Mandal_Type": m.mandalType || "",
                "City": m.city || "",
                "State": m.state || "",
                "Contact": m.contactNumber || "",
                "Email": m.email || "",
                "President": m.presidentName || "",
                "Status": m.status,
                "Is_Active": m.isActive ? "YES" : "NO",
                "Registered_On": new Date(m.createdAt).toLocaleDateString("en-IN")
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Mandals");
            XLSX.writeFile(wb, `mandals_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast({ title: "Success", description: "Export successful" });
        } catch (error) {
            toast({ title: "Export Failed", variant: "destructive" });
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                if (data.length === 0) {
                    toast({ title: "Empty File", variant: "destructive" });
                    return;
                }

                toast({ title: "Import Started", description: `Importing ${data.length} mandals...`, variant: "success" });

                let successCount = 0;
                let failCount = 0;
                const errors: string[] = [];

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    try {
                        if (!row.Name_EN) throw new Error("English name is required");
                        if (!row.Contact_Number) throw new Error("Contact number is required");

                        const formData = new FormData();
                        formData.append('name_en', String(row.Name_EN || "").trim());
                        formData.append('name_hi', String(row.Name_HI || "").trim());
                        formData.append('name_mr', String(row.Name_MR || "").trim());
                        formData.append('mandalType', String(row.Mandal_Type || "").trim());
                        formData.append('establishedYear', String(row.Established_Year || "").trim());
                        formData.append('contactNumber', String(row.Contact_Number).replace(/[^0-9]/g, ''));
                        formData.append('email', String(row.Email || "").trim());
                        formData.append('presiding_deity', String(row.Presiding_Deity || "").trim());
                        formData.append('festivals', String(row.Festivals || "").trim());
                        formData.append('city', String(row.City || "").trim());
                        formData.append('state', String(row.State || "").trim());
                        formData.append('pinCode', String(row.Pincode || "").trim());
                        formData.append('address', String(row.Address || "").trim());
                        formData.append('presidentName', String(row.President_Name || "").trim());
                        formData.append('registrationNumber', String(row.Registration_No || "").trim());
                        
                        const parsedStatus = String(row.Status || "").toUpperCase();
                        formData.append('status', ['PENDING', 'APPROVED', 'REJECTED'].includes(parsedStatus) ? parsedStatus : 'APPROVED');
                        formData.append('isActive', (String(row.Is_Active || "").toUpperCase() === "YES" || row.Is_Active === true) ? "true" : "false");

                        await createMandalAdmin(formData);
                        successCount++;
                    } catch (err: any) {
                        failCount++;
                        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed";
                        errors.push(`Row ${i + 2}: ${errorMsg}`);
                    }
                }

                if (failCount > 0) {
                    toast({
                        title: "Import Partially Failed",
                        description: `Success: ${successCount}, Failed: ${failCount}. Errors: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
                        variant: "destructive"
                    });
                } else {
                    toast({ title: "Import Successful", description: `Successfully imported ${successCount} mandals.` });
                }
                fetchMandals();
            } catch (error) {
                toast({ title: "Import Failed", description: "Failed to parse Excel file", variant: "destructive" });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Mandal Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {pagination.total} mandal{pagination.total !== 1 ? "s" : ""} registered
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={downloadTemplate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Template
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="import-excel"
                            onChange={handleImportExcel}
                        />
                        <button
                            onClick={() => document.getElementById('import-excel')?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
                        >
                            <Upload className="w-4 h-4" /> Import
                        </button>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <Link
                        href="/admin/mandals/create"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Mandal
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, city, state, contact…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    {["ALL", "PENDING", "APPROVED"].map(s => (
                        <button
                            key={s} 
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                statusFilter === s
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">City / State</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registered</th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 8 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-muted animate-pulse rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : mandals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                        No mandals found.
                                    </td>
                                </tr>
                            ) : (
                                mandals.map(m => (
                                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                                            {getName(m.name)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{m.mandalType || "—"}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {[m.city, m.state].filter(Boolean).join(", ") || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{m.contactNumber}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={m.status}
                                                onChange={e => handleStatusChange(m, e.target.value)}
                                                className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[m.status] || "bg-muted text-foreground"}`}
                                            >
                                                {["PENDING", "APPROVED", "REJECTED"].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleToggleActive(m)}
                                                className={`transition-colors ${m.isActive ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground"}`}
                                                title={m.isActive ? "Click to deactivate" : "Click to activate"}
                                            >
                                                {m.isActive
                                                    ? <ToggleRight className="w-6 h-6" />
                                                    : <ToggleLeft className="w-6 h-6" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {new Date(m.createdAt).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenApprovalModal(m)}
                                                    className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                                                    title="Verify / Configure Slabs"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    href={`/admin/mandals/${m.id}`}
                                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/mandals/edit/${m.id}`}
                                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                        <span className="text-xs text-muted-foreground">
                            Page {page} of {pagination.totalPages} · {pagination.total} total
                        </span>
                        <div className="flex gap-1">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-1.5 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={page === pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-1.5 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Approval / Verification Modal */}
            <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Verify Mandal Account</DialogTitle>
                    </DialogHeader>
                    {loadingSlabs ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-medium">Fetching commission slabs & configurations...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {/* URL Configuration Section */}
                            <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">PUBLIC URL CONFIGURATION</label>

                                {/* URL Type Selection */}
                                <div className="flex items-center gap-6 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="urlTypeApprovalMandal"
                                            value="slug"
                                            checked={approvalData.urlType === "slug"}
                                            onChange={e => setApprovalData({ ...approvalData, urlType: e.target.value })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-[13px] font-semibold text-slate-700">Slug</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="urlTypeApprovalMandal"
                                            value="subdomain"
                                            checked={approvalData.urlType === "subdomain"}
                                            onChange={e => setApprovalData({ ...approvalData, urlType: e.target.value })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-[13px] font-semibold text-slate-700">Subdomain</span>
                                    </label>
                                </div>

                                {/* Slug Field */}
                                {approvalData.urlType === "slug" && (
                                    <div className="space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                            <span className="text-[10px] text-muted-foreground bg-white px-2 py-2 rounded-l-md border sm:border-r-0 border-b-0 sm:border-b border-border font-mono whitespace-nowrap hidden sm:block">devbhakti.in/mandals/</span>
                                            <Input
                                                value={approvalData.slug}
                                                onChange={e => {
                                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                    setApprovalData({ ...approvalData, slug: val, subdomain: val });
                                                }}
                                                placeholder="mandal-slug"
                                                className="rounded-l-md sm:rounded-l-none font-mono h-8 text-xs w-full"
                                            />
                                        </div>
                                        <p className="text-[10px] font-mono text-blue-600 truncate">
                                            Preview: https://devbhakti.in/mandals/{approvalData.slug || "---"}
                                        </p>
                                    </div>
                                )}

                                {/* Subdomain Field */}
                                {approvalData.urlType === "subdomain" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                            <Input
                                                value={approvalData.subdomain}
                                                onChange={e => {
                                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                    setApprovalData({ ...approvalData, subdomain: val, slug: val });
                                                }}
                                                placeholder="subdomain"
                                                className="rounded-r-none font-mono h-8 text-xs"
                                            />
                                            <span className="text-[10px] text-muted-foreground bg-white px-2 py-2 rounded-r-md border border-l-0 font-mono">.devbhakti.in</span>
                                        </div>
                                        <p className="text-[10px] font-mono text-blue-600 truncate">
                                            Preview: https://{approvalData.subdomain || "---"}.devbhakti.in
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Slab management - Tabs for Online and Offline */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">COMMISSION SLABS</label>
                                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setApprovalData({ ...approvalData, activeSlabTab: 'online' })}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${approvalData.activeSlabTab !== 'offline' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            🌐 Online Slabs
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setApprovalData({ ...approvalData, activeSlabTab: 'offline' })}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${approvalData.activeSlabTab === 'offline' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            📍 Offline Slabs
                                        </button>
                                    </div>
                                </div>

                                {/* ONLINE SLABS CONTENT */}
                                {approvalData.activeSlabTab !== 'offline' && (
                                    <div className="space-y-4">
                                        {/* Online Pooja */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🕉️ POOJA PLATFORM FEE SLABS</label>
                                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                    <span className={`text-[9px] font-bold ${approvalData.poojaRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                    <Switch
                                                        checked={approvalData.poojaRateType === "CUSTOM"}
                                                        onCheckedChange={(checked) => setApprovalData({ ...approvalData, poojaRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                        className="scale-75"
                                                    />
                                                    <span className={`text-[9px] font-bold ${approvalData.poojaRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                {approvalData.poojaSlabs?.length > 0 ? (
                                                    approvalData.poojaSlabs.map((slab: any, index: number) => (
                                                        <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                                            <div className="text-[11px] font-semibold text-slate-600">
                                                                ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : '∞'}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={slab.platformFee}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.poojaSlabs];
                                                                            newSlabs[index].platformFee = e.target.value;
                                                                            setApprovalData({ ...approvalData, poojaSlabs: newSlabs });
                                                                        }}
                                                                        className="pl-5 h-8 text-xs font-mono"
                                                                        placeholder="Fee"
                                                                        disabled={approvalData.poojaRateType === "DEFAULT"}
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={slab.percentage}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.poojaSlabs];
                                                                            newSlabs[index].percentage = e.target.value;
                                                                            setApprovalData({ ...approvalData, poojaSlabs: newSlabs });
                                                                        }}
                                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                                        placeholder="%"
                                                                        disabled={approvalData.poojaRateType === "DEFAULT"}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Online Pooja slabs defined.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Online Marketplace */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🛍️ MARKETPLACE PLATFORM FEE SLABS</label>
                                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                    <span className={`text-[9px] font-bold ${approvalData.marketplaceRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                    <Switch
                                                        checked={approvalData.marketplaceRateType === "CUSTOM"}
                                                        onCheckedChange={(checked) => setApprovalData({ ...approvalData, marketplaceRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                        className="scale-75"
                                                    />
                                                    <span className={`text-[9px] font-bold ${approvalData.marketplaceRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                {approvalData.marketplaceSlabs?.length > 0 ? (
                                                    approvalData.marketplaceSlabs.map((slab: any, index: number) => (
                                                        <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                                            <div className="text-[11px] font-semibold text-slate-600">
                                                                ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : '∞'}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={slab.platformFee}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.marketplaceSlabs];
                                                                            newSlabs[index].platformFee = e.target.value;
                                                                            setApprovalData({ ...approvalData, marketplaceSlabs: newSlabs });
                                                                        }}
                                                                        className="pl-5 h-8 text-xs font-mono"
                                                                        placeholder="Fee"
                                                                        disabled={approvalData.marketplaceRateType === "DEFAULT"}
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={slab.percentage}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.marketplaceSlabs];
                                                                            newSlabs[index].percentage = e.target.value;
                                                                            setApprovalData({ ...approvalData, marketplaceSlabs: newSlabs });
                                                                        }}
                                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                                        placeholder="%"
                                                                        disabled={approvalData.marketplaceRateType === "DEFAULT"}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Online Marketplace slabs defined.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Online Donation */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">💳 ONLINE DONATION PLATFORM FEE SLABS</label>
                                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                    <span className={`text-[9px] font-bold ${approvalData.donationRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                    <Switch
                                                        checked={approvalData.donationRateType === "CUSTOM"}
                                                        onCheckedChange={(checked) => setApprovalData({ ...approvalData, donationRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                        className="scale-75"
                                                    />
                                                    <span className={`text-[9px] font-bold ${approvalData.donationRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                {approvalData.donationSlabs?.length > 0 ? (
                                                    approvalData.donationSlabs.map((slab: any, index: number) => (
                                                        <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                                            <div className="text-[11px] font-semibold text-slate-600">
                                                                ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : '∞'}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={slab.platformFee}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.donationSlabs];
                                                                            newSlabs[index].platformFee = e.target.value;
                                                                            setApprovalData({ ...approvalData, donationSlabs: newSlabs });
                                                                        }}
                                                                        className="pl-5 h-8 text-xs font-mono"
                                                                        placeholder="Fee"
                                                                        disabled={approvalData.donationRateType === "DEFAULT"}
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={slab.percentage}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.donationSlabs];
                                                                            newSlabs[index].percentage = e.target.value;
                                                                            setApprovalData({ ...approvalData, donationSlabs: newSlabs });
                                                                        }}
                                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                                        placeholder="%"
                                                                        disabled={approvalData.donationRateType === "DEFAULT"}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Online Donation slabs defined.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* OFFLINE SLABS CONTENT */}
                                {approvalData.activeSlabTab === 'offline' && (
                                    <div className="space-y-4">
                                        {/* Offline Pooja */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🕉️ OFFLINE POOJA PLATFORM FEE SLABS</label>
                                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                    <span className={`text-[9px] font-bold ${approvalData.offlinePoojaRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                    <Switch
                                                        checked={approvalData.offlinePoojaRateType === "CUSTOM"}
                                                        onCheckedChange={(checked) => setApprovalData({ ...approvalData, offlinePoojaRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                        className="scale-75"
                                                    />
                                                    <span className={`text-[9px] font-bold ${approvalData.offlinePoojaRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                {approvalData.offlinePoojaSlabs?.length > 0 ? (
                                                    approvalData.offlinePoojaSlabs.map((slab: any, index: number) => (
                                                        <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                                            <div className="text-[11px] font-semibold text-slate-600">
                                                                ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : '∞'}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={slab.platformFee}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.offlinePoojaSlabs];
                                                                            newSlabs[index].platformFee = e.target.value;
                                                                            setApprovalData({ ...approvalData, offlinePoojaSlabs: newSlabs });
                                                                        }}
                                                                        className="pl-5 h-8 text-xs font-mono"
                                                                        placeholder="Fee"
                                                                        disabled={approvalData.offlinePoojaRateType === "DEFAULT"}
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={slab.percentage}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.offlinePoojaSlabs];
                                                                            newSlabs[index].percentage = e.target.value;
                                                                            setApprovalData({ ...approvalData, offlinePoojaSlabs: newSlabs });
                                                                        }}
                                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                                        placeholder="%"
                                                                        disabled={approvalData.offlinePoojaRateType === "DEFAULT"}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Offline Pooja slabs defined.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Offline Marketplace */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🛍️ OFFLINE MARKETPLACE PLATFORM FEE SLABS</label>
                                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                    <span className={`text-[9px] font-bold ${approvalData.offlineMarketplaceRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                    <Switch
                                                        checked={approvalData.offlineMarketplaceRateType === "CUSTOM"}
                                                        onCheckedChange={(checked) => setApprovalData({ ...approvalData, offlineMarketplaceRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                        className="scale-75"
                                                    />
                                                    <span className={`text-[9px] font-bold ${approvalData.offlineMarketplaceRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                {approvalData.offlineMarketplaceSlabs?.length > 0 ? (
                                                    approvalData.offlineMarketplaceSlabs.map((slab: any, index: number) => (
                                                        <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                                            <div className="text-[11px] font-semibold text-slate-600">
                                                                ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : '∞'}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={slab.platformFee}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.offlineMarketplaceSlabs];
                                                                            newSlabs[index].platformFee = e.target.value;
                                                                            setApprovalData({ ...approvalData, offlineMarketplaceSlabs: newSlabs });
                                                                        }}
                                                                        className="pl-5 h-8 text-xs font-mono"
                                                                        placeholder="Fee"
                                                                        disabled={approvalData.offlineMarketplaceRateType === "DEFAULT"}
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={slab.percentage}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.offlineMarketplaceSlabs];
                                                                            newSlabs[index].percentage = e.target.value;
                                                                            setApprovalData({ ...approvalData, offlineMarketplaceSlabs: newSlabs });
                                                                        }}
                                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                                        placeholder="%"
                                                                        disabled={approvalData.offlineMarketplaceRateType === "DEFAULT"}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Offline Marketplace slabs defined.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Offline Donation */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">💳 OFFLINE DONATION PLATFORM FEE SLABS</label>
                                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                    <span className={`text-[9px] font-bold ${approvalData.offlineDonationRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                    <Switch
                                                        checked={approvalData.offlineDonationRateType === "CUSTOM"}
                                                        onCheckedChange={(checked) => setApprovalData({ ...approvalData, offlineDonationRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                        className="scale-75"
                                                    />
                                                    <span className={`text-[9px] font-bold ${approvalData.offlineDonationRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                {approvalData.offlineDonationSlabs?.length > 0 ? (
                                                    approvalData.offlineDonationSlabs.map((slab: any, index: number) => (
                                                        <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                                                            <div className="text-[11px] font-semibold text-slate-600">
                                                                ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : '∞'}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={slab.platformFee}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.offlineDonationSlabs];
                                                                            newSlabs[index].platformFee = e.target.value;
                                                                            setApprovalData({ ...approvalData, offlineDonationSlabs: newSlabs });
                                                                        }}
                                                                        className="pl-5 h-8 text-xs font-mono"
                                                                        placeholder="Fee"
                                                                        disabled={approvalData.offlineDonationRateType === "DEFAULT"}
                                                                    />
                                                                </div>
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={slab.percentage}
                                                                        onChange={(e) => {
                                                                            const newSlabs = [...approvalData.offlineDonationSlabs];
                                                                            newSlabs[index].percentage = e.target.value;
                                                                            setApprovalData({ ...approvalData, offlineDonationSlabs: newSlabs });
                                                                        }}
                                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                                        placeholder="%"
                                                                        disabled={approvalData.offlineDonationRateType === "DEFAULT"}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Offline Donation slabs defined.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>This will verify the mandal account and save the configured online and offline settings. Active status remains controlled by the separate Active toggle.</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setApprovalModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleConfirmApproval}
                            disabled={submittingApproval || loadingSlabs}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
                        >
                            {submittingApproval && <Loader2 className="w-4 h-4 animate-spin" />}
                            Verify Mandal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

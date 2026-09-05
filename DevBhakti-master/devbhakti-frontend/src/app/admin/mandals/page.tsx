"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search, Plus, Trash2, Edit, Eye, ToggleLeft, ToggleRight,
    ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Filter,
    Download, Upload, FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";
import { fetchAllMandalsAdmin, deleteMandalAdmin, toggleMandalStatusAdmin, createMandalAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";

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
    const [mandals, setMandals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const limit = 15;

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

    const { toast } = useToast();

    const handleToggleActive = async (mandal: any) => {
        try {
            await toggleMandalStatusAdmin(mandal.id, { isActive: !mandal.isActive });
            fetchMandals();
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    const handleStatusChange = async (mandal: any, status: string) => {
        try {
            await toggleMandalStatusAdmin(mandal.id, { status });
            fetchMandals();
        } catch (err) {
            alert("Failed to update status.");
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
                        
                        // Status & Active state
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
        </div>
    );
}

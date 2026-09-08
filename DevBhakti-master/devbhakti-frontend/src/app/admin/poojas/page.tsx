"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Eye,
    Clock,
    IndianRupee,
    Download,
    Upload,
    FileSpreadsheet,
    Filter,
    Loader2,
    LayoutTemplate,
    Home,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    fetchAllPoojasAdmin, 
    deletePoojaAdmin, 
    promotePoojaToMasterAdmin, 
    updatePoojaAdmin, 
    togglePoojaStatusAdmin,
    fetchAllTemplesAdmin,
    createPoojaAdmin
} from "@/api/adminController";
import { Pause, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { parseLocalizedValue } from "@/utils/textUtils";

function PoojasContent() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");
    const qParam = searchParams.get("q");

    const router = useRouter();
    const [poojas, setPoojas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    // CHANGED: Added 'mandal' tab option
    const [activeTab, setActiveTab] = useState<'templates' | 'platform' | 'temple' | 'mandal'>('templates');
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();

    // New states for Filter & Import/Export
    const [temples, setTemples] = useState<any[]>([]);
    const [selectedTempleId, setSelectedTempleId] = useState<string>("all");
    const [mandals, setMandals] = useState<any[]>([]);
    const [selectedMandalId, setSelectedMandalId] = useState<string>("all");
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });


    useEffect(() => {
        loadTemples();
        loadMandals();
    }, []);

    useEffect(() => {
        if (qParam) setSearchTerm(qParam);
        else if (idParam) setSearchTerm(idParam);
    }, [idParam, qParam]);

    useEffect(() => {
        loadPoojas();
    }, [activeTab, searchTerm, selectedTempleId, selectedMandalId]);

    const loadTemples = async () => {
        try {
            const data = await fetchAllTemplesAdmin({ isVerified: true, isActive: true });
            const actualTemples = data
                .filter((user: any) => user.temple)
                .map((user: any) => user.temple);
            setTemples(actualTemples);
        } catch (error) {
            console.error("Failed to load temples", error);
        }
    };

    const loadMandals = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/mandals`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setMandals(data);
            } else if (data.data && Array.isArray(data.data)) {
                setMandals(data.data);
            }
        } catch (error) {
            console.error("Failed to load mandals", error);
        }
    };

    const loadPoojas = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                search: searchTerm,
                poojaId: idParam || undefined,
                lang: 'raw'
            };
            
            // CHANGED: Updated tab logic
            if (activeTab === 'templates') {
                // Only master templates (blueprints)
                params.isMaster = true;
                params.templeId = 'null';
                params.mandalId = 'null';
            }
            else if (activeTab === 'platform') {
                // Platform poojas: isMaster = false, templeId = null, mandalId = null
                params.isMaster = false;
                params.templeId = 'null';
                params.mandalId = 'null';
            }
            else if (activeTab === 'temple') {
                // Temple poojas: isMaster = false, templeId != null
                params.isMaster = false;
                params.mandalId = 'null';
                if (selectedTempleId !== "all") {
                    params.templeId = selectedTempleId;
                } else {
                    params.templeId = 'not_null';
                }
            }
            else if (activeTab === 'mandal') {
                // Mandal poojas: isMaster = false, mandalId != null
                params.isMaster = false;
                params.templeId = 'null';
                if (selectedMandalId !== "all") {
                    params.mandalId = selectedMandalId;
                } else {
                    params.mandalId = 'not_null';
                }
            }

            const data = await fetchAllPoojasAdmin(params);
            setPoojas(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load poojas",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromoteToMaster = async (id: string) => {
        if (!window.confirm("Are you sure you want to promote this pooja to a Master Template?")) return;

        try {
            await promotePoojaToMasterAdmin(id);
            toast({
                title: "Success",
                description: "Pooja promoted to Master Template",
                variant: "success",
            });
            loadPoojas();
        } catch (error: any) {
            toast({
                title: "Promotion Failed",
                description: error.response?.data?.error || error.response?.data?.message || "Failed to promote pooja to master",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this pooja?")) {
            try {
                await deletePoojaAdmin(id);
                toast({ title: "Success", description: "Pooja deleted successfully", variant: "success" });
                loadPoojas();
            } catch (error: any) {
                toast({
                    title: "Action Failed",
                    description: error.response?.data?.error || error.response?.data?.message || "Failed to delete pooja",
                    variant: "destructive"
                });
            }
        }
    };

    const handleToggleStatus = async (pooja: any) => {
        // Block activation if pooja has no image
        if (!pooja.status && (!pooja.image || pooja.image.trim() === '')) {
            toast({
                title: "⚠️ Image Required",
                description: "Image is required. Please upload a pooja image before activating it.",
                variant: "destructive"
            });
            return;
        }
        try {
            await togglePoojaStatusAdmin(pooja.id);
            toast({
                title: !pooja.status ? "Pooja Resumed" : "Pooja Paused",
                description: `Pooja is now ${!pooja.status ? 'visible to' : 'hidden from'} devotees.`,
                variant: "success",
            });
            loadPoojas();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update pooja status",
                variant: "destructive"
            });
        }
    };


    const filteredPoojas = poojas.filter(pooja => {
        const s = searchTerm.toLowerCase();
        
        const matchesField = (field: any) => {
            if (!field) return false;
            if (typeof field === 'string') return field.toLowerCase().includes(s);
            if (typeof field === 'object') {
                return (field.en?.toLowerCase().includes(s) || 
                        field.hi?.toLowerCase().includes(s) || 
                        field.mr?.toLowerCase().includes(s));
            }
            return false;
        };

        return matchesField(pooja.name) || matchesField(pooja.category);
    });

    const getImageUrl = (path: string) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const getRawLangValue = (val: any, lang: 'en'|'hi'|'mr') => {
        if (!val) return "";
        if (typeof val === 'object') return val[lang] || "";
        try {
            const p = JSON.parse(val);
            if (typeof p === 'object' && p !== null) return p[lang] || "";
        } catch { }
        return lang === 'en' ? val : "";
    };

    // --- Excel Helper Functions ---

    const downloadTemplate = () => {
        const template = [
            {
                "Name_EN": "Maha Mrityunjaya Pooja",
                "Name_HI": "महा मृत्युंजय पूजा",
                "Name_MR": "महा मृत्युंजय पूजा",
                "Price": 1100,
                "Temple_ID": "TEMPLE_ID_HERE",
                "Category_ID": "CAT_ID_HERE",
                "Category_Name_EN": "Spiritual",
                "Category_Name_HI": "आध्यात्मिक",
                "Category_Name_MR": "आध्यात्मिक",
                "Is_Master": "NO",
                "About_EN": "Powerful pooja for health and longevity.",
                "About_HI": "स्वास्थ्य और दीर्घायु के लिए शक्तिशाली पूजा।",
                "About_MR": "आरोग्य आणि दीर्घायुष्यासाठी शक्तिशाली पूजा.",
                "Packages": '[]',
                "FAQs": '{"en":[], "hi":[], "mr":[]}',
                "Slug": "maha-mrityunjaya-pooja",
                "Image_URL": "https://example.com/image.jpg"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pooja Template");
        XLSX.writeFile(wb, "Pooja_Import_Template.xlsx");
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
                    toast({ title: "Empty File", description: "No records found", variant: "destructive" });
                    return;
                }

                setIsImporting(true);
                setImportProgress({ total: data.length, current: 0, success: 0, failed: 0 });
                toast({ title: "Import Started", description: `Processing ${data.length} poojas...`, variant: "success" });
                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    setImportProgress(p => ({ ...p, current: i + 1 }));

                    try {
                        // --- 1. VALIDATION ---
                        const name_en = String(row.Name_EN || "").trim();
                        const priceRaw = String(row.Price || "");
                        const time = String(row.Time || "Anytime").trim(); // Default to "Anytime"
                        const isMaster = (String(row.Is_Master || "").toUpperCase() === "YES");
                        const templeId = String(row.Temple_ID || "").trim();

                        if (!name_en) throw new Error("English Name is required");
                        if (!priceRaw) throw new Error("Price is required");
                        // Time check removed as requested
                        
                        if (!isMaster && (!templeId || templeId === "TEMPLE_ID_HERE" || templeId === "")) {
                            throw new Error("Temple_ID is required for non-master poojas");
                        }

                        // --- 2. SANITIZATION ---
                        const price = parseFloat(priceRaw.replace(/[^0-9.]/g, ""));
                        if (isNaN(price)) throw new Error("Invalid Price format");

                        const categoryIdRaw = String(row.Category_ID || "").trim();
                        const categoryId = (categoryIdRaw === "CAT_ID_HERE" || categoryIdRaw === "" || categoryIdRaw === "null") ? null : categoryIdRaw;

                        const fd = new FormData();
                        
                        // Basic Fields
                        fd.append("price", String(price));
                        fd.append("time", "Anytime"); // Default since it's required in DB
                        fd.append("slug", String(row.Slug || "").trim());
                        fd.append("isMaster", isMaster.toString());
                        fd.append("templeId", isMaster ? "null" : templeId);
                        fd.append("categoryId", categoryId || "null");
                        fd.append("category_en", String(row.Category_Name_EN || "").trim());
                        fd.append("category_hi", String(row.Category_Name_HI || "").trim());
                        fd.append("category_mr", String(row.Category_Name_MR || "").trim());

                        // Localized Names
                        fd.append("name_en", name_en);
                        fd.append("name_hi", String(row.Name_HI || "").trim());
                        fd.append("name_mr", String(row.Name_MR || "").trim());

                        // Localized About
                        fd.append("about_en", String(row.About_EN || "").trim());
                        fd.append("about_hi", String(row.About_HI || "").trim());
                        fd.append("about_mr", String(row.About_MR || "").trim());

                        // Defaults for complex fields
                        fd.append("packages", JSON.stringify({ en: [], hi: [], mr: [] }));
                        fd.append("faqs", JSON.stringify({ en: [], hi: [], mr: [] }));
                        fd.append("categoryIds", JSON.stringify(row.Category_ID ? [row.Category_ID] : []));

                        if (row.Image_URL) fd.append("image_url", String(row.Image_URL));

                        await createPoojaAdmin(fd);
                        successCount++;
                    } catch (err: any) {
                        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Unknown error";
                        console.error(`Failed row ${i + 2}:`, errorMsg);
                        failCount++;
                        toast({
                            title: `Error in Row ${i + 2}`,
                            description: errorMsg,
                            variant: "destructive"
                        });
                    }
                }

                setImportProgress(p => ({ ...p, success: successCount, failed: failCount }));
                toast({ title: "Import Done", description: `Success: ${successCount}, Failed: ${failCount}`, variant: "success" });
                loadPoojas();
            } catch (error) {
                toast({ title: "Import Error", description: "Failed to process file", variant: "destructive" });
            } finally {
                setIsImporting(false);
                if (e.target) e.target.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleExportExcel = () => {
        const exportData = poojas.map(p => ({
            "ID": p.id,
            "Name_EN": getRawLangValue(p.name, 'en'),
            "Name_HI": getRawLangValue(p.name, 'hi'),
            "Name_MR": getRawLangValue(p.name, 'mr'),
            "Price": p.price,
            "Temple_ID": p.templeId,
            "Temple_Name": parseLocalizedValue(p.temple?.name),
            "Category": parseLocalizedValue(p.category),
            "Category_Name_EN": getRawLangValue(p.category, 'en'),
            "Category_Name_HI": getRawLangValue(p.category, 'hi'),
            "Category_Name_MR": getRawLangValue(p.category, 'mr'),
            "Is_Master": p.isMaster ? "YES" : "NO",
            "Status": p.status ? "ACTIVE" : "PAUSED",
            "Slug": p.slug,
            
            // Localized About
            "About_EN": getRawLangValue(p.about, 'en'),
            "About_HI": getRawLangValue(p.about, 'hi'),
            "About_MR": getRawLangValue(p.about, 'mr'),

            // Complex Objects
            "Packages": JSON.stringify(p.packages || { en: [], hi: [], mr: [] }),
            "FAQs": JSON.stringify(p.faqs || { en: [], hi: [], mr: [] }),
            "Image_URL": p.image
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Poojas");
        XLSX.writeFile(wb, `Poojas_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">Poojas & Sevas Management</h1>
                    <p className="text-xs md:text-[14px] text-muted-foreground mt-1">
                        Manage all poojas, rituals, and spiritual services.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={downloadTemplate}
                        className="text-xs h-9"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Template
                    </Button>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImportExcel}
                            disabled={isImporting}
                        />
                        <Button
                            variant="outline"
                            className="text-xs h-9"
                            disabled={isImporting}
                        >
                            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            Import Excel
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="text-xs h-9"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export All
                    </Button>

                    {hasPermission("poojas.create") && (
                        <Button
                            onClick={() => router.push('/admin/poojas/create')}
                            className="bg-primary hover:bg-primary/90 px-4 py-2 text-sm h-9"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Pooja
                        </Button>
                    )}
                </div>
            </div>

            {/* Import Progress */}
            {isImporting && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-blue-900">Importing Poojas...</span>
                        <span className="text-xs font-bold text-blue-700">{importProgress.current} / {importProgress.total}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                    </div>
                    <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-green-600">Success: {importProgress.success}</span>
                        <span className="text-red-600">Failed: {importProgress.failed}</span>
                    </div>
                </div>
            )}

            {/* CHANGED: Updated Tabs */}
            <div className="flex flex-col sm:flex-row border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === 'templates'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <LayoutTemplate className="w-4 h-4" />
                    <span className="hidden sm:inline">Templates</span>
                    <span className="sm:hidden">Templates</span>
                </button>
                
                <button
                    onClick={() => setActiveTab('platform')}
                    className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === 'platform'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Platform Poojas</span>
                    <span className="sm:hidden">Platform</span>
                </button>
                
                <button
                    onClick={() => setActiveTab('temple')}
                    className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === 'temple'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Temple Poojas</span>
                    <span className="sm:hidden">Temple</span>
                </button>

                <button
                    onClick={() => setActiveTab('mandal')}
                    className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === 'mandal'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Mandal Poojas</span>
                    <span className="sm:hidden">Mandal</span>
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or category..."
                        className="pl-10 h-10 md:h-11 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Show temple filter for temple poojas tab */}
                {activeTab === 'temple' && (
                    <div className="flex items-center gap-2">
                        <div className="relative w-full lg:w-64">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                className="w-full pl-10 pr-4 h-10 md:h-11 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                                value={selectedTempleId}
                                onChange={(e) => setSelectedTempleId(e.target.value)}
                            >
                                <option value="all">All Temples</option>
                                {temples.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {parseLocalizedValue(t.name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Show mandal filter for mandal poojas tab */}
                {activeTab === 'mandal' && (
                    <div className="flex items-center gap-2">
                        <div className="relative w-full lg:w-64">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                className="w-full pl-10 pr-4 h-10 md:h-11 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                                value={selectedMandalId}
                                onChange={(e) => setSelectedMandalId(e.target.value)}
                            >
                                <option value="all">All Mandals</option>
                                {mandals.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {parseLocalizedValue(m.name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Card for each tab */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                {activeTab === 'templates' && (
                    <p className="text-sm text-slate-600">
                        📋 <strong>Master Templates:</strong> These are blueprints that can be used to create Platform, Temple, and Mandal poojas. 
                        Templates are not directly bookable by users.
                    </p>
                )}
                {activeTab === 'platform' && (
                    <p className="text-sm text-slate-600">
                        🏠 <strong>Platform Poojas:</strong> These are DevBhakti's own poojas created from master templates. 
                        Users can book these poojas directly.
                    </p>
                )}
                {activeTab === 'temple' && (
                    <p className="text-sm text-slate-600">
                        🛕 <strong>Temple Poojas:</strong> These are temple-specific poojas created from master templates. 
                        Each temple has its own customized poojas.
                    </p>
                )}
                {activeTab === 'mandal' && (
                    <p className="text-sm text-slate-600">
                        🚩 <strong>Mandal Poojas:</strong> These are mandal-specific poojas created for mandals/pandals. 
                        Each mandal has its own customized poojas.
                    </p>
                )}
            </div>

            {/* Poojas Table */}
            <div className="border rounded-lg bg-card overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>English Name</TableHead>
                                <TableHead>हिंदी</TableHead>
                                <TableHead>मराठी</TableHead>
                                <TableHead>{activeTab === 'mandal' ? 'Mandal' : 'Temple'}</TableHead>
                                <TableHead>Category/Purpose</TableHead>
                                <TableHead>Single Person Price</TableHead>
                                <TableHead>Status</TableHead>
                                {/* <TableHead>Duration</TableHead> */}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10">Loading poojas...</TableCell>
                                </TableRow>
                            ) : filteredPoojas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10">
                                        {activeTab === 'templates' && 'No templates found. Create your first template by clicking "Add New".'}
                                        {activeTab === 'platform' && 'No platform poojas found. Create from templates.'}
                                        {activeTab === 'temple' && 'No temple poojas found.'}
                                        {activeTab === 'mandal' && 'No mandal poojas found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPoojas.map((pooja) => (
                                    <TableRow key={pooja.id}>
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border">
                                                <img
                                                    src={getImageUrl(pooja.image)}
                                                    alt={parseLocalizedValue(pooja.name)}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                                {getRawLangValue(pooja.name, 'en') || parseLocalizedValue(pooja.name)}
                                                {/* CHANGED: Updated badges */}
                                                {pooja.isMaster ? (
                                                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] scale-90">
                                                        📋 TEMPLATE
                                                    </Badge>
                                                ) : pooja.mandalId ? (
                                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] scale-90">
                                                        🚩 MANDAL
                                                    </Badge>
                                                ) : pooja.templeId === null ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] scale-90">
                                                        🏠 PLATFORM
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-[10px] scale-90">
                                                        🛕 TEMPLE
                                                    </Badge>
                                                )}
                                            </div>
                                            {/* Show template source for non-master poojas */}
                                            {!pooja.isMaster && pooja.masterPoojaId && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    From template: {parseLocalizedValue(pooja.masterPooja?.name)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[14px] text-slate-600">
                                                {getRawLangValue(pooja.name, 'hi') || <span className="text-slate-300 italic text-xs">not set</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[14px] text-slate-600">
                                                {getRawLangValue(pooja.name, 'mr') || <span className="text-slate-300 italic text-xs">not set</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[14px] font-medium text-slate-600">
                                                {pooja.isMaster ? '—' : (parseLocalizedValue(pooja.mandal?.name || pooja.temple?.name) || '-')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50">
                                                {parseLocalizedValue(pooja.category)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center font-semibold text-primary text-[14px]">
                                                <IndianRupee className="w-3 h-3 mr-0.5" />
                                                {pooja.price}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={pooja.status ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}>
                                                {pooja.status ? "Active" : "Paused"}
                                            </Badge>
                                        </TableCell>
                                        {/* <TableCell>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                {pooja.duration}
                                            </div>
                                        </TableCell> */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/admin/poojas/${pooja.id}`)}
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4 text-slate-600" />
                                                </Button>
                                                {hasPermission("poojas.promote") && !pooja.isMaster && !pooja.masterPoojaId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handlePromoteToMaster(pooja.id)}
                                                        title="Promote to Master Template"
                                                    >
                                                        <Plus className="w-4 h-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {hasPermission("poojas.edit") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/admin/poojas/edit/${pooja.id}`)}
                                                        title="Edit Pooja"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                )}
                                                {hasPermission("poojas.edit") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggleStatus(pooja)}
                                                        title={pooja.status ? "Pause Pooja" : "Resume Pooja"}
                                                    >
                                                        {pooja.status ? (
                                                            <Pause className="w-4 h-4 text-orange-600" />
                                                        ) : (
                                                            <Play className="w-4 h-4 text-green-600" />
                                                        )}
                                                    </Button>
                                                )}
                                                {hasPermission("poojas.delete") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(pooja.id)}
                                                        title="Delete Pooja"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-3 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                                <p className="text-muted-foreground">Loading poojas...</p>
                            </div>
                        </div>
                    ) : filteredPoojas.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            {activeTab === 'templates' && 'No templates found.'}
                            {activeTab === 'platform' && 'No platform poojas found.'}
                            {activeTab === 'temple' && 'No temple poojas found.'}
                        </div>
                    ) : (
                        filteredPoojas.map((pooja) => (
                            <div key={pooja.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 hover:border-primary/30 transition-all">
                                {/* Header with Image and Name */}
                                <div className="flex items-start gap-3">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border flex-shrink-0">
                                        <img
                                            src={getImageUrl(pooja.image)}
                                            alt={parseLocalizedValue(pooja.name)}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-semibold text-slate-900 truncate text-sm">
                                                {getRawLangValue(pooja.name, 'en') || parseLocalizedValue(pooja.name)}
                                            </h3>
                                            {/* CHANGED: Updated badges */}
                                            {pooja.isMaster ? (
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] scale-90">
                                                    📋 TEMPLATE
                                                </Badge>
                                            ) : pooja.templeId === null ? (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] scale-90">
                                                    🏠 PLATFORM
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-[9px] scale-90">
                                                    🛕 TEMPLE
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-600 space-y-1">
                                            <div className="truncate">{getRawLangValue(pooja.name, 'hi') || <span className="text-slate-300 italic">not set</span>}</div>
                                            <div className="truncate">{getRawLangValue(pooja.name, 'mr') || <span className="text-slate-300 italic">not set</span>}</div>
                                        </div>
                                        {!pooja.isMaster && pooja.masterPoojaId && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                From: {parseLocalizedValue(pooja.masterPooja?.name)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-slate-400 font-medium mb-1">Temple</p>
                                        <p className="text-slate-700 truncate">
                                            {pooja.isMaster ? '—' : (parseLocalizedValue(pooja.temple?.name) || 'N/A')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-medium mb-1">Category</p>
                                        <Badge variant="outline" className="bg-slate-50 text-xs px-2 py-0.5">
                                            {parseLocalizedValue(pooja.category)}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-medium mb-1">Price</p>
                                        <div className="flex items-center font-semibold text-primary">
                                            <IndianRupee className="w-3 h-3 mr-0.5" />
                                            {pooja.price}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-medium mb-1">Status</p>
                                        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${pooja.status ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                                            {pooja.status ? "Active" : "Paused"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/admin/poojas/${pooja.id}`)}
                                            className="h-8 px-2 text-xs"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            View
                                        </Button>
                                        {hasPermission("poojas.edit") && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/poojas/edit/${pooja.id}`)}
                                                className="h-8 px-2 text-xs"
                                            >
                                                <Edit2 className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {hasPermission("poojas.promote") && !pooja.isMaster && !pooja.masterPoojaId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePromoteToMaster(pooja.id)}
                                                className="h-8 px-2 text-xs text-green-600"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        )}
                                        {hasPermission("poojas.edit") && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(pooja)}
                                                className={`h-8 px-2 text-xs ${pooja.status ? "text-orange-600" : "text-green-600"}`}
                                            >
                                                {pooja.status ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                            </Button>
                                        )}
                                        {hasPermission("poojas.delete") && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(pooja.id)}
                                                className="h-8 px-2 text-xs text-destructive"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminPoojasListPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading Poojas...</div>}>
            <PoojasContent />
        </Suspense>
    );
}
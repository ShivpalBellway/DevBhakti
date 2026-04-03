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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchAllPoojasAdmin, deletePoojaAdmin, promotePoojaToMasterAdmin, updatePoojaAdmin, togglePoojaStatusAdmin } from "@/api/adminController";
import { Pause, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";

function PoojasContent() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");
    const qParam = searchParams.get("q");

    const router = useRouter();
    const [poojas, setPoojas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'master' | 'temple'>('all');
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();


    useEffect(() => {
        if (qParam) setSearchTerm(qParam);
        else if (idParam) setSearchTerm(idParam);
    }, [idParam, qParam]);

    useEffect(() => {
        loadPoojas();
    }, [activeTab, searchTerm]);

    const loadPoojas = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                search: searchTerm,
                poojaId: idParam || undefined
            };
            if (activeTab === 'master') params.isMaster = true;
            if (activeTab === 'temple') params.isMaster = false;

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
            });
            loadPoojas();
        } catch (error) {
            toast({
                title: "Promotion Failed",
                description: "Failed to promote pooja to master",
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
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete pooja",
                    variant: "destructive"
                });
            }
        }
    };

    const handleToggleStatus = async (pooja: any) => {
        try {
            await togglePoojaStatusAdmin(pooja.id);
            toast({
                title: !pooja.status ? "Pooja Resumed" : "Pooja Paused",
                description: `Pooja is now ${!pooja.status ? 'visible to' : 'hidden from'} devotees.`,
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

    const filteredPoojas = poojas.filter(pooja =>
        (pooja.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pooja.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    );

    const getImageUrl = (path: string) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Poojas & Sevas Management</h1>
                    <p className="text-[14px] text-dark-foreground">
                        Manage all poojas, rituals, and spiritual services.
                    </p>
                </div>
                {hasPermission("poojas.create") && (
                    <Button
                        onClick={() => router.push('/admin/poojas/create')}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Pooja
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'all'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Poojas & Sevas Management
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'master'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {/* Master Templates */}
                    Non Temple Specific
                </button>
                <button
                    onClick={() => setActiveTab('temple')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'temple'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Temple Specific
                </button>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or category..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Poojas Table */}
            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Pooja Name</TableHead>
                            <TableHead>Temple</TableHead>
                            <TableHead>Category/Purpose</TableHead>
                            <TableHead> Single Person Price</TableHead>
                            <TableHead>Status</TableHead>
                            {/* <TableHead>Duration</TableHead> */}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">Loading poojas...</TableCell>
                            </TableRow>
                        ) : filteredPoojas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">No poojas found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredPoojas.map((pooja) => (
                                <TableRow key={pooja.id}>
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border">
                                            <img
                                                src={getImageUrl(pooja.image)}
                                                alt={pooja.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900 flex items-center gap-2">
                                            {pooja.name}
                                            {pooja.isMaster && (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] scale-90">
                                                    MASTER
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-[14px] text-slate-900 line-clamp-1 max-w-[200px]">
                                            {pooja.about || (pooja.description && pooja.description[0])}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-[14px] font-medium text-slate-600">{pooja.temple?.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50">
                                            {pooja.category}
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
                                            {hasPermission("poojas.edit") && !pooja.isMaster && !pooja.masterPoojaId && (
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

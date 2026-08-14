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
    Pause,
    Play,
    Trash2,
    Download,
    Upload,
    Loader2,
    FileText
} from "lucide-react";
import * as XLSX from 'xlsx';
import { createMandalPooja } from "@/api/mandalAdminController";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fetchMyMandalPoojas, deleteMandalPooja, toggleMandalPoojaStatus } from "@/api/mandalAdminController";
import { fetchPoojaCategories } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { API_URL } from "@/config/apiConfig";
import { parseLocalizedValue, stripHtml } from '@/utils/textUtils';

export default function MandalPoojasListPage() {
    const router = useRouter();
    const [poojas, setPoojas] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();

    useEffect(() => {
        loadPoojas();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await fetchPoojaCategories();
            if (res && res.data) {
                setCategories(res.data);
            }
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const loadPoojas = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyMandalPoojas();
            setPoojas(response.data || response || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load your poojas",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this pooja?")) {
            try {
                await deleteMandalPooja(id);
                toast({ title: "Success", description: "Pooja deleted successfully" });
                loadPoojas();
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to delete pooja",
                    variant: "destructive"
                });
            }
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await toggleMandalPoojaStatus(id);
            toast({
                title: currentStatus ? "Pooja Paused" : "Pooja Resumed",
                description: `Pooja is now ${currentStatus ? 'hidden from' : 'visible to'} devotees.`,
            });
            loadPoojas();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive"
            });
        }
    };

    const filteredPoojas = poojas.filter(pooja => {
        const matchesSearch = parseLocalizedValue(pooja.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                              parseLocalizedValue(pooja.category).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || parseLocalizedValue(pooja.category) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getImageUrl = (path: string) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

    const handleExportExcel = () => {
        const exportData = poojas.map(p => ({
            "ID": p.id,
            "Name_EN": p.name?.en || p.name || "",
            "Name_HI": p.name?.hi || "",
            "Name_MR": p.name?.mr || "",
            "Price": p.price,
            "Category": p.category?.en || p.category || "",
            "Time": p.time || "",
            "Status": p.status ? "TRUE" : "FALSE",
            "About_EN": p.about?.en || p.about || "",
            "About_HI": p.about?.hi || "",
            "About_MR": p.about?.mr || "",
            "Created_At": p.createdAt
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "My Poojas");
        XLSX.writeFile(wb, `My_Poojas_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6 px-2 sm:px-0">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">My Poojas</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Manage your mandal's rituals and offerings.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                    {hasPermission('poojas.create') && (
                        <Button
                            onClick={() => router.push('/mandals/dashboard/poojas/create')}
                            className="bg-[#7b4623] hover:bg-[#5d351a] text-white flex-1 md:flex-initial"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Pooja
                        </Button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search your poojas..."
                        className="pl-10 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="flex h-10 w-full md:w-[250px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="focus:bg-[#7b4623]/10 focus:text-[#7b4623]">
                            All Categories
                        </SelectItem>
                        {categories.map((cat) => (
                            <SelectItem 
                                key={cat.id} 
                                value={parseLocalizedValue(cat.name)}
                                className="focus:bg-[#7b4623]/10 focus:text-[#7b4623]"
                            >
                                {parseLocalizedValue(cat.name)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Poojas Table Container */}
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[80px] whitespace-nowrap">Image</TableHead>
                                <TableHead className="whitespace-nowrap">Pooja Name</TableHead>
                                <TableHead className="whitespace-nowrap">Category/Purpose</TableHead>
                                <TableHead className="whitespace-nowrap">Single Person Price</TableHead>
                                <TableHead className="whitespace-nowrap">Status</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm text-muted-foreground">Loading your poojas...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPoojas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <div className="text-muted-foreground px-4">No poojas found. Start by offering a new pooja!</div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPoojas.map((pooja) => (
                                    <TableRow key={pooja.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="whitespace-nowrap">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                                                <img
                                                    src={getImageUrl(pooja.image)}
                                                    alt={parseLocalizedValue(pooja.name)}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="font-semibold text-slate-900">{parseLocalizedValue(pooja.name)}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] sm:max-w-[250px]">
                                                {stripHtml(parseLocalizedValue(pooja.about)) || (pooja.description && stripHtml(pooja.description[0]))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">
                                                {parseLocalizedValue(pooja.category)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center font-bold text-slate-900">
                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                {pooja.price}
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <Badge className={pooja.status ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} variant="outline">
                                                {pooja.status ? 'Active' : 'Paused'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-1 sm:gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/mandals/dashboard/poojas/${pooja.id}`)}
                                                    className="hover:bg-blue-50 hover:text-blue-600"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                
                                                {hasPermission('poojas.edit') && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => router.push(`/mandals/dashboard/poojas/edit/${pooja.id}`)}
                                                            className="hover:bg-blue-50 hover:text-blue-600"
                                                            title="Edit Pooja"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleToggleStatus(pooja.id, pooja.status)}
                                                            className="hover:bg-orange-50 hover:text-orange-600"
                                                            title={pooja.status ? "Pause Pooja" : "Resume Pooja"}
                                                        >
                                                            {pooja.status ? (
                                                                <Pause className="w-4 h-4" />
                                                            ) : (
                                                                <Play className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </>
                                                )}

                                                {hasPermission('poojas.delete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(pooja.id)}
                                                        className="hover:bg-red-50 hover:text-red-600"
                                                        title="Remove Pooja"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
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
import { fetchMyPoojas, deleteMyPooja } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function TemplePoojasListPage() {
    const router = useRouter();
    const [poojas, setPoojas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        loadPoojas();
    }, []);

    const loadPoojas = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyPoojas();
            // The API returns { success: true, data: [...] }
            setPoojas(response.data || []);
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
                await deleteMyPooja(id);
                toast({ title: "Success", description: "Pooja deleted successfully" });
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

    const filteredPoojas = poojas.filter(pooja =>
        pooja.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pooja.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">My Poojas</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your temple's rituals and offerings.
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/temples/dashboard/poojas/create')}
                    className="bg-[#7b4623] hover:bg-[#5d351a] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Offer New Pooja
                </Button>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search your poojas..."
                        className="pl-10 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Poojas Table */}
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Pooja Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                    <div className="text-muted-foreground">No poojas found. Start by offering a new pooja!</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPoojas.map((pooja) => (
                                <TableRow key={pooja.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border">
                                            <img
                                                src={getImageUrl(pooja.image)}
                                                alt={pooja.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-slate-900">{pooja.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">
                                            {pooja.about || (pooja.description && pooja.description[0])}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100">
                                            {pooja.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center font-bold text-slate-900">
                                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                            {pooja.price}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4 mr-2" />
                                            {pooja.duration}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/temples/dashboard/poojas/${pooja.id}`)}
                                                className="hover:bg-blue-50 hover:text-blue-600"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/temples/dashboard/poojas/edit/${pooja.id}`)}
                                                className="hover:bg-blue-50 hover:text-blue-600"
                                                title="Edit Pooja"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(pooja.id)}
                                                className="hover:bg-red-50 hover:text-red-600"
                                                title="Delete Pooja"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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

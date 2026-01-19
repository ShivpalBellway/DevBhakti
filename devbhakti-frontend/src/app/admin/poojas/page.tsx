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
import { fetchAllPoojasAdmin, deletePoojaAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function AdminPoojasListPage() {
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
            const data = await fetchAllPoojasAdmin();
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

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this pooja?")) {
            try {
                await deletePoojaAdmin(id);
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
                    <h1 className="text-2xl font-bold tracking-tight">Poojas Management</h1>
                    <p className="text-muted-foreground">
                        Manage all poojas, rituals, and spiritual services.
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/admin/poojas/create')}
                    className="bg-primary hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Pooja
                </Button>
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
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Duration</TableHead>
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
                                        <div className="font-medium text-slate-900">{pooja.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                            {pooja.about || (pooja.description && pooja.description[0])}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium text-slate-600">{pooja.temple?.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50">
                                            {pooja.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center font-semibold text-primary">
                                            <IndianRupee className="w-3 h-3 mr-0.5" />
                                            {pooja.price}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                            {pooja.duration}
                                        </div>
                                    </TableCell>
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/admin/poojas/edit/${pooja.id}`)}
                                                title="Edit Pooja"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(pooja.id)}
                                                title="Delete Pooja"
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
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

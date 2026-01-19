"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Building2,
    MapPin,
    Eye,
    ExternalLink
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
import { Card, CardContent } from "@/components/ui/card";
import {
    fetchAllInstitutionsAdmin,
    deleteInstitutionAdmin,
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";

export default function InstitutionsListPage() {
    const router = useRouter();
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        loadInstitutions();
    }, []);

    const loadInstitutions = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllInstitutionsAdmin();
            setInstitutions(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load institutions",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this institution?")) {
            try {
                await deleteInstitutionAdmin(id);
                toast({ title: "Success", description: "Institution deleted successfully" });
                loadInstitutions();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete institution",
                    variant: "destructive",
                });
            }
        }
    };

    const filteredInstitutions = institutions.filter(
        (inst) =>
            inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.temple?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Institutions & Temples</h1>
                    <p className="text-muted-foreground">Manage organizational accounts and temple profiles.</p>
                </div>
                <Button onClick={() => router.push('/admin/institutions/create')} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Institution
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by owner or temple name..."
                        className="pl-10 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Institution/Owner</TableHead>
                            <TableHead>Temple Profile</TableHead>
                            <TableHead>Statistics</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        <span>Loading data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredInstitutions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    No institutions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInstitutions.map((inst) => (
                                <TableRow key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{inst.name || "N/A"}</span>
                                            <span className="text-xs text-muted-foreground">{inst.email || inst.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                                <span>{inst.temple?.name || "No Temple"}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span>{inst.temple?.location || "N/A"}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-[11px]">
                                            <span className="text-slate-600">Poojas: {inst.temple?._count?.poojas || 0}</span>
                                            <span className="text-slate-600">Events: {inst.temple?._count?.events || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {inst.temple?.liveStatus ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Live</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-amber-600 bg-amber-50">Pending</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600"
                                                onClick={() => router.push(`/admin/institutions/${inst.id}`)}
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600"
                                                onClick={() => router.push(`/admin/institutions/edit/${inst.id}`)}
                                                title="Edit Institution"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => handleDelete(inst.id)}
                                                title="Delete Institution"
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

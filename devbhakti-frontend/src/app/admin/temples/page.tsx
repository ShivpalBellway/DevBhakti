"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Plus,
    Eye,
    Edit2,
    Trash2,
    Building2,
    MapPin,
    CheckCircle,
    XCircle,
    Clock,
    Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    fetchAllTemplesAdmin,
    deleteTempleAdmin,
    toggleTempleStatusAdmin
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import TemplePreview from "@/components/admin/TemplePreview";

export default function TemplesManagementPage() {
    const router = useRouter();
    const [temples, setTemples] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTemple, setSelectedTemple] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadTemples();
    }, []);

    const loadTemples = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllTemplesAdmin();

            // Extract temple objects but keep the user data properly
            const actualTemples = data
                .filter((user: any) => user.temple) // Only include users that have temples
                .map((user: any) => ({
                    // User data
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    userPhone: user.phone,
                    isVerified: user.isVerified,
                    // Temple data
                    templeId: user.temple.id,
                    templeName: user.temple.name,
                    templeLocation: user.temple.location,
                    ...user.temple // Spread other temple properties
                }));

            setTemples(actualTemples);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load temples",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this temple account?")) {
            try {
                await deleteTempleAdmin(id);
                toast({ title: "Success", description: "Temple account deleted successfully" });
                loadTemples();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete temple account",
                    variant: "destructive",
                });
            }
        }
    };

    const handleToggleStatus = async (id: string, currentVerified: boolean, currentLive: boolean) => {
        try {
            await toggleTempleStatusAdmin(id, !currentVerified, !currentLive);
            toast({ title: "Success", description: `Temple ${!currentVerified ? 'Approved' : 'Deactivated'} successfully` });
            loadTemples();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const filteredTemples = temples.filter(
        (inst) =>
            inst.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.templeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.templeLocation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Temple Management</h1>
                    <p className="text-muted-foreground">Manage temple administrator accounts and temple profiles.</p>
                </div>
                <Button onClick={() => router.push('/admin/temples/create')} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Temple
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
                            <TableHead>Temple Owner</TableHead>
                            <TableHead>Temple ID</TableHead>
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
                        ) : filteredTemples.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    No temples found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTemples.map((inst) => (
                                <TableRow key={inst.userId} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{inst.userName || "N/A"}</span>
                                            <span className="text-xs text-muted-foreground">{inst.userEmail || inst.userPhone || "N/A"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {inst.templeId || "N/A"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                                <span>{inst.templeName || "No Temple"}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span>{inst.templeLocation || "N/A"}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-[11px]">
                                            <span className="text-slate-600">Poojas: {inst._count?.poojas || 0}</span>
                                            <span className="text-slate-600">Events: {inst._count?.events || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                {inst.isVerified ? (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-semibold">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-semibold">Pending</span>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${inst.isVerified ? 'text-amber-600' : 'text-emerald-600'}`}
                                                onClick={() => handleToggleStatus(inst.userId, inst.isVerified, inst.temple?.liveStatus || false)}
                                                title={inst.isVerified ? "Deactivate" : "Approve Temple"}
                                            >
                                                {inst.isVerified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600"
                                                onClick={() => router.push(`/admin/temples/${inst.userId}`)}
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-indigo-600"
                                                onClick={() => {
                                                    setSelectedTemple(inst);
                                                    setIsPreviewOpen(true);
                                                }}
                                                title="Preview on Website"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600"
                                                onClick={() => {
                                                    console.log('=== TEMPLE DATA DEBUG ===');
                                                    console.log('inst:', inst);
                                                    console.log('User Email:', inst.email);
                                                    console.log('User Phone:', inst.phone);
                                                    console.log('User ID:', inst.userId);
                                                    console.log('Temple Name:', inst.name);
                                                    console.log('Temple Location:', inst.location);
                                                    console.log('============================');
                                                    router.push(`/admin/temples/edit/${inst.userId}`)
                                                }}
                                                title="Edit Temple Account"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => handleDelete(inst.userId)}
                                                title="Delete Temple Account"
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

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-6xl p-0 overflow-hidden border-none bg-transparent shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Temple Preview</DialogTitle>
                    </DialogHeader>
                    {selectedTemple && <TemplePreview temple={selectedTemple} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

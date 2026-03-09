"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Check, X, Trash2, MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    fetchPoojaCategoriesAdmin,
    createPoojaCategoryAdmin,
    updatePoojaCategoryStatusAdmin,
    deletePoojaCategoryAdmin
} from "@/api/adminController";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AdminPoojaCategoriesPage() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        loadCategories();
    }, [filterStatus]);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetchPoojaCategoriesAdmin({
                status: filterStatus || undefined,
                search: searchTerm || undefined
            });
            if (res.success) {
                setCategories(res.data);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newName.trim()) return;
        try {
            const res = await createPoojaCategoryAdmin({ name: newName.trim(), status: "APPROVED" });
            if (res.success) {
                toast({ title: "Success", description: "Category added successfully" });
                setNewName("");
                setIsAdding(false);
                loadCategories();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to add category",
                variant: "destructive"
            });
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await updatePoojaCategoryStatusAdmin(id, status);
            if (res.success) {
                toast({ title: "Success", description: `Category ${status.toLowerCase()} successfully` });
                loadCategories();
            }
        } catch (error) {
            toast({ title: "Error", description: "Operation failed", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            const res = await deletePoojaCategoryAdmin(id);
            if (res.success) {
                toast({ title: "Deleted", description: "Category removed successfully" });
                loadCategories();
            }
        } catch (error) {
            toast({ title: "Error", description: "Deletion failed", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pooja Purposes / Categories</h1>
                    <p className="text-muted-foreground">Manage the master list of pooja categories available to temples.</p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#7b4623] hover:bg-[#5d351a]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Purpose
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Pooja Purpose</DialogTitle>
                            <DialogDescription>
                                This will be immediately available for all temples.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Purpose Name</Label>
                                <Input
                                    placeholder="e.g. Vehicle Puja"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                            <Button onClick={handleAddCategory} className="bg-[#7b4623] hover:bg-[#5d351a]">Add Purpose</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search purposes..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadCategories()}
                    />
                </div>
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-4 font-semibold text-slate-900">Name</th>
                            <th className="text-left px-6 py-4 font-semibold text-slate-900">Status</th>
                            <th className="text-left px-6 py-4 font-semibold text-slate-900">Created At</th>
                            <th className="text-right px-6 py-4 font-semibold text-slate-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Loading purposes...
                                </td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                    No categories found.
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{cat.name}</td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant={
                                                cat.status === "APPROVED" ? "default" :
                                                    cat.status === "REJECTED" ? "destructive" :
                                                        "outline"
                                            }
                                            className={cat.status === "PENDING" ? "bg-orange-50 text-orange-600 border-orange-200" : ""}
                                        >
                                            {cat.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(cat.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {cat.status !== "APPROVED" && (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "APPROVED")}>
                                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                )}
                                                {cat.status !== "REJECTED" && (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(cat.id, "REJECTED")}>
                                                        <X className="mr-2 h-4 w-4 text-orange-600" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleDelete(cat.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
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

            {categories.some(c => c.status === "PENDING") && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-sm text-orange-800">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>
                        You have pending category suggestions from temples. Approve them to make them available in the master list.
                    </p>
                </div>
            )}
        </div>
    );
}

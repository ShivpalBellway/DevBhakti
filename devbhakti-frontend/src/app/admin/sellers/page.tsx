"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Plus,
    Eye,
    Edit2,
    Trash2,
    Store,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    Phone,
    Calendar,
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
import { useToast } from "@/hooks/use-toast";
import {
    fetchAllSellersAdmin,
    deleteSellerAdmin,
    toggleSellerStatusAdmin
} from "@/api/adminController";

export default function SellersManagementPage() {
    const router = useRouter();
    const [sellers, setSellers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSeller, setSelectedSeller] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadSellers();
    }, []);

    const loadSellers = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllSellersAdmin();
            setSellers(data || []);
        } catch (error: any) {
            console.error("Load Sellers Error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load sellers",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (sellerId: string) => {
        // Find seller to get stats
        const seller = sellers.find(s => s.id === sellerId);
        if (!seller) return;

        const warningMessage = `⚠️ DELETE SELLER: ${seller.storeName}

This action will permanently delete:
• Seller Profile: ${seller.name}
• ${seller.totalProducts || 0} Products
• ${seller.totalOrders || 0} Orders
• All ledger entries and financial records
• All withdrawal requests

❌ THIS ACTION CANNOT BE UNDONE!

Are you sure you want to proceed?`;

        if (window.confirm(warningMessage)) {
            try {
                const response = await deleteSellerAdmin(sellerId);

                // Show detailed success message
                const deletedData = response?.deletedData;
                let successMessage = "Seller deleted successfully";

                if (deletedData) {
                    successMessage = `Deleted: ${deletedData.seller}\n` +
                        `• ${deletedData.productsDeleted} products\n` +
                        `• ${deletedData.ordersDeleted} orders\n` +
                        `• ${deletedData.ledgerEntriesDeleted} ledger entries\n` +
                        `• ${deletedData.withdrawalsDeleted} withdrawal requests`;
                }

                toast({
                    title: "✅ Seller Deleted",
                    description: successMessage
                });
                loadSellers(); // Refresh list
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to delete seller",
                    variant: "destructive",
                });
            }
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await toggleSellerStatusAdmin(id, newStatus);
            toast({ title: "Success", description: `Seller status updated to ${newStatus}` });
            loadSellers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const filteredSellers = sellers.filter(
        (seller) =>
            seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seller.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-xs font-medium whitespace-nowrap">
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                    </div>
                );
            case "pending":
                return (
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 text-xs font-medium whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-200 text-xs font-medium whitespace-nowrap">
                        <XCircle className="w-3 h-3" />
                        <span>Inactive</span>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Seller Management</h1>
                    <p className="text-muted-foreground">Manage your marketplace sellers and their applications.</p>
                </div>
                <Button onClick={() => router.push('/admin/sellers/create')} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Seller
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, store name, or email..."
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
                            <TableHead>Seller & Store</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Join Date</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        <span>Loading sellers...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredSellers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    No sellers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSellers.map((seller) => (
                                <TableRow key={seller.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Store className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{seller.storeName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {seller.name}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Mail className="w-3 h-3" />
                                                <span>{seller.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Phone className="w-3 h-3" />
                                                <span>{seller.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span>{new Date(seller.joinDate).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-medium">
                                            {seller.totalProducts} Products
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(seller.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${seller.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}
                                                onClick={() => handleToggleStatus(seller.id, seller.status)}
                                                title={seller.status === 'active' ? "Deactivate Seller" : "Activate Seller"}
                                            >
                                                {seller.status === 'active' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600"
                                                onClick={() => router.push(`/admin/sellers/view/${seller.id}`)}
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600"
                                                onClick={() => router.push(`/admin/sellers/edit/${seller.id}`)}
                                                title="Edit Seller"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => handleDelete(seller.id)}
                                                title="Delete Seller"
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
                {/* Keeping old dialog format but reusing new selectedSeller state, although Eye button now redirects. 
            Can optionally remove this part if we fully switched to new page. 
            Keeping it for backup/consistency with original code structure. */}
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Seller Details</DialogTitle>
                    </DialogHeader>
                    {selectedSeller && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Store className="w-10 h-10" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900">{selectedSeller.storeName}</h3>
                                    <p className="text-slate-600">{selectedSeller.name}</p>
                                    <div className="mt-1">{getStatusBadge(selectedSeller.status)}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Seller ID</label>
                                    <p className="text-slate-900">{selectedSeller.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Join Date</label>
                                    <p className="text-slate-900">{new Date(selectedSeller.joinDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                                    <p className="text-slate-900">{selectedSeller.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                                    <p className="text-slate-900">{selectedSeller.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Store Address</label>
                                <p className="text-slate-900 mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100 italic">
                                    {selectedSeller.address || 'No address provided'}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

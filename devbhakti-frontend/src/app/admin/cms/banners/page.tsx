"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Upload,
    X,
    CheckCircle2,
    AlertCircle
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchAllBannersAdmin, createBannerAdmin, updateBannerAdmin, deleteBannerAdmin } from "@/api/adminController";
import { API_URL, BASE_URL } from "@/config/apiConfig";


export default function BannersPage() {
    const [banners, setBanners] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        link: "",
        active: "true",
        order: 1,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            setLoading(true);
            const data = await fetchAllBannersAdmin();
            setBanners(data);
        } catch (error) {
            console.error("Error loading banners:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (banner: any = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                link: banner.link || "",
                active: banner.active ? "true" : "false",
                order: banner.order,
            });
            setImagePreview(banner.image.startsWith('http') ? banner.image : `${BASE_URL}${banner.image}`);

            setImageFile(null);
        } else {
            setEditingBanner(null);
            setFormData({
                link: "",
                active: "true",
                order: banners.length + 1,
            });
            setImagePreview("");
            setImageFile(null);
        }
        setIsDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('link', formData.link);
            data.append('active', formData.active);
            data.append('order', formData.order.toString());

            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editingBanner) {
                await updateBannerAdmin(editingBanner.id, data);
            } else {
                if (!imageFile) {
                    alert("Please select an image");
                    return;
                }
                await createBannerAdmin(data);
            }

            setIsDialogOpen(false);
            loadBanners();
        } catch (error) {
            console.error("Error saving banner:", error);
            alert("Error saving banner");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            try {
                await deleteBannerAdmin(id);
                loadBanners();
            } catch (error) {
                console.error("Error deleting banner:", error);
                alert("Error deleting banner");
            }
        }
    };

    const filteredBanners = banners.filter(banner =>
        (banner.link || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Banners Management</h1>
                    <p className="text-muted-foreground">
                        Manage your homepage carousel banners and promotions.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Banner
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search banners..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Banners Table */}
            <div className="border rounded-lg bg-card">
                {loading ? (
                    <div className="p-8 text-center">Loading banners...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Preview</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Link</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBanners.map((banner) => (
                                <TableRow key={banner.id}>
                                    <TableCell>
                                        <div className="w-24 h-14 rounded overflow-hidden bg-muted">
                                            <img
                                                src={banner.image.startsWith('http') ? banner.image : `${BASE_URL}${banner.image}`}
                                                alt="Banner"
                                                className="w-full h-full object-cover"
                                            />

                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={banner.active ? "default" : "secondary"}>
                                            {banner.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{banner.order}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{banner.link || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(banner)}
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(banner.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredBanners.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No banners found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
                        <DialogDescription>
                            Enter the details for the banner. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="link">Redirect Link (Optional)</Label>
                            <Input
                                id="link"
                                placeholder="e.g. /poojas/mahashivratri"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    value={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Banner Image</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <div className="text-sm font-medium">Click to upload or drag and drop</div>
                                <div className="text-xs text-muted-foreground">PNG, JPG or WEBP (Max 5MB)</div>
                                <Input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {imagePreview && (
                                <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden border">
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview("");
                                            setImageFile(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingBanner ? "Update Banner" : "Create Banner"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

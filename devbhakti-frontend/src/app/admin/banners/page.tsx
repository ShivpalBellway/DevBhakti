"use client";

import React, { useState } from "react";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    Eye,
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Mock Data
const initialBanners = [
    {
        id: "1",
        title: "Mahashivratri Special",
        image: "https://static.vecteezy.com/system/resources/previews/039/340/855/non_2x/happy-maha-shivratri-maha-shivaratri-wishes-happy-maha-shivratri-social-media-post-shivratri-web-banner-story-print-vector.jpg",
        status: "active",
        link: "/poojas/mahashivratri",
        order: 1,
        createdAt: "2024-01-15"
    },
    {
        id: "2",
        title: "Kashi Vishwanath Darshan",
        image: "https://miro.medium.com/v2/resize:fit:1400/format:webp/1*P9i1ElQ638e39kRRCNxbLQ.jpeg",
        status: "active",
        link: "/temples/kashi",
        order: 2,
        createdAt: "2024-01-16"
    },
    {
        id: "3",
        title: "New Year Blessings",
        image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000&auto=format&fit=crop",
        status: "inactive",
        link: "/offers",
        order: 3,
        createdAt: "2024-01-10"
    }
];

export default function BannersPage() {
    const [banners, setBanners] = useState(initialBanners);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: "",
        link: "",
        status: "active",
        order: 1,
        image: ""
    });

    const handleOpenDialog = (banner: any = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                link: banner.link,
                status: banner.status,
                order: banner.order,
                image: banner.image
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: "",
                link: "",
                status: "active",
                order: banners.length + 1,
                image: ""
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBanner) {
            setBanners(banners.map(b => b.id === editingBanner.id ? { ...b, ...formData } : b));
        } else {
            const newBanner = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData,
                createdAt: new Date().toISOString().split('T')[0]
            };
            setBanners([...banners, newBanner]);
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            setBanners(banners.filter(b => b.id !== id));
        }
    };

    const filteredBanners = banners.filter(banner =>
        banner.title.toLowerCase().includes(searchTerm.toLowerCase())
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
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Banners Table */}
            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Preview</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBanners.map((banner) => (
                            <TableRow key={banner.id}>
                                <TableCell>
                                    <div className="w-16 h-10 rounded overflow-hidden bg-muted">
                                        <img
                                            src={banner.image}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{banner.title}</div>
                                    {/* <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {banner.link}
                                    </div> */}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={banner.status === "active" ? "default" : "destructive"}>
                                        {banner.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{banner.order}</TableCell>
                                <TableCell>{banner.createdAt}</TableCell>
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
                    </TableBody>
                </Table>
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
                            <Label htmlFor="title">Banner Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Mahashivratri Special"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        {/* <div className="space-y-2">
                            <Label htmlFor="link">Redirect Link</Label>
                            <Input
                                id="link"
                                placeholder="e.g. /poojas/mahashivratri"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            />
                        </div> */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
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
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <div className="text-sm font-medium">Click to upload or drag and drop</div>
                                <div className="text-xs text-muted-foreground">PNG, JPG or WEBP (Max 2MB)</div>
                                <Input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        // Mock image upload
                                        if (e.target.files?.[0]) {
                                            setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
                                        }
                                    }}
                                />
                            </div>
                            {formData.image && (
                                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border">
                                    <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, image: "" })}
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

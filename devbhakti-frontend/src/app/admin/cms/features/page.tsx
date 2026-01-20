"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Upload,
    X,
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
import { Textarea } from "@/components/ui/textarea";
import { fetchAllFeaturesAdmin, createFeatureAdmin, updateFeatureAdmin, deleteFeatureAdmin } from "@/api/adminController";
import { API_URL, BASE_URL } from "@/config/apiConfig";


export default function FeaturesPage() {
    const [features, setFeatures] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        active: "true",
        order: 1,
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string>("");

    useEffect(() => {
        loadFeatures();
    }, []);

    const loadFeatures = async () => {
        try {
            setLoading(true);
            const data = await fetchAllFeaturesAdmin();
            setFeatures(data);
        } catch (error) {
            console.error("Error loading features:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (feature: any = null) => {
        if (feature) {
            setEditingFeature(feature);
            setFormData({
                title: feature.title,
                description: feature.description,
                active: feature.active ? "true" : "false",
                order: feature.order,
            });
            setImagePreview(feature.image.startsWith('http') ? feature.image : `${BASE_URL}${feature.image}`);
            setIconPreview(feature.icon.startsWith('http') ? feature.icon : `${BASE_URL}${feature.icon}`);

            setImageFile(null);
            setIconFile(null);
        } else {
            setEditingFeature(null);
            setFormData({
                title: "",
                description: "",
                active: "true",
                order: features.length + 1,
            });
            setImagePreview("");
            setIconPreview("");
            setImageFile(null);
            setIconFile(null);
        }
        setIsDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setIconFile(file);
            setIconPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('active', formData.active);
            data.append('order', formData.order.toString());

            if (imageFile) data.append('image', imageFile);
            if (iconFile) data.append('icon', iconFile);

            if (editingFeature) {
                await updateFeatureAdmin(editingFeature.id, data);
            } else {
                if (!imageFile || !iconFile) {
                    alert("Please select both image and icon");
                    return;
                }
                await createFeatureAdmin(data);
            }

            setIsDialogOpen(false);
            loadFeatures();
        } catch (error) {
            console.error("Error saving feature:", error);
            alert("Error saving feature");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this feature?")) {
            try {
                await deleteFeatureAdmin(id);
                loadFeatures();
            } catch (error) {
                console.error("Error deleting feature:", error);
                alert("Error deleting feature");
            }
        }
    };

    const filteredFeatures = features.filter(feature =>
        feature.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Features Management</h1>
                    <p className="text-muted-foreground">
                        Manage your homepage features and highlights.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Feature
                </Button>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search features..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Features Table */}
            <div className="border rounded-lg bg-card">
                {loading ? (
                    <div className="p-8 text-center">Loading features...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Icon</TableHead>
                                <TableHead className="w-[120px]">Background</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFeatures.map((feature) => (
                                <TableRow key={feature.id}>
                                    <TableCell>
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center p-1">
                                            <img
                                                src={feature.icon.startsWith('http') ? feature.icon : `${BASE_URL}${feature.icon}`}
                                                alt="Icon"
                                                className="w-full h-full object-contain"
                                            />

                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-20 h-12 rounded overflow-hidden bg-muted">
                                            <img
                                                src={feature.image.startsWith('http') ? feature.image : `${BASE_URL}${feature.image}`}
                                                alt="BG"
                                                className="w-full h-full object-cover"
                                            />

                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{feature.title}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{feature.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={feature.active ? "default" : "secondary"}>
                                            {feature.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{feature.order}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(feature)}
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(feature.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredFeatures.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No features found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingFeature ? "Edit Feature" : "Add New Feature"}</DialogTitle>
                        <DialogDescription>
                            Enter the details for the feature card.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Easy Pooja Booking"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Feature description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Icon Image (Small)</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                    <div className="text-xs font-medium text-center">Upload Icon</div>
                                    <Input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleIconChange}
                                    />
                                </div>
                                {iconPreview && (
                                    <div className="mt-2 relative w-16 h-16 rounded overflow-hidden border mx-auto">
                                        <img src={iconPreview} className="w-full h-full object-contain" alt="Icon Preview" />
                                        <button
                                            type="button"
                                            onClick={() => { setIconPreview(""); setIconFile(null); }}
                                            className="absolute -top-1 -right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Background Image</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                    <div className="text-xs font-medium text-center">Upload BG</div>
                                    <Input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                {imagePreview && (
                                    <div className="mt-2 relative w-full h-16 rounded overflow-hidden border">
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="BG Preview" />
                                        <button
                                            type="button"
                                            onClick={() => { setImagePreview(""); setImageFile(null); }}
                                            className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingFeature ? "Update Feature" : "Create Feature"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

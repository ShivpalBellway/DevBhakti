"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { ImageCropper } from "@/components/admin/ImageCropper";
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
import { Switch } from "@/components/ui/switch";
import { fetchAllBannersAdmin, createBannerAdmin, updateBannerAdmin, deleteBannerAdmin, fetchBannerGlobalStatus, toggleBannerGlobalStatus } from "@/api/adminController";
import { API_URL, BASE_URL } from "@/config/apiConfig";


export default function BannersPage() {
    const [banners, setBanners] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [bannerSectionActive, setBannerSectionActive] = useState(true);
    const [formData, setFormData] = useState({
        link: "",
        active: "true",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            setLoading(true);
            const [data, statusData] = await Promise.all([
                fetchAllBannersAdmin(),
                fetchBannerGlobalStatus()
            ]);
            setBanners(data);
            setBannerSectionActive(statusData.active);
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
            });
            setImagePreview(banner.image.startsWith('http') ? banner.image : `${BASE_URL}${banner.image}`);
            setImageFile(null);
        } else {
            setEditingBanner(null);
            setFormData({
                link: "",
                active: "true",
            });
            setImagePreview("");
            setImageFile(null);
        }
        setIsDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset input
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        setImageFile(croppedFile);
        setImagePreview(URL.createObjectURL(croppedFile));
        setShowCropper(false);
        setTempImage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('link', formData.link);
            data.append('active', formData.active);
            data.append('order', '1');

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

    const handleToggleSection = async () => {
        try {
            const data = await toggleBannerGlobalStatus();
            setBannerSectionActive(data.active);
        } catch (error) {
            console.error("Error toggling banner section:", error);
            alert("Error updating section visibility");
        }
    };

    const filteredBanners = banners.filter(banner =>
        (banner.link || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 p-6">
            {showCropper && tempImage && (
                <ImageCropper
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setShowCropper(false);
                        setTempImage(null);
                    }}
                    initialAspect={1920 / 800}
                    lockAspect={true}
                    title="Adjust Banner Image"
                />
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Banners Management</h1>
                    <p className="text-muted-foreground text-base">
                        Manage your homepage carousel banners and promotions.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 h-11 px-6 shadow-md">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Banner
                </Button>
            </div>

            {/* Global Toggle Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Label className="text-base font-semibold text-foreground">Banner Section Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                        When disabled, the entire carousel section will be hidden from the home page.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border border-border/50">
                    <span className={`text-sm font-medium ${bannerSectionActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                        {bannerSectionActive ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                        checked={bannerSectionActive}
                        onCheckedChange={handleToggleSection}
                        className="scale-110"
                    />
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search banners..."
                        className="pl-10 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Banners Table */}
            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading banners...</span>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border">
                                <TableHead className="w-[350px] pl-6 py-4">Preview</TableHead>
                                {/* Added min-w and pl-4 to create gap */}
                                <TableHead className="min-w-[120px] pl-6 py-4">Status</TableHead>
                                <TableHead className="min-w-[140px] pl-6 py-4">Uploaded Date</TableHead>
                                <TableHead className="text-right min-w-[120px] pr-6 py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBanners.map((banner) => (
                                <TableRow key={banner.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="w-[350px] h-[100px] rounded-md overflow-hidden bg-muted border border-border flex items-center justify-center relative group shadow-sm">
                                            <img
                                                src={banner.image.startsWith('http') ? banner.image : `${BASE_URL}${banner.image}`}
                                                alt="Banner"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                    </TableCell>
                                    {/* Matching padding to headers */}
                                    <TableCell className="pl-6 py-4">
                                        <Badge variant={banner.active ? "default" : "secondary"} className="px-3 py-1">
                                            {banner.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pl-6 py-4">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {new Date(banner.createdAt || new Date()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 py-4">
                                        <div className="flex justify-end gap-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(banner)}
                                                className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 text-muted-foreground"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(banner.id)}
                                                className="h-9 w-9 hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredBanners.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
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
                <DialogContent className="sm:max-w-[600px] gap-0 p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl">{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
                        <DialogDescription className="text-base">
                            {editingBanner ? "Update the banner details below." : "Configure the new banner settings."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 pt-4">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                                <select
                                    id="status"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none transition-all"
                                    value={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Banner Image</Label>
                            <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer relative group">
                                <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="text-sm font-medium text-foreground">Click to upload image</div>
                                    <div className="text-xs text-muted-foreground">Aspect Ratio: 2.4:1 (1920x800 px)</div>
                                </div>
                                <Input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {imagePreview && (
                                <div className="mt-2 relative w-full h-48 bg-muted rounded-lg overflow-hidden border border-border shadow-inner flex items-center justify-center">
                                    <img src={imagePreview} className="max-w-full max-h-full object-contain" alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview("");
                                            setImageFile(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 px-6">
                                Cancel
                            </Button>
                            <Button type="submit" className="h-10 px-6">
                                {editingBanner ? "Update Banner" : "Create Banner"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
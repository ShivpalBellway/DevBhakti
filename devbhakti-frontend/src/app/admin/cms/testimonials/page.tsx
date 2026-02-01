"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Upload,
    X,
    Video,
    Image as ImageIcon
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
import {
    fetchAllTestimonialsAdmin,
    createTestimonialAdmin,
    updateTestimonialAdmin,
    deleteTestimonialAdmin
} from "@/api/adminController";
import { API_URL, BASE_URL } from "@/config/apiConfig";

export default function TestimonialsPage() {
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        category: "",
        active: "true",
        order: 1,
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string>("");

    useEffect(() => {
        loadTestimonials();
    }, []);

    const loadTestimonials = async () => {
        try {
            setLoading(true);
            const data = await fetchAllTestimonialsAdmin();
            setTestimonials(data);
        } catch (error) {
            console.error("Error loading testimonials:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (testimonial: any = null) => {
        if (testimonial) {
            setEditingTestimonial(testimonial);
            setFormData({
                title: testimonial.title || "",
                subtitle: testimonial.subtitle || "",
                category: testimonial.category || "",
                active: testimonial.active ? "true" : "false",
                order: testimonial.order,
            });
            setThumbnailPreview(testimonial.thumbnail.startsWith('http') ? testimonial.thumbnail : `${BASE_URL}${testimonial.thumbnail}`);
            setVideoPreview(testimonial.videoSrc.startsWith('http') ? testimonial.videoSrc : `${BASE_URL}${testimonial.videoSrc}`);
            setThumbnailFile(null);
            setVideoFile(null);
        } else {
            setEditingTestimonial(null);
            setFormData({
                title: "",
                subtitle: "",
                category: "",
                active: "true",
                order: testimonials.length + 1,
            });
            setThumbnailPreview("");
            setVideoPreview("");
            setThumbnailFile(null);
            setVideoFile(null);
        }
        setIsDialogOpen(true);
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('subtitle', formData.subtitle);
            data.append('category', formData.category);
            data.append('active', formData.active);
            data.append('order', formData.order.toString());

            if (thumbnailFile) {
                data.append('thumbnail', thumbnailFile);
            }
            if (videoFile) {
                data.append('videoSrc', videoFile);
            }

            if (editingTestimonial) {
                await updateTestimonialAdmin(editingTestimonial.id, data);
            } else {
                if (!thumbnailFile || !videoFile) {
                    alert("Please select both thumbnail and video");
                    return;
                }
                await createTestimonialAdmin(data);
            }

            setIsDialogOpen(false);
            loadTestimonials();
        } catch (error) {
            console.error("Error saving testimonial:", error);
            alert("Error saving testimonial");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this testimonial?")) {
            try {
                await deleteTestimonialAdmin(id);
                loadTestimonials();
            } catch (error) {
                console.error("Error deleting testimonial:", error);
                alert("Error deleting testimonial");
            }
        }
    };

    const filteredTestimonials = testimonials.filter(t =>
        (t.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subtitle || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Video Testimonials</h1>
                    <p className="text-muted-foreground">
                        Manage video stories and testimonials for the landing page.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Testimonial
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search testimonials..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg bg-card">
                {loading ? (
                    <div className="p-8 text-center">Loading testimonials...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Thumbnail</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTestimonials.map((testimonial) => (
                                <TableRow key={testimonial.id}>
                                    <TableCell>
                                        <div className="w-16 h-24 rounded overflow-hidden bg-muted">
                                            <img
                                                src={testimonial.thumbnail.startsWith('http') ? testimonial.thumbnail : `${BASE_URL}${testimonial.thumbnail}`}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{testimonial.title}</div>
                                        <div className="text-xs text-muted-foreground">{testimonial.subtitle}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{testimonial.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={testimonial.active ? "default" : "secondary"}>
                                            {testimonial.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{testimonial.order}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(testimonial)}
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(testimonial.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTestimonials.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No testimonials found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the video story.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Pandit Ji on 'Sankalpa'"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subtitle">Subtitle</Label>
                                <Input
                                    id="subtitle"
                                    placeholder="e.g. Head Priest, Kashi"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    placeholder="e.g. SANKALPA"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        value={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="order">Order</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Thumbnail Image</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer relative h-40">
                                    {thumbnailPreview ? (
                                        <img src={thumbnailPreview} className="w-full h-full object-cover rounded" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                            <div className="text-xs text-center">Click to upload thumbnail</div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={handleThumbnailChange}
                                    />

                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Video File</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer relative h-40">
                                    {videoPreview ? (
                                        <div className="flex flex-col items-center justify-center bg-zinc-100 w-full h-full rounded">
                                            <Video className="w-8 h-8 text-orange-600" />
                                            <span className="text-[10px] mt-1 text-zinc-500 truncate w-full px-2 text-center">
                                                {videoFile ? videoFile.name : 'Current Video'}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <Video className="w-8 h-8 text-muted-foreground" />
                                            <div className="text-xs text-center">Click to upload MP4 video</div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="video/mp4"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={handleVideoChange}
                                    />

                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingTestimonial ? "Update Testimonial" : "Create Testimonial"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

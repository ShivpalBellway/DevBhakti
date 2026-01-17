"use client";

import React, { useState } from "react";
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Eye,
    Upload,
    X,
    Flower2,
    Clock,
    IndianRupee,
    Tag
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
import { poojas as initialPoojas } from "@/data/poojas";

export default function AdminPoojasPage() {
    const [poojas, setPoojas] = useState(initialPoojas);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedPooja, setSelectedPooja] = useState<any>(null);
    const [editingPooja, setEditingPooja] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        price: 0,
        duration: "",
        category: "",
        time: "",
        about: "",
        description: [] as string[],
        benefits: [] as string[],
        bullets: [] as string[],
        image: "" as any
    });

    const handleOpenDialog = (pooja: any = null) => {
        if (pooja) {
            setEditingPooja(pooja);
            setFormData({
                name: pooja.name,
                price: pooja.price,
                duration: pooja.duration,
                category: pooja.category,
                time: pooja.time,
                about: pooja.about || "",
                description: pooja.description || [],
                benefits: pooja.benefits || [],
                bullets: pooja.bullets || [],
                image: pooja.image
            });
        } else {
            setEditingPooja(null);
            setFormData({
                name: "",
                price: 0,
                duration: "",
                category: "",
                time: "",
                about: "",
                description: [],
                benefits: [],
                bullets: [],
                image: ""
            });
        }
        setIsDialogOpen(true);
    };

    const handleViewPooja = (pooja: any) => {
        setSelectedPooja(pooja);
        setIsViewOpen(true);
    };

    const handleArrayChange = (field: 'description' | 'benefits' | 'bullets', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const addArrayItem = (field: 'description' | 'benefits' | 'bullets') => {
        setFormData({ ...formData, [field]: [...formData[field], ""] });
    };

    const removeArrayItem = (field: 'description' | 'benefits' | 'bullets', index: number) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        setFormData({ ...formData, [field]: newArray });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPooja) {
            setPoojas(poojas.map(p => p.id === editingPooja.id ? { ...p, ...formData } : p));
        } else {
            const newPooja = {
                id: (poojas.length + 1).toString(),
                ...formData,
            };
            setPoojas([...poojas, newPooja as any]);
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this pooja?")) {
            setPoojas(poojas.filter(p => p.id !== id));
        }
    };

    const filteredPoojas = poojas.filter(pooja =>
        pooja.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pooja.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Pooja
                </Button>
            </div>

            {/* Filters & Search */}
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
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Poojas Table */}
            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Pooja Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPoojas.map((pooja) => (
                            <TableRow key={pooja.id}>
                                <TableCell>
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border">
                                        <img
                                            src={typeof pooja.image === 'string' ? pooja.image : (pooja.image as any)?.src}
                                            alt={pooja.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-slate-900">{pooja.name}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                        {pooja.about || pooja.description[0]}
                                    </div>
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
                                <TableCell>
                                    <div className="text-sm font-medium">{pooja.time}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleViewPooja(pooja)}
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4 text-slate-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenDialog(pooja)}
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
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto premium-scrollbar">
                    <DialogHeader>
                        <DialogTitle>{editingPooja ? "Edit Pooja" : "Add New Pooja"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the spiritual service.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Pooja Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Mangala Aarti"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    placeholder="e.g. Aarti, Pooja, Abhishekam"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration</Label>
                                <Input
                                    id="duration"
                                    placeholder="e.g. 30 mins"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Preferred Time</Label>
                                <Input
                                    id="time"
                                    placeholder="e.g. 5:00 AM"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="about">About Pooja</Label>
                            <Textarea
                                id="about"
                                placeholder="Brief description of the pooja..."
                                value={formData.about}
                                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                className="h-24"
                            />
                        </div>

                        {/* Description Array */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Description Points</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('description')}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Point
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.description.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => handleArrayChange('description', index, e.target.value)}
                                            placeholder={`Point ${index + 1}`}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('description', index)}>
                                            <X className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Benefits Array */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Benefits</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('benefits')}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Benefit
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.benefits.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={item}
                                            onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                                            placeholder={`Benefit ${index + 1}`}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('benefits', index)}>
                                            <X className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bullets Array */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Bullets (Single Words)</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('bullets')}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Bullet
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50">
                                {formData.bullets.map((item, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-white border rounded-full px-3 py-1 shadow-sm">
                                        <input
                                            className="text-xs font-medium outline-none w-20"
                                            value={item}
                                            onChange={(e) => handleArrayChange('bullets', index, e.target.value)}
                                            placeholder="Word..."
                                        />
                                        <button type="button" onClick={() => removeArrayItem('bullets', index)}>
                                            <X className="w-3 h-3 text-slate-400 hover:text-destructive" />
                                        </button>
                                    </div>
                                ))}
                                {formData.bullets.length === 0 && (
                                    <span className="text-xs text-muted-foreground italic">No bullets added yet</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Pooja Image</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <div className="text-sm font-medium">Click to upload image</div>
                                <Input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            const url = URL.createObjectURL(e.target.files[0]);
                                            setFormData({ ...formData, image: { src: url } });
                                        }
                                    }}
                                />
                            </div>
                            {formData.image && (
                                <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden border">
                                    <img
                                        src={typeof formData.image === 'string' ? formData.image : (formData.image as any)?.src}
                                        className="w-full h-full object-cover"
                                        alt="Preview"
                                    />
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
                                {editingPooja ? "Update Pooja" : "Create Pooja"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto premium-scrollbar">
                    {selectedPooja && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-slate-900">{selectedPooja.name}</DialogTitle>
                                <DialogDescription>
                                    Full details of the spiritual service.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                                {/* Left Column: Image & Basic Info */}
                                <div className="space-y-4">
                                    <div className="aspect-square rounded-xl overflow-hidden border shadow-sm">
                                        <img
                                            src={typeof selectedPooja.image === 'string' ? selectedPooja.image : (selectedPooja.image as any)?.src}
                                            className="w-full h-full object-cover"
                                            alt={selectedPooja.name}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="default" className="px-3 py-1">
                                                <Tag className="w-3 h-3 mr-1.5" />
                                                {selectedPooja.category}
                                            </Badge>
                                            <Badge variant="outline" className="px-3 py-1">
                                                <IndianRupee className="w-3 h-3 mr-1.5" />
                                                {selectedPooja.price}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Duration</div>
                                                <div className="text-xs font-medium flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 text-primary" />
                                                    {selectedPooja.duration}
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Timing</div>
                                                <div className="text-xs font-medium flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 text-primary" />
                                                    {selectedPooja.time}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bullets */}
                                    {selectedPooja.bullets && selectedPooja.bullets.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Highlights</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedPooja.bullets.map((bullet: string, idx: number) => (
                                                    <span key={idx} className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-full font-medium">
                                                        {bullet}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Middle & Right Columns */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* About Section - Fixed Height */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-primary rounded-full" />
                                            About this Pooja
                                        </h4>
                                        <div className="max-h-[120px] overflow-y-auto premium-scrollbar pr-2 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {selectedPooja.about || "No detailed description available."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Benefits */}
                                        {selectedPooja.benefits && selectedPooja.benefits.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-900 mb-2">Benefits</h4>
                                                <ul className="space-y-2">
                                                    {selectedPooja.benefits.map((benefit: string, idx: number) => (
                                                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                            {benefit}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Description Points */}
                                        {selectedPooja.description && selectedPooja.description.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-900 mb-2">Key Features</h4>
                                                <ul className="space-y-2">
                                                    {selectedPooja.description.map((point: string, idx: number) => (
                                                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Packages */}
                                    {selectedPooja.packages && selectedPooja.packages.length > 0 && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Available Packages</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {selectedPooja.packages.map((pkg: any, idx: number) => (
                                                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-xs font-bold text-slate-900">{pkg.name}</span>
                                                            <span className="text-xs font-bold text-primary">₹{pkg.price}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 line-clamp-2">{pkg.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Process Steps */}
                                    {selectedPooja.processSteps && selectedPooja.processSteps.length > 0 && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Ritual Process</h4>
                                            <div className="space-y-3">
                                                {selectedPooja.processSteps.map((step: any, idx: number) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-slate-900">{step.title}</div>
                                                            <div className="text-[10px] text-slate-500">{step.description}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => {
                                    setIsViewOpen(false);
                                    handleOpenDialog(selectedPooja);
                                }}>
                                    Edit Details
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

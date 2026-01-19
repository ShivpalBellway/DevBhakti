"use client";

import React, { useState, useEffect } from "react";
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
    Tag,
    ChevronDown,
    ChevronUp,
    ListOrdered,
    Package as PackageIcon,
    HelpCircle,
    Info,
    CheckCircle2,
    Sparkle,
    MapPin
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
import {
    fetchAllPoojasAdmin,
    createPoojaAdmin,
    updatePoojaAdmin,
    deletePoojaAdmin,
    fetchAllTemplesAdmin
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function AdminPoojasPage() {
    const [poojas, setPoojas] = useState<any[]>([]);
    const [temples, setTemples] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedPooja, setSelectedPooja] = useState<any>(null);
    const [editingPooja, setEditingPooja] = useState<any>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const { toast } = useToast();

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
        templeId: "",
        packages: [] as any[],
        processSteps: [] as any[],
        faqs: [] as any[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [poojasData, templesData] = await Promise.all([
                fetchAllPoojasAdmin(),
                fetchAllTemplesAdmin()
            ]);
            setPoojas(poojasData);
            setTemples(templesData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (pooja: any = null) => {
        setImageFile(null);
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
                templeId: pooja.templeId || "",
                packages: pooja.packages || [],
                processSteps: pooja.processSteps || [],
                faqs: pooja.faqs || []
            });
            setImagePreview(pooja.image ? (pooja.image.startsWith('http') ? pooja.image : `${API_URL.replace('/api', '')}${pooja.image}`) : "");
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
                templeId: temples.length > 0 ? temples[0].id : "",
                packages: [],
                processSteps: [],
                faqs: []
            });
            setImagePreview("");
        }
        setIsDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
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

    // Packages Handlers
    const addPackage = () => {
        setFormData({
            ...formData,
            packages: [...formData.packages, { name: "", price: 0, description: "" }]
        });
    };

    const updatePackage = (index: number, field: string, value: any) => {
        const newPackages = [...formData.packages];
        newPackages[index] = { ...newPackages[index], [field]: value };
        setFormData({ ...formData, packages: newPackages });
    };

    const removePackage = (index: number) => {
        setFormData({
            ...formData,
            packages: formData.packages.filter((_, i) => i !== index)
        });
    };

    // Process Steps Handlers
    const addStep = () => {
        setFormData({
            ...formData,
            processSteps: [...formData.processSteps, { title: "", description: "" }]
        });
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...formData.processSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, processSteps: newSteps });
    };

    const removeStep = (index: number) => {
        setFormData({
            ...formData,
            processSteps: formData.processSteps.filter((_, i) => i !== index)
        });
    };

    // FAQ Handlers
    const addFAQ = () => {
        setFormData({
            ...formData,
            faqs: [...formData.faqs, { q: "", a: "" }]
        });
    };

    const updateFAQ = (index: number, field: 'q' | 'a', value: string) => {
        const newFAQs = [...formData.faqs];
        newFAQs[index] = { ...newFAQs[index], [field]: value };
        setFormData({ ...formData, faqs: newFAQs });
    };

    const removeFAQ = (index: number) => {
        setFormData({
            ...formData,
            faqs: formData.faqs.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('price', formData.price.toString());
        submissionData.append('duration', formData.duration);
        submissionData.append('category', formData.category);
        submissionData.append('time', formData.time);
        submissionData.append('about', formData.about);
        submissionData.append('templeId', formData.templeId);
        submissionData.append('description', JSON.stringify(formData.description));
        submissionData.append('benefits', JSON.stringify(formData.benefits));
        submissionData.append('bullets', JSON.stringify(formData.bullets));
        submissionData.append('packages', JSON.stringify(formData.packages));
        submissionData.append('processSteps', JSON.stringify(formData.processSteps));
        submissionData.append('faqs', JSON.stringify(formData.faqs));

        if (imageFile) {
            submissionData.append('image', imageFile);
        }

        try {
            if (editingPooja) {
                await updatePoojaAdmin(editingPooja.id, submissionData);
                toast({ title: "Success", description: "Pooja updated successfully" });
            } else {
                await createPoojaAdmin(submissionData);
                toast({ title: "Success", description: "Pooja created successfully" });
            }
            setIsDialogOpen(false);
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save pooja",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this pooja?")) {
            try {
                await deletePoojaAdmin(id);
                toast({ title: "Success", description: "Pooja deleted successfully" });
                loadData();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete pooja",
                    variant: "destructive"
                });
            }
        }
    };

    const filteredPoojas = poojas.filter(pooja =>
        pooja.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pooja.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getImageUrl = (path: string) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith('http')) return path;
        return `${API_URL.replace('/api', '')}${path}`;
    };

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
            </div>

            {/* Poojas Table */}
            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Pooja Name</TableHead>
                            <TableHead>Temple</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">Loading poojas...</TableCell>
                            </TableRow>
                        ) : filteredPoojas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">No poojas found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredPoojas.map((pooja) => (
                                <TableRow key={pooja.id}>
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border">
                                            <img
                                                src={getImageUrl(pooja.image)}
                                                alt={pooja.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{pooja.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                            {pooja.about || (pooja.description && pooja.description[0])}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium text-slate-600">{pooja.temple?.name}</div>
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto premium-scrollbar">
                    <DialogHeader>
                        <DialogTitle>{editingPooja ? "Edit Pooja" : "Add New Pooja"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the spiritual service.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
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
                                <Label htmlFor="templeId">Temple</Label>
                                <select
                                    id="templeId"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.templeId}
                                    onChange={(e) => setFormData({ ...formData, templeId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a Temple</option>
                                    {temples.map(temple => (
                                        <option key={temple.id} value={temple.id}>{temple.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    placeholder="e.g. Aarti, Pooja"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Base Price (₹)</Label>
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="about">About Pooja (Short Summary)</Label>
                            <Textarea
                                id="about"
                                placeholder="Brief description of the pooja..."
                                value={formData.about}
                                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                className="h-24"
                            />
                        </div>

                        {/* Description Points Section */}
                        <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-slate-900">Detailed Description Points</h3>
                                </div>
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
                                            placeholder={`Point ${index + 1} (e.g. Early morning blessing aarti)`}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('description', index)}>
                                            <X className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.description.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">No description points added.</p>
                                )}
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                            <Label>Pooja Image</Label>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 relative group">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <Upload className="w-8 h-8 text-slate-300" />
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium">Upload a high-quality image</p>
                                    <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Max 5MB.</p>
                                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('image-upload')?.click()}>
                                        Select Image
                                    </Button>
                                    <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                                </div>
                            </div>
                        </div>

                        {/* Packages Section */}
                        <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PackageIcon className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-slate-900">Pooja Packages</h3>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Package
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {formData.packages.map((pkg, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-white border rounded-lg shadow-sm">
                                        <div className="col-span-4 space-y-1.5">
                                            <Label className="text-xs">Package Name</Label>
                                            <Input
                                                placeholder="e.g. Family Package"
                                                value={pkg.name}
                                                onChange={(e) => updatePackage(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <Label className="text-xs">Price (₹)</Label>
                                            <Input
                                                type="number"
                                                value={pkg.price}
                                                onChange={(e) => updatePackage(index, 'price', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-5 space-y-1.5">
                                            <Label className="text-xs">Description</Label>
                                            <Input
                                                placeholder="e.g. For 4 people"
                                                value={pkg.description}
                                                onChange={(e) => updatePackage(index, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-end justify-center pb-1">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removePackage(index)}>
                                                <X className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ritual Steps Section */}
                        <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ListOrdered className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-slate-900">Ritual Process Steps</h3>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Step
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {formData.processSteps.map((step, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-white border rounded-lg shadow-sm">
                                        <div className="col-span-1 flex items-center justify-center font-bold text-slate-400">
                                            {index + 1}
                                        </div>
                                        <div className="col-span-4 space-y-1.5">
                                            <Label className="text-xs">Step Title</Label>
                                            <Input
                                                placeholder="e.g. Sankalp"
                                                value={step.title}
                                                onChange={(e) => updateStep(index, 'title', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-6 space-y-1.5">
                                            <Label className="text-xs">Description</Label>
                                            <Input
                                                placeholder="Briefly explain the step..."
                                                value={step.description}
                                                onChange={(e) => updateStep(index, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-end justify-center pb-1">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                                                <X className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="space-y-4 p-4 border rounded-xl bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-slate-900">Frequently Asked Questions</h3>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addFAQ}>
                                    <Plus className="w-4 h-4 mr-2" /> Add FAQ
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {formData.faqs.map((faq, index) => (
                                    <div key={index} className="p-4 bg-white border rounded-lg shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold text-primary">FAQ #{index + 1}</Label>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFAQ(index)}>
                                                <X className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Question (e.g. What is the best time to arrive?)"
                                                value={faq.q}
                                                onChange={(e) => updateFAQ(index, 'q', e.target.value)}
                                            />
                                            <Textarea
                                                placeholder="Answer..."
                                                value={faq.a}
                                                onChange={(e) => updateFAQ(index, 'a', e.target.value)}
                                                className="h-20"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {formData.faqs.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4 italic">No FAQs added yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Benefits Array */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Benefits</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('benefits')}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
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
                                    <Label>Highlights (Bullets)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('bullets')}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
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
                                </div>
                            </div>
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

                            <div className="space-y-8 py-4">
                                {/* Top Section: Hero Style */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                                    <div className="md:col-span-4">
                                        <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md">
                                            <img
                                                src={getImageUrl(selectedPooja.image)}
                                                className="w-full h-full object-cover"
                                                alt={selectedPooja.name}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-8 space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1">
                                                <Tag className="w-3.5 h-3.5 mr-1.5" />
                                                {selectedPooja.category}
                                            </Badge>
                                            <Badge variant="outline" className="px-3 py-1 border-slate-200">
                                                <IndianRupee className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                                <span className="font-bold">{selectedPooja.price}</span>
                                            </Badge>
                                            <Badge variant="outline" className="px-3 py-1 border-slate-200">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                                {selectedPooja.time || selectedPooja.duration}
                                            </Badge>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-primary" />
                                                About this Pooja
                                            </h4>
                                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                {selectedPooja.about || "No detailed description available."}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Sacred Location</div>
                                                <div className="text-sm font-bold text-slate-900">{selectedPooja.temple?.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid Section: Highlights & Benefits */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Sparkle className="w-4 h-4 text-primary" />
                                            Detailed Highlights
                                        </h4>
                                        <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 min-h-[150px]">
                                            {selectedPooja.description && selectedPooja.description.length > 0 ? (
                                                selectedPooja.description.map((point: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 text-xs text-slate-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                        {point}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No highlights added.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            Divine Benefits
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 min-h-[150px]">
                                            {selectedPooja.benefits && selectedPooja.benefits.length > 0 ? (
                                                selectedPooja.benefits.map((benefit: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-100 text-xs text-slate-700 shadow-sm">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                        {benefit}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No benefits added.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Full Width: Packages */}
                                {selectedPooja.packages && selectedPooja.packages.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <PackageIcon className="w-4 h-4 text-primary" />
                                            Available Packages
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedPooja.packages.map((pkg: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-primary/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-sm font-bold text-slate-900">{pkg.name}</span>
                                                        <Badge className="bg-primary text-white text-[10px]">₹{pkg.price}</Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Full Width: Process Steps */}
                                {selectedPooja.processSteps && selectedPooja.processSteps.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <ListOrdered className="w-4 h-4 text-primary" />
                                            Ritual Process
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                            {selectedPooja.processSteps.map((step: any, idx: number) => (
                                                <div key={idx} className="flex gap-4 items-start">
                                                    <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 mb-0.5">{step.title}</div>
                                                        <div className="text-xs text-slate-500 leading-relaxed">{step.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Full Width: FAQs at the bottom */}
                                {selectedPooja.faqs && selectedPooja.faqs.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4 text-primary" />
                                            Frequently Asked Questions
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedPooja.faqs.map((faq: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                                    <div className="text-sm font-bold text-slate-900 mb-2 flex items-start gap-2">
                                                        <span className="text-primary font-black">Q:</span>
                                                        {faq.q}
                                                    </div>
                                                    <div className="text-xs text-slate-500 pl-6 border-l-2 border-slate-100">
                                                        <span className="font-bold text-slate-400 mr-1">A:</span>
                                                        {faq.a}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

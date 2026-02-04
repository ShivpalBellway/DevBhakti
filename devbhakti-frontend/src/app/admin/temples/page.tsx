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
    MoreVertical,
    Power,
    PowerOff,
    Calendar as CalendarIcon,
    X,
    Filter,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
    fetchAllTemplesAdmin,
    deleteTempleAdmin,
    toggleTempleStatusAdmin,
    fetchTempleUpdateRequests,
    fetchCommissionSlabsAdmin
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import TemplePreview from "@/components/admin/TemplePreview";

export default function TemplesManagementPage() {
    const router = useRouter();
    const [temples, setTemples] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTemple, setSelectedTemple] = useState<any>(null);
    const [selectedTempleFilter, setSelectedTempleFilter] = useState<string>("all");
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [updateRequestsCount, setUpdateRequestsCount] = useState(0);
    const { toast } = useToast();

    // Slabs State
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [globalSlabs, setGlobalSlabs] = useState<any[]>([]);
    const [approvalData, setApprovalData] = useState<any>({
        id: "",
        slug: "",
        subdomain: "",
        urlType: "slug",
        slabs: []
    });

    useEffect(() => {
        loadTemples();
        loadUpdateRequestsCount();
    }, []);

    const loadUpdateRequestsCount = async () => {
        try {
            const requests = await fetchTempleUpdateRequests();
            setUpdateRequestsCount(requests.length);
        } catch (error) {
            console.error("Failed to load update requests count", error);
        }
    };

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
                    temple: user.temple, // Explicitly include temple object
                    templeId: user.temple.id,
                    templeName: user.temple.name,
                    templeLocation: user.temple.location,
                    ...user.temple // Keep spread for compatibility with other fields if needed
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

    const handleToggleStatus = async (id: string, currentVerified: boolean, currentActive: boolean, templeName?: string) => {
        if (!currentVerified) {
            try {
                const response = await fetchCommissionSlabsAdmin('GLOBAL');
                const slabs = response.success ? response.data : [];

                const generatedSlug = templeName ? templeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "";
                setApprovalData({
                    id,
                    slug: generatedSlug,
                    subdomain: generatedSlug,
                    urlType: "slug",
                    slabs: slabs.map((s: any) => ({
                        minAmount: s.minAmount,
                        maxAmount: s.maxAmount,
                        platformFee: s.platformFee.toString(),
                        percentage: s.percentage.toString()
                    }))
                });
                setApprovalModalOpen(true);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load commission slabs" });
            }
        } else {
            if (window.confirm("Are you sure you want to revoke verification for this temple?")) {
                try {
                    await toggleTempleStatusAdmin(id, false, currentActive);
                    toast({ title: "Success", description: "Temple verification revoked" });
                    await loadTemples();
                } catch (error) {
                    toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                }
            }
        }
    };

    const handleConfirmApproval = async () => {
        try {
            await toggleTempleStatusAdmin(
                approvalData.id,
                true, // isVerified
                true, // isActive
                {
                    slug: approvalData.slug,
                    subdomain: approvalData.subdomain,
                    urlType: approvalData.urlType,
                    commissionSlabs: approvalData.slabs.map((s: any) => ({
                        minAmount: parseFloat(s.minAmount),
                        maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                        platformFee: parseFloat(s.platformFee),
                        percentage: parseFloat(s.percentage)
                    }))
                }
            );
            toast({ title: "Success", description: "Temple Approved Successfully" });
            setApprovalModalOpen(false);
            loadTemples();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to approve temple",
                variant: "destructive"
            });
        }
    };



    const handleToggleActive = async (id: string, currentVerified: boolean, currentActive: boolean) => {
        console.log('Toggle Active Called:', { id, currentVerified, currentActive, newValue: !currentActive });
        try {
            const response = await toggleTempleStatusAdmin(id, currentVerified, !currentActive);
            console.log('API Response:', response);
            toast({
                title: "Success",
                description: `Temple ${!currentActive ? 'activated' : 'deactivated'} successfully`
            });
            await loadTemples();
        } catch (error: any) {
            console.error('Toggle Active Error:', error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update status",
                variant: "destructive"
            });
        }
    };

    const filteredTemples = temples.filter((inst) => {
        const matchesSearch =
            inst.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.templeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.templeLocation?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTemple =
            selectedTempleFilter === "all"
                ? true
                : inst.templeId === selectedTempleFilter;

        const matchesDate = date
            ? new Date(inst.temple?.createdAt || inst.createdAt).toDateString() === date.toDateString()
            : true;

        return matchesSearch && matchesTemple && matchesDate;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Temple Management</h1>
                    <p className="text-muted-foreground">Manage temple administrator accounts and temple profiles.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/temples/update-requests')} className="border-primary text-primary hover:bg-primary/10 relative">
                        <Clock className="w-4 h-4 mr-2" />
                        Update Requests
                        {updateRequestsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white ring-2 ring-white">
                                {updateRequestsCount}
                            </span>
                        )}
                    </Button>
                    <Button onClick={() => router.push('/admin/temples/create')} className="bg-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Temple
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by owner, temple, or location..."
                        className="pl-10 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="w-full md:w-[200px]">
                        <Select value={selectedTempleFilter} onValueChange={setSelectedTempleFilter}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select Temple" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Temples</SelectItem>
                                {temples.map((inst) => (
                                    <SelectItem key={inst.userId} value={inst.templeId || inst.userId}>
                                        {inst.templeName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[180px] h-10 justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Filter by date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {(date || selectedTempleFilter !== "all" || searchTerm) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setDate(undefined);
                                    setSelectedTempleFilter("all");
                                    setSearchTerm("");
                                }}
                                className="h-10 w-10 text-muted-foreground"
                                title="Clear all filters"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
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
                                            {/* Verification Status Dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    {inst.isVerified ? (
                                                        <div className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-semibold">Verified</span>
                                                            <MoreVertical className="w-3 h-3 ml-auto" />
                                                        </div>
                                                    ) : (
                                                        <div className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-semibold">Pending</span>
                                                            <MoreVertical className="w-3 h-3 ml-auto" />
                                                        </div>
                                                    )}
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!inst.isVerified && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleStatus(inst.userId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                                className="text-emerald-600"
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Approve Temple
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    {inst.isVerified && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleStatus(inst.userId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                            className="text-amber-600"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Revoke Verification
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {/* Active/Inactive Status */}
                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${inst.temple?.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                                                    }`}>
                                                    {inst.temple?.isActive ? (
                                                        <><Power className="w-3 h-3" /> Active</>
                                                    ) : (
                                                        <><PowerOff className="w-3 h-3" /> Inactive</>
                                                    )}
                                                </div>
                                                <Switch
                                                    checked={inst.temple?.isActive || false}
                                                    onCheckedChange={() => handleToggleActive(inst.userId, inst.isVerified, inst.temple?.isActive || false)}
                                                    disabled={!inst.isVerified}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
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

            {/* Approval Modal */}
            <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Temple Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* URL Configuration Section */}
                        <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">🌐 Public URL Configuration</label>

                            {/* URL Type Selection */}
                            <div className="flex items-center gap-6 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="urlTypeApproval"
                                        value="slug"
                                        checked={approvalData.urlType === "slug"}
                                        onChange={e => setApprovalData({ ...approvalData, urlType: e.target.value })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-[13px] font-semibold text-slate-700">Slug</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="urlTypeApproval"
                                        value="subdomain"
                                        checked={approvalData.urlType === "subdomain"}
                                        onChange={e => setApprovalData({ ...approvalData, urlType: e.target.value })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-[13px] font-semibold text-slate-700">Subdomain</span>
                                </label>
                            </div>

                            {/* Slug Field */}
                            {approvalData.urlType === "slug" && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground bg-white px-2 py-2 rounded-l-md border border-r-0 font-mono">devbhakti.in/temples/</span>
                                        <Input
                                            value={approvalData.slug}
                                            onChange={e => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                setApprovalData({ ...approvalData, slug: val, subdomain: val });
                                            }}
                                            placeholder="temple-slug"
                                            className="rounded-l-none font-mono h-8 text-xs"
                                        />
                                    </div>
                                    <p className="text-[10px] font-mono text-blue-600 truncate">
                                        Preview: https://devbhakti.in/temples/{approvalData.slug || "---"}
                                    </p>
                                </div>
                            )}

                            {/* Subdomain Field */}
                            {approvalData.urlType === "subdomain" && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        <Input
                                            value={approvalData.subdomain}
                                            onChange={e => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                setApprovalData({ ...approvalData, subdomain: val, slug: val });
                                            }}
                                            placeholder="subdomain"
                                            className="rounded-r-none font-mono h-8 text-xs"
                                        />
                                        <span className="text-[10px] text-muted-foreground bg-white px-2 py-2 rounded-r-md border border-l-0 font-mono">.devbhakti.in</span>
                                    </div>
                                    <p className="text-[10px] font-mono text-blue-600 truncate">
                                        Preview: https://{approvalData.subdomain || "---"}.devbhakti.in
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Slab management */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">💰 Platform Fee Slabs</label>
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {approvalData.slabs?.map((slab: any, index: number) => (
                                    <div key={index} className="grid grid-cols-2 gap-3 items-center pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                                        <div className="text-[11px] font-semibold text-slate-600">
                                            ₹{slab.minAmount} - {slab.maxAmount ? `₹${slab.maxAmount}` : '∞'}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                                                <Input
                                                    type="number"
                                                    value={slab.platformFee}
                                                    onChange={(e) => {
                                                        const newSlabs = [...approvalData.slabs];
                                                        newSlabs[index].platformFee = e.target.value;
                                                        setApprovalData({ ...approvalData, slabs: newSlabs });
                                                    }}
                                                    className="pl-5 h-8 text-xs font-mono"
                                                    placeholder="Fee"
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={slab.percentage}
                                                    onChange={(e) => {
                                                        const newSlabs = [...approvalData.slabs];
                                                        newSlabs[index].percentage = e.target.value;
                                                        setApprovalData({ ...approvalData, slabs: newSlabs });
                                                    }}
                                                    className="pr-5 h-8 text-xs text-right font-mono"
                                                    placeholder="%"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {approvalData.slabs?.length === 0 && (
                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No slabs defined. Using system defaults.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg flex gap-2 items-start">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>This will activate the temple account, send a welcome email, and make the temple profile public with the configured settings.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setApprovalModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmApproval} className="bg-emerald-600 hover:bg-emerald-700">Approve & Live</Button>
                    </div>
                </DialogContent>
            </Dialog>

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

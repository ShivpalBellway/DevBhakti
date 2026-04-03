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
    ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
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
    fetchCommissionSlabsAdmin,
    fetchTempleCategories
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import TemplePreview from "@/components/admin/TemplePreview";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";

function TemplesContent() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");
    const qParam = searchParams.get("q");

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
    const { hasPermission } = useAdminAuth();


    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState("verified");
    const [allTemplesForFilter, setAllTemplesForFilter] = useState<any[]>([]);
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Slabs State
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [globalSlabs, setGlobalSlabs] = useState<any[]>([]);
    const [approvalData, setApprovalData] = useState<any>({
        id: "",
        slug: "",
        subdomain: "",
        urlType: "slug",
        slabs: [],
        poojaSlabs: [],
        marketplaceSlabs: []
    });

    useEffect(() => {
        if (qParam) setSearchTerm(qParam);
        else if (idParam) setSearchTerm(idParam);

        // If coming from dashboard pending approvals, it's likely unverified
        if (idParam && window.location.search.includes('q=')) {
            // We can guess it's unverified if it came from pending
            setActiveTab("unverified");
        }
    }, [idParam, qParam]);

    useEffect(() => {
        fetchAllTemplesAdmin().then(data => {
            if (Array.isArray(data)) {
                setAllTemplesForFilter(data.filter((u: any) => u.temple).map((u: any) => ({
                    userId: u.id,
                    templeId: u.temple.id,
                    templeName: u.temple.name
                })));
            } else if (data.data) {
                setAllTemplesForFilter(data.data.filter((u: any) => u.temple).map((u: any) => ({
                    userId: u.id,
                    templeId: u.temple.id,
                    templeName: u.temple.name
                })));
            }
        });

        fetchTempleCategories().then(res => {
            if (res.success && Array.isArray(res.data)) {
                setDynamicDeities(res.data);
            }
        });
    }, []);

    const [selectedDeity, setSelectedDeity] = useState<string>("all");
    const [transactionRange, setTransactionRange] = useState<string>("all");
    const [stateFilter, setStateFilter] = useState<string>("");
    const [districtFilter, setDistrictFilter] = useState<string>("");
    const [dynamicDeities, setDynamicDeities] = useState<string[]>([]);

    useEffect(() => {
        if (currentPage === 1) {
            loadTemples(1);
        } else {
            setCurrentPage(1);
        }
        loadUpdateRequestsCount();
    }, [debouncedSearch, activeTab, selectedTempleFilter, date, selectedDeity, transactionRange, stateFilter, districtFilter]);

    useEffect(() => {
        if (currentPage !== 1) {
            loadTemples(currentPage);
        }
    }, [currentPage]);

    const loadUpdateRequestsCount = async () => {
        try {
            const requests = await fetchTempleUpdateRequests();
            setUpdateRequestsCount(requests.length);
        } catch (error) {
            console.error("Failed to load update requests count", error);
        }
    };

    const loadTemples = async (page: number) => {
        setIsLoading(true);
        try {
            const res = await fetchAllTemplesAdmin({
                page,
                limit: itemsPerPage,
                search: debouncedSearch,
                isVerified: activeTab === "verified",
                templeId: idParam || (selectedTempleFilter === "all" ? undefined : selectedTempleFilter),
                date: date ? date.toISOString() : undefined,
                deity: selectedDeity === "all" ? undefined : selectedDeity,
                transactionRange: transactionRange === "all" ? undefined : transactionRange,
                state: stateFilter || undefined,
                district: districtFilter || undefined
            });

            const data = Array.isArray(res) ? res : res.data;

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

            if (res.pagination) {
                setTotalPages(res.pagination.totalPages);
                setTotalItems(res.pagination.total);
                setCurrentPage(res.pagination.page);
            } else {
                setTotalPages(1);
                setTotalItems(actualTemples.length);
            }
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
                toast({
                    title: "Success",
                    description: "Temple account deleted successfully",
                    variant: "success"
                });
                loadTemples(currentPage);
            } catch (error: any) {
                console.error('Delete error:', error);

                // Check if error has relatedData from backend
                const errorData = error.response?.data;

                if (errorData?.relatedData) {
                    // Build detailed message showing what data exists
                    const dataItems = [];
                    if (errorData.relatedData.products) {
                        dataItems.push(`${errorData.relatedData.products} Product${errorData.relatedData.products > 1 ? 's' : ''}`);
                    }
                    if (errorData.relatedData.bookings) {
                        dataItems.push(`${errorData.relatedData.bookings} Booking${errorData.relatedData.bookings > 1 ? 's' : ''}`);
                    }
                    if (errorData.relatedData.poojas) {
                        dataItems.push(`${errorData.relatedData.poojas} Pooja${errorData.relatedData.poojas > 1 ? 's' : ''}`);
                    }
                    if (errorData.relatedData.events) {
                        dataItems.push(`${errorData.relatedData.events} Event${errorData.relatedData.events > 1 ? 's' : ''}`);
                    }

                    const detailedMessage = dataItems.length > 0
                        ? `Cannot delete this temple. It has: ${dataItems.join(', ')}. Please remove this data first.`
                        : errorData.error || "Cannot delete this temple. It has existing data.";

                    toast({
                        title: "❌ Cannot Delete Temple",
                        description: detailedMessage,
                        variant: "destructive",
                    });
                } else {
                    // Fallback for other errors
                    toast({
                        title: "Error",
                        description: errorData?.error || errorData?.message || "Failed to delete temple account",
                        variant: "destructive",
                    });
                }
            }
        }
    };

    const handleToggleStatus = async (id: string, templeId: string, currentVerified: boolean, currentActive: boolean, templeName?: string) => {
        if (!currentVerified) {
            try {
                // First try to fetch existing slabs for this temple
                let slabs = [];

                // 1. Try fetching existing TEMPLE specific slabs using the TEMPLE ID
                const templeSlabsResponse = await fetchCommissionSlabsAdmin('TEMPLE', templeId);
                if (templeSlabsResponse.success && templeSlabsResponse.data && templeSlabsResponse.data.length > 0) {
                    slabs = templeSlabsResponse.data;
                } else {
                    // 2. Fallback to GLOBAL slabs if no specific slabs exist
                    const globalResponse = await fetchCommissionSlabsAdmin('GLOBAL');
                    slabs = globalResponse.success ? globalResponse.data : [];
                }

                const generatedSlug = templeName ? templeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "";

                // Deduplicate slabs based on unique properties (minAmount + classification) to prevent UI duplication issues
                const uniqueSlabs = slabs.filter((s: any, index: number, self: any[]) =>
                    index === self.findIndex((t: any) => (
                        t.minAmount === s.minAmount &&
                        t.category === s.category &&
                        t.slabType === s.slabType
                    ))
                );

                // Separate slabs by category
                const poojaSlabs = uniqueSlabs.filter((s: any) => s.category === 'POOJA').map((s: any) => ({
                    minAmount: s.minAmount,
                    maxAmount: s.maxAmount,
                    platformFee: s.platformFee.toString(),
                    percentage: s.percentage.toString(),
                    category: s.category
                }));

                const marketplaceSlabs = uniqueSlabs.filter((s: any) => s.category === 'MARKETPLACE' || !s.category).map((s: any) => ({
                    minAmount: s.minAmount,
                    maxAmount: s.maxAmount,
                    platformFee: s.platformFee.toString(),
                    percentage: s.percentage.toString(),
                    category: 'MARKETPLACE'
                }));

                setApprovalData({
                    id,
                    slug: generatedSlug,
                    subdomain: generatedSlug,
                    urlType: "slug",
                    poojaSlabs,
                    marketplaceSlabs,
                    slabs: [] // Keeping this for backward compatibility if needed, but we rely on split slabs
                });
                setApprovalModalOpen(true);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load commission slabs" });
            }
        } else {
            if (window.confirm("Are you sure you want to revoke verification for this temple?")) {
                try {
                    await toggleTempleStatusAdmin(id, false, currentActive);
                    toast({ title: "Success", description: "Temple verification revoked", variant: "success" });
                    await loadTemples(currentPage);
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
                    commissionSlabs: [
                        ...approvalData.poojaSlabs.map((s: any) => ({
                            minAmount: parseFloat(s.minAmount),
                            maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                            platformFee: parseFloat(s.platformFee),
                            percentage: parseFloat(s.percentage),
                            category: 'POOJA'
                        })),
                        ...approvalData.marketplaceSlabs.map((s: any) => ({
                            minAmount: parseFloat(s.minAmount),
                            maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                            platformFee: parseFloat(s.platformFee),
                            percentage: parseFloat(s.percentage),
                            category: 'MARKETPLACE'
                        }))
                    ]
                }
            );
            toast({ title: "Success", description: "Temple Approved Successfully", variant: "success" });
            setApprovalModalOpen(false);
            loadTemples(currentPage);
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
            await loadTemples(currentPage);
        } catch (error: any) {
            console.error('Toggle Active Error:', error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update status",
                variant: "destructive"
            });
        }
    };

    const handleToggleLiveStatus = async (id: string, currentVerified: boolean, currentActive: boolean, currentLiveStatus: boolean | undefined) => {
        try {
            await toggleTempleStatusAdmin(id, currentVerified, currentActive, {
                liveStatus: !currentLiveStatus,
            });
            toast({
                title: "Success",
                description: `Temple live status ${!currentLiveStatus ? 'enabled' : 'disabled'} successfully`
            });
            await loadTemples(currentPage);
        } catch (error: any) {
            console.error('Toggle Live Status Error:', error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update live status",
                variant: "destructive"
            });
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        Temple Management
                        {/* <ChevronRight className="w-6 h-6 text-slate-400" />
                        <span className="text-slate-500 font-medium text-[20px]">
                            {activeTab === 'verified' ? 'Verified Temples' : 'Pending Verification'}
                        </span> */}
                    </h1>
                    <p className="text-slate-600">Manage temple administrator accounts and temple profiles.</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission("temples.requests_view") && (
                        <Button variant="outline" onClick={() => router.push('/admin/temples/update-requests')} className="border-primary text-primary hover:bg-primary/10 relative">
                            <Clock className="w-4 h-4 mr-2" />
                            Update Requests
                            {updateRequestsCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white ring-2 ring-white">
                                    {updateRequestsCount}
                                </span>
                            )}
                        </Button>
                    )}
                    {hasPermission("temples.create") && (
                        <Button onClick={() => router.push('/admin/temples/create')} className="bg-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Temple
                        </Button>
                    )}
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
                    <div className="w-full md:w-[150px]">
                        <Select value={selectedDeity} onValueChange={setSelectedDeity}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Deity/God" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Deities</SelectItem>
                                {dynamicDeities.map(deity => (
                                    <SelectItem key={deity} value={deity}>{deity}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-[150px]">
                        <Select value={transactionRange} onValueChange={setTransactionRange}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Transactions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Trans.</SelectItem>
                                <SelectItem value="less_100">Less than 100 PM</SelectItem>
                                <SelectItem value="101_250">101 to 250 PM</SelectItem>
                                <SelectItem value="251_500">251 to 500 PM</SelectItem>
                                <SelectItem value="501_1000">501 to 1000 PM</SelectItem>
                                <SelectItem value="more_1000">1000+ PM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-[150px]">
                        <Input
                            placeholder="State..."
                            className="h-10"
                            value={stateFilter}
                            onChange={(e) => setStateFilter(e.target.value)}
                        />
                    </div>

                    <div className="w-full md:w-[150px]">
                        <Input
                            placeholder="District..."
                            className="h-10"
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                        />
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
                        {(date || selectedTempleFilter !== "all" || searchTerm || selectedDeity !== "all" || transactionRange !== "all" || stateFilter || districtFilter) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setDate(undefined);
                                    setSelectedTempleFilter("all");
                                    setSearchTerm("");
                                    setSelectedDeity("all");
                                    setTransactionRange("all");
                                    setStateFilter("");
                                    setDistrictFilter("");
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

            {/* Tabs for Verified vs Pending */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    {/* <TabsList>
                        <TabsTrigger value="verified" className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Verified Temples
                        </TabsTrigger>
                        <TabsTrigger value="unverified" className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            Pending Verification
                        </TabsTrigger>
                    </TabsList> */}





                    <TabsList className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl">

                        {/* VERIFIED TAB */}
                        <TabsTrigger
                            value="verified"
                            className="flex items-center gap-2 rounded-lg 
    data-[state=active]:bg-emerald-600 
    data-[state=active]:text-white"
                        >
                            <CheckCircle className="w-4 h-4 text-emerald-900 data-[state=active]:text-white" />
                            Verified Temples
                        </TabsTrigger>

                        {/* PENDING TAB */}
                        <TabsTrigger
                            value="unverified"
                            className="flex items-center gap-2 rounded-lg 
    data-[state=active]:bg-amber-500 
    data-[state=active]:text-white"
                        >
                            <Clock className="w-4 h-4 text-amber-600 data-[state=active]:text-white" />
                            Pending Verification
                        </TabsTrigger>

                    </TabsList>
                </div>

                <TabsContent value="verified">
                    <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/100">
                                <TableRow>
                                    <TableHead>Temple Profile</TableHead>
                                    <TableHead>Temple ID</TableHead>
                                    <TableHead>Temple Owner</TableHead>
                                    {/* <TableHead>Statistics</TableHead> */}
                                    <TableHead>Status</TableHead>
                                    <TableHead>Live</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <span>Loading data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : temples.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            No temples found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    temples.map((inst) => (
                                        <TableRow key={inst.userId} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                        <Building2 className="w-4 h-4 text-primary" />
                                                        <span>{inst.templeName || "No Temple"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[12px] text-dark-foreground">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{inst.templeLocation || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {inst.templeId || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{inst.userName || "N/A"}</span>
                                                    <span className="text-[13px] text-slate-800">{inst.userEmail || inst.userPhone || "N/A"}</span>
                                                    <span className="text-[13px] text-slate-800">{inst.userPhone || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            {/* <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${inst.temple?.liveStatus
                                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                                                        }`}>
                                                        {inst.temple?.liveStatus ? (
                                                            <><Power className="w-3 h-3" /> Live</>
                                                        ) : (
                                                            <><PowerOff className="w-3 h-3" /> Offline</>
                                                        )}
                                                    </div>
                                                    <Switch
                                                        checked={inst.temple?.liveStatus || false}
                                                        onCheckedChange={() => handleToggleLiveStatus(
                                                            inst.userId,
                                                            inst.isVerified,
                                                            inst.temple?.isActive || false,
                                                            inst.temple?.liveStatus || false
                                                        )}
                                                        disabled={!inst.isVerified}
                                                    />
                                                </div>
                                            </TableCell> */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-[14px]">
                                                    <span className="text-slate-800">Poojas: {inst._count?.poojas || 0}</span>
                                                    <span className="text-slate-800">Events: {inst._count?.events || 0}</span>
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
                                                            {!inst.isVerified && hasPermission("temples.verify") && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleToggleStatus(inst.userId, inst.templeId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                                        className="text-emerald-600"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Approve Temple
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}
                                                            {inst.isVerified && hasPermission("temples.verify") && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleStatus(inst.userId, inst.templeId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                                    className="text-amber-600"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    Revoke Verification
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!hasPermission("temples.verify") && (
                                                                <DropdownMenuItem disabled>
                                                                    No Action Allowed
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
                                                            disabled={!inst.isVerified || !hasPermission("temples.edit")}
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
                                                    {hasPermission("temples.edit") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600"
                                                            onClick={() => router.push(`/admin/temples/edit/${inst.userId}`)}
                                                            title="Edit Temple Account"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission("temples.delete") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => handleDelete(inst.userId)}
                                                            title="Delete Temple Account"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent >

                <TabsContent value="unverified">
                    <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/100">
                                <TableRow>
                                    <TableHead>Temple Profile</TableHead>
                                    <TableHead>Temple ID</TableHead>
                                    <TableHead>Temple Owner</TableHead>
                                    {/* <TableHead>Statistics</TableHead> */}
                                    <TableHead>Status</TableHead>
                                    <TableHead>Live</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <span>Loading data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : temples.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            No pending verification temples found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    temples.map((inst) => (
                                        <TableRow key={inst.userId} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                        <Building2 className="w-4 h-4 text-primary" />
                                                        <span>{inst.templeName || "No Temple"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[12px] text-dark-foreground">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{inst.templeLocation || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {inst.templeId || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{inst.userName || "N/A"}</span>
                                                    <span className="text-[13px] text-slate-800">{inst.userEmail || inst.userPhone || "N/A"}</span>
                                                    <span className="text-[13px] text-slate-800">{inst.userPhone || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            {/* <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${inst.temple?.liveStatus
                                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                                                        }`}>
                                                        {inst.temple?.liveStatus ? (
                                                            <><Power className="w-3 h-3" /> Live</>
                                                        ) : (
                                                            <><PowerOff className="w-3 h-3" /> Offline</>
                                                        )}
                                                    </div>
                                                    <Switch
                                                        checked={inst.temple?.liveStatus || false}
                                                        onCheckedChange={() => handleToggleLiveStatus(
                                                            inst.userId,
                                                            inst.isVerified,
                                                            inst.temple?.isActive || false,
                                                            inst.temple?.liveStatus || false
                                                        )}
                                                        disabled={!inst.isVerified}
                                                    />
                                                </div>
                                            </TableCell> */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-[14px]">
                                                    <span className="text-slate-800">Poojas: {inst._count?.poojas || 0}</span>
                                                    <span className="text-slate-800">Events: {inst._count?.events || 0}</span>
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
                                                            {!inst.isVerified && hasPermission("temples.verify") && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleToggleStatus(inst.userId, inst.templeId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                                        className="text-emerald-600"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Approve Temple
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}
                                                            {inst.isVerified && hasPermission("temples.verify") && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleStatus(inst.userId, inst.templeId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                                    className="text-amber-600"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    Revoke Verification
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!hasPermission("temples.verify") && (
                                                                <DropdownMenuItem disabled>
                                                                    No Action Allowed
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
                                                            disabled={!inst.isVerified || !hasPermission("temples.edit")}
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
                                                    {hasPermission("temples.edit") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600"
                                                            onClick={() => router.push(`/admin/temples/edit/${inst.userId}`)}
                                                            title="Edit Temple Account"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission("temples.delete") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => handleDelete(inst.userId)}
                                                            title="Delete Temple Account"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                        <p className="text-sm text-muted-foreground font-medium">
                            Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                            <span className="text-foreground">
                                {Math.min(currentPage * itemsPerPage, totalItems)}
                            </span>{" "}
                            of <span className="text-foreground">{totalItems}</span> results
                        </p>
                        <Pagination className="justify-end w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .map((page, idx, array) => (
                                        <React.Fragment key={page}>
                                            {idx > 0 && array[idx - 1] !== page - 1 && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handlePageChange(page);
                                                    }}
                                                    isActive={currentPage === page}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </React.Fragment>
                                    ))}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(currentPage + 1);
                                        }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </Tabs>

            {/* Approval Modal */}
            <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Approve Temple Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* URL Configuration Section */}
                        <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
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
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground bg-white px-2 py-2 rounded-l-md border sm:border-r-0 border-b-0 sm:border-b border-border font-mono whitespace-nowrap hidden sm:block">devbhakti.in/temples/</span>
                                        <span className="text-[10px] text-muted-foreground sm:hidden mb-1 block">devbhakti.in/temples/</span>
                                        <Input
                                            value={approvalData.slug}
                                            onChange={e => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                                                setApprovalData({ ...approvalData, slug: val, subdomain: val });
                                            }}
                                            placeholder="temple-slug"
                                            className="rounded-l-md sm:rounded-l-none font-mono h-8 text-xs w-full"
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

                        {/* Slab management - Pooja */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">🕉️ Pooja Platform Fee Slabs</label>
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {approvalData.poojaSlabs?.length > 0 ? (
                                    approvalData.poojaSlabs.map((slab: any, index: number) => (
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
                                                            const newSlabs = [...approvalData.poojaSlabs];
                                                            newSlabs[index].platformFee = e.target.value;
                                                            setApprovalData({ ...approvalData, poojaSlabs: newSlabs });
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
                                                            const newSlabs = [...approvalData.poojaSlabs];
                                                            newSlabs[index].percentage = e.target.value;
                                                            setApprovalData({ ...approvalData, poojaSlabs: newSlabs });
                                                        }}
                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                        placeholder="%"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Pooja slabs defined.</p>
                                )}
                            </div>
                        </div>

                        {/* Slab management - Marketplace */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">🛍️ Marketplace Platform Fee Slabs</label>
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {approvalData.marketplaceSlabs?.length > 0 ? (
                                    approvalData.marketplaceSlabs.map((slab: any, index: number) => (
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
                                                            const newSlabs = [...approvalData.marketplaceSlabs];
                                                            newSlabs[index].platformFee = e.target.value;
                                                            setApprovalData({ ...approvalData, marketplaceSlabs: newSlabs });
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
                                                            const newSlabs = [...approvalData.marketplaceSlabs];
                                                            newSlabs[index].percentage = e.target.value;
                                                            setApprovalData({ ...approvalData, marketplaceSlabs: newSlabs });
                                                        }}
                                                        className="pr-5 h-8 text-xs text-right font-mono"
                                                        placeholder="%"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Marketplace slabs defined.</p>
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

export default function TemplesManagementPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading Temples...</div>}>
            <TemplesContent />
        </Suspense>
    );
}

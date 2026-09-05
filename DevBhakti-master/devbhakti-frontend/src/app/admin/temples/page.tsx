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
    Download,
    Upload,
    FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";
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
import { DateRange } from "react-day-picker";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    fetchTempleCategories,
    fetchTempleLocations,
    fetchAllPoojasAdmin,
    createTempleAdmin
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { parseLocalizedValue } from "@/utils/textUtils";
import TempleQrDialog from "@/components/admin/TempleQrDialog";
        

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
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [updateRequestsCount, setUpdateRequestsCount] = useState(0);
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();


    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [allCount, setAllCount] = useState<number | null>(null);
    const [verifiedCount, setVerifiedCount] = useState<number | null>(null);
    const [unverifiedCount, setUnverifiedCount] = useState<number | null>(null);
    const [activeCount, setActiveCount] = useState<number | null>(null);
    const [inactiveCount, setInactiveCount] = useState<number | null>(null);
    const [itemsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState("all");
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
        marketplaceSlabs: [],
        donationSlabs: [],
        poojaRateType: "DEFAULT",
        marketplaceRateType: "DEFAULT"
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        confirmText?: string;
        cancelText?: string;
        variant?: "destructive" | "default";
        onConfirm?: () => Promise<void> | void;
    }>({
        isOpen: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "default",
        onConfirm: undefined,
    });

    // Excel feature states
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });
    const globalImportRef = React.useRef<HTMLInputElement>(null);
    const tabImportRef = React.useRef<HTMLInputElement>(null);

    const getLoc = (jsonObj: any, lang: string) => {
        if (!jsonObj) return "";
        let parsed = jsonObj;
        if (typeof jsonObj === "string" && jsonObj.trim().startsWith("{")) {
            try {
                parsed = JSON.parse(jsonObj);
            } catch (e) {
                return lang === "en" ? jsonObj : "";
            }
        }
        
        if (typeof parsed === "object" && parsed !== null) {
            return parsed[lang] || parsed["en"] || "";
        }
        
        return lang === "en" ? String(jsonObj) : "";
    };

    const handleExportExcel = async (scope: 'all' | 'verified' | 'unverified' | 'active' | 'inactive') => {
        try {
            toast({ title: "Exporting...", description: "Gathering temple data. Please wait." });
            let isVerifiedParam = undefined;
            let isActiveParam = undefined;
            if (scope === 'verified') isVerifiedParam = true;
            if (scope === 'unverified') isVerifiedParam = false;
            if (scope === 'active') isActiveParam = true;
            if (scope === 'inactive') isActiveParam = false;

            const res = await fetchAllTemplesAdmin({
                page: 1, limit: 10000, search: debouncedSearch, isVerified: isVerifiedParam, isActive: isActiveParam,
                category: selectedCategory === "all" ? undefined : selectedCategory,
                location: selectedLocation === "all" ? undefined : selectedLocation,
                ritual: selectedRitual === "all" ? undefined : selectedRitual,
            });

            const rawData = Array.isArray(res) ? res : res.data;
            if (!rawData || rawData.length === 0) {
                toast({ title: "No Data", description: "No temples found to export.", variant: "destructive" });
                return;
            }

            const exportData = rawData.filter((u:any) => u.temple).map((u: any) => {
                const t = u.temple;
                return {
                    "Admin_Name_EN": getLoc(u.name, "en"),
                    "Admin_Name_HI": getLoc(u.name, "hi"),
                    "Admin_Name_MR": getLoc(u.name, "mr"),
                    "Email": u.email || "",
                    "Phone": u.phone || "",
                    "Name_EN": getLoc(t.name, "en"),
                    "Name_HI": getLoc(t.name, "hi"),
                    "Name_MR": getLoc(t.name, "mr"),
                    "Location_EN": getLoc(t.location, "en"),
                    "Location_HI": getLoc(t.location, "hi"),
                    "Location_MR": getLoc(t.location, "mr"),
                    "Address_EN": getLoc(t.fullAddress, "en"),
                    "Address_HI": getLoc(t.fullAddress, "hi"),
                    "Address_MR": getLoc(t.fullAddress, "mr"),
                    "Category_EN": getLoc(t.category, "en"),
                    "Category_HI": getLoc(t.category, "hi"),
                    "Category_MR": getLoc(t.category, "mr"),
                    "Description_EN": getLoc(t.description, "en"),
                    "Description_HI": getLoc(t.description, "hi"),
                    "Description_MR": getLoc(t.description, "mr"),
                    "History_EN": getLoc(t.history, "en"),
                    "History_HI": getLoc(t.history, "hi"),
                    "History_MR": getLoc(t.history, "mr"),
                    "Pickup_Location_EN": getLoc(t.pickupLocation, "en"),
                    "Pickup_Location_HI": getLoc(t.pickupLocation, "hi"),
                    "Pickup_Location_MR": getLoc(t.pickupLocation, "mr"),
                    "Open_Time": t.openTime || "",
                    "Temple_Phone": t.phone || "",
                    "Website": t.website || "",
                    "Map_URL": t.mapUrl || "",
                    "Viewers": t.viewers || "",
                    "Rating": t.rating || "0",
                    "Reviews_Count": t.reviewsCount || "0",
                    "Slug": t.slug || "",
                    "Subdomain": t.subdomain || "",
                    "URL_Type": t.urlType || "slug",
                    "Is_Verified": u.isVerified ? "YES" : "NO",
                    "Is_Active": t.isActive ? "YES" : "NO",
                    "Live_Status": t.liveStatus ? "YES" : "NO",
                    "Pooja_Commission_Rate": t.poojaCommissionRate || "5.0",
                    "Product_Commission_Rate": t.productCommissionRate || "10.0",
                    "Image_URL": t.image || "",
                    "Youtube_Links": Array.isArray(t.youtubeLinks) ? t.youtubeLinks.join(", ") : (t.youtubeLinks || ""),
                    "Operating_Hours": t.operatingHours ? JSON.stringify(t.operatingHours) : "",
                    "Pooja_IDs": Array.isArray(t.poojas) ? t.poojas.map((p: any) => p.masterPoojaId || p.id).join(", ") : ""
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Temples");
            XLSX.writeFile(workbook, `temples_export_${scope}_${new Date().getTime()}.xlsx`);
            toast({ title: "Success", description: "Export downloaded successfully!" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to export data.", variant: "destructive" });
        }
    };

    const downloadTemplate = () => {
        const templateData = [{
            "Admin_Name_EN": "Admin User",
            "Admin_Name_HI": "व्यवस्थापक",
            "Admin_Name_MR": "प्रशासक",
            "Email": "temple@example.com",
            "Phone": "9876543210",
            "Name_EN": "Shri Ram Temple",
            "Name_HI": "श्री राम मंदिर",
            "Name_MR": "श्री राम मंदिर",
            "Location_EN": "Ayodhya",
            "Location_HI": "अयोध्या",
            "Location_MR": "अयोध्या",
            "Address_EN": "Ram Janmabhoomi, Ayodhya, UP",
            "Address_HI": "राम जन्मभूमि, अयोध्या",
            "Address_MR": "राम जन्मभूमी, अयोध्या",
            "Category_EN": "Rama",
            "Category_HI": "राम",
            "Category_MR": "राम",
            "Description_EN": "Historic and divine temple of Lord Ram.",
            "Description_HI": "भगवान राम का ऐतिहासिक और दिव्य मंदिर।",
            "Description_MR": "भगवान रामाचे ऐतिहासिक आणि दिव्य मंदिर.",
            "History_EN": "Ancient temple built at the birthplace of Lord Ram.",
            "History_HI": "भगवान राम के जन्मस्थान पर बना प्राचीन मंदिर।",
            "History_MR": "भगवान रामाच्या जन्मस्थानी बांधलेले प्राचीन मंदिर.",
            "Pickup_Location_EN": "Main Gate, Ram Temple",
            "Pickup_Location_HI": "मुख्य द्वार, राम मंदिर",
            "Pickup_Location_MR": "मुख्य द्वार, राम मंदिर",
            "Open_Time": "06:00 AM - 09:00 PM",
            "Temple_Phone": "9876543211",
            "Website": "https://ramtemple.com",
            "Map_URL": "https://maps.google.com/...",
            "Viewers": "10000+",
            "Rating": "5",
            "Reviews_Count": "1200",
            "Slug": "shri-ram-temple-ayodhya",
            "Subdomain": "shriram",
            "URL_Type": "slug",
            "Is_Verified": "YES",
            "Is_Active": "YES",
            "Live_Status": "NO",
            "Pooja_Commission_Rate": "5.0",
            "Product_Commission_Rate": "10.0",
            "Image_URL": "https://example.com/temple.jpg",
            "Youtube_Links": "https://youtube.com/watch?v=123, https://youtube.com/watch?v=456",
            "Operating_Hours": '[{"label":"Morning","start":"06:00 AM","end":"12:00 PM","active":true},{"label":"Evening","start":"04:00 PM","end":"09:00 PM","active":true}]',
            "Pooja_IDs": "pooja_id_1, pooja_id_2"
        }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, `temple_import_template.xlsx`);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast({ title: "Empty File", description: "No records found in Excel sheet", variant: "destructive"});
                    return;
                }

                setIsImporting(true);
                setImportProgress({ total: data.length, current: 0, success: 0, failed: 0 });
                toast({ title: "Import Started", description: `Processing ${data.length} temples...`, variant: "success" });
                let successCount = 0;
                let failCount = 0;

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    setImportProgress(p => ({ ...p, current: i + 1 }));
                    
                    try {
                        const formData = new FormData();
                        formData.append("email", String(row.Email || ""));
                        formData.append("phone", String(row.Phone || ""));
                        
                        // Admin Names
                        formData.append("adminName_en", String(row.Admin_Name_EN || ""));
                        formData.append("adminName_hi", String(row.Admin_Name_HI || ""));
                        formData.append("adminName_mr", String(row.Admin_Name_MR || ""));
                        
                        // Temple Names
                        formData.append("name_en", String(row.Name_EN || ""));
                        formData.append("name_hi", String(row.Name_HI || ""));
                        formData.append("name_mr", String(row.Name_MR || ""));
                        
                        // Locations
                        formData.append("location_en", String(row.Location_EN || ""));
                        formData.append("location_hi", String(row.Location_HI || ""));
                        formData.append("location_mr", String(row.Location_MR || ""));
                        
                        // Addresses
                        formData.append("fullAddress_en", String(row.Address_EN || ""));
                        formData.append("fullAddress_hi", String(row.Address_HI || ""));
                        formData.append("fullAddress_mr", String(row.Address_MR || ""));
                        
                        // Categories
                        formData.append("category_en", String(row.Category_EN || ""));
                        formData.append("category_hi", String(row.Category_HI || ""));
                        formData.append("category_mr", String(row.Category_MR || ""));
                        
                        // Descriptions
                        formData.append("description_en", String(row.Description_EN || ""));
                        formData.append("description_hi", String(row.Description_HI || ""));
                        formData.append("description_mr", String(row.Description_MR || ""));
                        
                        // History
                        formData.append("history_en", String(row.History_EN || ""));
                        formData.append("history_hi", String(row.History_HI || ""));
                        formData.append("history_mr", String(row.History_MR || ""));
                        
                        // Pickup Locations
                        formData.append("pickupLocation_en", String(row.Pickup_Location_EN || ""));
                        formData.append("pickupLocation_hi", String(row.Pickup_Location_HI || ""));
                        formData.append("pickupLocation_mr", String(row.Pickup_Location_MR || ""));
                        
                        // Metadata
                        formData.append("openTime", String(row.Open_Time || ""));
                        formData.append("templePhone", String(row.Temple_Phone || ""));
                        formData.append("website", String(row.Website || ""));
                        formData.append("mapUrl", String(row.Map_URL || ""));
                        formData.append("viewers", String(row.Viewers || ""));
                        formData.append("rating", String(row.Rating || "0"));
                        formData.append("reviewsCount", String(row.Reviews_Count || "0"));
                        formData.append("slug", String(row.Slug || ""));
                        formData.append("subdomain", String(row.Subdomain || ""));
                        formData.append("urlType", String(row.URL_Type || "slug"));
                        
                        // Status
                        formData.append("isVerified", (row.Is_Verified === "YES") ? "true" : "false");
                        formData.append("isActive", (row.Is_Active === "YES") ? "true" : "false");
                        formData.append("liveStatus", (row.Live_Status === "YES") ? "true" : "false");
                        
                        // Commission Rates
                        formData.append("poojaCommissionRate", String(row.Pooja_Commission_Rate || "5.0"));
                        formData.append("productCommissionRate", String(row.Product_Commission_Rate || "10.0"));
                        
                        // Associations
                        const youtubeLinks = row.Youtube_Links ? String(row.Youtube_Links).split(",").map(l => l.trim()).filter(Boolean) : [];
                        formData.append("youtubeLinks", JSON.stringify(youtubeLinks));
                        
                        if (row.Operating_Hours) {
                            formData.append("operatingHours", String(row.Operating_Hours));
                        } else {
                            formData.append("operatingHours", JSON.stringify([
                                { label: "Morning", start: "07:00 AM", end: "01:00 PM", active: true },
                                { label: "Evening", start: "05:00 PM", end: "10:00 PM", active: true }
                            ]));
                        }
                        
                        const poojaIds = row.Pooja_IDs ? String(row.Pooja_IDs).split(",").map(i => i.trim()).filter(Boolean) : [];
                        formData.append("poojaIds", JSON.stringify(poojaIds));
                        
                        // Image URL (If backend supports creating from URL, otherwise this might need logic)
                        if (row.Image_URL) formData.append("image_url", String(row.Image_URL));
                        
                        // Add an empty array for inlineEvents if backend requires it
                        formData.append("inlineEvents", JSON.stringify([]));
                        
                        // Treat as create new user/temple
                        await createTempleAdmin(formData as any);
                        successCount++;
                    } catch (err: any) {
                        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Unknown error";
                        console.error(`Failed to import row ${i+2}:`, errorMsg, err);
                        failCount++;
                        toast({
                            title: `Error in Row ${i+2}`,
                            description: errorMsg,
                            variant: "destructive"
                        });
                    }
                    setImportProgress(p => ({ ...p, success: successCount, failed: failCount }));
                }
                
                toast({ 
                    title: "Import Complete", 
                    description: `Successfully imported ${successCount} out of ${data.length} temples.`,
                    variant: successCount > 0 ? "success" : "destructive"
                });
                
                setTimeout(() => {
                    setIsImporting(false);
                    loadTemples(1);
                }, 2000);
            } catch (err) {
                console.error(err);
                toast({ title: "Format Error", description: "Could not parse Excel file.", variant: "destructive" });
                setIsImporting(false);
            }
        };
        reader.readAsBinaryString(file);
        
        // Reset file input
        if (e.target) e.target.value = "";
    };

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
                    templeName: parseLocalizedValue(u.temple.name)
                })));
            } else if (data.data) {
                setAllTemplesForFilter(data.data.filter((u: any) => u.temple).map((u: any) => ({
                    userId: u.id,
                    templeId: u.temple.id,
                    templeName: parseLocalizedValue(u.temple.name)
                })));
            }
        });

        fetchTempleCategories().then(res => {
            if (res.success && Array.isArray(res.data)) {
                setDynamicCategories(res.data);
            }
        });

        fetchTempleLocations().then(res => {
            if (res.success && Array.isArray(res.data)) {
                setDynamicLocations(res.data);
            }
        });

        // Fetch Poojas (Rituals) for filter
        fetchAllPoojasAdmin({ isMaster: true }).then(res => {
            const poojaData = Array.isArray(res) ? res : res.data;
            if (Array.isArray(poojaData)) {
                // Deduplicate master poojas by name
                const uniquePoojas = poojaData.filter((p: any, index: number, self: any[]) =>
                    index === self.findIndex((t: any) => parseLocalizedValue(t.name) === parseLocalizedValue(p.name))
                );
                setRitualTypes(uniquePoojas);
            }
        });
    }, []);

    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [transactionRange, setTransactionRange] = useState<string>("all");
    const [selectedLocation, setSelectedLocation] = useState<string>("all");
    const [selectedRitual, setSelectedRitual] = useState<string>("all");
    const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
    const [dynamicLocations, setDynamicLocations] = useState<string[]>([]);
    const [ritualTypes, setRitualTypes] = useState<any[]>([]);

    useEffect(() => {
        if (currentPage === 1) {
            loadTemples(1);
        } else {
            setCurrentPage(1);
        }
        loadUpdateRequestsCount();
    }, [debouncedSearch, activeTab, selectedTempleFilter, date, selectedCategory, transactionRange, selectedLocation, selectedRitual]);

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
            const commonFilter = {
                search: debouncedSearch,
                templeId: idParam || (selectedTempleFilter === "all" ? undefined : selectedTempleFilter),
                startDate: date?.from ? date.from.toISOString() : undefined,
                endDate: date?.to ? date.to.toISOString() : undefined,
                category: selectedCategory === "all" ? undefined : selectedCategory,
                transactionRange: transactionRange === "all" ? undefined : transactionRange,
                location: selectedLocation === "all" ? undefined : selectedLocation,
                ritual: selectedRitual === "all" ? undefined : selectedRitual
            };

            // Fetch total counts for all tabs in background
            Promise.all([
                fetchAllTemplesAdmin({ page: 1, limit: 1, ...commonFilter }),
                fetchAllTemplesAdmin({ page: 1, limit: 1, isVerified: true, ...commonFilter }),
                fetchAllTemplesAdmin({ page: 1, limit: 1, isVerified: false, ...commonFilter }),
                fetchAllTemplesAdmin({ page: 1, limit: 1, isActive: true, ...commonFilter }),
                fetchAllTemplesAdmin({ page: 1, limit: 1, isActive: false, ...commonFilter })
            ]).then(([aRes, vRes, uRes, activeRes, iRes]) => {
                setAllCount(aRes.pagination?.total ?? (Array.isArray(aRes) ? aRes.length : aRes.data?.length ?? 0));
                setVerifiedCount(vRes.pagination?.total ?? (Array.isArray(vRes) ? vRes.length : vRes.data?.length ?? 0));
                setUnverifiedCount(uRes.pagination?.total ?? (Array.isArray(uRes) ? uRes.length : uRes.data?.length ?? 0));
                setActiveCount(activeRes.pagination?.total ?? (Array.isArray(activeRes) ? activeRes.length : activeRes.data?.length ?? 0));
                setInactiveCount(iRes.pagination?.total ?? (Array.isArray(iRes) ? iRes.length : iRes.data?.length ?? 0));
            }).catch(console.error);

            let isVerifiedParam: boolean | undefined = undefined;
            let isActiveParam: boolean | undefined = undefined;

            if (activeTab === "verified") isVerifiedParam = true;
            else if (activeTab === "unverified") isVerifiedParam = false;
            else if (activeTab === "active") isActiveParam = true;
            else if (activeTab === "inactive") isActiveParam = false;

            const res = await fetchAllTemplesAdmin({
                page,
                limit: itemsPerPage,
                isVerified: isVerifiedParam,
                isActive: isActiveParam,
                ...commonFilter
            });

            const data = Array.isArray(res) ? res : res.data;



            // Extract temple objects but keep the user data properly
            const actualTemples = data
                .filter((user: any) => user.temple) // Only include users that have temples
                .map((user: any) => ({
                    // User data
                    userId: user.id,
                    userName: parseLocalizedValue(user.name),
                    userEmail: user.email,
                    userPhone: user.phone,
                    isVerified: user.isVerified,
                    // Temple data
                    temple: user.temple, // Explicitly include temple object
                    templeId: user.temple.id,
                    templeName: parseLocalizedValue(user.temple.name),
                    templeLocation: parseLocalizedValue(user.temple.location),
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

    const handleDelete = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Temple Account?",
            description: "Are you sure you want to delete this temple account? All associated logins (staff and owner) will also be deleted. A new creation of temple will be required on the platform.",
            confirmText: "Delete Account",
            cancelText: "Cancel",
            variant: "destructive",
            onConfirm: async () => {
                try {
                    await deleteTempleAdmin(id);
                    toast({
                        title: "Success",
                        description: "Temple account and all associated logins deleted successfully."
                    });
                    loadTemples(currentPage);
                } catch (error: any) {
                    console.error('Delete error:', error);
                    const errorData = error.response?.data;
                    if (errorData?.relatedData) {
                        const dataItems = [];
                        if (errorData.relatedData.products) dataItems.push(`${errorData.relatedData.products} Product${errorData.relatedData.products > 1 ? 's' : ''}`);
                        if (errorData.relatedData.bookings) dataItems.push(`${errorData.relatedData.bookings} Booking${errorData.relatedData.bookings > 1 ? 's' : ''}`);
                        if (errorData.relatedData.poojas) dataItems.push(`${errorData.relatedData.poojas} Pooja${errorData.relatedData.poojas > 1 ? 's' : ''}`);
                        if (errorData.relatedData.events) dataItems.push(`${errorData.relatedData.events} Event${errorData.relatedData.events > 1 ? 's' : ''}`);

                        const detailedMessage = dataItems.length > 0
                            ? `Cannot delete this temple. It has: ${dataItems.join(', ')}. Please remove this data first.`
                            : errorData.error || "Cannot delete this temple. It has existing data.";

                        toast({
                            title: "❌ Cannot Delete Temple",
                            description: detailedMessage,
                            variant: "destructive",
                        });
                    } else {
                        toast({
                            title: "Error",
                            description: errorData?.error || errorData?.message || "Failed to delete temple account",
                            variant: "destructive",
                        });
                    }
                }
            }
        });
    };

    const handleToggleStatus = async (id: string, templeId: string, currentVerified: boolean, currentActive: boolean, templeName?: string) => {
        if (!currentVerified) {
            try {
                // First try to fetch existing slabs for this temple
                let onlineSlabs = [];
                let offlineSlabs = [];

                // 1. Try fetching existing TEMPLE specific slabs using the TEMPLE ID
                const templeOnlineResponse = await fetchCommissionSlabsAdmin('TEMPLE', templeId, undefined, false);
                const templeOfflineResponse = await fetchCommissionSlabsAdmin('TEMPLE', templeId, undefined, true);

                if (templeOnlineResponse.success && templeOnlineResponse.data && templeOnlineResponse.data.length > 0) {
                    onlineSlabs = templeOnlineResponse.data;
                } else {
                    const globalResponse = await fetchCommissionSlabsAdmin('GLOBAL', undefined, undefined, false);
                    onlineSlabs = globalResponse.success ? globalResponse.data : [];
                }

                if (templeOfflineResponse.success && templeOfflineResponse.data && templeOfflineResponse.data.length > 0) {
                    offlineSlabs = templeOfflineResponse.data;
                } else {
                    const globalOfflineResponse = await fetchCommissionSlabsAdmin('GLOBAL', undefined, undefined, true);
                    offlineSlabs = globalOfflineResponse.success ? globalOfflineResponse.data : [];
                }

                const generatedSlug = templeName ? templeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "";

                const filterSlabs = (slabsList: any[], cat: string) => {
                    return slabsList
                        .filter((s: any) => cat === 'MARKETPLACE' ? (s.category === 'MARKETPLACE' || !s.category) : s.category === cat)
                        .map((s: any) => ({
                            minAmount: s.minAmount,
                            maxAmount: s.maxAmount,
                            platformFee: s.platformFee.toString(),
                            percentage: s.percentage.toString(),
                            category: cat
                        }));
                };

                setApprovalData({
                    id,
                    isActive: currentActive,
                    slug: generatedSlug,
                    subdomain: generatedSlug,
                    urlType: "slug",
                    poojaSlabs: filterSlabs(onlineSlabs, 'POOJA'),
                    marketplaceSlabs: filterSlabs(onlineSlabs, 'MARKETPLACE'),
                    donationSlabs: filterSlabs(onlineSlabs, 'DONATION'),
                    offlinePoojaSlabs: filterSlabs(offlineSlabs, 'POOJA'),
                    offlineMarketplaceSlabs: filterSlabs(offlineSlabs, 'MARKETPLACE'),
                    offlineDonationSlabs: filterSlabs(offlineSlabs, 'DONATION'),
                    poojaRateType: "DEFAULT",
                    marketplaceRateType: "DEFAULT",
                    donationRateType: "DEFAULT",
                    offlinePoojaRateType: "DEFAULT",
                    offlineMarketplaceRateType: "DEFAULT",
                    offlineDonationRateType: "DEFAULT",
                    activeSlabTab: "online",
                    slabs: []
                });
                setApprovalModalOpen(true);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load commission slabs" });
            }
        } else {
            setConfirmModal({
                isOpen: true,
                title: "Revoke Temple Verification?",
                description: "Are you sure you want to revoke verification for this temple? This will change the temple status to unverified.",
                confirmText: "Revoke Verification",
                cancelText: "Cancel",
                variant: "destructive",
                onConfirm: async () => {
                    try {
                        await toggleTempleStatusAdmin(id, false, currentActive);
                        toast({ title: "Success", description: "Temple verification revoked" });
                        await loadTemples(currentPage);
                    } catch (error) {
                        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
                    }
                }
            });
        }
    };

    const handleConfirmApproval = async () => {
        try {
            const onlineSlabs = [
                ...(approvalData.poojaRateType === 'CUSTOM' ? (approvalData.poojaSlabs || []).map((s: any) => ({
                    minAmount: parseFloat(s.minAmount),
                    maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                    platformFee: parseFloat(s.platformFee),
                    percentage: parseFloat(s.percentage),
                    category: 'POOJA',
                    isOffline: false
                })) : []),
                ...(approvalData.marketplaceRateType === 'CUSTOM' ? (approvalData.marketplaceSlabs || []).map((s: any) => ({
                    minAmount: parseFloat(s.minAmount),
                    maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                    platformFee: parseFloat(s.platformFee),
                    percentage: parseFloat(s.percentage),
                    category: 'MARKETPLACE',
                    isOffline: false
                })) : []),
                ...(approvalData.donationRateType === 'CUSTOM' ? (approvalData.donationSlabs || []).map((s: any) => ({
                    minAmount: parseFloat(s.minAmount),
                    maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                    platformFee: parseFloat(s.platformFee),
                    percentage: parseFloat(s.percentage),
                    category: 'DONATION',
                    isOffline: false
                })) : [])
            ];

            const offlineSlabs = [
                ...(approvalData.offlinePoojaRateType === 'CUSTOM' ? (approvalData.offlinePoojaSlabs || []).map((s: any) => ({
                    minAmount: parseFloat(s.minAmount),
                    maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                    platformFee: parseFloat(s.platformFee),
                    percentage: parseFloat(s.percentage),
                    category: 'POOJA',
                    isOffline: true
                })) : []),
                ...(approvalData.offlineMarketplaceRateType === 'CUSTOM' ? (approvalData.offlineMarketplaceSlabs || []).map((s: any) => ({
                    minAmount: parseFloat(s.minAmount),
                    maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                    platformFee: parseFloat(s.platformFee),
                    percentage: parseFloat(s.percentage),
                    category: 'MARKETPLACE',
                    isOffline: true
                })) : []),
                ...(approvalData.offlineDonationRateType === 'CUSTOM' ? (approvalData.offlineDonationSlabs || []).map((s: any) => ({
                    minAmount: parseFloat(s.minAmount),
                    maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
                    platformFee: parseFloat(s.platformFee),
                    percentage: parseFloat(s.percentage),
                    category: 'DONATION',
                    isOffline: true
                })) : [])
            ];

            await toggleTempleStatusAdmin(
                approvalData.id,
                true, // isVerified
                approvalData.isActive, // keep existing active/inactive status unchanged
                {
                    slug: approvalData.slug,
                    subdomain: approvalData.subdomain,
                    urlType: approvalData.urlType,
                    commissionSlabs: [...onlineSlabs, ...offlineSlabs]
                }
            );
            toast({ title: "Success", description: "Temple Verified Successfully" });
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        Temple Management
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600">Manage temple administrator accounts and temple profiles.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    {hasPermission("temples.requests_view") && (
                        <Button variant="outline" onClick={() => router.push('/admin/temples/update-requests')} className="border-primary text-primary hover:bg-primary/10 relative w-full sm:w-auto justify-center">
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
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <input type="file" accept=".xlsx" className="hidden" ref={globalImportRef} onChange={handleImportExcel} />
                            
                             {/* <Button variant="outline" onClick={downloadTemplate} className="border-secondary text-secondary hover:bg-secondary/10 px-3 w-full sm:w-auto" title="Download Template">
                                <FileSpreadsheet className="w-4 h-4" />
                            </Button>  */}
                             
                           {/* <Button variant="outline" onClick={() => globalImportRef.current?.click()} className="border-amber-600 text-amber-600 hover:bg-amber-50 px-3 w-full sm:w-auto" title="Import All Temples">
                                <Upload className="w-4 h-4" />
                            </Button>   */}
{/* 
                            <Button variant="outline" onClick={() => handleExportExcel('all')} className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-3 w-full sm:w-auto" title="Export All Temples">
                                <Download className="w-4 h-4" />
                            </Button>  */}

                            <Button onClick={() => router.push('/admin/temples/create')} className="bg-primary w-full sm:w-auto justify-center">
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Temple
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative flex-1 w-full max-w-2xl group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by owner, temple name or ID..."
                        className="pl-10 h-10 w-full bg-white/50 border-primary/10 focus:border-primary/30 focus:ring-primary/10 rounded-xl transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {/* Divine Category Filter */}
                    <div className="w-full">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-10 w-full bg-white/50 border-primary/10 rounded-xl">
                                <SelectValue placeholder="Divine Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Categories</SelectItem>
                                {dynamicCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sanctum Location Filter */}
                    <div className="w-full">
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger className="h-10 w-full bg-white/50 border-primary/10 rounded-xl">
                                <SelectValue placeholder="Sanctum Location" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Locations</SelectItem>
                                {dynamicLocations.map(loc => (
                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ritual Type Filter */}
                    <div className="w-full">
                        <Select value={selectedRitual} onValueChange={setSelectedRitual}>
                            <SelectTrigger className="h-10 w-full bg-white/50 border-primary/10 rounded-xl">
                                <SelectValue placeholder="Ritual Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Poojas</SelectItem>
                                {ritualTypes.map(ritual => (
                                    <SelectItem key={ritual.id} value={parseLocalizedValue(ritual.name)}>
                                        {parseLocalizedValue(ritual.name)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Transactions Filter - KEPT */}
                    <div className="w-full">
                        <Select value={transactionRange} onValueChange={setTransactionRange}>
                            <SelectTrigger className="h-10 w-full bg-white/50 border-primary/10 rounded-xl">
                                <SelectValue placeholder="Transactions" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Trans.</SelectItem>
                                <SelectItem value="0_5">0 to 5</SelectItem>
                                <SelectItem value="5_10">5 to 10</SelectItem>
                                <SelectItem value="10_25">10 to 25</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:col-span-3 xl:col-span-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex-1 h-10 justify-start text-left font-normal border-primary/10 bg-white/50 hover:bg-white hover:border-primary/30 rounded-xl transition-all shadow-sm",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-primary/60" />
                                    <span className="truncate">
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            "Filter by Date"
                                        )}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-primary/5" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        {(date || selectedTempleFilter !== "all" || searchTerm || selectedCategory !== "all" || transactionRange !== "all" || selectedLocation !== "all" || selectedRitual !== "all") && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setDate(undefined);
                                    setSelectedTempleFilter("all");
                                    setSearchTerm("");
                                    setSelectedCategory("all");
                                    setTransactionRange("all");
                                    setSelectedLocation("all");
                                    setSelectedRitual("all");
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
                <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                    <TabsList className="grid grid-cols-2 sm:grid-cols-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto gap-1">
                        {/* ALL TEMPLES TAB */}
                        <TabsTrigger
                            value="all"
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm"
                        >
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">All {allCount !== null && `(${allCount})`}</span>
                        </TabsTrigger>

                        {/* VERIFIED TAB */}
                        <TabsTrigger
                            value="verified"
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm"
                        >
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span className="truncate">Verified {verifiedCount !== null && `(${verifiedCount})`}</span>
                        </TabsTrigger>

                        {/* PENDING TAB */}
                        <TabsTrigger
                            value="unverified"
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm"
                        >
                            <Clock className="w-4 h-4 shrink-0" />
                            <span className="truncate">Pending Verification{unverifiedCount !== null && `(${unverifiedCount})`}</span>
                        </TabsTrigger>

                        {/* ACTIVE TAB */}
                        <TabsTrigger
                            value="active"
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-all data-[state=active]:bg-teal-600 data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm"
                        >
                            <Power className="w-4 h-4 shrink-0" />
                            <span className="truncate">Active {activeCount !== null && `(${activeCount})`}</span>
                        </TabsTrigger>

                        {/* INACTIVE TAB */}
                        <TabsTrigger
                            value="inactive"
                            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-all data-[state=active]:bg-slate-700 data-[state=active]:text-white shadow-none data-[state=active]:shadow-sm"
                        >
                            <PowerOff className="w-4 h-4 shrink-0" />
                            <span className="truncate">Inactive {inactiveCount !== null && `(${inactiveCount})`}</span>
                        </TabsTrigger>
                    </TabsList>

                    {hasPermission("temples.create") && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <input type="file" accept=".xlsx" className="hidden" ref={tabImportRef} onChange={handleImportExcel} />
                            
                            <Button variant="outline" size="sm" onClick={downloadTemplate} className="border-secondary text-secondary hover:bg-secondary/10 flex-1 md:flex-none" title="Download Template">
                                <FileSpreadsheet className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Template</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => tabImportRef.current?.click()} className="border-amber-600 text-amber-600 hover:bg-amber-50 flex-1 md:flex-none" title={`Import into ${activeTab === 'verified' ? 'Verified' : 'Pending'}`}>
                                <Upload className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Import</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExportExcel(activeTab as any)} className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex-1 md:flex-none" title={`Export ${activeTab === 'verified' ? 'Verified' : 'Pending'} Temples`}>
                                <Download className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Export</span>
                            </Button>
                        </div>
                    )}
                </div>

                <TabsContent value={activeTab}>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block border rounded-xl bg-card overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/100">
                                <TableRow>
                                    <TableHead>Temple Profile</TableHead>
                                    <TableHead>Temple ID</TableHead>
                                    <TableHead>Temple Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Live</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <span>Loading data...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : temples.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
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
                                                    {inst.temple?.displayId || inst.templeId || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{inst.userName || "N/A"}</span>
                                                    <span className="text-[13px] text-slate-800">{inst.userEmail || inst.userPhone || "N/A"}</span>
                                                    <span className="text-[13px] text-slate-800">{inst.userPhone || "N/A"}</span>
                                                </div>
                                            </TableCell>
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
                                                            disabled={!hasPermission("temples.edit")}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <TempleQrDialog
                                                        temple={{
                                                            id: inst.temple?.id || inst.templeId,
                                                            slug: inst.temple?.slug,
                                                            subdomain: inst.temple?.subdomain,
                                                            urlType: inst.temple?.urlType,
                                                            name: inst.templeName || inst.temple?.name
                                                        }}
                                                        buttonLabel="QR"
                                                    />
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

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span>Loading data...</span>
                                </div>
                            </div>
                        ) : temples.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No temples found.
                            </div>
                        ) : (
                            temples.map((inst) => (
                                <Card key={inst.userId} className="border rounded-xl bg-card shadow-sm">
                                    <CardContent className="p-4 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{inst.templeName || "No Temple"}</h3>
                                                    <p className="text-sm text-slate-600 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {inst.templeLocation || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {inst.temple?.displayId || inst.templeId || "N/A"}
                                            </Badge>
                                        </div>

                                        {/* Owner Info */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-slate-700">Temple Owner</h4>
                                            <div className="bg-slate-50 rounded-lg p-3">
                                                <p className="font-medium text-slate-900">{inst.userName || "N/A"}</p>
                                                <p className="text-sm text-slate-600">{inst.userEmail || inst.userPhone || "N/A"}</p>
                                                <p className="text-sm text-slate-600">{inst.userPhone || "N/A"}</p>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-xs text-blue-600 font-medium">Poojas</p>
                                                <p className="text-lg font-bold text-blue-900">{inst._count?.poojas || 0}</p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <p className="text-xs text-green-600 font-medium">Events</p>
                                                <p className="text-lg font-bold text-green-900">{inst._count?.events || 0}</p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-700">Status</span>
                                                <div className="flex items-center gap-2">
                                                    {inst.isVerified ? (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-semibold">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-semibold">Pending</span>
                                                        </div>
                                                    )}
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
                                                </div>
                                                <Switch
                                                    checked={inst.temple?.isActive || false}
                                                    onCheckedChange={() => handleToggleActive(inst.userId, inst.isVerified, inst.temple?.isActive || false)}
                                                    disabled={!hasPermission("temples.edit")}
                                                    className="scale-90"
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div className="flex gap-2">
                                                    {!inst.isVerified && hasPermission("temples.verify") && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(inst.userId, inst.templeId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                            className="bg-emerald-600 hover:bg-emerald-700"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {inst.isVerified && hasPermission("temples.verify") && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleToggleStatus(inst.userId, inst.templeId, inst.isVerified, inst.temple?.isActive || false, inst.templeName)}
                                                            className="border-amber-600 text-amber-600 hover:bg-amber-50"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Revoke
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <TempleQrDialog
                                                        temple={{
                                                            id: inst.temple?.id || inst.templeId,
                                                            slug: inst.temple?.slug,
                                                            subdomain: inst.temple?.subdomain,
                                                            urlType: inst.temple?.urlType,
                                                            name: inst.templeName || inst.temple?.name
                                                        }}
                                                        buttonLabel="QR"
                                                    />
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
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
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
                        <DialogTitle>Verify Temple Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* URL Configuration Section */}
                        <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">Public URL Configuration</label>

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
                                        <span className="text-[10px] text-muted-foreground sm:hidden mb-1 block">devbhakti.com/temples/</span>
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
                                        Preview: https://devbhakti.com/temples/{approvalData.slug || "---"}
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

                         {/* Slab management - Tabs for Online and Offline */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between border-b pb-2">
                                <label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[11px]">Commission Slabs</label>
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setApprovalData({ ...approvalData, activeSlabTab: 'online' })}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${approvalData.activeSlabTab !== 'offline' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        🌐 Online Slabs
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApprovalData({ ...approvalData, activeSlabTab: 'offline' })}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${approvalData.activeSlabTab === 'offline' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        📍 Offline Slabs
                                    </button>
                                </div>
                            </div>

                            {/* ONLINE SLABS CONTENT */}
                            {approvalData.activeSlabTab !== 'offline' && (
                                <div className="space-y-4">
                                    {/* Online Pooja */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🕉️ Pooja Platform Fee Slabs</label>
                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                <span className={`text-[9px] font-bold ${approvalData.poojaRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                <Switch
                                                    checked={approvalData.poojaRateType === "CUSTOM"}
                                                    onCheckedChange={(checked) => setApprovalData({ ...approvalData, poojaRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                    className="scale-75"
                                                />
                                                <span className={`text-[9px] font-bold ${approvalData.poojaRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            {approvalData.poojaSlabs?.length > 0 ? (
                                                approvalData.poojaSlabs.map((slab: any, index: number) => (
                                                    <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
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
                                                                    disabled={approvalData.poojaRateType === "DEFAULT"}
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
                                                                    disabled={approvalData.poojaRateType === "DEFAULT"}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Online Pooja slabs defined.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Online Marketplace */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🛍️ Marketplace Platform Fee Slabs</label>
                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                <span className={`text-[9px] font-bold ${approvalData.marketplaceRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                <Switch
                                                    checked={approvalData.marketplaceRateType === "CUSTOM"}
                                                    onCheckedChange={(checked) => setApprovalData({ ...approvalData, marketplaceRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                    className="scale-75"
                                                />
                                                <span className={`text-[9px] font-bold ${approvalData.marketplaceRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            {approvalData.marketplaceSlabs?.length > 0 ? (
                                                approvalData.marketplaceSlabs.map((slab: any, index: number) => (
                                                    <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
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
                                                                    disabled={approvalData.marketplaceRateType === "DEFAULT"}
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
                                                                    disabled={approvalData.marketplaceRateType === "DEFAULT"}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Online Marketplace slabs defined.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Online Donation */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">💳 Online Donation Platform Fee Slabs</label>
                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                <span className={`text-[9px] font-bold ${approvalData.donationRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                <Switch
                                                    checked={approvalData.donationRateType === "CUSTOM"}
                                                    onCheckedChange={(checked) => setApprovalData({ ...approvalData, donationRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                    className="scale-75"
                                                />
                                                <span className={`text-[9px] font-bold ${approvalData.donationRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            {approvalData.donationSlabs?.length > 0 ? (
                                                approvalData.donationSlabs.map((slab: any, index: number) => (
                                                    <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
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
                                                                        const newSlabs = [...approvalData.donationSlabs];
                                                                        newSlabs[index].platformFee = e.target.value;
                                                                        setApprovalData({ ...approvalData, donationSlabs: newSlabs });
                                                                    }}
                                                                    className="pl-5 h-8 text-xs font-mono"
                                                                    placeholder="Fee"
                                                                    disabled={approvalData.donationRateType === "DEFAULT"}
                                                                />
                                                            </div>
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={slab.percentage}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...approvalData.donationSlabs];
                                                                        newSlabs[index].percentage = e.target.value;
                                                                        setApprovalData({ ...approvalData, donationSlabs: newSlabs });
                                                                    }}
                                                                    className="pr-5 h-8 text-xs text-right font-mono"
                                                                    placeholder="%"
                                                                    disabled={approvalData.donationRateType === "DEFAULT"}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Online Donation slabs defined.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* OFFLINE SLABS CONTENT */}
                            {approvalData.activeSlabTab === 'offline' && (
                                <div className="space-y-4">
                                    {/* Offline Pooja */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🕉️ Offline Pooja Platform Fee Slabs</label>
                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                <span className={`text-[9px] font-bold ${approvalData.offlinePoojaRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                <Switch
                                                    checked={approvalData.offlinePoojaRateType === "CUSTOM"}
                                                    onCheckedChange={(checked) => setApprovalData({ ...approvalData, offlinePoojaRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                    className="scale-75"
                                                />
                                                <span className={`text-[9px] font-bold ${approvalData.offlinePoojaRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            {approvalData.offlinePoojaSlabs?.length > 0 ? (
                                                approvalData.offlinePoojaSlabs.map((slab: any, index: number) => (
                                                    <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
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
                                                                        const newSlabs = [...approvalData.offlinePoojaSlabs];
                                                                        newSlabs[index].platformFee = e.target.value;
                                                                        setApprovalData({ ...approvalData, offlinePoojaSlabs: newSlabs });
                                                                    }}
                                                                    className="pl-5 h-8 text-xs font-mono"
                                                                    placeholder="Fee"
                                                                    disabled={approvalData.offlinePoojaRateType === "DEFAULT"}
                                                                />
                                                            </div>
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={slab.percentage}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...approvalData.offlinePoojaSlabs];
                                                                        newSlabs[index].percentage = e.target.value;
                                                                        setApprovalData({ ...approvalData, offlinePoojaSlabs: newSlabs });
                                                                    }}
                                                                    className="pr-5 h-8 text-xs text-right font-mono"
                                                                    placeholder="%"
                                                                    disabled={approvalData.offlinePoojaRateType === "DEFAULT"}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Offline Pooja slabs defined.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Offline Marketplace */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">🛍️ Offline Marketplace Platform Fee Slabs</label>
                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                <span className={`text-[9px] font-bold ${approvalData.offlineMarketplaceRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                <Switch
                                                    checked={approvalData.offlineMarketplaceRateType === "CUSTOM"}
                                                    onCheckedChange={(checked) => setApprovalData({ ...approvalData, offlineMarketplaceRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                    className="scale-75"
                                                />
                                                <span className={`text-[9px] font-bold ${approvalData.offlineMarketplaceRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            {approvalData.offlineMarketplaceSlabs?.length > 0 ? (
                                                approvalData.offlineMarketplaceSlabs.map((slab: any, index: number) => (
                                                    <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
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
                                                                        const newSlabs = [...approvalData.offlineMarketplaceSlabs];
                                                                        newSlabs[index].platformFee = e.target.value;
                                                                        setApprovalData({ ...approvalData, offlineMarketplaceSlabs: newSlabs });
                                                                    }}
                                                                    className="pl-5 h-8 text-xs font-mono"
                                                                    placeholder="Fee"
                                                                    disabled={approvalData.offlineMarketplaceRateType === "DEFAULT"}
                                                                />
                                                            </div>
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={slab.percentage}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...approvalData.offlineMarketplaceSlabs];
                                                                        newSlabs[index].percentage = e.target.value;
                                                                        setApprovalData({ ...approvalData, offlineMarketplaceSlabs: newSlabs });
                                                                    }}
                                                                    className="pr-5 h-8 text-xs text-right font-mono"
                                                                    placeholder="%"
                                                                    disabled={approvalData.offlineMarketplaceRateType === "DEFAULT"}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Offline Marketplace slabs defined.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Offline Donation */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">💳 Offline Donation Platform Fee Slabs</label>
                                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                                <span className={`text-[9px] font-bold ${approvalData.offlineDonationRateType === "DEFAULT" ? "text-primary" : "text-muted-foreground"}`}>DEFAULT</span>
                                                <Switch
                                                    checked={approvalData.offlineDonationRateType === "CUSTOM"}
                                                    onCheckedChange={(checked) => setApprovalData({ ...approvalData, offlineDonationRateType: checked ? "CUSTOM" : "DEFAULT" })}
                                                    className="scale-75"
                                                />
                                                <span className={`text-[9px] font-bold ${approvalData.offlineDonationRateType === "CUSTOM" ? "text-orange-600" : "text-muted-foreground"}`}>CUSTOM</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            {approvalData.offlineDonationSlabs?.length > 0 ? (
                                                approvalData.offlineDonationSlabs.map((slab: any, index: number) => (
                                                    <div key={index} className="grid grid-cols-2 gap-3 items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
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
                                                                        const newSlabs = [...approvalData.offlineDonationSlabs];
                                                                        newSlabs[index].platformFee = e.target.value;
                                                                        setApprovalData({ ...approvalData, offlineDonationSlabs: newSlabs });
                                                                    }}
                                                                    className="pl-5 h-8 text-xs font-mono"
                                                                    placeholder="Fee"
                                                                    disabled={approvalData.offlineDonationRateType === "DEFAULT"}
                                                                />
                                                            </div>
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={slab.percentage}
                                                                    onChange={(e) => {
                                                                        const newSlabs = [...approvalData.offlineDonationSlabs];
                                                                        newSlabs[index].percentage = e.target.value;
                                                                        setApprovalData({ ...approvalData, offlineDonationSlabs: newSlabs });
                                                                    }}
                                                                    className="pr-5 h-8 text-xs text-right font-mono"
                                                                    placeholder="%"
                                                                    disabled={approvalData.offlineDonationRateType === "DEFAULT"}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-center text-slate-400 py-2 italic font-mono">No Offline Donation slabs defined.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg flex gap-2 items-start">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>This will verify the temple account and save the configured online and offline settings. Active status remains controlled by the separate Active toggle.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setApprovalModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmApproval} className="bg-emerald-600 hover:bg-emerald-700">Verify Temple</Button>
                    </div>
                </DialogContent>
            </Dialog>

        {/* Import Progress Dialog */}
            <Dialog open={isImporting} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle>Importing Temples</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="text-4xl animate-bounce">ðŸ“¦</div>
                        <h3 className="text-lg font-medium text-slate-900">
                            Processing Row {importProgress.current} of {importProgress.total}
                        </h3>
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                            <div 
                                className="bg-primary h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between w-full text-sm text-slate-500">
                            <span className="text-emerald-600 font-medium">Success: {importProgress.success}</span>
                            <span className="text-red-500 font-medium">Failed: {importProgress.failed}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center w-full">Please do not close this window until the process completes.</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Confirmation Modal */}
            <AlertDialog open={confirmModal.isOpen} onOpenChange={(open) => !open && setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
                <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl max-w-md">
                    <AlertDialogHeader className="space-y-2">
                        <AlertDialogTitle className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                            {confirmModal.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {confirmModal.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 flex items-center justify-end gap-3 sm:space-x-0">
                        <AlertDialogCancel 
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                            className="h-10 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-sm"
                        >
                            {confirmModal.cancelText || "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                const action = confirmModal.onConfirm;
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                if (action) await action();
                            }}
                            className={cn(
                                "h-10 px-5 rounded-xl font-bold text-sm shadow-md transition-all",
                                confirmModal.variant === "destructive" 
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                                    : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                            )}
                        >
                            {confirmModal.confirmText || "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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

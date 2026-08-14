"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    User,
    Phone,
    Mail,
    X,
    IndianRupee,
    MapPin,
    ShieldCheck,
    Download,
    TrendingUp,
    Users,
    ChevronRight,
    Building2,
    Trash2,
    Calendar as CalendarIcon,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

import { fetchMyTempleProfile } from "@/api/templeAdminController";
import { generateReceiptHTML } from "@/utils/donationReceipt";
import { parseLocalizedValue } from "@/utils/textUtils";
import { API_URL } from "@/config/apiConfig";
import axios from "axios";

const statusConfig = {
    SUCCESS: {
        label: "Success",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
    },
};

export default function DonationClient() {
    const searchParams = useSearchParams();
    const typeParam = searchParams.get("type")?.toUpperCase(); // "ONLINE" or "OFFLINE"
    const [donationType, setDonationType] = useState<string>("all");

    useEffect(() => {
        if (typeParam === "ONLINE" || typeParam === "OFFLINE") {
            setDonationType(typeParam);
        } else {
            setDonationType("all");
        }
    }, [typeParam]);

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [donations, setDonations] = useState<any[]>([]);
    const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [templeId, setTempleId] = useState<string | null>(null);
    const [templeName, setTempleName] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [addAmount, setAddAmount] = useState("");
    const [addPaymentMethod, setAddPaymentMethod] = useState("CASH");
    const [addDonorName, setAddDonorName] = useState("");
    const [addDonorPhone, setAddDonorPhone] = useState("");
    const [addDonorEmail, setAddDonorEmail] = useState("");
    const [addAddress, setAddAddress] = useState("");
    const [addMessage, setAddMessage] = useState("");
    const [addPanNumber, setAddPanNumber] = useState("");
    const [addStatus, setAddStatus] = useState("SUCCESS");
    const amountPresets = [101, 501, 1001, 2101, 5001];
    const { toast } = useToast();

    const [stats, setStats] = useState({
        totalAmount: 0,
        totalDonors: 0,
        avgDonation: 0,
        onlineAmount: 0,
        onlineCount: 0,
        offlineAmount: 0,
        offlineCount: 0,
        growth: 12.5,
        trend: [40, 70, 45, 90, 65, 80, 95]
    });

    const sanitizePhone = (phone: string) => phone.replace(/\D/g, "").slice(0, 11);
    const isValidPhone = (phone: string) => /^\d{10,11}$/.test(phone);

    const resetAddDonationForm = () => {
        setAddAmount("");
        setAddPaymentMethod("CASH");
        setAddDonorName("");
        setAddDonorPhone("");
        setAddDonorEmail("");
        setAddAddress("");
        setAddMessage("");
        setAddPanNumber("");
        setAddStatus("SUCCESS");
    };

    const openAddDonationModal = () => {
        resetAddDonationForm();
        setAddModalOpen(true);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const profile = await fetchMyTempleProfile();
                if (profile.success && profile.data.id) {
                    setTempleId(profile.data.id);
                    setTempleName(parseLocalizedValue(profile.data.name, "en") || "Temple");
                }
            } catch (error) {
                console.error("Load Initial Data Error:", error);
            }
        };
        loadInitialData();
    }, []);

    const fetchDonations = async (page: number) => {
        if (!templeId) return;
        try {
            setLoading(true);
            const query = new URLSearchParams({
                search: debouncedSearch,
                status: statusFilter,
                page: page.toString(),
                limit: "10",
                ...(dateRange?.from && { startDate: dateRange.from.toISOString() }),
                ...(dateRange?.to && { endDate: dateRange.to.toISOString() }),
                ...(donationType !== "all" && { donationType })
            });

            const response = await axios.get(`${API_URL}/temple-admin/donations/${templeId}?${query}`, { validateStatus: () => true });
            const data = response.data;

            if (data.success) {
                setDonations(data.data);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages || 1);
                    setTotalItems(data.pagination.total || 0);
                }
            }
        } catch (error) {
            console.error("Fetch Donations Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDonation = async () => {
        if (!addAmount || Number(addAmount) <= 0) {
            toast({ title: "Validation Error", description: "Please enter a valid donation amount.", variant: "destructive" });
            return;
        }

        if (!addDonorName.trim() || !addDonorPhone.trim()) {
            toast({ title: "Validation Error", description: "Please fill donor name and phone.", variant: "destructive" });
            return;
        }

        if (!isValidPhone(addDonorPhone.trim())) {
            toast({ title: "Validation Error", description: "Please enter a 10 or 11 digit phone number.", variant: "destructive" });
            return;
        }

        if (!templeId) {
            toast({ title: "Error", description: "Temple not selected.", variant: "destructive" });
            return;
        }

        try {
            setIsCreateSubmitting(true);
            const payload = {
                amount: Number(addAmount),
                donorName: addDonorName.trim(),
                donorPhone: addDonorPhone.trim(),
                donorEmail: addDonorEmail.trim(),
                panNumber: addPanNumber.trim(),
                address: addAddress.trim(),
                message: addMessage.trim(),
                paymentMethod: addPaymentMethod,
                status: addStatus,
            };

            const response = await axios.post(`${API_URL}/temple-admin/donations/${templeId}`, payload, {
                validateStatus: () => true,
            });
            const data = response.data;

            if (data.success) {
                toast({ title: "Donation Recorded", description: "Donation entry saved successfully.", variant: "success" });
                setAddModalOpen(false);
                resetAddDonationForm();
                fetchDonations(currentPage);
                fetchStats();
            } else {
                toast({ title: "Error", description: data.message || "Could not save donation.", variant: "destructive" });
            }
        } catch (error: any) {
            console.error("Create Donation Error:", error);
            toast({ title: "Error", description: error?.message || "Failed to create donation.", variant: "destructive" });
        } finally {
            setIsCreateSubmitting(false);
        }
    };

    const fetchStats = async () => {
        if (!templeId) return;
        try {
            const response = await axios.get(`${API_URL}/temple-admin/donations/${templeId}/stats`, { validateStatus: () => true });
            const data = response.data;
            if (data.success) {
                const s = data.data;
                setStats(prev => ({
                    ...prev,
                    totalAmount: s.totalAmount,
                    totalDonors: s.totalDonors,
                    avgDonation: Math.round(s.totalAmount / (s.successCount || 1)),
                    onlineAmount: s.onlineAmount || 0,
                    onlineCount: s.onlineCount || 0,
                    offlineAmount: s.offlineAmount || 0,
                    offlineCount: s.offlineCount || 0
                }));
            }
        } catch (error) {
            console.error("Fetch Stats Error:", error);
        }
    };

    useEffect(() => {
        if (templeId) {
            fetchStats();
        }
    }, [templeId]);

    useEffect(() => {
        if (templeId) {
            fetchDonations(currentPage);
        }
    }, [templeId, debouncedSearch, statusFilter, dateRange, currentPage, donationType]);

    const handlePrintReceipt = (donation: any) => {
        const html = generateReceiptHTML({
            ...donation,
            templeName: parseLocalizedValue(donation.templeName, "en") || "Temple"
        });
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const handleSendEmail = async (id: string) => {
        try {
            setSendingEmail(true);
            const response = await axios.post(`${API_URL}/temple-admin/donations/send-email/${id}`, {}, { validateStatus: () => true });
            const data = response.data;
            if (data.success) {
                toast({ title: "Success", description: data.message || "Receipt sent successfully via email!", variant: "success" });
            } else {
                toast({ title: "Error", description: data.message || "Failed to send email", variant: "destructive" });
            }
        } catch (error) {
            console.error("Send Email Error:", error);
            toast({ title: "Error", description: "An error occurred while sending the receipt email", variant: "destructive" });
        } finally {
            setSendingEmail(false);
        }
    };

    const handleDeleteDonation = async (id: string) => {
        if (!templeId) {
            toast({ title: "Error", description: "Temple not selected.", variant: "destructive" });
            return;
        }

        try {
            setDeletingId(id);
            const token = localStorage.getItem("token");
            const response = await axios.delete(`${API_URL}/temple-admin/donations/${templeId}/${id}`, {
                validateStatus: () => true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = response.data;
            if (data && data.success) {
                toast({ title: "Deleted", description: data.message || "Donation deleted successfully.", variant: "success" });
                fetchDonations(currentPage);
                fetchStats();
            } else {
                toast({ title: "Error", description: data?.message || "Failed to delete donation.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Delete Donation Error:", error);
            toast({ title: "Error", description: "An error occurred while deleting the donation.", variant: "destructive" });
        } finally {
            setDeletingId(null);
            setPendingDeleteId(null);
        }
    };

    const handleDownloadReport = async () => {
        if (!templeId) return;
        try {
            toast({ title: "Exporting...", description: "Please wait while we prepare the Excel file." });
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/temple-admin/donations/${templeId}/export/excel?status=${statusFilter}`, {
                responseType: 'blob',
                validateStatus: () => true,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `temple_donations_${new Date().toISOString().slice(0, 10)}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                toast({ title: "Success", description: "Donations exported successfully!" });
            } else {
                throw new Error("Download failed");
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to download Excel.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">
                        Sacred Contributions
                    </h1>
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary fill-primary" />
                        Manage and track all donations received for your temple
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {donationType === "OFFLINE" && (
                        <Button
                            variant="secondary"
                            className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                            onClick={openAddDonationModal}
                        >
                            Add Donation
                        </Button>
                    )}
                    <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5" onClick={handleDownloadReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Excel
                    </Button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: "Total Collection",
                        value: `₹${stats.totalAmount.toLocaleString()}`,
                        icon: IndianRupee,
                        color: "from-amber-500/10 to-orange-500/10",
                        textColor: "text-orange-700",
                        sub: "Total received till date"
                    },
                    {
                        label: "Online Donations",
                        value: `₹${stats.onlineAmount.toLocaleString()}`,
                        icon: TrendingUp,
                        color: "from-blue-500/10 to-indigo-500/10",
                        textColor: "text-indigo-700",
                        sub: `${stats.onlineCount} online transactions`
                    },
                    {
                        label: "Offline Donations",
                        value: `₹${stats.offlineAmount.toLocaleString()}`,
                        icon: Heart,
                        color: "from-emerald-500/10 to-teal-500/10",
                        textColor: "text-teal-700",
                        sub: `${stats.offlineCount} manual entries`
                    },
                    {
                        label: "Total Donors",
                        value: stats.totalDonors,
                        icon: Users,
                        color: "from-purple-500/10 to-violet-500/10",
                        textColor: "text-violet-700",
                        sub: "Unique devotees count"
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="border-none bg-gradient-to-br shadow-sm overflow-hidden relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-60 group-hover:opacity-80 transition-opacity`} />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1">{stat.label}</p>
                                        <h3 className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</h3>
                                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">{stat.sub}</p>
                                    </div>
                                    <div className={`p-3 rounded-2xl bg-white/50 backdrop-blur-sm ${stat.textColor}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                                {i === 0 && (
                                    <div className="mt-4 h-8 flex items-end gap-1">
                                        {stats.trend.map((point, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${point}%` }}
                                                transition={{ delay: 0.5 + idx * 0.05 }}
                                                className="flex-1 bg-orange-500/20 rounded-t-sm"
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Donations List - Main Section */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-serif">Recent Donations</CardTitle>
                                    <CardDescription>History of all spiritual contributions</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] justify-start text-left font-normal h-9 text-xs border-primary/10 rounded-xl",
                                                    !dateRange && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                                            {format(dateRange.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Pick a date range</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {dateRange && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                                            onClick={() => setDateRange(undefined)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-xl border border-primary/10 transition-all min-w-0">
                                        <Filter className="w-4 h-4 text-muted-foreground ml-1.5 flex-shrink-0" />
                                        <select
                                            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-2 min-w-0 text-muted-foreground"
                                            value={donationType}
                                            onChange={(e) => {
                                                setDonationType(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <option value="all">All Types</option>
                                            <option value="ONLINE">Online</option>
                                            <option value="OFFLINE">Offline</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by ID or Donor..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="pl-9 h-9 w-[200px] text-sm bg-background/50 border-primary/10 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                                {["all", "SUCCESS"].map((status) => (
                                    <Button
                                        key={status}
                                        variant={statusFilter === status ? "sacred" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setCurrentPage(1);
                                        }}
                                        className="capitalize rounded-full text-xs h-8 px-4"
                                    >
                                        {status === "all" ? "All Status" : status.toLowerCase()}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-y border-primary/5 bg-primary/5">
                                        <tr>
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Donor</th>
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Fee</th>
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Earning</th>
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                                            <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                        {donations.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Heart className="w-12 h-12 text-muted-foreground/20" />
                                                        <p className="text-muted-foreground font-medium">No donations found in this sacred circle</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : donations.map((donation, index) => {
                                            const status = statusConfig[donation.status as keyof typeof statusConfig] || statusConfig.SUCCESS;
                                            return (
                                                <motion.tr
                                                    key={donation.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-primary/5 transition-colors group"
                                                >
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm ${donation.isAnonymous ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary border border-primary/20"}`}>
                                                                {donation.isAnonymous ? "?" : donation.donorName?.split(' ')[0]?.[0] || "D"}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{donation.donorName}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-base text-foreground">₹{donation.amount.toLocaleString()}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-medium text-sm text-rose-600">₹{(donation.commissionAmount || 0).toLocaleString()}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-sm text-emerald-600">₹{(donation.netEarning || donation.amount).toLocaleString()}</p>
                                                    </td>
                                                    <td className="p-4 text-sm text-muted-foreground">
                                                        {new Date(donation.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-center">
                                                            <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-tighter px-2 h-5 flex items-center gap-1 border-none ${status.color}`}>
                                                                <status.icon className="w-3 h-3" />
                                                                {status.label}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedDonation(donation)}>
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600"
                                                                onClick={() => setPendingDeleteId(donation.id)}
                                                                disabled={deletingId === donation.id}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4 pb-4">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                            <span className="flex items-center text-sm font-bold px-4">Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Donation Modal */}
            <AnimatePresence>
                {addModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[24px] w-full max-w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
                        >
                            <div className="bg-[#7c4624] p-5 sm:p-6 text-white relative">
                                <button
                                    onClick={() => setAddModalOpen(false)}
                                    className="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                                        <Heart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-2xl font-serif font-bold">Temple Donation Entry</h2>
                                        {templeName && (
                                            <p className="text-sm text-white/80 mt-1">
                                                Recording donation for <span className="font-semibold">{templeName}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 sm:p-7 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-3">Donation Amount</p>
                                            <Input
                                                type="number"
                                                placeholder="Amount"
                                                value={addAmount}
                                                onChange={(e) => setAddAmount(e.target.value)}
                                                className="h-9 text-sm bg-background/50 border-primary/10 rounded-xl"
                                            />
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {amountPresets.map((value) => (
                                                    <button
                                                        type="button"
                                                        key={value}
                                                        onClick={() => setAddAmount(value.toString())}
                                                        className={cn(
                                                            "rounded-full border px-3 py-2 text-xs font-semibold transition-all",
                                                            addAmount === value.toString()
                                                                ? "bg-[#7c4624] border-[#7c4624] text-white"
                                                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                                        )}
                                                    >
                                                        ₹{value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Payment Method - Fixed Dropdown */}
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Payment Method</p>
                                            <select
                                                value={addPaymentMethod}
                                                onChange={(e) => setAddPaymentMethod(e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7c4624]/20"
                                            >
                                                <option value="CASH"> Cash</option>
                                                <option value="UPI"> UPI</option>
                                                <option value="CARD"> Card</option>
                                                <option value="CHEQUE">Cheque</option>
                                                <option value="BANK">Bank Transfer</option>
                                            </select>
                                            <p className="mt-2 text-[11px] text-slate-500">
                                                The donation will be recorded for the currently selected temple.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Full Name</p>
                                            <Input
                                                placeholder="Full name"
                                                value={addDonorName}
                                                onChange={(e) => setAddDonorName(e.target.value)}
                                                className="h-9 text-sm bg-background/50 border-primary/10 rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Phone</p>
                                            <Input
                                                placeholder="Phone"
                                                value={addDonorPhone}
                                                onChange={(e) => setAddDonorPhone(sanitizePhone(e.target.value))}
                                                className="h-9 text-sm bg-background/50 border-primary/10 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Email</p>
                                            <Input
                                                placeholder="Email"
                                                value={addDonorEmail}
                                                onChange={(e) => setAddDonorEmail(e.target.value)}
                                                className="h-9 text-sm bg-background/50 border-primary/10 rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">PAN Number</p>
                                            <Input
                                                placeholder="PAN number"
                                                value={addPanNumber}
                                                onChange={(e) => setAddPanNumber(e.target.value.toUpperCase())}
                                                className="h-9 text-sm bg-background/50 border-primary/10 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Address</p>
                                        <Input
                                            placeholder="Address"
                                            value={addAddress}
                                            onChange={(e) => setAddAddress(e.target.value)}
                                            className="h-9 text-sm bg-background/50 border-primary/10 rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Prayer Message</p>
                                        <textarea
                                            value={addMessage}
                                            onChange={(e) => setAddMessage(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-primary/10 bg-background/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c4624]/20"
                                            placeholder="Enter prayer or message"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 sm:p-6 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200">
                                <Button
                                    onClick={handleCreateDonation}
                                    disabled={isCreateSubmitting}
                                    className="w-full sm:w-auto bg-[#7c4624] hover:bg-[#63361c]"
                                >
                                    {isCreateSubmitting ? "Saving..." : "Record Donation"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={resetAddDonationForm}
                                    className="w-full sm:w-auto"
                                >
                                    Clear
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Donation Detail Modal */}
            <AnimatePresence>
                {selectedDonation && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDonation(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="bg-[#7c4624] p-8 text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Heart className="w-40 h-40" />
                                </div>
                                <button
                                    onClick={() => setSelectedDonation(null)}
                                    className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-20"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                                        <Heart className="w-8 h-8 fill-white/20" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold">Contribution Details</h3>
                                        <p className="text-white/60 text-[10px] font-mono tracking-widest uppercase mt-1">Ref: {selectedDonation.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="text-center py-6 bg-slate-50 rounded-[24px] border border-slate-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Blessed Amount</p>
                                    <h4 className="text-5xl font-serif font-black text-primary">
                                        <span className="text-2xl mr-1 self-start opacity-70">₹</span>
                                        {selectedDonation.amount.toLocaleString()}
                                    </h4>
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <Badge className={`rounded-full px-3 ${(statusConfig[selectedDonation.status as keyof typeof statusConfig] || statusConfig.SUCCESS).color} border-none`}>
                                            {selectedDonation.status}
                                        </Badge>
                                        <p className="text-xs text-slate-400 font-medium">{new Date(selectedDonation.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Devotee</p>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800 flex items-center gap-2 justify-end">
                                                {selectedDonation.donorName}
                                                <User className="w-3.5 h-3.5 text-primary/40" />
                                            </p>
                                            {selectedDonation.isAnonymous && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black italic">Anonymous Entry</span>}
                                        </div>
                                    </div>

                                    {!selectedDonation.isAnonymous && (
                                        <>
                                            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                                                <div className="text-right space-y-1">
                                                    <p className="text-sm font-semibold text-slate-700">{selectedDonation.donorPhone}</p>
                                                    <p className="text-xs text-slate-500 italic">{selectedDonation.donorEmail}</p>
                                                </div>
                                            </div>
                                            {selectedDonation.address && (
                                                <div className="flex items-start justify-between border-b border-slate-50 pb-3">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Location</p>
                                                    <p className="text-xs font-medium text-slate-600 max-w-[200px] text-right leading-relaxed flex items-center gap-2 justify-end">
                                                        {selectedDonation.address}
                                                        <MapPin className="w-3 h-3 text-primary/40" />
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pay Method</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedDonation.paymentMethod}</p>
                                    </div>

                                    <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-orange-800/60 uppercase tracking-wider">Gross Amount</p>
                                            <p className="text-sm font-bold text-orange-900">₹{selectedDonation.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-orange-800/60 uppercase tracking-wider">Platform Fee</p>
                                            <p className="text-sm font-bold text-rose-600">- ₹{(selectedDonation.commissionAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="pt-2 border-t border-orange-200/50 flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-orange-900 uppercase tracking-widest">Net Temple Earning</p>
                                            <p className="text-base font-black text-emerald-600">₹{(selectedDonation.netEarning || selectedDonation.amount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {selectedDonation.message && (
                                        <div className="pt-2">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sacred Message / Sankalp</p>
                                            <p className="text-sm text-slate-600 bg-primary/5 p-4 rounded-2xl italic leading-relaxed border border-dashed border-primary/10">
                                                "{selectedDonation.message}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                                <Button
                                    className="flex-1 bg-[#7c4624] hover:bg-[#63361c] text-white rounded-[20px] h-12 font-bold shadow-lg shadow-[#7c4624]/20"
                                    onClick={() => handlePrintReceipt(selectedDonation)}
                                >
                                    <Download className="w-4 h-4 mr-2" /> Print Receipt
                                </Button>
                                <Button
                                    className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-[20px] h-12 font-bold shadow-sm"
                                    onClick={() => handleSendEmail(selectedDonation.id)}
                                    disabled={sendingEmail || !selectedDonation.donorEmail}
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    {sendingEmail ? "Sending..." : "Send Receipt"}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-[20px] h-12 font-bold"
                                    onClick={() => setSelectedDonation(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {pendingDeleteId && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPendingDeleteId(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[16px] w-full max-w-md overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="p-6 text-center">
                                <div className="flex items-center justify-center mb-4">
                                    <XCircle className="w-12 h-12 text-rose-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Delete Donation</h3>
                                <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this donation? This action cannot be undone.</p>
                                <div className="flex items-center justify-center gap-3">
                                    <Button variant="ghost" onClick={() => setPendingDeleteId(null)} className="w-28">Cancel</Button>
                                    <Button
                                        onClick={() => pendingDeleteId && handleDeleteDonation(pendingDeleteId)}
                                        className="w-28 bg-rose-600 hover:bg-rose-700 text-white"
                                        disabled={deletingId === pendingDeleteId}
                                    >
                                        {deletingId === pendingDeleteId ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
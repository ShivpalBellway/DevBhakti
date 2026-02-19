"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    Search,
    Filter,
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
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

// Mock Data for Temple
const mockDonations = [
    {
        id: "DON-TM-90123",
        donorName: "Amit Kumar",
        donorPhone: "+91 9123456780",
        donorEmail: "amit@example.com",
        amount: 11000,
        status: "SUCCESS",
        createdAt: "2024-02-19T10:30:00Z",
        isAnonymous: false,
        is80GRequired: true,
        panNumber: "PQRSR1234M",
        address: "Ayodhya, Uttar Pradesh",
        message: "Sukh Shanti ke liye.",
        paymentMethod: "UPI"
    },
    {
        id: "DON-TM-90124",
        donorName: "Priya Singh",
        donorPhone: "+91 8234567891",
        donorEmail: "priya@example.com",
        amount: 5100,
        status: "SUCCESS",
        createdAt: "2024-02-18T15:45:00Z",
        isAnonymous: false,
        is80GRequired: false,
        address: "Lucknow, Uttar Pradesh",
        paymentMethod: "Card"
    },
    {
        id: "DON-TM-90125",
        donorName: "Devotee",
        donorPhone: "N/A",
        donorEmail: "N/A",
        amount: 1100,
        status: "SUCCESS",
        createdAt: "2024-02-18T09:15:00Z",
        isAnonymous: true,
        is80GRequired: false,
        paymentMethod: "Net Banking"
    },
    {
        id: "DON-TM-90126",
        donorName: "Karan Johar",
        donorPhone: "+91 7345678902",
        donorEmail: "karan@example.com",
        amount: 25000,
        status: "PENDING",
        createdAt: "2024-02-19T12:00:00Z",
        isAnonymous: false,
        is80GRequired: true,
        panNumber: "TUVWX5678Y",
        address: "Mumbai, Maharashtra",
        message: "Blessings for the new project.",
        paymentMethod: "UPI"
    },
    {
        id: "DON-TM-90127",
        donorName: "Sanjay Dutt",
        donorPhone: "+91 9456789012",
        donorEmail: "sanjay@example.com",
        amount: 50001,
        status: "SUCCESS",
        createdAt: "2024-02-17T11:20:00Z",
        isAnonymous: false,
        is80GRequired: true,
        panNumber: "XYZAB9012C",
        address: "Mumbai, Maharashtra",
        paymentMethod: "UPI"
    }
];

const statusConfig = {
    SUCCESS: {
        label: "Success",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
    },
    PENDING: {
        label: "Pending",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
    },
    FAILED: {
        label: "Failed",
        color: "bg-rose-100 text-rose-700 border-rose-200",
        icon: XCircle,
    },
};

export default function DonationClient() {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState("all");
    const [donations, setDonations] = useState<any[]>(mockDonations);
    const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
    const { toast } = useToast();

    const stats = {
        totalAmount: mockDonations.reduce((acc, curr) => acc + (curr.status === "SUCCESS" ? curr.amount : 0), 0),
        totalDonors: new Set(mockDonations.map(d => d.donorName)).size,
        avgDonation: Math.round(mockDonations.reduce((acc, curr) => acc + (curr.status === "SUCCESS" ? curr.amount : 0), 0) / (mockDonations.filter(d => d.status === "SUCCESS").length || 1)),
        growth: 12.5,
        trend: [40, 70, 45, 90, 65, 80, 95] // Mock chart points
    };

    useEffect(() => {
        let filtered = mockDonations.filter(d => {
            const matchesSearch =
                d.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                d.donorName.toLowerCase().includes(debouncedSearch.toLowerCase());

            const matchesStatus = statusFilter === "all" || d.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        setDonations(filtered);
    }, [debouncedSearch, statusFilter]);

    const handleDownloadReport = () => {
        toast({
            title: "Report Generated",
            description: "Your donation report is being downloaded.",
        });
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
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5" onClick={handleDownloadReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        label: "Total Donors",
                        value: stats.totalDonors,
                        icon: Users,
                        color: "from-blue-500/10 to-indigo-500/10",
                        textColor: "text-indigo-700",
                        sub: "Unique devotees"
                    },
                    {
                        label: "Avg. Donation",
                        value: `₹${stats.avgDonation.toLocaleString()}`,
                        icon: TrendingUp,
                        color: "from-emerald-500/10 to-teal-500/10",
                        textColor: "text-teal-700",
                        sub: "Gift per devotee"
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
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by ID or Donor..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 h-9 w-[200px] text-sm bg-background/50 border-primary/10 rounded-xl"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-xl border border-primary/10">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                                {["all", "SUCCESS", "PENDING", "FAILED"].map((status) => (
                                    <Button
                                        key={status}
                                        variant={statusFilter === status ? "sacred" : "outline"}
                                        size="sm"
                                        onClick={() => setStatusFilter(status)}
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
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                                            <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                        {donations.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center">
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
                                                                {donation.isAnonymous ? "?" : donation.donorName.split(' ')[0][0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{donation.donorName}</p>
                                                                <p className="text-[10px] text-muted-foreground font-mono">{donation.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-base text-foreground">₹{donation.amount.toLocaleString()}</p>
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
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedDonation(donation)}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column - Top Donors & Activity */}

            </div>

            {/* Donation Detail Modal (Reusing Admin Style for consistency but refined) */}
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
                            {/* Modal Header */}
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
                                {/* Amount Hero */}
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

                                {/* Devotee Info */}
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

                            {/* Modal Footer */}
                            <div className="p-8 pt-0 flex gap-3">
                                <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-[20px] h-12 font-bold shadow-lg shadow-primary/20">
                                    Accept Blessing
                                </Button>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

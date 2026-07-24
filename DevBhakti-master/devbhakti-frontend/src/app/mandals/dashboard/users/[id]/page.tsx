"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    User,
    MapPin,
    Loader2,
    Search,
    IndianRupee,
    ShieldCheck,
    Receipt,
    CheckCircle2,
    Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchMandalDonations } from "@/api/mandalAdminController";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function MandalDevoteeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [devotee, setDevotee] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadDevoteeDetail = async () => {
            setLoading(true);
            try {
                // Fetch mandal donations to match donor by ID/Phone/Email
                const response = await fetchMandalDonations({ limit: 100 });
                if (response.success && response.data) {
                    const decoded = decodeURIComponent(id || "").toLowerCase();
                    const matchedDonations = response.data.filter((d: any) => {
                        const name = (d.donorName || "").toLowerCase();
                        const phone = (d.donorPhone || "").toLowerCase();
                        const email = (d.donorEmail || "").toLowerCase();
                        const donId = (d.id || "").toLowerCase();
                        return (
                            donId === decoded ||
                            phone === decoded ||
                            email === decoded ||
                            name === decoded ||
                            (phone && phone.includes(decoded)) ||
                            (email && email.includes(decoded))
                        );
                    });

                    if (matchedDonations.length > 0) {
                        const first = matchedDonations[0];
                        const totalAmount = matchedDonations.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
                        const has80G = matchedDonations.some((item: any) => item.is80GRequired);
                        const pan = matchedDonations.find((item: any) => item.panNumber)?.panNumber;
                        const addr = matchedDonations.find((item: any) => item.address)?.address;

                        setDevotee({
                            donorName: first.donorName || "Anonymous Devotee",
                            donorPhone: first.donorPhone,
                            donorEmail: first.donorEmail,
                            address: addr,
                            panNumber: pan,
                            is80GRequired: has80G,
                            totalAmount,
                            donationCount: matchedDonations.length,
                            donations: matchedDonations
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load devotee details:", error);
                toast({ title: "Error", description: "Failed to load devotee details", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        if (id) loadDevoteeDetail();
    }, [id]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: `${label} copied to clipboard!` });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#7b4623]" />
                <p className="text-muted-foreground font-serif">Loading devotee profile...</p>
            </div>
        );
    }

    if (!devotee) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed m-6">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-serif text-slate-700">Devotee record not found.</p>
                <Button variant="outline" className="mt-6 rounded-xl border-slate-200" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Devotees List
                </Button>
            </div>
        );
    }

    const filteredDonations = devotee.donations.filter((d: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            d.id?.toLowerCase().includes(q) ||
            d.displayId?.toLowerCase().includes(q) ||
            d.amount?.toString().includes(q) ||
            d.paymentMethod?.toLowerCase().includes(q) ||
            d.message?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full border-slate-200 hover:bg-[#7b4623] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-serif font-bold text-slate-900">
                                {devotee.donorName}
                            </h1>
                            <Badge className="bg-[#7b4623] text-white border-0">
                                Devotee Profile
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Viewing complete donation history and donor information for your mandal.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-5">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Donated</p>
                        <p className="text-2xl font-bold text-emerald-800 mt-1">
                            {formatCurrency(devotee.totalAmount)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-5">
                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Contributions</p>
                        <p className="text-2xl font-bold text-[#7b4623] mt-1">
                            {devotee.donationCount} {devotee.donationCount === 1 ? "Contribution" : "Contributions"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 col-span-2 sm:col-span-1">
                    <CardContent className="p-5">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Average Contribution</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                            {formatCurrency(Math.round(devotee.totalAmount / devotee.donationCount))}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Details & Records */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Devotee Info */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border shadow-sm overflow-hidden bg-white">
                        <div className="h-20 bg-gradient-to-r from-[#7b4623] to-[#a05a2c]" />
                        <CardContent className="pt-0 px-6 pb-6 relative">
                            <div className="-mt-10 mb-4">
                                <div className="w-20 h-20 rounded-2xl bg-[#7b4623] text-white font-bold text-2xl flex items-center justify-center border-4 border-white shadow-lg">
                                    {(devotee.donorName || "D").substring(0, 2).toUpperCase()}
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-900 text-xl">{devotee.donorName}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Mandal Devotee & Donor</p>

                            <div className="mt-6 space-y-3 border-t pt-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Contact & Details
                                </h4>

                                {devotee.donorPhone && (
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3 overflow-hidden text-xs">
                                            <Phone className="w-4 h-4 text-[#7b4623] shrink-0" />
                                            <span className="font-medium text-slate-800 truncate">{devotee.donorPhone}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(devotee.donorPhone, "Phone")}>
                                            <Copy className="w-3 h-3 text-slate-400" />
                                        </Button>
                                    </div>
                                )}

                                {devotee.donorEmail && (
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3 overflow-hidden text-xs">
                                            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span className="font-medium text-slate-800 truncate">{devotee.donorEmail}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(devotee.donorEmail, "Email")}>
                                            <Copy className="w-3 h-3 text-slate-400" />
                                        </Button>
                                    </div>
                                )}

                                {devotee.address && (
                                    <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl text-xs">
                                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span className="font-medium text-slate-800">{devotee.address}</span>
                                    </div>
                                )}
                            </div>

                            {(devotee.panNumber || devotee.is80GRequired) && (
                                <div className="mt-6 border-t pt-4 space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        80G Tax Details
                                    </h4>
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-1 text-xs">
                                        {devotee.panNumber && (
                                            <p className="flex justify-between">
                                                <span className="text-slate-500">PAN Number:</span>
                                                <span className="font-mono font-bold">{devotee.panNumber}</span>
                                            </p>
                                        )}
                                        {devotee.is80GRequired && (
                                            <p className="flex items-center gap-1 text-amber-800 font-medium pt-1">
                                                <ShieldCheck className="w-3.5 h-3.5" /> 80G Receipt Requested
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Donation History */}
                <div className="lg:col-span-8 space-y-4">
                    <Card className="border shadow-sm bg-white">
                        <CardHeader className="p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-[#7b4623]" />
                                    Donation History ({devotee.donations.length})
                                </CardTitle>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <Input
                                    placeholder="Search transactions..."
                                    className="pl-9 h-9 text-xs border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {filteredDonations.map((item: any) => (
                                    <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-emerald-800">
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            {item.status || "SUCCESS"}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        ID: #{item.displayId || item.id?.slice(-8).toUpperCase()} • {item.paymentMethod || "ONLINE"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right text-xs text-slate-500">
                                                <p className="font-medium text-slate-700">{formatDate(item.createdAt)}</p>
                                            </div>
                                        </div>

                                        {item.message && (
                                            <div className="bg-amber-50/60 border border-amber-100 p-2.5 rounded-xl text-xs text-slate-700 italic">
                                                <span className="font-semibold not-italic text-amber-900 mr-1">Note:</span>
                                                "{item.message}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

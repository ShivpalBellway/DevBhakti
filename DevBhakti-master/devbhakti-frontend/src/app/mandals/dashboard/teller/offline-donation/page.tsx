"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    IndianRupee,
    Loader2,
    Eye,
    Printer,
    Download,
    ArrowLeft,
    Filter,
    X,
    Heart,
    TrendingUp,
    CreditCard,
    Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalDonations } from "@/api/mandalAdminController";
import { generateReceiptHTML, downloadDonationReceiptPDF } from "@/utils/donationReceipt";
import AddOfflineDonationPage from "./AddOfflineDonationPage";
import * as XLSX from "xlsx";

export default function MandalOfflineDonationPage() {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<"list" | "add">("list");
    const [donations, setDonations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("ALL");
    const [selectedDonation, setSelectedDonation] = useState<any>(null);

    const loadDonations = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMandalDonations();
            if (response.success) {
                // Include all offline/counter donations (excluding online Razorpay payments)
                const offlineList = (response.data || []).filter((d: any) => {
                    return d.donationType === "OFFLINE" || d.isOffline === true || !d.razorpayPaymentId || d.paymentMethod === "CASH" || d.paymentMethod === "UPI";
                });
                setDonations(offlineList);
            } else {
                toast({ title: "Error", description: response.message || "Failed to load donations", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to load donations:", error);
            toast({ title: "Error", description: "Failed to fetch offline donations", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === "list") {
            loadDonations();
        }
    }, [viewMode]);

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        let todayCount = 0;
        let todayTotal = 0;
        let grandTotal = 0;

        donations.forEach((d) => {
            const amount = Number(d.amount || 0);
            grandTotal += amount;

            const dDate = d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : "";
            if (dDate === todayStr) {
                todayCount += 1;
                todayTotal += amount;
            }
        });

        return {
            totalDonations: donations.length,
            todayCount,
            todayTotal,
            grandTotal,
        };
    }, [donations]);

    // Filtered donations list
    const filteredDonations = useMemo(() => {
        return donations.filter((d) => {
            const donorName = (d.donorName || "").toLowerCase();
            const donorPhone = (d.donorPhone || "").toLowerCase();
            const displayId = (d.displayId || d.id || "").toLowerCase();
            const message = (d.message || "").toLowerCase();

            const query = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || donorName.includes(query) || donorPhone.includes(query) || displayId.includes(query) || message.includes(query);

            const matchesPayment = paymentFilter === "ALL" || (d.paymentMethod || "").toUpperCase() === paymentFilter.toUpperCase();

            return matchesSearch && matchesPayment;
        });
    }, [donations, searchQuery, paymentFilter]);

    const handlePrintReceipt = (donation: any) => {
        const receiptData = {
            id: donation.displayId || donation.id,
            donorName: donation.donorName || "Donor",
            donorPhone: donation.donorPhone || "N/A",
            donorEmail: donation.donorEmail || "",
            amount: Number(donation.amount || 0),
            paymentMethod: donation.paymentMethod || "CASH",
            createdAt: donation.createdAt || new Date().toISOString(),
            templeName: donation.mandal?.name ? (typeof donation.mandal.name === "string" ? donation.mandal.name : donation.mandal.name.en) : "DevBhakti Mandal",
            address: donation.address,
            message: donation.message,
            panNumber: donation.panNumber,
        };

        const html = generateReceiptHTML(receiptData as any);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 400);
        }
    };

    const handleDownloadReceipt = (donation: any) => {
        const receiptData = {
            id: donation.displayId || donation.id,
            donorName: donation.donorName || "Donor",
            donorPhone: donation.donorPhone || "N/A",
            donorEmail: donation.donorEmail || "",
            amount: Number(donation.amount || 0),
            paymentMethod: donation.paymentMethod || "CASH",
            createdAt: donation.createdAt || new Date().toISOString(),
            templeName: donation.mandal?.name ? (typeof donation.mandal.name === "string" ? donation.mandal.name : donation.mandal.name.en) : "DevBhakti Mandal",
            address: donation.address,
            message: donation.message,
            panNumber: donation.panNumber,
        };
        downloadDonationReceiptPDF(receiptData as any);
    };

    const handleExportExcel = () => {
        if (filteredDonations.length === 0) {
            toast({ title: "No Data", description: "There are no donations to export.", variant: "destructive" });
            return;
        }

        const exportData = filteredDonations.map((d: any) => ({
            "Receipt ID": d.displayId || d.id?.slice(-8) || "N/A",
            "Donor Name": d.donorName || "Donor",
            "Phone": d.donorPhone || "N/A",
            "Purpose / Message": d.message || "General Donation",
            "Date": d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "N/A",
            "Amount (₹)": Number(d.amount || 0),
            "Payment Method": d.paymentMethod || "CASH"
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Offline Donations");
        XLSX.writeFile(wb, `Mandal_Offline_Donations_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    if (viewMode === "add") {
        return <AddOfflineDonationPage onBack={() => setViewMode("list")} />;
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
            {/* Top Breadcrumb Navigation */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/mandals/dashboard/teller" className="hover:text-[#7b4623] flex items-center gap-1 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Teller Module
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">Offline Donation Management</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleExportExcel} variant="outline" className="border-[#7b4623]/20 hover:bg-[#7b4623]/5 text-[#7b4623] shadow-sm rounded-xl">
                        <Download className="w-4 h-4 mr-2" /> Export Excel
                    </Button>
                    <Button onClick={() => setViewMode("add")} className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-md rounded-xl">
                        <Plus className="w-4 h-4 mr-2" /> Record Offline Donation
                    </Button>
                </div>
            </div>

            {/* Header Title */}
            <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Offline Donations</h1>
                <p className="text-sm text-slate-500">View, manage, and record manual donations for your mandal.</p>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white shadow-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Donations</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalDonations}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{stats.todayCount} recorded today</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                            <Heart className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Today's Collection</p>
                            <h3 className="text-2xl font-bold text-emerald-700 mt-1">₹{stats.todayTotal.toLocaleString()}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Offline donations today</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-sm rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Collection</p>
                            <h3 className="text-2xl font-bold text-blue-700 mt-1">₹{stats.grandTotal.toLocaleString()}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Cumulative offline donations</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by donor, phone, receipt ID, or purpose..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 rounded-xl border-slate-200 focus:border-[#7b4623]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20"
                            >
                                <option value="ALL">All Payment Methods</option>
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="CHEQUE">Cheque</option>
                                <option value="BANK">Bank Transfer</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Donations List Table */}
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5 text-left font-semibold">Receipt ID</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Donor Name</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Phone</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Purpose / Message</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Date</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Amount</th>
                                <th className="px-4 py-3.5 text-left font-semibold">Payment</th>
                                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#7b4623]" />
                                            <span>Loading offline donations...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDonations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        <p className="font-medium text-base text-slate-700">No offline donations found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try adjusting search query or filter criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDonations.map((donation) => (
                                    <tr key={donation.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-700">
                                            {donation.displayId || donation.id?.slice(-8) || "N/A"}
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                                            {donation.donorName || "Donor"}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600">
                                            {donation.donorPhone || "N/A"}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                                            {donation.message || "General Donation"}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600">
                                            {donation.createdAt ? new Date(donation.createdAt).toLocaleDateString("en-IN") : "N/A"}
                                        </td>
                                        <td className="px-4 py-3.5 font-bold text-emerald-700">
                                            ₹{Number(donation.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Badge variant="outline" className="uppercase text-xs font-semibold bg-slate-50 text-slate-700">
                                                {donation.paymentMethod || "CASH"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedDonation(donation)}
                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                    title="View Donation Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handlePrintReceipt(donation)}
                                                    className="h-8 w-8 text-slate-700 hover:bg-slate-100"
                                                    title="Print Receipt"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownloadReceipt(donation)}
                                                    className="h-8 w-8 text-emerald-700 hover:bg-emerald-50"
                                                    title="Download PDF Receipt"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Donation Details Modal */}
            {selectedDonation && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedDonation(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-serif font-bold text-slate-900">Offline Donation Details</h2>
                            <button onClick={() => setSelectedDonation(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Receipt ID</p>
                                    <p className="font-mono font-bold text-slate-800">{selectedDonation.displayId || selectedDonation.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Payment Method</p>
                                    <Badge variant="outline" className="uppercase text-xs mt-0.5">{selectedDonation.paymentMethod || "CASH"}</Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Donor Name</p>
                                    <p className="font-semibold text-slate-900">{selectedDonation.donorName || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                                    <p className="font-semibold text-slate-900">{selectedDonation.donorPhone || "N/A"}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {selectedDonation.donorEmail && (
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Email</span>
                                        <span className="font-semibold text-slate-900">{selectedDonation.donorEmail}</span>
                                    </div>
                                )}
                                {selectedDonation.panNumber && (
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">PAN Number</span>
                                        <span className="font-semibold text-slate-900">{selectedDonation.panNumber}</span>
                                    </div>
                                )}
                                {selectedDonation.address && (
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Address</span>
                                        <span className="font-semibold text-slate-900">{selectedDonation.address}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Purpose / Message</span>
                                    <span className="font-semibold text-slate-900">{selectedDonation.message || "General Donation"}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-100">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-semibold text-slate-900">{selectedDonation.createdAt ? new Date(selectedDonation.createdAt).toLocaleString("en-IN") : "N/A"}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center">
                                <span className="font-medium text-slate-700">Donation Amount Paid</span>
                                <span className="text-xl font-bold text-emerald-700">₹{Number(selectedDonation.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-4 border-t flex gap-3">
                            <Button onClick={() => handlePrintReceipt(selectedDonation)} variant="outline" className="flex-1 rounded-xl">
                                <Printer className="w-4 h-4 mr-2" /> Print Receipt
                            </Button>
                            <Button onClick={() => setSelectedDonation(null)} className="flex-1 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

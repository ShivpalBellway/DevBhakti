"use client";

import React, { useState, useEffect } from "react";
import {
    Users,
    Search,
    Mail,
    Phone,
    ShoppingBag,
    IndianRupee,
    Calendar,
    ArrowUpRight,
    UserCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fetchSellerCustomers } from "@/api/sellerController";
import { useRouter } from "next/navigation";

export default function SellerCustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setIsLoading(true);
        try {
            const res = await fetchSellerCustomers();
            if (res.success) {
                setCustomers(res.data);
            }
        } catch (error) {
            console.error("Failed to load customers", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        c.phone?.includes(searchQuery) ||
        (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Users className="w-10 h-10 animate-pulse text-[#794A05]" />
                <p className="text-[#794A05] font-serif italic animate-pulse">Fetching Devotee List...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">My Customers</h1>
                    <p className="text-slate-500 mt-1">Devotees who have purchased items from your store.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Customers</p>
                        <p className="text-xl font-black text-[#794A05]">{customers.length}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search by name, email or phone..."
                    className="pl-10 h-12 bg-white border-slate-100 rounded-xl focus:ring-[#794A05]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Customers List Table */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Devotee Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Orders</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifetime Value</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Order</th>
                                    <th className="px-8 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <UserCircle className="w-16 h-16 text-slate-100 mb-4" />
                                                <p className="text-slate-400 font-serif italic text-lg transition-all animate-pulse">
                                                    No devotees found in your records yet...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#794A05]/5 flex items-center justify-center text-[#794A05] font-black text-lg border border-[#794A05]/10 group-hover:scale-110 transition-transform">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{customer.name}</p>
                                                        <Badge variant="outline" className="mt-1 bg-white text-[9px] font-black border-slate-100">
                                                            Marketplace Devotee
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                        <Mail className="w-3.5 h-3.5 text-slate-300" />
                                                        {customer.email || "N/A"}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                                        <Phone className="w-3.5 h-3.5 text-slate-300" />
                                                        {customer.phone || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100 min-w-[60px]">
                                                    <ShoppingBag className="w-3 h-3 text-slate-400 mb-1" />
                                                    <span className="text-sm font-black text-slate-900">{customer.totalOrders}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-1.5 text-[#794A05]">
                                                    <IndianRupee className="w-4 h-4 text-[#794A05]/40" />
                                                    <span className="text-base font-black italic">{customer.totalSpent.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-xs font-bold">{format(new Date(customer.lastOrderDate), "dd MMM, yyyy")}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 ml-5">
                                                        {format(new Date(customer.lastOrderDate), "hh:mm a")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-xl font-black text-[10px] uppercase text-[#794A05] hover:bg-[#794A05]/5 gap-2"
                                                    onClick={() => router.push(`/seller/dashboard/orders?search=${customer.phone}`)}
                                                >
                                                    View History
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

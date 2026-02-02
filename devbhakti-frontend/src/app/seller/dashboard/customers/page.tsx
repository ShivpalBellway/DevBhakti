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

export default function SellerCustomersPage() {
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
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
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

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <UserCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No customers found matching your search.</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <Card key={customer.id} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="p-6 bg-[#794A05]/5 flex items-center gap-4 border-b border-[#794A05]/10">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#794A05] font-black text-xl border border-[#794A05]/10">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-slate-900 truncate uppercase tracking-tight">{customer.name}</h3>
                                        <p className="text-xs font-bold text-slate-400">Joined via Marketplace</p>
                                    </div>
                                    <Badge variant="outline" className="bg-white text-[10px] font-black">
                                        Active
                                    </Badge>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            {customer.email || "No email provided"}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            {customer.phone || "No phone provided"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Orders</p>
                                            <p className="text-lg font-black text-slate-900">{customer.totalOrders}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <p className="text-[9px] font-black uppercase text-emerald-600/70 tracking-widest">Lifetime Value</p>
                                            <p className="text-lg font-black text-emerald-700">₹{customer.totalSpent.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-400">Last order {format(new Date(customer.lastOrderDate), "dd MMM, yyyy")}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-amber-700 hover:bg-amber-50 group-hover:px-4 transition-all">
                                            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-black mr-2 uppercase">View Orders</span>
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    Building2,
    Package,
    Wallet,
    AlertCircle,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Info,
    ArrowRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    fetchAllTemplesAdmin,
    fetchAllProductsAdmin,
    fetchAllPoojasAdmin,
    fetchWithdrawalRequestsAdmin,
    fetchPendingApprovals
} from "@/api/adminController";


export default function PendingRequestsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    const [temples, setTemples] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [poojas, setPoojas] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);

    useEffect(() => {
        loadAllPendingData();
    }, []);

    const loadAllPendingData = async () => {
        setIsLoading(true);
        try {
            const [tRes, prRes, poRes, paRes, apRes] = await Promise.all([
                fetchAllTemplesAdmin({ isVerified: false, limit: 100 }),
                fetchAllProductsAdmin({ status: "pending", limit: 100 }),
                fetchAllPoojasAdmin(),
                fetchWithdrawalRequestsAdmin(),
                fetchPendingApprovals()
            ]);

            // Temples
            let tData = Array.isArray(tRes) ? tRes : (tRes.data || []);
            setTemples(tData.filter((u: any) => u.temple).map((u: any) => ({
                id: u.temple.id,
                name: u.temple.name,
                location: u.temple.location,
                date: u.temple.createdAt,
                owner: u.name || "Unknown",
            })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            // Products
            let prData = prRes.data?.products || [];
            setProducts(prData.map((p: any) => ({
                id: p.id,
                name: p.name,
                date: p.createdAt,
                owner: p.temple?.name || p.seller?.name || "DevBhakti",
                type: p.categoryObj?.name || p.category
            })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            // Poojas
            let poData = Array.isArray(poRes) ? poRes : (poRes.data || []);
            setPoojas(poData.filter((p: any) => p.status === false).map((p: any) => ({
                id: p.id,
                name: p.name,
                date: p.createdAt,
                owner: p.temple?.name || "DevBhakti",
                type: p.category
            })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            // Payouts
            let paData = Array.isArray(paRes) ? paRes : (paRes.data || []);
            setPayouts(paData.filter((w: any) => w.status === "PENDING").map((w: any) => ({
                id: w.id,
                name: `₹${w.amount} Withdrawal`,
                date: w.createdAt,
                owner: w.temple?.name || w.seller?.name || "Unknown",
                type: w.templeId ? "Temple" : "Seller"
            })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            // Finance Approvals
            let aData = Array.isArray(apRes) ? apRes : (apRes.data || []);
            setApprovals(aData.map((a: any) => ({
                id: a.id,
                name: a.type === 'BANK_DETAILS' ? 'Bank Details Approval' : (a.type === 'KYC' ? 'KYC Approval' : 'Finance Approval'),
                date: a.createdAt,
                owner: a.temple?.name || a.seller?.name || "Unknown",
                type: a.type
            })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        } catch (error) {
            console.error("Failed to load pending requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-primary font-medium font-serif italic">Gathering all pending requests...</p>
            </div>
        );
    }

    const counts = {
        total: temples.length + poojas.length + products.length + payouts.length + approvals.length,
        temples: temples.length,
        poojas: poojas.length,
        products: products.length,
        payouts: payouts.length,
        approvals: approvals.length,
    };

    const EmptySection = ({ title, desc }: { title: string, desc: string }) => (
        <div className="bg-emerald-50/50 p-12 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-emerald-900 mb-1">{title}</h3>
            <p className="text-emerald-600/80 font-medium">{desc}</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    Review All Requests
                </h1>
                <p className="text-slate-500 mt-1 font-medium">
                    Approve, reject or review pending items across the whole DevBhakti platform.
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-widest font-bold text-[10px]">
                        {counts.total} Action Items Total
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-white border shadow-sm p-1 rounded-2xl w-full justify-start h-auto flex flex-wrap gap-1">
                    <TabsTrigger value="all" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                        All ({counts.total})
                    </TabsTrigger>
                    <TabsTrigger value="temples" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                        Temples ({counts.temples})
                    </TabsTrigger>
                    <TabsTrigger value="poojas" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                        Poojas ({counts.poojas})
                    </TabsTrigger>
                    <TabsTrigger value="products" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                        Products ({counts.products})
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                        Payouts Request ({counts.payouts})
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                        Bank Account Approvals ({counts.approvals})
                    </TabsTrigger>
                </TabsList>

                {/* ALL REQUESTS */}
                <TabsContent value="all" className="mt-6 focus-visible:outline-none">
                    {counts.total > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                ...temples.map(t => ({ ...t, itemType: 'temple' })),
                                ...poojas.map(p => ({ ...p, itemType: 'pooja' })),
                                ...products.map(pr => ({ ...pr, itemType: 'product' })),
                                ...payouts.map(pa => ({ ...pa, itemType: 'payout' })),
                                ...approvals.map(ap => ({ ...ap, itemType: 'finance' }))
                            ]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((req, i) => {
                                    const typeConfig: any = {
                                        temple: { icon: Building2, color: 'bg-blue-50 text-blue-600', link: '/admin/temples', label: 'Temple' },
                                        pooja: { icon: AlertCircle, color: 'bg-purple-50 text-purple-600', link: '/admin/poojas', label: 'Pooja' },
                                        product: { icon: Package, color: 'bg-amber-50 text-amber-600', link: '/admin/products', label: 'Product' },
                                        payout: { icon: Wallet, color: 'bg-emerald-50 text-emerald-600', link: '/admin/finance/withdrawals', label: 'Payout' },
                                        finance: { icon: CheckCircle2, color: 'bg-teal-50 text-teal-600', link: '/admin/finance/approvals', label: 'Finance' }
                                    };
                                    const config = typeConfig[req.itemType];
                                    const Icon = config.icon;

                                    return (
                                        <Card key={i} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] tracking-widest uppercase">Pending</Badge>
                                                        <Badge variant="secondary" className="text-[9px] font-extrabold uppercase px-2 py-0">{config.label}</Badge>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{req.name}</h3>
                                                <p className="text-sm font-medium text-slate-500 mb-4 truncate">
                                                    {req.itemType === 'temple' ? req.location : (req.itemType === 'payout' ? `Beneficiary: ${req.owner}` : (req.itemType === 'pooja' ? (req.category || "General Pooja") : req.type))}
                                                </p>

                                                <div className="space-y-2 mb-6">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-400">Date</span>
                                                        <span className="font-bold text-slate-700">{format(new Date(req.date), "dd MMM yyyy, hh:mm a")}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-400">{req.itemType === 'temple' ? 'Applicant' : (req.itemType === 'payout' ? 'Account Type' : (req.itemType === 'pooja' ? 'Temple' : (req.itemType === 'finance' ? 'Entity' : 'Vendor')))}</span>
                                                        <span className="font-bold text-slate-700 truncate max-w-[150px] text-right">{req.itemType === 'payout' ? req.type : req.owner}</span>
                                                    </div>
                                                </div>

                                                <Button className="w-full bg-slate-900 group" onClick={() => router.push(config.link)}>
                                                    Review {config.label}
                                                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                        </div>
                    ) : (
                        <EmptySection title="All Clear!" desc="No pending items across any category. Everything caught up!" />
                    )}
                </TabsContent>

                {/* TEMPLES */}
                <TabsContent value="temples" className="mt-6 focus-visible:outline-none">
                    {temples.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {temples.map((req, i) => (
                                <Card key={i} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] tracking-widest uppercase">Pending</Badge>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{req.name}</h3>
                                        <p className="text-sm font-medium text-slate-500 mb-4">{req.location}</p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Date</span>
                                                <span className="font-bold text-slate-700">{format(new Date(req.date), "dd MMM yyyy, hh:mm a")}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Applicant</span>
                                                <span className="font-bold text-slate-700">{req.owner}</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-slate-900 group" onClick={() => router.push('/admin/temples')}>
                                            Review Temple
                                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptySection title="No Pending Temples" desc="All temple registrations are currently up to date." />
                    )}
                </TabsContent>

                {/* POOJAS */}
                <TabsContent value="poojas" className="mt-6 focus-visible:outline-none">
                    {poojas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {poojas.map((req, i) => (
                                <Card key={i} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] tracking-widest uppercase">Pending</Badge>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{req.name}</h3>
                                        <p className="text-sm font-medium text-slate-500 mb-4">{req.category || "General Pooja"}</p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Date</span>
                                                <span className="font-bold text-slate-700">{format(new Date(req.date), "dd MMM yyyy, hh:mm a")}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Temple</span>
                                                <span className="font-bold text-slate-700">{req.owner}</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-slate-900 group" onClick={() => router.push('/admin/poojas')}>
                                            Review Pooja
                                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptySection title="No Pending Poojas" desc="All poojas have been approved successfully." />
                    )}
                </TabsContent>

                {/* PRODUCTS */}
                <TabsContent value="products" className="mt-6 focus-visible:outline-none">
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map((req, i) => (
                                <Card key={i} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] tracking-widest uppercase">Pending</Badge>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{req.name}</h3>
                                        <p className="text-sm font-medium text-slate-500 mb-4">{req.type}</p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Date</span>
                                                <span className="font-bold text-slate-700">{format(new Date(req.date), "dd MMM yyyy, hh:mm a")}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Vendor</span>
                                                <span className="font-bold text-slate-700 text-right">{req.owner}</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-slate-900 group" onClick={() => router.push('/admin/products')}>
                                            Review Product
                                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptySection title="No Pending Products" desc="Inventory looks robust! All products are verified." />
                    )}
                </TabsContent>

                {/* PAYOUTS */}
                <TabsContent value="payouts" className="mt-6 focus-visible:outline-none">
                    {payouts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {payouts.map((req, i) => (
                                <Card key={i} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Wallet className="w-6 h-6" />
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] tracking-widest uppercase">Pending</Badge>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1">{req.name}</h3>
                                        <p className="text-sm font-medium text-slate-500 mb-4">Beneficiary: {req.owner}</p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Date</span>
                                                <span className="font-bold text-slate-700">{format(new Date(req.date), "dd MMM yyyy, hh:mm a")}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Account Type</span>
                                                <span className="font-bold text-slate-700">{req.type}</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-slate-900 group" onClick={() => router.push('/admin/finance/withdrawals')}>
                                            Review Withdrawal
                                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptySection title="All Clear" desc="No pending withdrawals in the queue." />
                    )}
                </TabsContent>

                {/* FINANCE APPROVALS */}
                <TabsContent value="finance" className="mt-6 focus-visible:outline-none">
                    {approvals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {approvals.map((req, i) => (
                                <Card key={i} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] tracking-widest uppercase">Pending</Badge>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{req.name}</h3>
                                        <p className="text-sm font-medium text-slate-500 mb-4 truncate">Entity: {req.owner}</p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Date</span>
                                                <span className="font-bold text-slate-700">{format(new Date(req.date), "dd MMM yyyy, hh:mm a")}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Request Type</span>
                                                <span className="font-bold text-slate-700">{req.type}</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-slate-900 group" onClick={() => router.push('/admin/finance/approvals')}>
                                            Review Approval
                                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptySection title="Finance Clear" desc="No pending finance approvals in the queue." />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

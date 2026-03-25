"use client";

import React, { useState, useEffect } from "react";
import { fetchMyOrders, fetchOrderInvoice } from "@/api/productOrderController";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    ChevronRight,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Search,
    IndianRupee,
    Download,
    Store,
    Calendar as CalendarIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BASE_URL } from "@/config/apiConfig";

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const response = await fetchMyOrders();
            if (response.success) {
                setOrders(response.data);
            }
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "SHIPPED":
            case "PARTIALLY_SHIPPED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "DELIVERED":
            case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const handleInvoice = async (order: any) => {
        try {
            const invoiceHtml = await fetchOrderInvoice(order.id);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(invoiceHtml);
                printWindow.document.close();
            }
        } catch (error) {
            console.error("Failed to fetch invoice", error);
            // Fallback or alert
            alert("Could not load invoice. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCF6]">
            <Navbar />
            <main className="pt-24 pb-16 container mx-auto px-4 relative">
                <div className="absolute inset-0 pattern-sacred opacity-30 pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} className="rounded-xl h-9 w-9 bg-white/50 border border-slate-100 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95">
                            <ArrowLeft className="w-4 h-4 text-[#794A05]" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Your Sacred Journey</h1>
                            <p className="text-[13px] text-slate-500 font-medium">Tracking your spiritual essentials & blessings</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <Card className="rounded-[2.5rem] border-dashed border-2 p-12 text-center bg-white/50">
                            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No orders placed yet</h3>
                            <p className="text-slate-500 mb-6">Explore our marketplace for sacred idols, incense, and more.</p>
                            <Button onClick={() => router.push("/marketplace")} className="bg-[#794A05] hover:bg-[#5d3804] text-white rounded-full px-8">
                                Go to Marketplace
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={order.id}
                                    className={cn(
                                        "group bg-white rounded-[2rem] border border-orange-100/50 shadow-lg shadow-orange-900/5 transition-all duration-500",
                                        expandedOrderId === order.id ? "ring-2 ring-orange-200 overflow-visible" : "overflow-hidden hover:border-orange-200"
                                    )}
                                >
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-orange-50 rounded-2xl">
                                                    <Package className="w-6 h-6 text-[#794A05]" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                                                    <p className="font-mono text-sm font-bold text-slate-900">#{order.id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 font-bold text-[10px]", getStatusColor(order.status))}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6 border-y border-slate-50">
                                            <div className="flex items-start gap-5 col-span-1 md:col-span-1 lg:col-span-1">
                                                <div className="flex -space-x-12 overflow-hidden">
                                                    {order.subOrders.flatMap((so: any) => so.items).slice(0, 3).map((item: any, i: number) => (
                                                        <div key={i} className="w-50 h-32 rounded-2xl bg-white border-2 border-slate-50 overflow-hidden flex-shrink-0 shadow-md relative group-hover:scale-105 transition-transform duration-500" style={{ zIndex: 10 - i }}>
                                                            <img
                                                                src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `${BASE_URL.replace('/api', '')}/${item.product.image.replace(/^\//, '')}`) : "/placeholder.png"}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {item.quantity > 1 && (
                                                                <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-xl shadow-sm z-20">
                                                                    {item.quantity}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {order.subOrders.flatMap((so: any) => so.items).length > 3 && (
                                                        <div className="w-28 h-32 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-sm font-black border-2 border-white shadow-lg relative z-0">
                                                            +{order.subOrders.flatMap((so: any) => so.items).length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Products</p>
                                                    <p className="text-sm font-black text-slate-900 line-clamp-1">
                                                        {order.subOrders.flatMap((so: any) => so.items)[0]?.product?.name}
                                                        {order.subOrders.flatMap((so: any) => so.items).length > 1 ? " & more" : ""}
                                                    </p>
                                                    <p className="text-[11px] text-[#794A05] font-bold mt-0.5">{order.subOrders.reduce((acc: number, so: any) => acc + so.items.length, 0)} Items</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Shipping To</p>
                                                <div className="flex items-start gap-2.5 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/50">
                                                    <Truck className="w-4 h-4 text-[#794A05] mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-tight">{order.shippingAddress?.fullName || "Not provided"}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{order.shippingAddress?.city}, {order.shippingAddress?.pincode}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="lg:text-right">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Value</p>
                                                <p className="text-3xl font-black text-[#794A05] tracking-tighter drop-shadow-sm">₹{order.totalAmount?.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inclusive of Taxes</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {format(new Date(order.createdAt), "dd MMM yyyy")}
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="font-bold text-primary">{order.paymentStatus || "PAID"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleInvoice(order);
                                                    }}
                                                    className="border-primary/20 text-primary hover:bg-primary/5 rounded-full px-4 h-9 text-xs font-bold transition-all"
                                                >
                                                    <Download className="w-3.5 h-3.5 mr-1.5" />
                                                    Invoice
                                                </Button>
                                                <Button
                                                    onClick={() => toggleExpand(order.id)}
                                                    variant="ghost"
                                                    className={cn(
                                                        "text-primary font-bold hover:bg-orange-50 rounded-full group transition-all h-9 px-4 text-xs",
                                                        expandedOrderId === order.id && "bg-orange-50"
                                                    )}
                                                >
                                                    {expandedOrderId === order.id ? "Hide Details" : "View Details"}
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 ml-1 transition-transform",
                                                        expandedOrderId === order.id ? "rotate-90" : "group-hover:translate-x-1"
                                                    )} />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expanded Content with Animation */}
                                        <AnimatePresence>
                                            {expandedOrderId === order.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-8 space-y-8">
                                                        <div className="grid md:grid-cols-2 gap-6">
                                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <Truck className="w-4 h-4 text-[#794A05]" />
                                                                    Shipping Destination
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Recipient Name</p>
                                                                        <p className="text-sm font-bold text-slate-700">{order.shippingAddress?.fullName}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Address</p>
                                                                        <div className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                                                            <p>{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                                                                            <p>{order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100/50 flex flex-col gap-4">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <Store className="w-4 h-4 text-[#794A05]" />
                                                                    Items Information
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total Items</p>
                                                                        <p className="text-sm font-bold text-slate-700">{order.subOrders.reduce((acc: number, so: any) => acc + so.items.length, 0)} Units</p>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Packages</p>
                                                                        <p className="text-sm font-bold text-slate-700">{order.subOrders.length} Parcel(s)</p>
                                                                    </div>
                                                                    <div className="flex justify-between items-center pt-2 border-t border-orange-200/30">
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Support Pin</p>
                                                                        <p className="text-sm font-bold text-[#794A05]">#SPD-{order.id.slice(-4).toUpperCase()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Tracking Information (If available) */}
                                                        {order.subOrders.some((so: any) => so.awbCode) && (
                                                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-blue-200">
                                                                        <Truck className="w-6 h-6 text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Shiprocket Tracking</p>
                                                                        <p className="text-sm font-bold text-slate-900">Your order is synced for shipping</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    {order.subOrders.map((sub: any) => sub.awbCode && (
                                                                        <Button
                                                                            key={sub.id}
                                                                            onClick={() => window.open(sub.trackingUrl || `https://shiprocket.co/tracking/${sub.awbCode}`, '_blank')}
                                                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-10 px-6 shadow-lg shadow-blue-500/20"
                                                                        >
                                                                            Track Pkg #{sub.id.slice(-4)}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Breakdowns - Product List */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Package Breakdown</h4>
                                                            {order.subOrders.map((sub: any) => (
                                                                <div key={sub.id} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                                    <div className="bg-slate-50/40 px-6 py-3 border-b border-slate-50 flex items-center justify-between">
                                                                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                                                            <Store className="w-3 h-3" />
                                                                            {sub.temple?.name || "Official Warehouse"}
                                                                        </span>
                                                                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest rounded-lg h-5", getStatusColor(sub.status))}>
                                                                            {sub.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="p-4 space-y-4">
                                                                        {sub.items.map((item: any) => (
                                                                            <div key={item.id} className="flex items-center justify-between group/item opacity-90 hover:opacity-100">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-12 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden group-hover/item:border-orange-200 transition-all shadow-sm">
                                                                                        <img
                                                                                            src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `${BASE_URL.replace('/api', '')}/${item.product.image.replace(/^\//, '')}`) : "/placeholder.png"}
                                                                                            alt={item.product?.name}
                                                                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[13px] font-bold text-slate-800 group-hover/item:text-[#794A05] transition-colors">{item.product?.name}</p>
                                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                                                                                {item.variantName || "Standard Edition"}
                                                                                            </span>
                                                                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                                                            <span className="text-[10px] text-orange-600 font-bold">{item.quantity} Unit(s)</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="text-sm font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                                                    <p className="text-[10px] text-slate-400 font-medium">₹{item.price} each</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Financial Summary */}
                                                        <div className="bg-orange-50/30 p-6 rounded-[2rem] border border-orange-100/50 space-y-3 mb-4">
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Items Subtotal</span>
                                                                <span className="font-black text-slate-700">₹{(order.totalAmount - (order.platformFee || 0) - (order.shippingCost || 0)).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-orange-200/30">
                                                                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Platform Service Fee</span>
                                                                <span className="font-black text-slate-700">₹{(order.platformFee || 0).toLocaleString()}</span>
                                                            </div>
                                                            {(order.shippingCost || 0) > 0 && (
                                                               <div className="flex justify-between items-center text-sm pt-2 border-t border-orange-200/30">
                                                                   <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Shipping</span>
                                                                   <span className="font-black text-slate-700">₹{(order.shippingCost).toLocaleString()}</span>
                                                               </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/10">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm">
                                                                    <Package className="w-7 h-7 text-orange-400" />
                                                                </div>
                                                                {/* <div>
                                                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Shipping Status</p>
                                                                    <p className="font-serif font-bold text-lg flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                                        {order.status === 'DELIVERED' ? 'Successfully Delivered' : 'Processing Your Order'}
                                                                    </p>
                                                                </div> */}

                                                                <p className="font-serif font-bold text-lg flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                                                    {order.status === 'DELIVERED' ? 'Successfully Delivered' : 'Processing Your Order'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right hidden sm:block">
                                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Final Payment</p>
                                                                <p className="text-2xl font-black tracking-tighter text-orange-400">₹{order.totalAmount.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

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
    Download
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
            <main className="pt-28 pb-20 container mx-auto px-4 relative">
                <div className="absolute inset-0 pattern-sacred opacity-40 pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} className="rounded-full">
                            <ArrowLeft className="w-5 h-5 text-[#794A05]" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900">My Sacred Orders</h1>
                            <p className="text-slate-500">Track your spiritual items and their blessings</p>
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
                                    <div className="p-0">
                                        {/* Card Header Section */}
                                        <div className="px-6 py-5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100/50 flex items-center justify-center border border-orange-100">
                                                    <Package className="w-5 h-5 text-orange-700" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                                            Order #{order.id.slice(-8).toUpperCase()}
                                                        </h3>
                                                        <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold tracking-wider px-2 h-5", getStatusColor(order.status))}>
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(order.createdAt), "dd MMM yyyy")} &bull; {format(new Date(order.createdAt), "hh:mm a")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xl font-bold text-slate-900 tracking-tight">₹{order.totalAmount.toLocaleString()}</span>
                                                <span className="text-xs font-medium text-slate-500">{order.subOrders.reduce((acc: number, so: any) => acc + so.items.length, 0)} Items</span>
                                            </div>
                                        </div>

                                        {/* Card Body Section */}
                                        <div className="px-6 py-5">
                                            {/* Products Row */}
                                            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
                                                {order.subOrders.flatMap((so: any) => so.items).map((item: any, i: number) => (
                                                    <div key={i} className="group relative flex-shrink-0 w-20 h-24 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                                        <img
                                                            src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `${BASE_URL.replace('/api', '')}/${item.product.image.replace(/^\//, '')}`) : "/placeholder.png"}
                                                            alt={item.product?.name}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 translate-y-full group-hover:translate-y-0 transition-transform">
                                                            <p className="text-[9px] font-medium text-white line-clamp-1">{item.product?.name}</p>
                                                        </div>
                                                        <div className="absolute top-1 right-1 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                            x{item.quantity}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action Footer */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {order.status === 'DELIVERED' && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Delivered
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInvoice(order);
                                                        }}
                                                        className="rounded-full px-4 h-8 font-bold text-xs border-slate-200 hover:bg-slate-50 gap-2 text-slate-700"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        Invoice
                                                    </Button>
                                                    <Button
                                                        onClick={() => toggleExpand(order.id)}
                                                        className={cn(
                                                            "rounded-full px-4 h-8 font-bold text-xs transition-all",
                                                            expandedOrderId === order.id
                                                                ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                                                                : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                                                        )}
                                                    >
                                                        {expandedOrderId === order.id ? "Hide Details" : "View Details"}
                                                        <ChevronRight className={cn(
                                                            "w-3.5 h-3.5 ml-1.5 transition-transform duration-300",
                                                            expandedOrderId === order.id ? "-rotate-90" : "group-hover:translate-x-1"
                                                        )} />
                                                    </Button>
                                                </div>
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
                                                        {/* Shipping Address */}
                                                        <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100/50">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                <Truck className="w-4 h-4 text-[#794A05]" />
                                                                Delivery Address
                                                            </h4>
                                                            <div className="text-sm text-slate-700 space-y-1">
                                                                <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
                                                                <p>{order.shippingAddress?.street}</p>
                                                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                                                                <p className="pt-2 font-medium text-slate-500">Contact: {order.shippingAddress?.phone}</p>
                                                            </div>
                                                        </div>

                                                        {/* Breakdowns by Temple */}
                                                        <div className="space-y-6">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Consignment Breakdown</h4>
                                                            {order.subOrders.map((sub: any) => (
                                                                <div key={sub.id} className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
                                                                    <div className="bg-slate-50/50 px-5 py-3 border-b flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="secondary" className="bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                                                {sub.temple?.name || "Official Warehouse"}
                                                                            </Badge>
                                                                        </div>
                                                                        <Badge className={cn("text-[8px] font-bold uppercase tracking-widest rounded-full", getStatusColor(sub.status))}>
                                                                            {sub.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="p-4 space-y-4">
                                                                        {sub.items.map((item: any) => (
                                                                            <div key={item.id} className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm">
                                                                                        <img
                                                                                            src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `${BASE_URL.replace('/api', '')}/${item.product.image.replace(/^\//, '')}`) : "/placeholder.png"}
                                                                                            alt={item.product?.name}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-slate-800">{item.product?.name}</p>
                                                                                        <p className="text-[10px] text-slate-400 font-medium">{item.variantName} × {item.quantity}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-sm font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                                            </div>
                                                                        ))}
                                                                        <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                                                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Subtotal</span>
                                                                            <span className="text-sm font-bold text-[#794A05]">₹{sub.totalAmount.toLocaleString()}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Final Summary Row */}
                                                        <div className="flex flex-col items-end pt-4 border-t border-slate-100">
                                                            <div className="w-full md:w-64 space-y-2">
                                                                <div className="flex justify-between text-slate-500 text-sm">
                                                                    <span>Subtotal</span>
                                                                    <span>₹{order.totalAmount.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between text-slate-500 text-sm">
                                                                    <span>Shipping</span>
                                                                    <span className="text-emerald-600 font-bold">FREE</span>
                                                                </div>
                                                                <div className="flex justify-between items-center pt-2">
                                                                    <span className="font-bold text-slate-900">Grand Total</span>
                                                                    <span className="text-xl font-bold text-[#794A05]">₹{order.totalAmount.toLocaleString()}</span>
                                                                </div>
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

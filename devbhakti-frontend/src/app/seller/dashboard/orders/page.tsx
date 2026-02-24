"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
    ShoppingBag,
    Search,
    Filter,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    User,
    MapPin,
    Phone,
    IndianRupee,
    Store,
    ArrowLeft,
    Loader2,
    Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchSellerOrders, updateSellerSubOrderStatus, fetchSellerProfile } from "@/api/sellerController";
import { BASE_URL } from "@/config/apiConfig";

import { useSearchParams } from "next/navigation";
export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get("status")?.toUpperCase();

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetchSellerOrders();
            if (response.success) {
                setOrders(response.data);
            }
        } catch (error) {
            console.error("Load orders error:", error);

        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (subOrderId: string, status: string) => {
        try {
            const response = await updateSellerSubOrderStatus(subOrderId, { status });
            if (response.success) {
                toast({
                    title: "Status Updated",
                    description: `Order marked as ${status}`,
                });
                // Refresh data
                const ordersRes = await fetchSellerOrders();
                if (ordersRes.success) {
                    setOrders(ordersRes.data);
                    // Update selected order if modal is open
                    if (selectedOrder && selectedOrder.id === subOrderId) {
                        const updated = ordersRes.data.find((o: any) => o.id === subOrderId);
                        if (updated) setSelectedOrder(updated);
                    }
                }
            }
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Could not update order status",
                variant: "destructive",
            });
        }
    };

    const filteredOrders = orders.filter((o) => {
        const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.order?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter ? o.status === statusFilter : true;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-200";
            case "ACCEPTED": return "bg-blue-50 text-blue-700 border-blue-200";
            case "PROCESSING": return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "PICKED_UP": return "bg-violet-50 text-violet-700 border-violet-200";
            case "SHIPPED": return "bg-blue-50 text-blue-700 border-blue-200";
            case "PARTIALLY_SHIPPED": return "bg-sky-50 text-sky-700 border-sky-200";
            case "OUT_FOR_DELIVERY": return "bg-orange-50 text-orange-700 border-orange-200";
            case "DELIVERED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "COMPLETED": return "bg-green-50 text-green-700 border-green-200";
            case "CANCELLED": return "bg-red-50 text-red-700 border-red-200";
            case "RTO_INITIATED": return "bg-rose-50 text-rose-700 border-rose-200";
            case "RTO_DELIVERED": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#794A05]" />
                <p className="text-[#794A05] font-medium font-serif">Fetching Store Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 overflow-x-hidden">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-[#794A05]" />
                        {statusFilter ? `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Orders` : "Seller Order Management"}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Track and fulfill marketplace orders for your store products.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Orders", value: orders.length, color: "text-slate-900", icon: ShoppingBag },
                    { label: "Pending", value: orders.filter(o => o.status === "PENDING").length, color: "text-amber-600", icon: Clock },
                    { label: "Ready to Ship", value: orders.filter(o => o.status === "ACCEPTED").length, color: "text-blue-400", icon: Package },
                    { label: "Total Revenue", value: `₹${orders.filter(o => o.status !== "CANCELLED").reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}`, color: "text-emerald-700", icon: IndianRupee },
                ].map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                </div>
                                <div className={cn("p-2 rounded-lg bg-slate-50", stat.color.replace('text', 'bg').replace('-900', '-100'))}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search by Order ID or Customer Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:border-[#794A05] transition-all"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white premium-scrollbar">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="py-5 pl-8 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Sub-Order ID</TableHead>
                                <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Customer</TableHead>
                                <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Items</TableHead>
                                <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Amount</TableHead>
                                <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Date</TableHead>
                                <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Status</TableHead>
                                <TableHead className="py-5 pr-8 text-right font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <ShoppingBag className="w-12 h-12 opacity-20" />
                                            <p className="font-bold uppercase tracking-widest text-[10px]">No orders found yet</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="py-6 pl-8">
                                            <span className="font-mono text-xs font-bold text-[#794A05] bg-orange-50 px-2 py-1 rounded">
                                                #{order.id.slice(-8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <span className="text-sm font-extrabold text-slate-900">{order.order?.user?.name || "Customer"}</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-sm font-bold text-slate-700">{order.items.length} Product(s)</span>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-sm font-extrabold text-[#794A05]">₹{order.totalAmount.toLocaleString()}</span>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-xs font-bold text-slate-500">
                                                {format(new Date(order.createdAt), "dd MMM, yyyy")}
                                            </span>
                                        </td>
                                        <td className="py-6">
                                            <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-bold text-[10px] border", getStatusStyle(order.status))}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="py-6 pr-8 text-right">
                                            <button
                                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#794A05]/10 hover:text-[#794A05] transition-all"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Order Details Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl premium-scrollbar">
                    {selectedOrder && (
                        <div className="bg-[#FDFCF6]">
                            <DialogHeader className="p-8 pb-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-orange-100 pb-6 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Order Details</p>
                                        <DialogTitle className="text-2xl font-bold text-slate-900 font-serif">
                                            ID: #{selectedOrder.id.toUpperCase()}
                                        </DialogTitle>
                                        <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-widest">
                                            Placed on {format(new Date(selectedOrder.createdAt), "dd MMMM yyyy")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Select
                                            defaultValue={selectedOrder.status}
                                            onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                                        >
                                            <SelectTrigger className="w-full sm:w-[180px] h-11 font-extrabold border-slate-200 rounded-2xl bg-white shadow-sm ring-offset-orange-50 focus:ring-[#794A05]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-orange-50 shadow-xl">
                                                <SelectItem value="PENDING" className="font-bold py-3">⏳ Pending</SelectItem>
                                                <SelectItem value="ACCEPTED" className="font-bold py-3">✅ Accepted</SelectItem>
                                                <SelectItem value="PICKED_UP" className="font-bold py-3">📦 Picked Up</SelectItem>
                                                <SelectItem value="SHIPPED" className="font-bold py-3">🚚 Shipped</SelectItem>
                                                <SelectItem value="OUT_FOR_DELIVERY" className="font-bold py-3">🛵 Out for Delivery</SelectItem>
                                                <SelectItem value="DELIVERED" className="font-bold py-3">✨ Delivered</SelectItem>
                                                <SelectItem value="CANCELLED" className="font-bold py-3 text-red-600">❌ Cancelled</SelectItem>
                                                <SelectItem value="RTO_INITIATED" className="font-bold py-3">🔄 RTO Initiated</SelectItem>
                                                <SelectItem value="RTO_DELIVERED" className="font-bold py-3">🚩 RTO Delivered</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="p-8 space-y-8">
                                {/* Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-orange-100/50 shadow-sm rounded-3xl bg-white overflow-hidden">
                                        <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-50">
                                            <CardTitle className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <User className="w-4 h-4 text-[#794A05]" />
                                                Customer Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-5 space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-bold">Client Name</span>
                                                <span className="text-slate-900 font-extrabold">{selectedOrder.order?.user?.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-bold">Contact No.</span>
                                                <span className="text-slate-900 font-extrabold">{selectedOrder.order?.user?.phone}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-bold">Payment Method</span>
                                                <Badge variant="outline" className="font-extrabold bg-orange-50 text-[#794A05] border-orange-100 px-2 py-0">
                                                    {selectedOrder.order?.paymentMethod?.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-orange-100/50 shadow-sm rounded-3xl bg-white overflow-hidden">
                                        <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-50">
                                            <CardTitle className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-[#794A05]" />
                                                Delivery Address
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-5 text-sm">
                                            <div className="space-y-1">
                                                <p className="font-extrabold text-slate-900 text-base">{selectedOrder.order?.shippingAddress?.fullName}</p>
                                                <p className="text-slate-700 font-medium leading-relaxed">
                                                    {selectedOrder.order?.shippingAddress?.street}<br />
                                                    {selectedOrder.order?.shippingAddress?.city}, {selectedOrder.order?.shippingAddress?.state}<br />
                                                    <span className="text-[#794A05] font-bold tracking-widest">{selectedOrder.order?.shippingAddress?.pincode}</span>
                                                </p>
                                                <div className="pt-2 flex items-center gap-2 text-[#794A05] font-bold">
                                                    <Phone className="w-3 h-3" /> {selectedOrder.order?.shippingAddress?.phone}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Items Table */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-[0.2em] pl-1">
                                        Items for Fullfillment
                                    </h4>
                                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-slate-50/50">
                                                    <TableRow className="hover:bg-transparent border-none">
                                                        <TableHead className="py-4 pl-8 font-extrabold text-slate-600 uppercase text-[10px]">Product</TableHead>
                                                        <TableHead className="py-4 font-extrabold text-slate-600 uppercase text-[10px]">Variant</TableHead>
                                                        <TableHead className="py-4 font-extrabold text-slate-600 uppercase text-[10px] text-center">Qty</TableHead>
                                                        <TableHead className="py-4 pr-8 font-extrabold text-slate-600 uppercase text-[10px] text-right">Amount</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedOrder.items.map((item: any) => (
                                                        <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                                                            <TableCell className="py-5 pl-8">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm flex-shrink-0">
                                                                        <img
                                                                            src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `${BASE_URL}/${item.product.image.replace(/^\//, '')}`) : "/placeholder.png"}
                                                                            alt={item.product?.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <span className="font-extrabold text-slate-900 leading-tight">{item.product?.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-bold text-slate-600">{item.variantName}</TableCell>
                                                            <TableCell className="font-extrabold text-slate-900 text-center text-lg">{item.quantity}</TableCell>
                                                            <TableCell className="font-extrabold text-[#794A05] text-right pr-8">₹{item.price.toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="bg-[#794A05]/5 p-6 flex justify-between items-center px-8 border-t border-slate-100">
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Consignment Total Earnings</span>
                                            <span className="text-2xl font-extrabold text-[#794A05]">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div className="bg-slate-100 p-6 rounded-3xl border border-dashed border-slate-300">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                                            <Store className="w-5 h-5 text-[#794A05]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-slate-900 mb-1 tracking-tight">Fullfillment Instructions</p>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                Please pack the items with care. Once shipped, update the status to "Shipped" and ensure the shipping label is correctly attached to the parcel.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

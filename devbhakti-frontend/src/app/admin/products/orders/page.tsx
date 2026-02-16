"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    fetchAllOrdersAdmin,
    updateSubOrderStatusAdmin
} from "@/api/adminController";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Package,
    Truck,
    Clock,
    Eye,
    User,
    MapPin,
    Building2,
    Store,
    IndianRupee,
    Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/config/apiConfig";

export default function AdminOrdersPage() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (idParam) {
            setSearchQuery(idParam);
        }
        loadOrders();
    }, [idParam]);

    useEffect(() => {
        if (idParam && orders.length > 0) {
            const order = orders.find(o => o.id === idParam);
            if (order) {
                setSelectedOrder(order);
            }
        }
    }, [idParam, orders]);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetchAllOrdersAdmin();
            if (response.success) {
                setOrders(response.data);
            }
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast({
                title: "Error",
                description: "Failed to load orders",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (subOrderId: string, status: string) => {
        try {
            const response = await updateSubOrderStatusAdmin(subOrderId, { status });
            if (response.success) {
                toast({
                    title: "Status Updated",
                    description: `Order status changed to ${status}`,
                });

                // Refresh local state for selected order if it's open
                if (selectedOrder) {
                    const updatedOrders = await fetchAllOrdersAdmin();
                    if (updatedOrders.success) {
                        setOrders(updatedOrders.data);
                        const refreshed = updatedOrders.data.find((o: any) => o.id === selectedOrder.id);
                        if (refreshed) setSelectedOrder(refreshed);
                    }
                } else {
                    loadOrders();
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "ACCEPTED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "SHIPPED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "DELIVERED": return "bg-green-100 text-green-700 border-green-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Marketplace Orders</h1>
                    <p className="text-slate-600 font-medium">Manage and track all product orders across temples</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by ID or Devotee..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full md:w-80 border-slate-300 focus:ring-[#794A05]"
                        />
                    </div>
                    <Button onClick={loadOrders} variant="outline" className="border-slate-300 hover:bg-slate-50">
                        <Clock className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden premium-scrollbar">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-4 font-bold text-slate-800">Order ID</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Devotee</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Date & Time</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Amount</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Status</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Payment</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800 text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center text-slate-900 font-bold">
                                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-[#794A05]" />
                                    Fetching orders...
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-40 text-center text-slate-900 font-bold">
                                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    {searchQuery ? "No matching orders found" : "No orders yet"}
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                <TableCell className="font-mono text-sm font-bold text-slate-900">
                                    #{order.id.slice(-8).toUpperCase()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{order.user?.name || "Devotee"}</span>
                                        <span className="text-xs font-bold text-slate-600">{order.user?.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-slate-800">
                                    {format(new Date(order.createdAt), "dd MMM, hh:mm a")}
                                </TableCell>
                                <TableCell className="font-extrabold text-[#794A05]">
                                    ₹{order.totalAmount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-bold uppercase tracking-wider text-[10px]", getStatusColor(order.status))}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                                        {order.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        onClick={() => setSelectedOrder(order)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-[#794A05] hover:bg-orange-50 hover:text-[#794A05] rounded-full"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Order Details Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl premium-scrollbar">
                    {selectedOrder && (
                        <div className="bg-[#FDFCF6]">
                            <DialogHeader className="p-8 pb-0">
                                <div className="flex items-center justify-between border-b border-orange-100 pb-6">
                                    <div>
                                        <DialogTitle className="text-2xl font-bold text-slate-900 font-serif">
                                            Order Details
                                        </DialogTitle>
                                        <p className="text-slate-700 font-bold mt-1 uppercase tracking-widest text-xs">
                                            ID: #{selectedOrder.id} • {format(new Date(selectedOrder.createdAt), "dd MMM yyyy")}
                                        </p>
                                    </div>
                                    <Badge className={cn("rounded-full px-4 py-1.5 font-bold uppercase tracking-widest text-xs", getStatusColor(selectedOrder.status))}>
                                        {selectedOrder.status}
                                    </Badge>
                                </div>
                            </DialogHeader>

                            <div className="p-8 space-y-8">
                                {/* Top Info: Customer & Shipping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-orange-100 shadow-sm">
                                        <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
                                            <User className="w-4 h-4 text-[#794A05]" />
                                            Customer Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 font-bold">Name</span>
                                                <span className="text-slate-900 font-extrabold">{selectedOrder.user?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 font-bold">Phone</span>
                                                <span className="text-slate-900 font-extrabold">{selectedOrder.user?.phone}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 font-bold">Payment Mode</span>
                                                <span className="text-[#794A05] font-extrabold uppercase">{selectedOrder.paymentMethod}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-[1.5rem] border border-orange-100 shadow-sm">
                                        <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
                                            <MapPin className="w-4 h-4 text-[#794A05]" />
                                            Shipping Address
                                        </h4>
                                        <div className="text-slate-900 font-bold leading-relaxed">
                                            <p className="font-extrabold text-lg">{selectedOrder.shippingAddress?.fullName}</p>
                                            <p>{selectedOrder.shippingAddress?.street}</p>
                                            <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                                            <p className="text-orange-800 tracking-widest">{selectedOrder.shippingAddress?.pincode}</p>
                                            <div className="mt-2 flex items-center gap-2 text-slate-600 text-sm">
                                                <Phone className="w-3 h-3" /> {selectedOrder.shippingAddress?.phone}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Breakdown by Consignment */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-[0.2em] pl-1">
                                        Order Consignments ({selectedOrder.subOrders.length})
                                    </h4>

                                    {selectedOrder.subOrders.map((sub: any) => (
                                        <div key={sub.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-md">
                                            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                                                        <Store className="w-5 h-5 text-[#794A05]" />
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-900">
                                                            {sub.temple?.name || "Official Warehouse"}
                                                        </span>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Sub-Order ID: #{sub.id.slice(-6)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Select
                                                        defaultValue={sub.status}
                                                        onValueChange={(val) => handleStatusUpdate(sub.id, val)}
                                                    >
                                                        <SelectTrigger className="w-[160px] h-10 font-extrabold border-slate-300 rounded-xl bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PENDING" className="font-bold">Pending</SelectItem>
                                                            <SelectItem value="ACCEPTED" className="font-bold">Accepted</SelectItem>
                                                            <SelectItem value="SHIPPED" className="font-bold">Shipped</SelectItem>
                                                            <SelectItem value="DELIVERED" className="font-bold">Delivered</SelectItem>
                                                            <SelectItem value="CANCELLED" className="font-bold text-red-600">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="p-0">
                                                <Table>
                                                    <TableHeader className="bg-slate-50/50">
                                                        <TableRow className="hover:bg-transparent border-none">
                                                            <TableHead className="py-4 pl-6 font-extrabold text-slate-600 uppercase text-[10px]">Product</TableHead>
                                                            <TableHead className="py-4 font-extrabold text-slate-600 uppercase text-[10px]">Variant</TableHead>
                                                            <TableHead className="py-4 font-extrabold text-slate-600 uppercase text-[10px]">Qty</TableHead>
                                                            <TableHead className="py-4 pr-6 font-extrabold text-slate-600 uppercase text-[10px] text-right">Amount</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {sub.items.map((item: any) => (
                                                            <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                                                                <TableCell className="py-4 pl-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-14 h-14 rounded-xl border border-slate-100 overflow-hidden bg-white flex-shrink-0 shadow-sm">
                                                                            <img
                                                                                src={item.product?.image ? (item.product.image.startsWith('http') ? item.product.image : `${BASE_URL}/${item.product.image.replace(/^\//, '')}`) : "/placeholder.png"}
                                                                                alt={item.product?.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                        <span className="font-extrabold text-slate-900 leading-tight">{item.product?.name}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-bold text-slate-700">{item.variantName}</TableCell>
                                                                <TableCell className="font-extrabold text-slate-900 text-lg">{item.quantity}</TableCell>
                                                                <TableCell className="font-extrabold text-[#794A05] text-right pr-6">₹{item.price.toLocaleString()}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow className="hover:bg-transparent border-t-2 border-slate-50">
                                                            <TableCell colSpan={3} className="pt-4 pb-4 pr-4 text-right">
                                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Consignment Subtotal</span>
                                                            </TableCell>
                                                            <TableCell className="pt-4 pb-4 pr-6 text-right font-extrabold text-xl text-slate-900">
                                                                ₹{sub.totalAmount.toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Grand Total Section */}
                                <div className="bg-[#794A05] p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-[#794A05]/30">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-white/10 rounded-full">
                                            <IndianRupee className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Total Order Value</p>
                                            <h3 className="text-4xl font-extrabold">₹{selectedOrder.totalAmount.toLocaleString()}</h3>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-white/80 font-bold text-sm">Status: {selectedOrder.paymentStatus} via {selectedOrder.paymentMethod}</p>
                                        <div className="mt-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                                            Sacred Delivery Processed by DevBhakti
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

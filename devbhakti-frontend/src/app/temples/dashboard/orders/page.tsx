"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";

import {
    ShoppingBag,
    Search,
    Filter,
    Eye,

    Printer,
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
import { fetchTempleOrders, updateSubOrderStatus, fetchMyTempleProfile } from "@/api/templeAdminController";
import { BASE_URL } from "@/config/apiConfig";
import { Checkbox } from "@/components/ui/checkbox";

export default function TempleOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [templeId, setTempleId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [templeData, setTempleData] = useState<any>(null);

    const { toast } = useToast();

    useEffect(() => {
        loadTempleAndOrders();
    }, []);

    const loadTempleAndOrders = async () => {
        setIsLoading(true);
        try {
            // 1. Get Temple Profile to get templeId
            const profileRes = await fetchMyTempleProfile();
            if (profileRes.success && profileRes.data.id) {
                const id = profileRes.data.id;
                setTempleId(id);
                // 2. Load orders for this temple
                setTempleData(profileRes.data);
                const ordersRes = await fetchTempleOrders(id);
                if (ordersRes.success) {
                    setOrders(ordersRes.data);
                }
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load temple profile",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Load orders error:", error);
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (subOrderId: string, status: string) => {
        if (!templeId) return;
        try {
            const response = await updateSubOrderStatus(subOrderId, { status, templeId });
            if (response.success) {
                toast({
                    title: "Status Updated",
                    description: `Order mark as ${status}`,
                });
                // Refresh data
                const ordersRes = await fetchTempleOrders(templeId);
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

    const searchParams = useSearchParams();
    const statusFilter = searchParams.get("status");

    const filteredOrders = orders.filter((o) => {
        const matchesSearch =
            o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.order?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter ? o.status === statusFilter : true;

        return matchesSearch && matchesStatus;
    });

    const toggleSelectOrder = (id: string) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOrders(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

    const handleBulkPrint = () => {
        if (selectedOrders.size === 0) return;
        const ids = Array.from(selectedOrders).join(",");
        router.push(`/temples/dashboard/orders/print?ids=${ids}`);
    };

    const handleSinglePrint = (order: any) => {
        router.push(`/temples/dashboard/orders/print?ids=${order.id}`);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "DELIVERED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "SHIPPED": return "bg-blue-50 text-blue-700 border-blue-200";
            case "ACCEPTED": return "bg-orange-50 text-orange-700 border-orange-200";
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-200";
            case "CANCELLED": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#794A05]" />
                <p className="text-[#794A05] font-medium font-serif">Fetching Sacred Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-[#794A05]" />
                        Temple Order Management
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Track and fulfill marketplace orders specifically for your temple's offerings.
                    </p>
                </div>

                <AnimatePresence>
                    {selectedOrders.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-xl border border-orange-100"
                        >
                            <div className="px-4 py-2 bg-orange-50 rounded-xl">
                                <span className="text-sm font-bold text-[#794A05]">{selectedOrders.size} Selected</span>
                            </div>
                            <Button
                                onClick={handleBulkPrint}
                                className="bg-[#794A05] hover:bg-[#5d3904] text-white rounded-xl px-6 flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print Labels
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedOrders(new Set())}
                                className="text-slate-500 hover:text-red-500 rounded-xl"
                            >
                                Cancel
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Orders", value: orders.length, color: "text-slate-900", icon: ShoppingBag },
                    { label: "Pending", value: orders.filter(o => o.status === "PENDING").length, color: "text-amber-600", icon: Clock },
                    { label: "Ready to Ship", value: orders.filter(o => o.status === "ACCEPTED").length, color: "text-blue-400", icon: Package },
                    { label: "Revenue", value: `₹${orders.filter(o => o.status !== "CANCELLED").reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}`, color: "text-emerald-700", icon: IndianRupee },
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
                        placeholder="Search by Order ID or Devotee Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:border-[#794A05] transition-all"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white premium-scrollbar">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="py-5 pl-8 w-[50px]">
                                <Checkbox
                                    checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                                    onCheckedChange={toggleSelectAll}
                                    className="border-slate-300 data-[state=checked]:bg-[#794A05] data-[state=checked]:border-[#794A05]"
                                />
                            </TableHead>
                            <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Sub-Order ID</TableHead>
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
                                        <p className="font-bold uppercase tracking-widest text-[10px]">No orders found for your temple</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order, index) => (
                                <TableRow
                                    key={order.id}
                                    className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="py-6 pl-8">
                                        <Checkbox
                                            checked={selectedOrders.has(order.id)}
                                            onCheckedChange={() => toggleSelectOrder(order.id)}
                                            className="border-slate-300 data-[state=checked]:bg-[#794A05] data-[state=checked]:border-[#794A05]"
                                        />
                                    </td>
                                    <td className="py-6">
                                        <span className="font-mono text-xs font-bold text-[#794A05] bg-orange-50 px-2 py-1 rounded">
                                            #{order.id.slice(-8).toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <span className="text-sm font-extrabold text-slate-900">{order.order?.user?.name}</span>
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
                                    <td className="py-6 pr-8 text-right flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-[#794A05]/10 hover:text-[#794A05] transition-all"
                                            onClick={() => handleSinglePrint(order)}
                                            title="Print Label"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-[#794A05]/10 hover:text-[#794A05] transition-all"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Order Details Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl premium-scrollbar">
                    {selectedOrder && (
                        <div className="bg-[#FDFCF6]">
                            <DialogHeader className="p-8 pb-0">
                                <div className="flex items-center justify-between border-b border-orange-100 pb-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Consignment Details</p>
                                        <DialogTitle className="text-2xl font-bold text-slate-900 font-serif">
                                            ID: #{selectedOrder.id.toUpperCase()}
                                        </DialogTitle>
                                        <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-widest">
                                            Placed on {format(new Date(selectedOrder.createdAt), "dd MMMM yyyy")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            onClick={() => handleSinglePrint(selectedOrder)}
                                            className="bg-[#794A05] hover:bg-[#5d3904] text-white rounded-xl px-6 flex items-center gap-2"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Print Label
                                        </Button>
                                        <Select
                                            defaultValue={selectedOrder.status}
                                            onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                                        >
                                            <SelectTrigger className="w-[180px] h-11 font-extrabold border-slate-200 rounded-2xl bg-white shadow-sm ring-offset-orange-50 focus:ring-[#794A05]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-orange-50 shadow-xl">
                                                <SelectItem value="PENDING" className="font-bold py-3">⏳ Pending</SelectItem>
                                                <SelectItem value="ACCEPTED" className="font-bold py-3">✅ Accepted</SelectItem>
                                                <SelectItem value="SHIPPED" className="font-bold py-3">🚚 Shipped</SelectItem>
                                                <SelectItem value="DELIVERED" className="font-bold py-3">✨ Delivered</SelectItem>
                                                <SelectItem value="CANCELLED" className="font-bold py-3 text-red-600">❌ Cancelled</SelectItem>
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
                                                <Badge variant="outline" className="font-extrabold bg-orange-50 text-[#794A05] border-orange-100">
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
                                        Sacred Items for Fullfillment
                                    </h4>
                                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
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
                                                Please pack the sacred items with utmost care and respect. Once shipped, update the status to "Shipped" and ensure the shipping label is correctly attached to the parcel.
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

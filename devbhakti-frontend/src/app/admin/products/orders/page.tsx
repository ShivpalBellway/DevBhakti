"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
    Phone,
    Printer,
    Download,
    Calendar as CalendarIcon,
    X
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BASE_URL, API_URL } from "@/config/apiConfig";
import { useDebounce } from "@/hooks/use-debounce";
import axios from "axios";

function AdminOrdersContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const idParam = searchParams.get("id");
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ subOrderId: string; status: string } | null>(null);
    const [showUpdateWarning, setShowUpdateWarning] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (idParam) {
            setSearchQuery(idParam);
        }
    }, [idParam]);

    useEffect(() => {
        loadOrders(currentPage);
    }, [debouncedSearch, statusFilter, paymentStatusFilter, dateFilter, currentPage]);


    useEffect(() => {
        if (idParam && orders.length > 0) {
            const order = orders.find(o => o.id === idParam);
            if (order) {
                setSelectedOrder(order);
            }
        }
    }, [idParam, orders]);

    const loadOrders = async (page: number) => {
        setIsLoading(true);
        try {
            const response = await fetchAllOrdersAdmin({
                page,
                limit: 10,
                search: debouncedSearch,
                status: statusFilter,
                paymentStatus: paymentStatusFilter,
                date: dateFilter ? format(dateFilter, "yyyy-MM-dd") : undefined
            });


            if (response.success) {
                setOrders(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages || 1);
                    setTotalItems(response.pagination.total || 0);
                }
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

    const handleStatusUpdate = async () => {
        if (!pendingStatusUpdate) return;
        const { subOrderId, status } = pendingStatusUpdate;

        try {
            const response = await updateSubOrderStatusAdmin(subOrderId, { status });
            if (response.success) {
                toast({
                    title: "Status Updated",
                    description: `Order status changed to ${status}`,
                });

                // Refresh local state for selected order if it's open
                if (selectedOrder) {
                    const updatedOrders = await fetchAllOrdersAdmin({
                        page: currentPage,
                        limit: 10,
                        search: debouncedSearch,
                        status: statusFilter,
                        paymentStatus: paymentStatusFilter,
                        date: dateFilter ? format(dateFilter, "yyyy-MM-dd") : undefined
                    });


                    if (updatedOrders.success) {
                        setOrders(updatedOrders.data);
                        const refreshed = updatedOrders.data.find((o: any) => o.id === selectedOrder.id);
                        if (refreshed) setSelectedOrder(refreshed);
                    }
                } else {
                    loadOrders(currentPage);
                }
            }
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Could not update order status",
                variant: "destructive",
            });
        } finally {
            setPendingStatusUpdate(null);
            setShowUpdateWarning(false);
        }
    };

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
        router.push(`/admin/products/orders/print?ids=${ids}`);
    };

    const handleSinglePrint = (order: any) => {
        router.push(`/admin/products/orders/print?ids=${order.id}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
            case "ACCEPTED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "PROCESSING": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "PICKED_UP": return "bg-violet-100 text-violet-700 border-violet-200";
            case "SHIPPED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "PARTIALLY_SHIPPED": return "bg-sky-100 text-sky-700 border-sky-200";
            case "OUT_FOR_DELIVERY": return "bg-orange-100 text-orange-700 border-orange-200";
            case "DELIVERED": return "bg-green-100 text-green-700 border-green-200";
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            case "FAILED": return "bg-red-100 text-red-700 border-red-200";
            case "RTO_INITIATED": return "bg-rose-100 text-rose-700 border-rose-200";
            case "RTO_DELIVERED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "PAID": return "bg-emerald-50 text-emerald-700 border border-emerald-100";
            case "FAILED": return "bg-red-50 text-red-700 border border-red-200";
            case "PENDING": return "bg-amber-50 text-amber-700 border border-amber-100";
            case "REFUNDED": return "bg-sky-50 text-sky-700 border border-sky-100";
            default: return "bg-slate-50 text-slate-700 border border-slate-100";
        }
    };

    const handleExportOrders = async () => {
        try {
            toast({ title: "Exporting...", description: "Please wait while we prepare the Excel file." });
            const token = localStorage.getItem('admin_token') || localStorage.getItem('staff_token');
            const response = await axios.get(`${API_URL}/admin/orders/export/excel`, {
                responseType: 'blob',
                validateStatus: () => true,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `admin_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                toast({ title: "Success", description: "Orders exported successfully!" });
            } else {
                throw new Error("Download failed");
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to download Excel.", variant: "destructive" });
        }
    };

    const filteredOrders = orders;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Product Orders</h1>
                    <p className="text-slate-600 font-medium">Manage and track all product orders across temples</p>
                </div>



                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by ID or Devotee..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full md:w-80 h-10 border-slate-300 focus:ring-[#794A05] rounded-xl font-bold"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[200px] h-10 justify-start text-left font-bold rounded-xl border-slate-300",
                                        !dateFilter && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateFilter}
                                    onSelect={(date) => { setDateFilter(date); setCurrentPage(1); }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {dateFilter && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDateFilter(undefined); setCurrentPage(1); }}
                                className="h-10 w-10 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>

                        <SelectTrigger className="w-[150px] h-10 rounded-xl border-slate-300 bg-white font-bold">
                            <SelectValue placeholder="Order Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={paymentStatusFilter} onValueChange={(val) => { setPaymentStatusFilter(val); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[150px] h-10 rounded-xl border-slate-300 bg-white font-bold">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="ALL">All Payment</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                            <SelectItem value="REFUNDED">Refunded</SelectItem>
                        </SelectContent>
                    </Select>
                    {selectedOrders.size > 0 && (
                        <>
                            <span className="text-sm font-bold text-[#794A05] bg-orange-50 px-3 py-2 rounded-lg">
                                {selectedOrders.size} Selected
                            </span>
                            <Button
                                onClick={handleBulkPrint}
                                className="bg-[#794A05] hover:bg-[#5d3904] text-white flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print Labels
                            </Button>
                            <Button variant="ghost" onClick={() => setSelectedOrders(new Set())} className="text-slate-500">
                                Cancel
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={handleExportOrders}
                        variant="sacred"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </Button>
                    {/* <Button onClick={() => loadOrders(currentPage)} variant="outline" className="border-slate-300 hover:bg-slate-50 h-10">
                        <Clock className="w-4 h-4 mr-2" /> Refresh
                    </Button> */}
                </div>
            </div>

            <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden premium-scrollbar">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-4 pl-4 w-[50px]">
                                <Checkbox
                                    checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                                    onCheckedChange={toggleSelectAll}
                                    className="border-slate-300 data-[state=checked]:bg-[#794A05] data-[state=checked]:border-[#794A05]"
                                />
                            </TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Order ID</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Devotee</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Date & Time</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Amount</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Status</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800">Payment</TableHead>
                            <TableHead className="py-4 font-bold text-slate-800 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center text-slate-900 font-bold">
                                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-[#794A05]" />
                                    Fetching orders...
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center text-slate-900 font-bold">
                                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    {searchQuery ? "No matching orders found" : "No orders yet"}
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                <TableCell className="pl-4">
                                    <Checkbox
                                        checked={selectedOrders.has(order.id)}
                                        onCheckedChange={() => toggleSelectOrder(order.id)}
                                        className="border-slate-300 data-[state=checked]:bg-[#794A05] data-[state=checked]:border-[#794A05]"
                                    />
                                </TableCell>
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
                                    <Badge variant="secondary" className={cn("rounded-full text-[10px] font-bold uppercase", getPaymentStatusColor(order.paymentStatus))}>
                                        {order.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            onClick={() => handleSinglePrint(order)}
                                            variant="ghost"
                                            size="icon"
                                            title="Print Label"
                                            className="h-10 w-10 text-slate-500 hover:bg-orange-50 hover:text-[#794A05] rounded-full"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => setSelectedOrder(order)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-[#794A05] hover:bg-orange-50 hover:text-[#794A05] rounded-full"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Button>
                                    </div>
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
                                                        onValueChange={(val) => {
                                                            setPendingStatusUpdate({ subOrderId: sub.id, status: val });
                                                            setShowUpdateWarning(true);
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[160px] h-10 font-extrabold border-slate-300 rounded-xl bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PENDING" className="font-bold">Pending</SelectItem>
                                                            <SelectItem value="ACCEPTED" className="font-bold">Accepted</SelectItem>
                                                            <SelectItem value="PICKED_UP" className="font-bold">Picked Up</SelectItem>
                                                            <SelectItem value="SHIPPED" className="font-bold">Shipped</SelectItem>
                                                            <SelectItem value="OUT_FOR_DELIVERY" className="font-bold">Out for Delivery</SelectItem>
                                                            <SelectItem value="DELIVERED" className="font-bold">Delivered</SelectItem>
                                                            <SelectItem value="CANCELLED" className="font-bold text-red-600">Cancelled</SelectItem>
                                                            <SelectItem value="RTO_INITIATED" className="font-bold">RTO Initiated</SelectItem>
                                                            <SelectItem value="RTO_DELIVERED" className="font-bold">RTO Delivered</SelectItem>
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

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pb-12">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                    <span className="flex items-center text-sm font-bold px-4">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}
            <AlertDialog open={showUpdateWarning} onOpenChange={setShowUpdateWarning}>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                            Confirm Status Update
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-slate-600">
                            Are you sure you want to change the order status to <span className="text-[#794A05] font-extrabold">{pendingStatusUpdate?.status}</span>?
                            This will notify the customer and potentially trigger shipping processes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-slate-200">No, Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStatusUpdate} className="rounded-xl bg-[#794A05] hover:bg-[#5d3904]">Yes, Update</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default function AdminOrdersPage() {
    return (
        <React.Suspense fallback={<div className="p-12 text-center text-[#794A05] font-serif">Loading Orders...</div>}>
            <AdminOrdersContent />
        </React.Suspense>
    );
}

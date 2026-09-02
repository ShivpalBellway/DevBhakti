"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Loader2, 
    ShoppingBag, 
    User, 
    MapPin, 
    Phone, 
    IndianRupee, 
    Printer, 
    Clock, 
    Package 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { fetchMandalOrders, updateMandalOrderStatus, fetchMandalProfile } from "@/api/mandalAdminController";
import { BASE_URL } from "@/config/apiConfig";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { parseLocalizedValue } from "@/utils/textUtils";

export default function MandalOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const canManageOrders = true; // Temples usually manage their own orders

    const loadOrder = async () => {
        setLoading(true);
        try {
            const profileRes = await fetchMandalProfile();
            if (profileRes.success && profileRes.data.id) {
                const tId = profileRes.data.id;
                const response = await fetchMandalOrders(tId);
            if (response.success) {
                const found = response.data.find((o: any) => o.id === params.id);
                if (found) {
                    setOrder(found);
                } else {
                    toast({ title: "Order Not Found", variant: "destructive" });
                    router.push("/mandals/dashboard/orders");
                }
            }
        }
    } catch (error) {
            console.error("Load order error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            loadOrder();
        }
    }, [params.id]);

    const handleStatusUpdate = async (status: string) => {
        try {
            const profileRes = await fetchMandalProfile();
            const tId = profileRes.data.id;
            const response = await updateMandalOrderStatus(params.id as string, { status, mandalId: tId });
            if (response.success) {
                toast({ title: "Status Updated", description: `Order marked as ${status}` });
                loadOrder();
            }
        } catch (error: any) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PENDING": return "bg-amber-50 text-amber-700 border-amber-200";
            case "ACCEPTED": return "bg-blue-50 text-blue-700 border-blue-200";
            case "PROCESSING": return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "SHIPPED": return "bg-blue-50 text-blue-700 border-blue-200";
            case "DELIVERED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "CANCELLED": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-primary font-medium">Loading Order Details...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => router.push("/mandals/dashboard/orders")}
                    className="rounded-full w-10 h-10 p-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-serif text-slate-900">Mandal Order Details</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage and track status for Order {order.displayId || `#${order.id.slice(-8).toUpperCase()}`}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                                Order Items
                            </CardTitle>
                            <Badge className={cn("rounded-full", getStatusStyle(order.status))}>
                                {order.status}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="pl-6">Product</TableHead>
                                        <TableHead>Variant</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right pr-6">Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-50 border overflow-hidden">
                                                        <img 
                                                            src={item.product?.image ? `${BASE_URL}${item.product.image}` : "/placeholder.png"} 
                                                            alt={parseLocalizedValue(item.product?.name)}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <span className="font-bold text-sm">{parseLocalizedValue(item.product?.name)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">{item.variantName}</TableCell>
                                            <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                                            <TableCell className="text-right pr-6 font-bold text-primary">₹{item.price.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-6 bg-slate-50/50 border-t space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-bold">₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span className="text-slate-900">Total Earning</span>
                                    <span className="text-primary">₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Update */}
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                                Update Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <Select defaultValue={order.status} onValueChange={handleStatusUpdate}>
                                    <SelectTrigger className="w-[240px] h-12 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">⏳ Pending</SelectItem>
                                        <SelectItem value="ACCEPTED">✅ Accepted</SelectItem>
                                        <SelectItem value="PROCESSING">📦 Processing</SelectItem>
                                        <SelectItem value="SHIPPED">🚚 Shipped</SelectItem>
                                        <SelectItem value="DELIVERED">✨ Delivered</SelectItem>
                                        <SelectItem value="CANCELLED" className="text-red-600">❌ Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button 
                                    variant="outline" 
                                    className="h-12 rounded-xl flex items-center gap-2"
                                    onClick={() => router.push(`/mandals/dashboard/orders/print?ids=${order.id}`)}
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Label
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <User className="w-4 h-4" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Name</p>
                                <p className="font-bold text-slate-900">{order.order?.user?.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Contact</p>
                                <p className="font-bold text-slate-900 flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-primary" /> {order.order?.user?.phone || "N/A"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-sm space-y-1">
                                <p className="font-bold text-slate-900">{order.order?.shippingAddress?.fullName}</p>
                                <p className="text-slate-600 leading-relaxed">
                                    {order.order?.shippingAddress?.street}<br />
                                    {order.order?.shippingAddress?.city}, {order.order?.shippingAddress?.state}<br />
                                    <span className="font-bold text-primary">{order.order?.shippingAddress?.pincode}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

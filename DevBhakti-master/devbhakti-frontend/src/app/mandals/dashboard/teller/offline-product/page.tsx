"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShoppingBag,
    User,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Printer,
    Package,
    Minus,
    Plus,
    Search,
    TrendingUp,
    CreditCard,
    Eye,
    Filter,
    ChevronLeft,
    ChevronRight,
    X,
    IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalProducts, fetchMandalProfile } from "@/api/mandalAdminController";
import { parseLocalizedValue } from "@/utils/textUtils";
import { BASE_URL, API_URL } from "@/config/apiConfig";
import axios from "axios";

interface CartItem {
    productId: string;
    variantId: string;
    variantName: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
    maxStock: number;
}

export default function MandalOfflineProductPage() {
    const router = useRouter();
    const { toast } = useToast();

    // View mode
    const [viewMode, setViewMode] = useState<"list" | "add">("list");

    const [mandalName, setMandalName] = useState<string>("");
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    // Orders list
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    // Table search, filter, pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentFilter, setPaymentFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearch, setProductSearch] = useState("");

    // Customer info
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [adminNotes, setAdminNotes] = useState("");

    const sanitizePhone = (phone: string) => phone.replace(/\D/g, "").slice(0, 11);

    const loadInitial = async () => {
        try {
            const profile = await fetchMandalProfile();
            if (profile.success && profile.data) {
                setMandalName(parseLocalizedValue(profile.data.name, "en") || "Mandal");
            }
            const data = await fetchMandalProducts({});
            if (data.success) {
                setProducts(data.data.products || []);
            }
        } catch (error) {
            console.error("Load error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/mandal-admin/teller/product-orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
                setOrders(json.data || []);
            } else {
                console.error("Failed to fetch product orders:", json.message);
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        loadInitial();
    }, []);

    useEffect(() => {
        if (viewMode === "list") {
            fetchOrders();
        }
    }, [viewMode]);

    // Stats
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        let todayTotal = 0;
        let grandTotal = 0;
        let todayCount = 0;

        orders.forEach((o) => {
            const amount = Number(o.totalAmount || o.amount || 0);
            grandTotal += amount;
            const dDate = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : "";
            if (dDate === todayStr) {
                todayCount++;
                todayTotal += amount;
            }
        });

        return { total: orders.length, todayCount, todayTotal, grandTotal };
    }, [orders]);

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const name = (o.customerName || o.user?.name || "").toLowerCase();
            const phone = (o.customerPhone || o.user?.phone || "").toLowerCase();
            const id = (o.displayId || o.id || "").toLowerCase();
            const query = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || name.includes(query) || phone.includes(query) || id.includes(query);
            const matchesPayment = paymentFilter === "ALL" || (o.paymentMethod || "").toUpperCase() === paymentFilter.toUpperCase();
            return matchesSearch && matchesPayment;
        });
    }, [orders, searchQuery, paymentFilter]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(start, start + itemsPerPage);
    }, [filteredOrders, currentPage]);

    // Cart helpers
    const addToCart = (product: any, variant: any) => {
        const existing = cart.find((c) => c.variantId === variant.id);
        if (existing) {
            if (existing.quantity >= variant.stock) {
                toast({ title: "Stock Limit", description: "Cannot add more than available stock.", variant: "destructive" });
                return;
            }
            setCart(cart.map((c) => (c.variantId === variant.id ? { ...c, quantity: c.quantity + 1 } : c)));
        } else {
            setCart([...cart, {
                productId: product.id,
                variantId: variant.id,
                variantName: parseLocalizedValue(variant.name) || "Default",
                productName: parseLocalizedValue(product.name) || "Product",
                productImage: product.image || "",
                price: variant.price,
                quantity: 1,
                maxStock: variant.stock,
            }]);
        }
        toast({ title: "Added to cart", description: `${parseLocalizedValue(product.name)} added` });
    };

    const updateCartQty = (variantId: string, delta: number) => {
        setCart((prev) => prev.map((c) => {
            if (c.variantId !== variantId) return c;
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null as any;
            if (newQty > c.maxStock) return c;
            return { ...c, quantity: newQty };
        }).filter(Boolean));
    };

    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    const filteredProducts = products.filter((p) => {
        if (!productSearch) return true;
        const name = parseLocalizedValue(p.name)?.toLowerCase() || "";
        return name.includes(productSearch.toLowerCase());
    });

    const handleSubmit = async () => {
        if (!customerName.trim() || !customerPhone.trim()) {
            toast({ title: "Validation Error", description: "Please fill customer name and phone.", variant: "destructive" });
            return;
        }
        if (cart.length === 0) {
            toast({ title: "Empty Cart", description: "Please add at least one product.", variant: "destructive" });
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem("token");
            const payload = {
                items: cart.map((c) => ({ productId: c.productId, variantId: c.variantId, quantity: c.quantity, price: c.price })),
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                customerEmail: customerEmail.trim() || undefined,
                customerAddress: customerAddress.trim() || undefined,
                paymentMethod,
                adminNotes: adminNotes.trim() || undefined,
                isOffline: true,
            };

            const response = await axios.post(`${API_URL}/mandal-admin/orders/offline`, payload, {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
            });

            if (response.data.success) {
                toast({ title: "Order Created!", description: "Offline product order recorded successfully.", variant: "success" });
                // Reset and return to list
                setCart([]);
                setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
                setCustomerAddress(""); setAdminNotes(""); setPaymentMethod("CASH");
                setStep(1);
                setViewMode("list");
            } else {
                toast({ title: "Error", description: response.data.message || "Could not create order.", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to create offline order.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateReceiptHTML = (order: any) => {
        const orderId = order?.displayId || order?.id || "ORD-OFF";
        const items = (order?.items || order?.subOrders || []);
        const itemRows = items.map((item: any) => `
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">${item.productName || item.product?.name || "Product"} (${item.variantName || item.variant?.name || "Default"})</td>
                <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${item.quantity}</td>
                <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">₹${Number(item.price || 0).toLocaleString()}</td>
                <td style="padding:8px;text-align:right;font-weight:bold;border-bottom:1px solid #eee;">₹${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</td>
            </tr>
        `).join("");

        return `<!DOCTYPE html><html><head><title>Order Receipt - ${orderId}</title>
            <style>body{font-family:Arial,sans-serif;color:#333;padding:20px;}
            .receipt-card{max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;}
            .header{text-align:center;border-bottom:2px solid #7b4623;padding-bottom:16px;margin-bottom:20px;}
            .title{font-size:20px;font-weight:bold;color:#7b4623;}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;margin-bottom:20px;}
            .label{color:#64748b;font-size:11px;text-transform:uppercase;}.val{font-weight:600;font-size:14px;}
            table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;}
            th{text-align:left;background:#f8fafc;padding:8px;border-bottom:2px solid #e2e8f0;color:#475569;}
            .total-box{margin-top:20px;background:#fdf6f0;border:1px solid #7b4623;border-radius:8px;padding:16px;text-align:right;}
            .total-val{font-size:24px;font-weight:bold;color:#7b4623;}
            @media print{body{padding:0}.receipt-card{border:none}}</style></head>
            <body><div class="receipt-card">
            <div class="header"><h1 class="title">${mandalName || "DevBhakti Mandal"}</h1><p style="color:#64748b">Offline Product Purchase Receipt</p></div>
            <div class="grid">
                <div><div class="label">Order ID</div><div class="val">${orderId}</div></div>
                <div><div class="label">Date</div><div class="val">${new Date(order?.createdAt || Date.now()).toLocaleDateString("en-IN")}</div></div>
                <div><div class="label">Customer Name</div><div class="val">${order?.customerName || "N/A"}</div></div>
                <div><div class="label">Phone</div><div class="val">${order?.customerPhone || "N/A"}</div></div>
                <div><div class="label">Payment</div><div class="val">${order?.paymentMethod || "CASH"}</div></div>
            </div>
            <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${itemRows}</tbody></table>
            <div class="total-box"><span class="label" style="display:block">Grand Total</span><span class="total-val">₹${Number(order?.totalAmount || 0).toLocaleString()}</span></div>
            <p style="text-align:center;margin-top:20px;font-size:11px;color:#94a3b8">Thank you for your purchase!</p>
            </div>
            <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
            </body></html>`;
    };

    const handlePrintOrder = (order: any) => {
        const html = generateReceiptHTML(order);
        const w = window.open("", "_blank");
        if (w) { w.document.write(html); w.document.close(); }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#7b4623]" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-32 px-2 sm:px-0">

            {/* Top Breadcrumb Navigation */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/mandals/dashboard/teller" className="hover:text-[#7b4623] flex items-center gap-1 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Teller Module
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">
                        {viewMode === "list" ? "Offline Product Orders" : "New Offline Order"}
                    </span>
                </div>

                {viewMode === "list" ? (
                    <Button onClick={() => setViewMode("add")} className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-md rounded-xl font-bold">
                        <Plus className="w-4 h-4 mr-2" /> New Offline Order
                    </Button>
                ) : (
                    <Button onClick={() => { setViewMode("list"); setCart([]); setStep(1); }} variant="outline" className="border-slate-300 rounded-xl font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders List
                    </Button>
                )}
            </div>

            {/* ═══════════════════════════════ LIST VIEW ═══════════════════════════════ */}
            {viewMode === "list" && (
                <>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Offline Product Orders</h1>
                        <p className="text-sm text-slate-500">View and manage all offline product orders recorded at the counter.</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white shadow-sm rounded-2xl">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Orders</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{stats.todayCount} created today</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm rounded-2xl">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Today's Sales</p>
                                    <h3 className="text-2xl font-bold text-emerald-700 mt-1">₹{stats.todayTotal.toLocaleString()}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Counter sales today</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-sm rounded-2xl">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Revenue</p>
                                    <h3 className="text-2xl font-bold text-blue-700 mt-1">₹{stats.grandTotal.toLocaleString()}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Cumulative offline sales</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter & Search */}
                    <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                            <div className="relative w-full md:max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by customer name, phone, or order ID..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="pl-9 rounded-xl border-slate-200 focus:border-[#7b4623]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20"
                                >
                                    <option value="ALL">All Payment Methods</option>
                                    <option value="CASH">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Card</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left font-semibold">Order ID</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Customer Name</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Phone</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Items</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Date</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Amount</th>
                                        <th className="px-4 py-3.5 text-left font-semibold">Payment</th>
                                        <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingOrders ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 animate-spin text-[#7b4623]" />
                                                    <span>Loading offline orders...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paginatedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                                <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                                <p className="font-medium text-base text-slate-700">No offline orders found</p>
                                                <p className="text-xs text-slate-400 mt-1">Click "New Offline Order" to record the first one.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOrders.map((order, idx) => {
                                            const itemsArr = order.items || order.subOrders || [];
                                            const itemSummary = itemsArr.length > 0
                                                ? `${itemsArr[0]?.productName || itemsArr[0]?.product?.name || "Product"} ${itemsArr.length > 1 ? `+${itemsArr.length - 1} more` : ""}`
                                                : "—";
                                            return (
                                                <tr key={order.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#7b4623]">
                                                        {order.displayId || order.id?.slice(-8) || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                                                        {order.customerName || order.user?.name || "Customer"}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {order.customerPhone || order.user?.phone || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-700 max-w-[180px] truncate" title={itemSummary}>
                                                        {itemSummary}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-bold text-emerald-700">
                                                        ₹{Number(order.totalAmount || order.amount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <Badge variant="outline" className="uppercase text-xs font-semibold bg-slate-50 text-slate-700">
                                                            {order.paymentMethod || "CASH"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                onClick={() => setSelectedOrder(order)}
                                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                onClick={() => handlePrintOrder(order)}
                                                                className="h-8 w-8 text-[#7b4623] hover:bg-amber-50" title="Print Receipt"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredOrders.length > 0 && (
                            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-xs text-slate-500">
                                    Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                                    <strong>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> of{" "}
                                    <strong>{filteredOrders.length}</strong> orders
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="h-8 px-3 rounded-lg text-xs">
                                        <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                                    </Button>
                                    <span className="text-xs font-semibold px-2 text-slate-700">Page {currentPage} of {totalPages}</span>
                                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="h-8 px-3 rounded-lg text-xs">
                                        Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            )}

            {/* ═══════════════════════════════ ADD / FORM VIEW ═══════════════════════════════ */}
            {viewMode === "add" && (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold font-serif text-slate-900">New Offline Product Order</h1>
                        <p className="text-sm text-muted-foreground">Create an offline order for {mandalName}</p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2">
                        {[{ num: 1, label: "Select Products" }, { num: 2, label: "Customer Details" }, { num: 3, label: "Confirm Order" }]
                            .map((s, idx) => (
                                <React.Fragment key={s.num}>
                                    <button
                                        onClick={() => { if (s.num < step || (s.num === 2 && cart.length > 0)) setStep(s.num); }}
                                        className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                                            step >= s.num ? "bg-[#7b4623] text-white" : "bg-slate-100 text-slate-500")}
                                    >
                                        {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : <span>{s.num}</span>}
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </button>
                                    {idx < 2 && <div className={cn("w-8 h-0.5 rounded", step > s.num ? "bg-[#7b4623]" : "bg-slate-200")} />}
                                </React.Fragment>
                            ))}
                    </div>

                    {/* Step 1: Products */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10 rounded-xl" />
                            </div>

                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-16">
                                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    <p className="text-muted-foreground">No products available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredProducts.map((product) => (
                                        <Card key={product.id} className="overflow-hidden border-slate-100 shadow-sm">
                                            <div className="aspect-video bg-slate-50 overflow-hidden">
                                                {product.image ? (
                                                    <img src={`${BASE_URL}${product.image}`} alt={parseLocalizedValue(product.name)} className="w-full h-full object-contain p-3" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-10 h-10 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <CardContent className="p-4 space-y-3">
                                                <h3 className="font-bold text-sm line-clamp-1">{parseLocalizedValue(product.name)}</h3>
                                                <div className="space-y-2">
                                                    {(product.variants || []).map((v: any) => {
                                                        const inCart = cart.find((c) => c.variantId === v.id);
                                                        return (
                                                            <div key={v.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                                                                <div>
                                                                    <p className="text-xs font-semibold">{parseLocalizedValue(v.name) || "Default"}</p>
                                                                    <p className="text-xs text-slate-500">₹{v.price} · Stock: {v.stock}</p>
                                                                </div>
                                                                {inCart ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => updateCartQty(v.id, -1)} className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">
                                                                            <Minus className="w-3 h-3" />
                                                                        </button>
                                                                        <span className="w-8 text-center text-sm font-bold">{inCart.quantity}</span>
                                                                        <button onClick={() => updateCartQty(v.id, 1)} className="w-7 h-7 rounded-full bg-[#7b4623] text-white flex items-center justify-center hover:bg-[#5d351a]">
                                                                            <Plus className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg" onClick={() => addToCart(product, v)} disabled={v.stock <= 0}>
                                                                        {v.stock > 0 ? "Add" : "Out"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Customer */}
                    {step === 2 && (
                        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Full Name *</label>
                                        <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Phone *</label>
                                        <Input placeholder="10-digit phone" value={customerPhone} onChange={(e) => setCustomerPhone(sanitizePhone(e.target.value))} className="rounded-xl" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Email</label>
                                        <Input placeholder="Email (optional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="rounded-xl" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Payment Method</label>
                                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20">
                                            <option value="CASH">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="CARD">Card</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Address</label>
                                    <Input placeholder="Address (optional)" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="rounded-xl" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Admin Notes</label>
                                    <Textarea placeholder="Internal notes (optional)" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="rounded-xl min-h-[60px]" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <Card className="border-none shadow-sm rounded-2xl">
                                <CardHeader className="bg-slate-50/50 border-b">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.variantId} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    {item.productImage ? (
                                                        <img src={`${BASE_URL}${item.productImage}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{item.productName}</p>
                                                    <p className="text-xs text-slate-500">{item.variantName} × {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-[#7b4623]">₹{cartTotal.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm rounded-2xl">
                                <CardContent className="p-6 grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-xs text-slate-500 uppercase">Customer</p><p className="font-semibold">{customerName}</p></div>
                                    <div><p className="text-xs text-slate-500 uppercase">Phone</p><p className="font-semibold">{customerPhone}</p></div>
                                    <div><p className="text-xs text-slate-500 uppercase">Payment</p><Badge variant="outline" className="capitalize">{paymentMethod.toLowerCase()}</Badge></div>
                                    {customerAddress && <div><p className="text-xs text-slate-500 uppercase">Address</p><p className="font-semibold">{customerAddress}</p></div>}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Sticky Bottom Bar (for ADD mode) */}
            {viewMode === "add" && (
                <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg p-3 z-40">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#7b4623]/10 p-2 rounded-xl text-[#7b4623]">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500">Total ({cartItemCount} items)</p>
                                <p className="text-base font-bold text-[#7b4623]">₹{cartTotal.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {step > 1 && (
                                <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => setStep(step - 1)}>
                                    Back
                                </Button>
                            )}
                            {step < 3 ? (
                                <Button size="sm" className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl px-6 h-9"
                                    disabled={step === 1 && cart.length === 0}
                                    onClick={() => setStep(step + 1)}>
                                    Next
                                </Button>
                            ) : (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-9"
                                    disabled={isSubmitting}
                                    onClick={handleSubmit}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Confirm Order
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-serif font-bold text-slate-900">Order Details</h2>
                            <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div><p className="text-xs text-slate-500 uppercase font-semibold">Order ID</p><p className="font-mono font-bold text-[#7b4623]">{selectedOrder.displayId || selectedOrder.id?.slice(-8)}</p></div>
                                <div><p className="text-xs text-slate-500 uppercase font-semibold">Payment</p><Badge variant="outline" className="uppercase text-xs mt-0.5">{selectedOrder.paymentMethod || "CASH"}</Badge></div>
                                <div><p className="text-xs text-slate-500 uppercase font-semibold">Customer</p><p className="font-semibold text-slate-900">{selectedOrder.customerName || "N/A"}</p></div>
                                <div><p className="text-xs text-slate-500 uppercase font-semibold">Phone</p><p className="font-semibold text-slate-900">{selectedOrder.customerPhone || "N/A"}</p></div>
                            </div>

                            {/* Items ordered */}
                            {(selectedOrder.items || selectedOrder.subOrders || []).length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Items Purchased</p>
                                    {(selectedOrder.items || selectedOrder.subOrders || []).map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                            <div>
                                                <p className="font-medium text-slate-800">{item.productName || item.product?.name || "Product"}</p>
                                                <p className="text-xs text-slate-500">{item.variantName || item.variant?.name || "Default"} × {item.quantity}</p>
                                            </div>
                                            <span className="font-bold text-slate-800">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex justify-between items-center">
                                <span className="font-medium text-slate-700">Total Order Amount</span>
                                <span className="text-xl font-bold text-[#7b4623]">₹{Number(selectedOrder.totalAmount || selectedOrder.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-4 border-t flex gap-3">
                            <Button onClick={() => handlePrintOrder(selectedOrder)} variant="outline" className="flex-1 border-[#7b4623] text-[#7b4623] rounded-xl">
                                <Printer className="w-4 h-4 mr-2" /> Print Receipt
                            </Button>
                            <Button onClick={() => setSelectedOrder(null)} className="flex-1 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

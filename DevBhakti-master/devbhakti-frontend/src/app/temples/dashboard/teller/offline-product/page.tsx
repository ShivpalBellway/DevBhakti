"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingBag,
    User,
    Phone,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Printer,
    Package,
    Minus,
    Plus,
    Search,
    IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchMyProducts, fetchMyTempleProfile, createOfflineTempleOrder } from "@/api/templeAdminController";
import { parseLocalizedValue } from "@/utils/textUtils";
import { BASE_URL } from "@/config/apiConfig";

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

export default function TempleOfflineProductPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [templeId, setTempleId] = useState<string | null>(null);
    const [templeName, setTempleName] = useState<string>("");
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [step, setStep] = useState(1); // 1=products, 2=customer, 3=confirm

    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);

    // Customer info
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [adminNotes, setAdminNotes] = useState("");

    const sanitizePhone = (phone: string) => phone.replace(/\D/g, "").slice(0, 11);

    useEffect(() => {
        const load = async () => {
            try {
                const profile = await fetchMyTempleProfile();
                if (profile.success && profile.data?.id) {
                    setTempleId(profile.data.id);
                    setTempleName(parseLocalizedValue(profile.data.name, "en") || "Sacred Temple");
                }
                const data = await fetchMyProducts({});
                if (data.success) {
                    setProducts(data.data.products || []);
                }
            } catch (error) {
                console.error("Load error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const addToCart = (product: any, variant: any) => {
        const existing = cart.find((c) => c.variantId === variant.id);
        if (existing) {
            if (existing.quantity >= variant.stock) {
                toast({ title: "Stock Limit", description: "Cannot add more than available stock.", variant: "destructive" });
                return;
            }
            setCart(cart.map((c) => (c.variantId === variant.id ? { ...c, quantity: c.quantity + 1 } : c)));
        } else {
            setCart([
                ...cart,
                {
                    productId: product.id,
                    variantId: variant.id,
                    variantName: parseLocalizedValue(variant.name) || "Default",
                    productName: parseLocalizedValue(product.name) || "Product",
                    productImage: product.image || "",
                    price: Number(variant.price),
                    quantity: 1,
                    maxStock: variant.stock,
                },
            ]);
        }
        toast({ title: "Added to cart", description: `${parseLocalizedValue(product.name)} — ${variant.name || "Default"}` });
    };

    const updateCartQty = (variantId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((c) => {
                    if (c.variantId !== variantId) return c;
                    const newQty = c.quantity + delta;
                    if (newQty <= 0) return null as any;
                    if (newQty > c.maxStock) return c;
                    return { ...c, quantity: newQty };
                })
                .filter(Boolean)
        );
    };

    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    const filteredProducts = products.filter((p) => {
        if (!searchQuery) return true;
        const name = parseLocalizedValue(p.name)?.toLowerCase() || "";
        return name.includes(searchQuery.toLowerCase());
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
            const payload = {
                templeId,
                items: cart.map((c) => ({
                    productId: c.productId,
                    variantId: c.variantId,
                    quantity: c.quantity,
                    price: c.price,
                })),
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                customerEmail: customerEmail.trim() || undefined,
                customerAddress: customerAddress.trim() || undefined,
                paymentMethod,
                adminNotes: adminNotes.trim() || undefined,
                isOffline: true,
            };

            const response = await createOfflineTempleOrder(payload);

            if (response.success) {
                setCreatedOrder(response.data);
                setIsComplete(true);
                toast({ title: "Order Created", description: "Offline product order recorded successfully." });
            } else {
                toast({ title: "Error", description: response.message || "Could not create order.", variant: "destructive" });
            }
        } catch (error: any) {
            console.error("Create Order Error:", error);
            toast({ title: "Error", description: "Failed to create offline order.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewOrder = () => {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setCustomerAddress("");
        setAdminNotes("");
        setPaymentMethod("CASH");
        setIsComplete(false);
        setCreatedOrder(null);
        setStep(1);
    };

    const generateReceiptHTML = () => {
        const orderId = createdOrder?.displayId || createdOrder?.id || "ORD-OFF";
        const items = cart.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName} (${item.variantName})</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹{(item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join("");

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Temple Order Receipt - ${orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.5; }
                    .receipt-card { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
                    .header { text-align: center; border-bottom: 2px solid #7b4623; padding-bottom: 16px; margin-bottom: 20px; }
                    .title { font-size: 20px; font-weight: bold; color: #7b4623; margin: 0; }
                    .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-bottom: 20px; }
                    .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
                    .val { font-weight: 600; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
                    th { text-align: left; background: #f8fafc; padding: 8px; border-bottom: 2px solid #e2e8f0; color: #475569; }
                    .total-box { margin-top: 20px; background: #fdf6f0; border: 1px solid #7b4623; border-radius: 8px; padding: 16px; text-align: right; }
                    .total-val { font-size: 24px; font-weight: bold; color: #7b4623; }
                    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; }
                    @media print {
                        body { padding: 0; }
                        .receipt-card { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-card">
                    <div class="header">
                        <h1 class="title">${templeName || "Sacred Temple"}</h1>
                        <p class="subtitle">Offline Product Purchase Receipt</p>
                    </div>
                    <div class="grid">
                        <div>
                            <div class="label">Order ID</div>
                            <div class="val">${orderId}</div>
                        </div>
                        <div>
                            <div class="label">Date</div>
                            <div class="val">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                        <div>
                            <div class="label">Customer Name</div>
                            <div class="val">${customerName || "N/A"}</div>
                        </div>
                        <div>
                            <div class="label">Phone</div>
                            <div class="val">${customerPhone || "N/A"}</div>
                        </div>
                        <div>
                            <div class="label">Payment Method</div>
                            <div class="val" style="text-transform: uppercase;">${paymentMethod}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items}
                        </tbody>
                    </table>

                    <div class="total-box">
                        <span class="label" style="display: block;">Grand Total</span>
                        <span class="total-val">₹${cartTotal.toLocaleString()}</span>
                    </div>

                    <div class="footer">
                        <p>Thank you for your purchase! Jay Shri Krishna.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handlePrintReceipt = () => {
        const html = generateReceiptHTML();
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 400);
        }
    };

    // ─── Success Screen ────────────────────────────────────────
    if (isComplete) {
        return (
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <div className="text-center space-y-4 py-8">
                    <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900">
                        Temple Order Created Successfully!
                    </h1>
                    <p className="text-muted-foreground">
                        Offline order of <span className="font-bold text-emerald-700">₹{cartTotal.toLocaleString()}</span> has been recorded.
                    </p>
                </div>

                <Card className="border-none shadow-sm rounded-2xl">
                    <CardContent className="p-6 space-y-3">
                        {cart.map((item) => (
                            <div key={item.variantId} className="flex justify-between items-center text-sm">
                                <span>{item.productName} ({item.variantName}) × {item.quantity}</span>
                                <span className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <div className="border-t pt-3 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-emerald-700">₹{cartTotal.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={handlePrintReceipt} variant="outline" className="rounded-xl h-12 border-slate-300 hover:bg-slate-50">
                        <Printer className="w-4 h-4 mr-2" /> Print Receipt
                    </Button>
                    <Button onClick={handlePrintReceipt} variant="outline" className="rounded-xl h-12 border-slate-300 hover:bg-slate-50">
                        <Printer className="w-4 h-4 mr-2" /> Download Receipt
                    </Button>
                </div>

                <Button onClick={handleNewOrder} className="w-full bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl h-12">
                    <ShoppingBag className="w-4 h-4 mr-2" /> Create Another Order
                </Button>
            </div>
        );
    }

    // ─── Loading ─────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-32">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-serif text-slate-900">Offline Product Booking</h1>
                    <p className="text-sm text-muted-foreground">
                        Create an offline product sale for {templeName}
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2">
                {[
                    { num: 1, label: "Select Products" },
                    { num: 2, label: "Customer Details" },
                    { num: 3, label: "Confirm Order" },
                ].map((s, idx) => (
                    <React.Fragment key={s.num}>
                        <button
                            onClick={() => { if (s.num < step || (s.num === 2 && cart.length > 0)) setStep(s.num); }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                                step >= s.num
                                    ? "bg-[#7b4623] text-white"
                                    : "bg-slate-100 text-slate-500"
                            )}
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
                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-xl"
                        />
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-muted-foreground">No products available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product) => {
                                const variants = product.variants || [];
                                return (
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
                                                {variants.map((v: any) => {
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
                                );
                            })}
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
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20"
                                >
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
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
                                Order Summary
                            </CardTitle>
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
                                    <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
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
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Customer</p>
                                <p className="font-semibold">{customerName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Phone</p>
                                <p className="font-semibold">{customerPhone}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Payment</p>
                                <Badge variant="outline" className="capitalize">{paymentMethod.toLowerCase()}</Badge>
                            </div>
                            {customerAddress && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Address</p>
                                    <p className="font-semibold">{customerAddress}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg p-3 z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
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
                            <Button
                                size="sm"
                                className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl px-6 h-9"
                                disabled={step === 1 && cart.length === 0}
                                onClick={() => setStep(step + 1)}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-9"
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Confirm Order
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

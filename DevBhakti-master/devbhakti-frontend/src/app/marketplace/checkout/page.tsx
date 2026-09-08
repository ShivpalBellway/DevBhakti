"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, MapPin, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import { notifyFailedPayment } from "@/api/adminController";
import { parseLocalizedValue, isSequentialOrRepetitive } from "@/utils/textUtils";
import { useLanguage } from "@/context/LanguageContext";

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fdf6e9] flex items-center justify-center"><p className="animate-pulse text-[#794A05] font-bold">Loading checkout...</p></div>}>
            <CheckoutContent />
        </Suspense>
    );
}

function CheckoutContent() {
    const router = useRouter();
    const { cartItems: globalCartItems, totalAmount: globalTotalAmount, clearCart } = useCart();
    const { language, t } = useLanguage();
    const searchParams = useSearchParams();
    const isBuyNow = searchParams.get('mode') === 'buy_now';

    // Buy Now mode: use sessionStorage items instead of cart
    const [buyNowItems, setBuyNowItems] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (isBuyNow) {
            try {
                const stored = sessionStorage.getItem('devbhakti_buy_now');
                if (stored) {
                    setBuyNowItems(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to parse buy_now data', e);
            }
        }
    }, [isBuyNow]);

    const cartItems = isBuyNow ? buyNowItems : globalCartItems;
    const totalAmount = isBuyNow
        ? buyNowItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
        : globalTotalAmount;
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("RAZORPAY");
    const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";

    const [address, setAddress] = useState({
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
    });

    // Autofill basic details if logged in
    React.useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setAddress(prev => ({
                    ...prev,
                    fullName: parseLocalizedValue(user.name, language) || prev.fullName,
                    phone: (user.phone || "").replace(/\D/g, "").slice(-10) || prev.phone,
                }));
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    const [platformFee, setPlatformFee] = useState(0);
    const [isCalculatingFees, setIsCalculatingFees] = useState(false);

    React.useEffect(() => {
        const fetchFees = async () => {
            if (cartItems.length === 0) return;
            setIsCalculatingFees(true);
            try {
                const requestData = {
                    items: cartItems.map(item => ({
                        productId: item.productId,
                        price: item.price,
                        quantity: item.quantity,
                        templeId: item.templeId,
                        mandalId: (item as any).mandalId,
                        sellerId: (item as any).sellerId
                    }))
                };
                const response = await axios.post(`${API_URL}/orders/calculate-fees`, requestData);
                if (response.data.success) {
                    setPlatformFee(response.data.totalPlatformFee);
                }
            } catch (error) {
                console.error("Fee calculation error:", error);
            } finally {
                setIsCalculatingFees(false);
            }
        };
        fetchFees();
    }, [cartItems, API_URL]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "pincode") {
            const numericValue = value.replace(/[^0-9]/g, "");
            if (numericValue.length <= 6) {
                setAddress((prev) => ({ ...prev, [name]: numericValue }));
            }
            return;
        }
        if (name === "phone") {
            const numericValue = value.replace(/\D/g, "");
            if (numericValue.length <= 10) {
                setAddress((prev) => ({ ...prev, [name]: numericValue }));
            }
            return;
        }
        setAddress((prev) => ({ ...prev, [name]: value }));
    };

    // Using shared `isSequentialOrRepetitive` from utils

    const hasInactiveItems = cartItems.some(item => item.isActive === false);

    const handlePlaceOrder = async () => {
        // Block checkout if any items are discontinued/soft-deleted
        if (hasInactiveItems) {
            toast({
                title: "Items Unavailable",
                description: "Some items in your order are no longer available. Please remove them from your cart before proceeding.",
                variant: "destructive",
            });
            return;
        }

        // Basic validation
        if (!address.fullName || !address.phone || !address.street || !address.pincode) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required shipping details.",
                variant: "destructive",
            });
            return;
        }

        // Phone: must be 10 digits and not obvious sequential/repetitive patterns
        if (address.phone.length !== 10) {
            toast({
                title: "Invalid Phone Number",
                description: "Please enter a valid 10-digit phone number.",
                variant: "destructive",
            });
            return;
        }

        if (isSequentialOrRepetitive(address.phone)) {
            toast({
                title: "Invalid Phone Number",
                description: "Phone number looks invalid (sequential or repetitive). Please provide a real mobile number.",
                variant: "destructive",
            });
            return;
        }

        if (address.pincode.length !== 6) {
            toast({
                title: "Invalid Pincode",
                description: "Please enter a valid 6-digit pincode.",
                variant: "destructive",
            });
            return;
        }

        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!savedUser || !token) {
            toast({
                title: "Authentication Required",
                description: "Please login to place an order.",
                variant: "destructive",
            });
            router.push("/auth?mode=login");
            return;
        }

        const user = JSON.parse(savedUser);

        if (user.role !== "DEVOTEE") {
            toast({
                title: "Devotee account required",
                description: "Only devotee accounts can place marketplace orders.",
                variant: "destructive",
            });
            router.push("/auth?mode=login");
            return;
        }

        const userId = user.id;

        // Enforce Razorpay payment only
        if (paymentMethod !== "RAZORPAY") {
            toast({
                title: "Online payment required",
                description: "Please complete Razorpay payment to confirm your order.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const orderData = {
                userId,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    variantName: item.variantName,
                    price: item.price,
                    quantity: item.quantity,
                    templeId: item.templeId,
                    sellerId: (item as any).sellerId
                })),
                totalAmount: totalAmount + platformFee,
                paymentMethod,
                shippingAddress: address,
                platformFee,
                shippingCost: 0,
            };

            const response = await axios.post(`${API_URL}/orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                if (paymentMethod === "RAZORPAY" && response.data.razorpayOrder) {
                    const options = {
                        key: RAZORPAY_KEY,
                        amount: response.data.razorpayOrder.amount,
                        currency: response.data.razorpayOrder.currency,
                        name: "DevBhakti",
                        description: "Sacred Marketplace Order",
                        order_id: response.data.razorpayOrder.id,
                        handler: async function (responseData: any) {
                            setIsPaymentLoading(true);
                            try {
                                const verifyRes = await axios.post(`${API_URL}/payments/verify`, {
                                    razorpay_order_id: responseData.razorpay_order_id,
                                    razorpay_payment_id: responseData.razorpay_payment_id,
                                    razorpay_signature: responseData.razorpay_signature,
                                    orderType: "MARKETPLACE",
                                    orderData: orderData,
                                    userId: user.id
                                }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });

                                if (verifyRes.data.success) {
                                    toast({
                                        title: "Payment Successful!",
                                        description: "Your order is confirmed.",
                                        variant: "success"
                                    });
                                    if (isBuyNow) {
                                        sessionStorage.removeItem('devbhakti_buy_now');
                                    } else {
                                        clearCart();
                                    }
                                    router.push("/marketplace/order-success");
                                } else {
                                    setIsPaymentLoading(false);
                                    toast({
                                        title: "Payment Verification Failed",
                                        description: verifyRes.data?.message || "Please contact support if the amount was deducted.",
                                        variant: "destructive",
                                    });
                                }
                             } catch (error: any) {
                                console.error("Verification error:", error);
                                const errorCode = error?.response?.data?.code;
                                const count = error?.response?.data?.count;
                                const backendMsg = error?.response?.data?.message;

                                let errorTitle = t("marketplace.checkout.order_failed");
                                let errorDescription = backendMsg || t("marketplace.checkout.contact_support");

                                if (errorCode === "OUT_OF_STOCK") {
                                    errorTitle = t("marketplace.checkout.out_of_stock_title");
                                    errorDescription = count !== undefined && count > 0
                                        ? t("marketplace.checkout.out_of_stock_limited", { count })
                                        : t("marketplace.checkout.out_of_stock_msg");
                                } else if (errorCode === "PRODUCT_UNAVAILABLE") {
                                    errorTitle = t("marketplace.checkout.product_unavailable_title");
                                    errorDescription = t("marketplace.checkout.product_unavailable_msg");
                                }

                                toast({
                                    title: errorTitle,
                                    description: errorDescription,
                                    variant: "destructive",
                                });
                                setIsPaymentLoading(false);
                            }
                        },
                        prefill: {
                            name: address.fullName,
                            contact: address.phone,
                            email: user.email || "",
                        },
                        theme: { color: "#794A05" },
                        modal: {
                            ondismiss: function () {
                                setIsPaymentLoading(false);
                                notifyFailedPayment({
                                    orderType: "MARKETPLACE",
                                    orderData: orderData,
                                    userId: user.id,
                                    phone: address.phone,
                                    userName: address.fullName,
                                }).catch(console.error);
                            }
                        }
                    };

                    const rzp = new (window as any).Razorpay(options);

                    rzp.on('payment.failed', function (response: any) {
                        setIsPaymentLoading(false);
                        console.error("Payment failed event:", response.error);
                        notifyFailedPayment({
                            orderType: "MARKETPLACE",
                            orderData: orderData,
                            userId: user.id,
                            phone: address.phone,
                            userName: address.fullName,
                            error: response.error
                        }).catch(console.error);
                    });

                    rzp.open();
                } else {
                    toast({
                        title: "Order Placed Successfully!",
                        description: "Your sacred items will be delivered soon.",
                        variant: "success"
                    });
                    if (isBuyNow) {
                        sessionStorage.removeItem('devbhakti_buy_now');
                    } else {
                        clearCart();
                    }
                    router.push("/marketplace/order-success");
                }
            }
        } catch (error: any) {
            console.error("Order error:", error);
            toast({
                title: "Order Failed",
                description: error.response?.data?.message || "There was an error placing your order.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#fdf6e9]">
                <Navbar />
                <main className="pt-32 pb-20 container mx-auto px-4 text-center">
                    <Card className="max-w-md mx-auto p-8 bg-white/80 backdrop-blur-sm border-[#794A05]/10">
                        <CardHeader>
                            <CardTitle className="font-display text-2xl text-[#2a1b01]">Your cart is empty</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 mb-6">Looks like you haven&apos;t added any sacred items yet.</p>
                            <Button onClick={() => router.push("/marketplace")} className="bg-[#794A05] hover:bg-[#5d3804] text-white rounded-full px-8">
                                Explore Marketplace
                            </Button>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdf6e9]">
            {isPaymentLoading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 text-center shadow-2xl border border-[#794A05]/10">
                        <Loader2 className="h-10 w-10 animate-spin text-[#794A05]" />
                        <div>
                            <p className="text-lg font-bold text-[#2a1b01]">Loading Payment</p>
                            <p className="mt-1 text-sm text-slate-500">Please wait while we confirm your payment.</p>
                        </div>
                    </div>
                </div>
            )}
            <Navbar />
            <main className="pt-32 pb-20 container mx-auto px-4">
                <div className="flex items-center gap-2 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#794A05]">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-display font-bold text-[#2a1b01]">Checkout</h1>
                </div>

                {hasInactiveItems && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                        <span className="text-red-500 text-xl">⚠️</span>
                        <div>
                            <p className="text-red-700 font-bold text-sm">Some items are no longer available</p>
                            <p className="text-red-600 text-xs mt-1">Please remove the unavailable items from your cart to proceed with checkout.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Delivery Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="bg-white border-[#794A05]/10 overflow-hidden">
                            <CardHeader className="bg-[#794A05]/5 border-b border-[#794A05]/10">
                                <CardTitle className="flex items-center gap-2 text-[#794A05]">
                                    <MapPin className="w-5 h-5" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Full Name *</label>
                                        <Input name="fullName" value={address.fullName} onChange={handleInputChange} placeholder="Enter your full name" className="focus:ring-[#794A05] border-[#794A05]/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Phone Number *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium border-r border-slate-200 pr-2 text-xs">+91</span>
                                            <Input
                                                name="phone"
                                                value={address.phone}
                                                onChange={handleInputChange}
                                                placeholder="10-digit number"
                                                maxLength={10}
                                                className="pl-12 focus:ring-[#794A05] border-[#794A05]/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Street Address *</label>
                                    <Input name="street" value={address.street} onChange={handleInputChange} placeholder="Building, Street name" className="focus:ring-[#794A05] border-[#794A05]/20" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">City *</label>
                                        <Input name="city" value={address.city} onChange={handleInputChange} placeholder="City" className="focus:ring-[#794A05] border-[#794A05]/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">State *</label>
                                        <Input name="state" value={address.state} onChange={handleInputChange} placeholder="State" className="focus:ring-[#794A05] border-[#794A05]/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Pincode *</label>
                                        <Input name="pincode" value={address.pincode} onChange={handleInputChange} placeholder="6 digits" className="focus:ring-[#794A05] border-[#794A05]/20" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Mode Info */}
                        {/* <div className="p-5 bg-[#794A05]/5 border border-[#794A05]/10 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <ShieldCheck className="w-6 h-6 text-[#794A05]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#794A05]">Secure Online Payment</p>
                                    <p className="text-xs text-slate-500">UPI, Cards, NetBanking available</p>
                                </div>
                            </div>
                            <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="w-5 h-5 opacity-60" />
                        </div> */}
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5">
                        <Card className="bg-white border-[#794A05]/10 sticky top-32">
                            <CardHeader>
                                <CardTitle className="text-xl font-display font-bold text-[#2a1b01]">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-[#794A05]/20">
                                    {cartItems.map((item) => (
                                        <div key={item.variantId} className={`flex gap-4 ${item.isActive === false ? 'opacity-50' : ''}`}>
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 relative">
                                                <img
                                                    src={item.image ? (item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`) : '/placeholder.jpg'}
                                                    alt={item.name}
                                                    className={`w-full h-full object-cover ${item.isActive === false ? 'grayscale' : ''}`}
                                                />
                                                {item.isActive === false && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <span className="text-[8px] text-white font-bold uppercase">Unavailable</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-[#2a1b01] line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.variantName} x {item.quantity}</p>
                                                {item.isActive === false ? (
                                                    <p className="text-[10px] text-red-500 font-bold italic mt-0.5">Currently Unavailable — Please remove</p>
                                                ) : (
                                                    <p className="text-sm font-bold text-[#794A05]">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-[#794A05]/10" />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="flex items-center font-medium"><IndianRupee className="w-3.5 h-3.5" /> {totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Platform Service Fee</span>
                                        <span className="flex items-center font-medium">
                                            {isCalculatingFees ? (
                                                <span className="text-[10px] animate-pulse">Calculating...</span>
                                            ) : (
                                                <><IndianRupee className="w-3.5 h-3.5" /> {platformFee.toLocaleString()}</>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span className="text-tulsi font-medium">Free</span>
                                    </div>
                                    <Separator className="bg-[#794A05]/10" />
                                    <div className="flex justify-between text-xl font-bold text-[#2a1b01]">
                                        <span>Total</span>
                                        <span className="flex items-center text-[#794A05]"><IndianRupee className="w-5 h-5" /> {(totalAmount + platformFee).toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 flex-col gap-4">
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting || hasInactiveItems}
                                    className="w-full h-14 text-lg font-bold bg-[#794A05] hover:bg-[#5d3804] text-white rounded-2xl shadow-lg shadow-[#794A05]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    {isSubmitting ? "Processing Payment..." : hasInactiveItems ? "Remove Unavailable Items First" : "Pay Now"}
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                    <ShieldCheck className="w-4 h-4 text-tulsi" />
                                    Secure Transaction • Authentic Sacred Products
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

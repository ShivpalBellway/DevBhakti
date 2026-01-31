"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, MapPin, Truck, ShieldCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function CheckoutPage() {
    const router = useRouter();
    const { cartItems, totalAmount, clearCart } = useCart();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const [address, setAddress] = useState({
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddress((prev) => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async () => {
        // Basic validation
        if (!address.fullName || !address.phone || !address.street || !address.pincode) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required shipping details.",
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
        const userId = user.id;

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
                    templeId: item.templeId
                })),
                totalAmount,
                paymentMethod: "COD",
                shippingAddress: address,
            };

            const response = await axios.post(`${API_URL}/api/orders`, orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast({
                    title: "Order Placed Successfully!",
                    description: "Your sacred items will be delivered soon.",
                });
                clearCart();
                router.push("/marketplace/order-success");
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
                            <p className="text-slate-600 mb-6">Looks like you haven't added any sacred items yet.</p>
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
            <Navbar />
            <main className="pt-32 pb-20 container mx-auto px-4">
                <div className="flex items-center gap-2 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#794A05]">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-display font-bold text-[#2a1b01]">Checkout</h1>
                </div>

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
                                        <Input name="phone" value={address.phone} onChange={handleInputChange} placeholder="Mobile number" className="focus:ring-[#794A05] border-[#794A05]/20" />
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

                        <Card className="bg-white border-[#794A05]/10">
                            <CardHeader className="bg-[#794A05]/5 border-b border-[#794A05]/10">
                                <CardTitle className="text-[#794A05]">Payment Method</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 p-4 border-2 border-[#794A05] bg-[#794A05]/5 rounded-xl">
                                    <div className="w-5 h-5 rounded-full border-4 border-[#794A05]"></div>
                                    <div>
                                        <p className="font-bold text-[#794A05]">Cash on Delivery</p>
                                        <p className="text-xs text-slate-500">Pay when you receive your sacred items</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                        <div key={item.variantId} className="flex gap-4">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                                <img src={item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-[#2a1b01] line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.variantName} x {item.quantity}</p>
                                                <p className="text-sm font-bold text-[#794A05]">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-[#794A05]/10" />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="flex items-center"><IndianRupee className="w-3.5 h-3.5" /> {totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span className="text-tulsi font-medium">Free</span>
                                    </div>
                                    <Separator className="bg-[#794A05]/10" />
                                    <div className="flex justify-between text-xl font-bold text-[#2a1b01]">
                                        <span>Total</span>
                                        <span className="flex items-center text-[#794A05]"><IndianRupee className="w-5 h-5" /> {totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 flex-col gap-4">
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                    className="w-full h-14 text-lg font-bold bg-[#794A05] hover:bg-[#5d3804] text-white rounded-2xl shadow-lg shadow-[#794A05]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isSubmitting ? "Processing Sacred Order..." : "Place Order"}
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

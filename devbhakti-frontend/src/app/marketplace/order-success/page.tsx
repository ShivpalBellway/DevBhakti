"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#fdf6e9]">
            <Navbar />
            <main className="pt-32 pb-20 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl mx-auto bg-white rounded-[3rem] p-12 shadow-2xl shadow-[#794A05]/10 border border-[#794A05]/5"
                >
                    <div className="w-24 h-24 bg-tulsi/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12 text-tulsi" />
                    </div>

                    <h1 className="text-4xl font-display font-bold text-[#2a1b01] mb-4">Jai Shri Ram!</h1>
                    <h2 className="text-2xl font-display font-semibold text-[#794A05] mb-6">Order Placed Successfully</h2>

                    <p className="text-slate-600 mb-10 text-lg leading-relaxed">
                        Your sacred items have been ordered. You will receive a confirmation message soon.
                        The respective temples and DevBhakti team will begin preparing your blessings for delivery.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            onClick={() => router.push("/marketplace")}
                            variant="outline"
                            className="h-14 rounded-2xl border-[#794A05]/20 text-[#794A05] hover:bg-[#794A05]/5 font-bold"
                        >
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            Continue Shopping
                        </Button>
                        <Button
                            onClick={() => router.push("/profile/orders")}
                            className="h-14 rounded-2xl bg-[#794A05] hover:bg-[#5d3804] text-white font-bold shadow-lg shadow-[#794A05]/20"
                        >
                            View My Orders
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </motion.div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-[#794A05]/10">
                        <Package className="w-8 h-8 text-[#794A05] mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-[#794A05]/60 mb-1">Authentic</p>
                        <p className="text-sm font-semibold text-[#2a1b01]">Temple Blessed</p>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-[#794A05]/10">
                        <CheckCircle2 className="w-8 h-8 text-[#794A05] mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-[#794A05]/60 mb-1">Quality</p>
                        <p className="text-sm font-semibold text-[#2a1b01]">Handpicked Items</p>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-[#794A05]/10">
                        <ArrowRight className="w-8 h-8 text-[#794A05] mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-[#794A05]/60 mb-1">Fast Delivery</p>
                        <p className="text-sm font-semibold text-[#2a1b01]">Pan-India Shipping</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

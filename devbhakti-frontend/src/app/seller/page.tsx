"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Store, Key, CheckCircle2, ShieldCheck, ShoppingBag, X, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOTP, verifyOTP, checkSellerPhone } from "@/api/authController";
import { useRouter } from "next/navigation";
import { clearAllTokens } from "@/lib/auth-utils";

export default function SellerLoginPage() {
    const router = useRouter();
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [devOtp, setDevOtp] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [showNotRegisteredModal, setShowNotRegisteredModal] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const normalizedPhone = phone.replace(/\D/g, '');

        try {
            // Step 1: Pre-check — does this number exist as a SELLER in DB?
            const checkResult = await checkSellerPhone(normalizedPhone);

            if (!checkResult.isSellerRegistered) {
                // Number not registered as a Seller — show popup
                setShowNotRegisteredModal(true);
                setLoading(false);
                return;
            }

            // Step 2: Number is valid SELLER — send OTP
            const response = await sendOTP({ phone: normalizedPhone, role: "SELLER" });
            setShowOtpInput(true);
            if (response.data?.otp) {
                setDevOtp(response.data.otp);
            }
        } catch (error: any) {
            console.error("OTP Error:", error);
            setError(error.response?.data?.message || "Failed to send OTP. Please check the number and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const normalizedPhone = phone.replace(/\D/g, '');
        try {
            const response = await verifyOTP(normalizedPhone, otp, "SELLER");
            const { token, user } = response.data;

            if (user.role !== "SELLER") {
                setError("Access restricted to Sellers only.");
                return;
            }

            // Clear any old conflicting tokens
            clearAllTokens();

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            router.push("/seller/dashboard");

        } catch (error: any) {
            setError(error.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCF6] relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pattern-sacred grayscale" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10 px-6"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-primary/10 overflow-hidden">
                    {/* Top bar with design */}
                    <div className="h-3 bg-gradient-to-r from-[#7b4623] via-[#a65d2e] to-[#7b4623]" />

                    <div className="p-8 md:p-12">
                        {/* Logo & Intro */}
                        <div className="flex flex-col items-center text-center mb-10">
                            <motion.div
                                className="mb-6 p-4 bg-[#7b4623]/5 rounded-2xl shadow-inner border border-[#7b4623]/10"
                            >
                                <Store className="w-12 h-12 text-[#7b4623]" />
                            </motion.div>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2">
                                Seller Portal
                            </h1>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                Manage your DevBhakti store, products, and orders.
                            </p>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3"
                                >
                                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form Section */}
                        {!showOtpInput ? (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-slate-700 font-medium ml-1">Mobile Number</Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <Phone className="w-5 h-5 text-slate-400 group-focus-within:text-[#7b4623] transition-colors" />
                                            <span className="text-slate-400 font-semibold border-l pl-2 border-slate-300 leading-none group-focus-within:text-[#7b4623] transition-colors">+91</span>
                                        </div>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            maxLength={10}
                                            placeholder="XXXXX XXXXX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            className="h-14 pl-24 bg-slate-50 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-2xl text-lg tracking-wide"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 ml-1">
                                        We will send an OTP to verify your account.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || phone.length < 10}
                                    className="w-full h-14 bg-gradient-to-r from-[#7b4623] to-[#a65d2e] hover:from-[#5d351a] hover:to-[#7b4623] text-white rounded-2xl text-lg font-bold shadow-lg shadow-[#7b4623]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Checking...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Send OTP
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                {devOtp && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-[#FDF6F0] border border-[#7b4623]/10 p-4 rounded-xl mb-6 text-center shadow-sm"
                                    >
                                        <p className="text-slate-600 text-xs font-medium mb-1">Development OTP</p>
                                        <p className="text-3xl font-serif font-bold text-[#7b4623] tracking-widest">{devOtp}</p>
                                    </motion.div>
                                )}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label htmlFor="otp" className="text-slate-700 font-medium">Enter OTP</Label>
                                        <button
                                            type="button"
                                            onClick={() => setShowOtpInput(false)}
                                            className="text-xs text-[#7b4623] font-bold hover:underline"
                                        >
                                            Change Number
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7b4623] transition-colors">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <Input
                                            id="otp"
                                            type="text"
                                            maxLength={6}
                                            placeholder="· · · · · ·"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="h-14 pl-12 bg-slate-50 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10 rounded-2xl text-2xl text-center tracking-[0.5em] font-bold"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">
                                        Sent to <span className="text-slate-600 font-bold">+91 {phone}</span>
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-gradient-to-r from-[#7b4623] to-[#a65d2e] hover:from-[#5d351a] hover:to-[#7b4623] text-white rounded-2xl text-lg font-bold shadow-lg shadow-[#7b4623]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Verifying...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Login to Store
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                    )}
                                </Button>

                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        className="text-sm text-slate-500 hover:text-[#7b4623] transition-colors"
                                    >
                                        Didn't receive code? <span className="font-bold underline">Resend</span>
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-8 text-center border-t border-slate-100 pt-8">
                            <button
                                onClick={() => router.push("/seller/staff-login")}
                                className="text-sm font-bold text-[#7b4623] hover:underline flex items-center justify-center gap-2 mx-auto"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Seller Staff? Login Here
                            </button>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500">
                            For assistance contact <a href="mailto:admin@devbhakti.in" className="text-[#7b4623] font-bold hover:underline">admin@devbhakti.in</a>
                        </p>
                    </div>
                </div>

                {/* Secure Trust Badges */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                    <div className="flex items-center gap-2 grayscale brightness-50">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Secure Login</span>
                    </div>
                </div>
            </motion.div>

            {/* ===== NOT REGISTERED POPUP MODAL ===== */}
            <AnimatePresence>
                {showNotRegisteredModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowNotRegisteredModal(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="fixed inset-0 flex items-center justify-center z-50 px-4"
                        >
                            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto">
                                {/* Modal top accent */}
                                <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

                                <div className="p-8">
                                    {/* Close button */}
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={() => setShowNotRegisteredModal(false)}
                                            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Icon */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center mb-5">
                                            <AlertTriangle className="w-10 h-10 text-orange-500" />
                                        </div>

                                        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">
                                            Account Not Registered
                                        </h2>

                                        <p className="text-slate-500 text-sm leading-relaxed mb-2">
                                            Your account is not registered with us as a Seller.
                                        </p>

                                        <p className="text-slate-600 text-sm font-medium mb-6">
                                            To become a seller on DevBhakti, submit your request at:
                                        </p>

                                        {/* Email highlight box */}
                                        <a
                                            href="mailto:sales@devbhakti.in"
                                            className="flex items-center gap-3 bg-[#7b4623]/5 border border-[#7b4623]/20 rounded-2xl px-6 py-4 hover:bg-[#7b4623]/10 transition-colors group mb-6 w-full justify-center"
                                        >
                                            <Mail className="w-5 h-5 text-[#7b4623]" />
                                            <span className="text-[#7b4623] font-bold text-base group-hover:underline">
                                                sales@devbhakti.in
                                            </span>
                                        </a>

                                        <button
                                            onClick={() => setShowNotRegisteredModal(false)}
                                            className="w-full h-12 bg-gradient-to-r from-[#7b4623] to-[#a65d2e] hover:from-[#5d351a] hover:to-[#7b4623] text-white rounded-2xl font-bold shadow-md shadow-[#7b4623]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Try Another Number
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
